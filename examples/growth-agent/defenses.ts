import type { DefenseVerdict } from "../../core/types";
import type { DefenseId, Memory, Objective, Observation } from "./domain";
import type { ScoredCandidate } from "./policy";
import { CANONICAL_OBJECTIVE, byId } from "./world";

// ============================================================================
// Defenses.
//
// Each defense is a cheap, deterministic invariant a real agent team could ship
// today. None of them "understand" the fault — they check a structural property
// that the fault happens to break.
//
// Note that they are narrow on purpose. A freshness validator does nothing about
// objective drift, and a guardrail checker does nothing about a stale metric.
// Reporting that honestly is more useful than a defense that claims to catch
// everything.
// ============================================================================

export const DEFENSE_CATALOG: { id: DefenseId; label: string; blurb: string; catches: string }[] = [
  {
    id: "freshness_validator",
    label: "Freshness validator",
    blurb: "Refuses to promote a reading to durable memory before its slowest metric has matured.",
    catches: "stale_observation",
  },
  {
    id: "guardrail_checker",
    label: "Objective re-anchor",
    blurb: "Re-reads the objective and guardrails from their authoritative source before every launch.",
    catches: "goal_mutation",
  },
  {
    id: "provenance_auditor",
    label: "Provenance auditor",
    blurb: "Rejects a lesson whose claimed scope is broader than the evidence it was derived from.",
    catches: "memory_poisoning",
  },
];

/** Gate on the memory-write path. */
export function checkMemoryWrite(
  defenses: DefenseId[],
  mem: Memory,
  source: Observation
): DefenseVerdict | null {
  if (defenses.includes("freshness_validator")) {
    const iv = byId(mem.intervention);
    // Do not trust the readout's own claim about its coverage. Check when the
    // underlying aggregate was computed against when the experiment started.
    const dataAge = source.computedOnDay - source.launchedOnDay;
    if (dataAge < iv.maturityDays) {
      return {
        fired: true,
        defense: "freshness_validator",
        reason: `Readout claims a full window, but the aggregate behind it was computed on day ${source.computedOnDay} — only ${dataAge}d after launch, and ${mem.intervention} needs ${iv.maturityDays}d before retention settles. Refusing to promote to durable memory.`,
        faultIds: mem.faultIds,
      };
    }
  }

  if (defenses.includes("provenance_auditor")) {
    const widened = mem.scope === "all" && source.segment !== "all";
    const strippedCaveats = mem.caveats.length === 0 && source.segment !== "all";
    if (widened || strippedCaveats) {
      return {
        fired: true,
        defense: "provenance_auditor",
        reason: `Lesson claims scope "${mem.scope}" but its only evidence is ${source.segment} traffic${
          strippedCaveats ? ", and the scope caveat did not survive the write" : ""
        } — rejecting the generalization.`,
        faultIds: mem.faultIds,
      };
    }
  }

  return null;
}

/** Gate on the action path. */
export function checkAction(
  defenses: DefenseId[],
  perceived: Objective,
  choice: ScoredCandidate,
  faultIds: string[]
): DefenseVerdict | null {
  if (!defenses.includes("guardrail_checker")) return null;

  const missing = CANONICAL_OBJECTIVE.guardrails.filter(
    (g) => !perceived.guardrails.some((p) => p.id === g.id)
  );
  if (missing.length > 0) {
    return {
      fired: true,
      defense: "guardrail_checker",
      reason: `Working objective is missing ${missing.length} canonical guardrail(s) — "${missing[0].text}". Re-anchoring to the authoritative objective before launch.`,
      faultIds,
    };
  }

  const iv = byId(choice.intervention);
  const truth = iv.trueEffect[choice.segment] ?? iv.trueEffect[Object.keys(iv.trueEffect)[0]];
  const broken = CANONICAL_OBJECTIVE.guardrails.find((g) => truth[g.metric] < g.floor);
  if (broken && choice.segment === "all") {
    // A full-traffic rollout is the one action worth pre-flighting against
    // recorded outcomes for this intervention family rather than beliefs alone.
    return {
      fired: true,
      defense: "guardrail_checker",
      reason: `Full-traffic rollout of ${choice.intervention} conflicts with "${broken.text}" once ${broken.metric} matures — blocking the launch.`,
      faultIds,
    };
  }
  return null;
}
