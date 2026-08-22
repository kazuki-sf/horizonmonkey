import type { Fault, FaultType, TraceEvent } from "../../core/types";
import { TraceRecorder } from "../../core/trace";
import { summarizeBlastRadius } from "../../core/metrics";
import { propagate } from "../../core/propagation";
import type {
  Effect,
  Experiment,
  Memory,
  Objective,
  Observation,
  RunConfig,
  RunResult,
} from "./domain";
import { GrowthAgent, type GrowthContext, type ScoredCandidate } from "./policy";
import { GrowthFaultInjector, specFor } from "./faults";
import { checkAction, checkMemoryWrite } from "./defenses";
import { scoreRun } from "./evaluator";
import { CANONICAL_OBJECTIVE, SEED_HISTORY, START_DAY, byId } from "./world";

const DAYS_PER_STEP = 6;

/**
 * Concurrent live experiments. Growth teams cap this to keep experiments from
 * interfering with each other, which is also what makes the horizon long: the
 * agent spends most of its steps waiting for traffic rather than acting.
 */
const MAX_CONCURRENT = 3;

/** How the environment reports a matured experiment. Always the truth. */
function readout(exp: Experiment, day: number, id: string): Observation {
  return {
    id,
    experimentId: exp.id,
    intervention: exp.intervention,
    segment: exp.segment,
    status: "completed",
    effect: { ...exp.trueEffect },
    readOnDay: day,
    computedOnDay: day,
    launchedOnDay: exp.launchedOnDay,
    maturityDays: day - exp.launchedOnDay,
    requiredMaturityDays: byId(exp.intervention).maturityDays,
    note: `${byId(exp.intervention).title} · ${exp.segment}`,
    faultIds: [],
  };
}

const pct = (n: number) => `${n > 0 ? "+" : ""}${n}%`;
const fmt = (e: Effect) =>
  `signup ${pct(e.signup)} · qualified ${pct(e.qualified)} · retention ${pct(e.retention)} · revenue ${pct(e.revenue)}`;

export function runScenario(config: RunConfig): RunResult {
  const recorder = new TraceRecorder();
  const trace = recorder.events;
  const launched: Experiment[] = [...SEED_HISTORY];
  const injector = new GrowthFaultInjector(config.faultType, config.faultStep, config.faultTarget);

  let objective: Objective = structuredClone(CANONICAL_OBJECTIVE);
  const agent = new GrowthAgent(objective);
  for (const s of SEED_HISTORY) agent.markTried({ intervention: s.intervention, segment: s.segment });

  let day = START_DAY;
  let expSeq = 200;
  const nid = (p: string) => recorder.id(p);

  const pending: Experiment[] = [...SEED_HISTORY];
  const reported = new Set<string>();
  let recoveryStep: number | null = null;
  /** Once the objective is corrupted, every subsequent decision inherits from it. */
  let objectiveFaultId: string | null = null;
  let lastAction = "no action taken";

  const push = (e: Omit<TraceEvent, "faultIds"> & { faultIds?: string[] }) => recorder.record(e);

  for (let step = 0; step < config.maxSteps; step++) {
    if (step > 0) day += DAYS_PER_STEP;

    // ---- objective drift: a summarization pass over the working goal --------
    if (config.faultType === "goal_mutation" && step === config.faultStep) {
      const { objective: next, fault } = injector.maybeCorruptObjective(objective, step);
      if (fault) {
        push({
          id: fault.id,
          step,
          type: "fault_injection",
          summary: `Objective re-summarized: "${next.primary}"`,
          detail: `Guardrails carried forward: ${next.guardrails.length} of ${objective.guardrails.length}. ${specFor("goal_mutation").plausibility}`,
          inputIds: [],
          faultIds: [fault.id],
          isFaultOrigin: true,
          metadata: { before: objective, after: next },
        });
        objective = next;
        agent.objective = next;
        objectiveFaultId = fault.id;
      }
    }

    // ---- observe -----------------------------------------------------------
    const matured = pending.find((e) => !reported.has(e.id) && e.maturesOnDay <= day);
    let obsId: string | null = null;
    if (matured) {
      reported.add(matured.id);
      const clean = readout(matured, day, nid("obs"));
      const seen = injector.maybeCorruptObservation(clean, step);
      const faulted = seen.faultIds.length > 0;

      if (faulted) {
        const f = injector.faults[injector.faults.length - 1];
        push({
          id: f.id,
          step,
          type: "fault_injection",
          summary: `Analytics cache served a day-${(f.corruptedValue as { computedOnDay: number }).computedOnDay - matured.launchedOnDay} snapshot as a completed result`,
          detail: specFor(config.faultType as FaultType).plausibility,
          inputIds: [],
          faultIds: [f.id],
          isFaultOrigin: true,
          metadata: { original: f.originalValue, corrupted: f.corruptedValue },
        });
      }

      obsId = push({
        id: seen.id,
        step,
        type: "observation",
        summary: `${seen.note} — ${fmt(seen.effect)}`,
        detail: `Experiment ${matured.id}, aggregate computed day ${seen.computedOnDay}, launched day ${seen.launchedOnDay}.`,
        inputIds: faulted ? [injector.faults[injector.faults.length - 1].id] : [],
        faultIds: [...seen.faultIds],
        metadata: { effect: seen.effect, segment: seen.segment, intervention: seen.intervention },
      });

      // ---- write the lesson to durable memory ------------------------------
      const memId = nid("mem");
      let mem: Memory = agent.interpret(seen, step, memId);
      mem = injector.maybeCorruptMemory(mem, step);

      if (mem.faultIds.length && config.faultType === "memory_poisoning") {
        const f = injector.faults[injector.faults.length - 1];
        push({
          id: f.id,
          step,
          type: "fault_injection",
          summary: `Lesson written without its scope caveat — "${byId(mem.intervention).title}" promoted from ${seen.segment} to a general rule`,
          detail: specFor("memory_poisoning").plausibility,
          inputIds: [seen.id],
          faultIds: [f.id],
          isFaultOrigin: true,
          metadata: { original: f.originalValue, corrupted: f.corruptedValue },
        });
      }

      const verdict = checkMemoryWrite(config.defenses, mem, seen);
      if (verdict) {
        mem.quarantined = true;
        agent.memories.push(mem);
        recorder.detect({ step, defense: verdict.defense, faultIds: verdict.faultIds });
        push({
          id: nid("det"),
          step,
          type: "fault_detection",
          summary: `${verdict.defense.replace(/_/g, " ")} blocked a memory write`,
          detail: verdict.reason,
          inputIds: [mem.id, seen.id],
          faultIds: [],
          metadata: { defense: verdict.defense, truePositive: verdict.faultIds.length > 0 },
        });
        push({
          id: mem.id,
          step,
          type: "memory_write",
          summary: `QUARANTINED · ${byId(mem.intervention).title} (${mem.scope})`,
          detail: verdict.reason,
          inputIds: [seen.id],
          faultIds: [...mem.faultIds],
          quarantined: true,
          metadata: { memory: mem },
        });
        if (verdict.faultIds.length > 0 && recoveryStep === null) {
          recoveryStep = step;
          push({
            id: nid("rec"),
            step,
            type: "recovery",
            summary: "Fault contained before it reached durable memory",
            detail: "The contaminated lesson never entered the belief set, so no downstream decision could inherit it.",
            inputIds: [],
            faultIds: [],
          });
        }
      } else {
        const superseded = agent.commit(mem);
        // ---- ship decision: make the winner permanent ----------------------
        if (agent.shouldShip(mem)) {
          matured.shipped = true;
          push({
            id: nid("ship"),
            step,
            type: "action",
            summary: `SHIP ${byId(mem.intervention).title} → ${matured.segment} permanently`,
            detail: `Promoted on the strength of ${mem.id}. Believed effect: ${fmt(mem.effect)}.`,
            inputIds: [mem.id],
            faultIds: [],
            metadata: { key: `ship:${mem.intervention}:${matured.segment}`, experimentId: matured.id, ship: true },
          });
          lastAction = `ship ${byId(mem.intervention).title} → ${matured.segment}`;
        }
        push({
          id: mem.id,
          step,
          type: "memory_write",
          summary: `Lesson: ${byId(mem.intervention).title} → ${mem.scope} · ${fmt(mem.effect)}`,
          detail: mem.caveats.length ? `Caveats: ${mem.caveats.join(" | ")}` : "No caveats attached.",
          inputIds: [seen.id],
          faultIds: [...mem.faultIds],
          metadata: { memory: mem },
        });
        // Belief revision: a matured reading overwrites an earlier, rosier one.
        if (superseded.length && superseded.some((s) => s.faultIds.length > 0)) {
          if (recoveryStep === null) recoveryStep = step;
          push({
            id: nid("rec"),
            step,
            type: "recovery",
            summary: `Belief revised — matured data superseded ${superseded.length} contaminated lesson(s)`,
            detail: `The agent corrected itself, ${step - injector.faults[0].injectedAtStep} steps after the fault entered. The experiments launched in between had already shipped.`,
            inputIds: superseded.map((s) => s.id),
            faultIds: [],
          });
        }
      }
    }

    // ---- periodic memory consolidation ------------------------------------
    if (step > 0 && step % 4 === 0) {
      const strategy = agent.consolidate(step, nid("mem"));
      if (strategy) {
        agent.memories.push(strategy);
        push({
          id: strategy.id,
          step,
          type: "memory_write",
          summary: `Strategy note: "${byId(strategy.intervention).title}" is the current best play (${strategy.scope})`,
          detail: `Consolidated from ${strategy.sourceIds.join(", ")}. Confidence ${strategy.confidence.toFixed(2)}.`,
          inputIds: strategy.sourceIds,
          faultIds: [...strategy.faultIds],
          metadata: { memory: strategy, consolidated: true },
        });
      }
    }

    // ---- wait for traffic --------------------------------------------------
    const live = pending.filter((e) => !reported.has(e.id)).length;
    if (live >= MAX_CONCURRENT) {
      push({
        id: nid("eval"),
        step,
        type: "evaluation",
        summary: `Holding — ${live} experiments still collecting traffic (day ${day})`,
        inputIds: [],
        faultIds: [],
      });
      continue;
    }

    // ---- retrieve, hypothesize, decide ------------------------------------
    const ctx: GrowthContext = {
      step,
      day,
      embargoed: new Set(pending.filter((e) => !reported.has(e.id)).map((e) => e.intervention)),
    };
    const chosen = agent.decide(ctx);
    // `rank()` is read separately so the trace can show what the policy passed
    // over, not just what it picked. The decision itself comes from `decide`.
    const ranked = agent.rank();
    const top = ranked[0];
    if (!chosen || !top) {
      push({
        id: nid("eval"),
        step,
        type: "evaluation",
        summary:
          ranked.length === 0
            ? `No untried experiments left — consolidating (day ${day})`
            : `Nothing clears the launch bar (best: ${byId(top.intervention).title} at ${top.score}) — holding traffic`,
        detail: top ? top.rationale : undefined,
        inputIds: top ? top.basis : [],
        faultIds: [],
      });
      continue;
    }

    const readIds = [...new Set(ranked.slice(0, 3).flatMap((c) => c.basis))];
    push({
      id: nid("read"),
      step,
      type: "memory_read",
      summary: readIds.length
        ? `Retrieved ${readIds.length} lesson(s) to rank ${ranked.length} candidate experiments`
        : `No applicable lessons — ranking ${ranked.length} candidates on priors`,
      inputIds: readIds,
      faultIds: [],
    });

    const hypId = push({
      id: nid("hyp"),
      step,
      type: "hypothesis",
      summary: `${byId(top.intervention).title} on ${top.segment} should be the highest-impact next test`,
      detail: top.rationale,
      inputIds: [...top.basis, ...(obsId ? [obsId] : []), ...(objectiveFaultId ? [objectiveFaultId] : [])],
      faultIds: [],
      metadata: { runnerUp: ranked[1] ? `${ranked[1].intervention}:${ranked[1].segment} (${ranked[1].score})` : null },
    });

    let choice: ScoredCandidate = chosen;
    const decId = push({
      id: nid("dec"),
      step,
      type: "decision",
      summary: `Selected ${byId(choice.intervention).title} → ${choice.segment} (score ${choice.score})`,
      detail: choice.rationale,
      inputIds: [hypId, ...choice.basis, ...(objectiveFaultId ? [objectiveFaultId] : [])],
      faultIds: [],
      metadata: { key: `${choice.intervention}:${choice.segment}`, expected: choice.expected },
    });

    // ---- pre-flight the action against authoritative state -----------------
    const inheritedFaults = [
      ...new Set([
        ...choice.basis.flatMap((b) => agent.memories.find((m) => m.id === b)?.faultIds ?? []),
        ...(objectiveFaultId ? [objectiveFaultId] : []),
      ]),
    ];
    const actionVerdict = checkAction(config.defenses, objective, choice, inheritedFaults);
    if (actionVerdict) {
      recorder.detect({ step, defense: actionVerdict.defense, faultIds: actionVerdict.faultIds });
      push({
        id: nid("det"),
        step,
        type: "fault_detection",
        summary: `${actionVerdict.defense.replace(/_/g, " ")} blocked the launch`,
        detail: actionVerdict.reason,
        inputIds: [decId],
        faultIds: [],
        metadata: { defense: actionVerdict.defense, truePositive: actionVerdict.faultIds.length > 0 },
      });
      // Re-anchor to the canonical objective and take the best legal alternative.
      objective = structuredClone(CANONICAL_OBJECTIVE);
      agent.objective = objective;
      objectiveFaultId = null;
      const blockedKey = `${choice.intervention}:${choice.segment}`;
    const alt = agent
      .rank()
      .find(
        (c) =>
          `${c.intervention}:${c.segment}` !== blockedKey &&
          !c.guardrailBlocked &&
          c.score > GrowthAgent.LAUNCH_FLOOR
      );
      if (recoveryStep === null && actionVerdict.faultIds.length > 0) {
        recoveryStep = step;
        push({
          id: nid("rec"),
          step,
          type: "recovery",
          summary: "Re-anchored to the authoritative objective and re-ranked",
          detail: alt ? `Falling back to ${byId(alt.intervention).title} → ${alt.segment}.` : "No legal alternative available this step.",
          inputIds: [],
          faultIds: [],
        });
      }
      if (!alt) continue;
      choice = alt;
    }

    if (choice.guardrailBlocked) continue;

    // ---- act ---------------------------------------------------------------
    const iv = byId(choice.intervention);
    const truth = iv.trueEffect[choice.segment] ?? iv.trueEffect[Object.keys(iv.trueEffect)[0]];
    const exp: Experiment = {
      id: `exp_${++expSeq}`,
      intervention: choice.intervention,
      segment: choice.segment,
      launchedOnDay: day,
      maturesOnDay: day + iv.maturityDays,
      status: "running",
      trueEffect: { ...truth },
    };
    pending.push(exp);
    launched.push(exp);
    agent.markTried(choice);
    lastAction = `${iv.title} → ${choice.segment}`;

    push({
      id: nid("act"),
      step,
      type: "action",
      summary: `LAUNCH ${iv.title} → ${choice.segment} (${Math.round((choice.segment === "all" ? 1 : 0.3) * 100)}%+ of traffic)`,
      detail: `Experiment ${exp.id} live on day ${day}, matures day ${exp.maturesOnDay}.`,
      inputIds: [decId],
      faultIds: [],
      metadata: { key: `${choice.intervention}:${choice.segment}`, experimentId: exp.id },
    });
  }

  // ---- propagate taint and score ------------------------------------------
  propagate(trace);

  const faults: Fault[] = injector.faults;
  // A check firing on an artifact that carries no taint is a false positive, not
  // a detection. `summarizeBlastRadius` applies the same rule; this copy exists
  // only to stamp the fault ledger the UI reads.
  const truePositive = recorder.detections.find((d) => d.faultIds.length > 0);
  if (truePositive && faults[0]) {
    faults[0].detectedAtStep = truePositive.step;
    faults[0].detectedBy = truePositive.defense;
    if (recoveryStep !== null) faults[0].recoveredAtStep = recoveryStep;
  }

  const scored = scoreRun(launched, agent.memories);
  const summary = {
    ...summarizeBlastRadius({
      trace,
      faults,
      detections: recorder.detections,
      recoveryStep,
      maxSteps: config.maxSteps,
    }),
    ...scored,
    finalRecommendation: lastAction,
  };

  return {
    runId: `${config.faultType}-${config.defenses.join("+") || "none"}-${config.maxSteps}`,
    config,
    objectivePerceived: objective,
    objectiveCanonical: CANONICAL_OBJECTIVE,
    faults,
    trace,
    memories: agent.memories,
    launched,
    summary,
  };
}
