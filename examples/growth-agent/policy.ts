import type { AgentPolicy } from "../../core/policy";
import type { Effect, Guardrail, Memory, MetricKey, Objective, Observation, Segment } from "./domain";
import { INTERVENTIONS, REACH, byId } from "./world";

// ============================================================================
// The growth agent's decision policy.
//
// Deliberately a *belief-driven* policy rather than a script: every choice is a
// function of what is currently in memory and what the agent thinks its
// objective is. That property is what makes the harness meaningful — if the
// policy ignored its beliefs, corrupting them would prove nothing.
//
// It implements `AgentPolicy` from the harness (`core/policy.ts`): interpret an
// observation into a belief, commit that belief, decide what to do next. An
// LLM-backed policy implements the same three methods and returns the same
// provenance; nothing in `core/` would change.
//
// The policy is also deliberately competent. It weights impact by reach, it
// checks its guardrails before acting, it attaches scope caveats to lessons and
// it refuses to generalize a bounded one. It is not a strawman. It has exactly
// one ordinary weakness: it evaluates its guardrails against its beliefs.
// ============================================================================

export type Candidate = { intervention: string; segment: Segment };

/** What the scenario's loop carries into each decision. */
export type GrowthContext = {
  step: number;
  day: number;
  /** Interventions with a live experiment — you do not re-run one already in flight. */
  embargoed: Set<string>;
};

export type ScoredCandidate = Candidate & {
  score: number;
  expected: Effect;
  /** Memory ids the estimate leaned on. Becomes the decision's provenance. */
  basis: string[];
  rationale: string;
  guardrailBlocked: boolean;
  evidence: number;
};

const ZERO: Effect = { signup: 0, qualified: 0, retention: 0, revenue: 0 };
const METRICS: MetricKey[] = ["signup", "qualified", "retention", "revenue"];

/** Prior used before any evidence exists — mildly optimistic, uninformative. */
const PRIOR: Effect = { signup: 2, qualified: 2, retention: 0, revenue: 2 };

const BOUNDED = /generaliz|replicat|only|scope/i;

export class GrowthAgent
  implements AgentPolicy<GrowthContext, Observation, Memory, ScoredCandidate>
{
  readonly id = "growth-agent/deterministic";

  memories: Memory[] = [];
  tried = new Set<string>();
  /**
   * Interventions with a live experiment. A growth team does not run the same
   * change on three segments at once and then read all three at the end — it
   * runs one, reads it, and lets the result inform the next target.
   */
  embargoed = new Set<string>();

  constructor(public objective: Objective) {}

  static key(c: Candidate) {
    return `${c.intervention}:${c.segment}`;
  }

  /** Live, non-superseded, non-quarantined memory. */
  get live() {
    return this.memories.filter((m) => !m.quarantined);
  }

  /**
   * Retrieve memories the agent considers applicable to a candidate.
   *
   * The scope check is the load-bearing logic in this file. A lesson learned on
   * SMB traffic transfers to other segments only if the agent believes its scope
   * is global and nothing attached to it forbids generalizing — which is exactly
   * what a stale reading or a dropped caveat manufactures.
   */
  retrieve(intervention: string, segment: Segment): Memory[] {
    return this.live.filter((m) => {
      if (m.intervention !== intervention) return false;
      if (m.scope === "all") return true;
      if (m.scope === segment) return true;
      return !m.caveats.some((c) => BOUNDED.test(c)) && segment === "all";
    });
  }

  private estimate(c: Candidate) {
    const mems = this.retrieve(c.intervention, c.segment);
    if (mems.length === 0)
      return { expected: { ...PRIOR }, basis: [] as string[], evidence: 0 };
    const wsum = mems.reduce((s, m) => s + m.confidence, 0);
    const expected: Effect = { ...ZERO };
    for (const m of METRICS)
      expected[m] = +(mems.reduce((s, x) => s + x.effect[m] * x.confidence, 0) / wsum).toFixed(2);
    return { expected, basis: mems.map((m) => m.id), evidence: wsum };
  }

  /** Any live lesson about this intervention that breaches a guardrail. */
  warningFor(intervention: string): Memory | null {
    for (const m of this.live) {
      if (m.intervention !== intervention) continue;
      if (this.objective.guardrails.some((g) => m.effect[g.metric] < g.floor)) return m;
    }
    return null;
  }

  /**
   * Ship decision: promote a completed experiment to a permanent change.
   * Judged on the agent's belief about the result, under its current objective.
   */
  shouldShip(m: Memory): boolean {
    if (m.quarantined) return false;
    if (this.violates(m.effect, this.objective.guardrails)) return false;
    let utility = 0;
    for (const k of METRICS) utility += (this.objective.weights[k] ?? 0) * m.effect[k];
    return utility > 2;
  }

  private violates(expected: Effect, guardrails: Guardrail[]): Guardrail | null {
    for (const g of guardrails) if (expected[g.metric] < g.floor) return g;
    return null;
  }

  score(c: Candidate): ScoredCandidate {
    const { expected, basis, evidence } = this.estimate(c);

    let utility = 0;
    for (const m of METRICS) utility += (this.objective.weights[m] ?? 0) * expected[m];

    // Impact is effect times reach. This is the correct thing for a growth agent
    // to do, and it is also what makes a contaminated global belief so expensive.
    let score = utility * (REACH[c.segment] ?? 0.3);

    if (evidence === 0) score += 2 + byId(c.intervention).priorAppeal; // breadth-first exploration

    // A guardrail breach observed on *any* segment is evidence about the
    // intervention itself, not just about that segment. A bounded lesson still
    // transfers as a warning even when it does not transfer as a recommendation.
    // This is the agent's main line of defence, and every fault in this project
    // works by making sure the warning never gets written down.
    if (this.warningFor(c.intervention)) score -= 60;

    // The agent checks guardrails against its *beliefs*. Corrupt the beliefs and
    // the guardrail check passes cleanly while reality breaks underneath it.
    const broken = this.violates(expected, this.objective.guardrails);
    if (broken) score -= 100;

    const rationale = basis.length
      ? `${basis.length} lesson(s) put revenue at ${expected.revenue > 0 ? "+" : ""}${expected.revenue}% / retention at ${expected.retention > 0 ? "+" : ""}${expected.retention}% across ${Math.round((REACH[c.segment] ?? 0.3) * 100)}% of traffic`
      : `no evidence yet — exploratory launch under "${this.objective.primary}"`;

    return { ...c, score: +score.toFixed(2), expected, basis, rationale, guardrailBlocked: Boolean(broken), evidence };
  }

  /** Deterministic ranking over every untried (intervention, segment) pair. */
  rank(): ScoredCandidate[] {
    const cands: Candidate[] = [];
    for (const iv of INTERVENTIONS)
      for (const seg of iv.applicableTo) {
        const c = { intervention: iv.id, segment: seg };
        if (this.tried.has(GrowthAgent.key(c))) continue;
        if (this.embargoed.has(iv.id)) continue;
        // Hard rule: you do not put an untested change in front of all traffic.
        // You test it on a segment and roll it out once you believe it works.
        //
        // This is ordinary release discipline, and it has a consequence worth
        // stating plainly: the *only* route to a full-traffic rollout runs
        // through the belief set. Which is why corrupting a belief is the only
        // way to make this agent do real damage.
        if (seg === "all" && this.retrieve(iv.id, "all").length === 0) continue;
        cands.push(c);
      }
    return cands
      .map((c) => this.score(c))
      .sort((a, b) =>
        b.score !== a.score ? b.score - a.score : GrowthAgent.key(a).localeCompare(GrowthAgent.key(b))
      );
  }

  /**
   * Launch threshold. When nothing on the board beats doing nothing, the agent
   * holds rather than spending traffic on its least-bad remaining idea.
   */
  static readonly LAUNCH_FLOOR = 0.5;

  decide(ctx: GrowthContext): ScoredCandidate | null {
    this.embargoed = ctx.embargoed;
    const top = this.rank()[0];
    return top && top.score > GrowthAgent.LAUNCH_FLOOR ? top : null;
  }

  markTried(c: Candidate) {
    this.tried.add(GrowthAgent.key(c));
  }

  /**
   * Turn an observation into a durable lesson.
   *
   * The widening heuristic below is the agent's one real liberty: a result that
   * is large, clean and fully matured gets promoted from "a thing that happened
   * on SMB" to "a thing that works". That is a defensible heuristic and a very
   * common one. It is also the doorway every fault in this project walks through.
   */
  interpret(obs: Observation, step: number, memId: string): Memory {
    const iv = byId(obs.intervention);
    const matured = obs.maturityDays >= iv.maturityDays;
    const strong = obs.effect.signup > 15 && obs.effect.retention > -3 && obs.effect.qualified >= 0;
    const widen = strong && matured;

    const caveats: string[] = [];
    if (!matured)
      caveats.push(`Only ${obs.maturityDays}d of data; ${iv.maturityDays}d needed before retention settles`);
    if (!widen && obs.segment !== "all")
      caveats.push(`Observed on ${obs.segment} traffic only — do not generalize without a replication`);
    if (obs.effect.qualified < 0)
      caveats.push("Qualified lead volume moved negative — treat the signup lift as suspect");
    if (obs.effect.retention < -3)
      caveats.push(`Breaches the retention guardrail (${obs.effect.retention}%)`);

    return {
      id: memId,
      step,
      intervention: obs.intervention,
      scope: widen ? "all" : obs.segment,
      effect: { ...obs.effect },
      caveats,
      confidence: matured ? 0.9 : 0.5,
      observedOnDay: obs.computedOnDay,
      maturityDays: obs.maturityDays,
      sourceIds: [obs.id],
      faultIds: [...obs.faultIds],
    };
  }

  /**
   * Belief revision: a fully matured reading supersedes an earlier, less mature
   * one for the same intervention. This is why the agent can eventually recover
   * on its own — and why recovery is not the same thing as undoing the damage.
   */
  commit(m: Memory): Memory[] {
    // Compare when the data was actually computed, not what the readout claimed
    // to cover — otherwise a stale snapshot that lies about its window is never
    // superseded by the reading that would have corrected it.
    // Same intervention *and* same claimed scope: a fresh reading on developer
    // traffic is not entitled to overwrite what the agent learned about SMB.
    const superseded = this.live.filter(
      (old) =>
        old.intervention === m.intervention &&
        old.scope === m.scope &&
        old.observedOnDay < m.observedOnDay
    );
    for (const old of superseded) old.quarantined = true;
    this.memories.push(m);
    return superseded;
  }

  /**
   * Periodic memory consolidation — the step where an observation stops being a
   * data point and becomes a strategy. Agents that run for weeks all do some
   * version of this, and it is where a single bad belief becomes durable policy.
   */
  consolidate(step: number, memId: string): Memory | null {
    const ranked = [...this.live].sort(
      (a, b) => b.confidence * b.effect.revenue - a.confidence * a.effect.revenue
    );
    const best = ranked[0];
    if (!best || best.effect.revenue <= 0) return null;
    const supporting = ranked.slice(0, 2);
    return {
      id: memId,
      step,
      intervention: best.intervention,
      scope: best.scope,
      effect: { ...best.effect },
      caveats: [...best.caveats],
      confidence: Math.min(0.95, best.confidence + 0.05),
      observedOnDay: best.observedOnDay,
      maturityDays: best.maturityDays,
      sourceIds: supporting.map((m) => m.id),
      faultIds: [...new Set(supporting.flatMap((m) => m.faultIds))],
      // Marked so the UI can show a strategy-level belief distinctly.
    };
  }
}
