// ============================================================================
// The seam where an agent plugs in.
//
// The reference scenario uses a deterministic policy on purpose — it isolates
// the fault as the only variable between experimental arms, which is what makes
// the reported numbers comparable. That is an experimental design choice, not a
// limitation of the harness: nothing in `core/` inspects how a decision was
// reached, only what it was derived from.
//
// An LLM-backed policy implements the same three methods and returns the same
// provenance. The recorder, the taint closure and the metrics do not change.
// ============================================================================

/**
 * `Obs` is whatever the observation layer hands the agent (possibly corrupted),
 * `Belief` whatever it writes to durable memory, `Decision` whatever it chooses
 * to do next, and `Ctx` whatever the scenario's loop carries between steps.
 *
 * The one contract that matters: anything returned from these methods must
 * report the artifact ids it was derived from, so the harness can propagate
 * taint without guessing.
 */
export interface AgentPolicy<Ctx, Obs, Belief, Decision> {
  readonly id: string;

  /**
   * Turn a (possibly corrupted) observation into a candidate durable belief.
   * Returning `null` means the observation was not worth remembering.
   *
   * This is where over-generalization happens in practice — the step that
   * decides whether a result is "a thing that happened on SMB" or "a thing that
   * works" — so it is worth instrumenting even when it looks trivial.
   */
  interpret(obs: Obs, step: number, beliefId: string): Belief | null;

  /**
   * Commit a belief to durable memory. Returns any beliefs it supersedes, which
   * is how self-correction shows up in the trace when late data arrives.
   */
  commit(belief: Belief): Belief[];

  /** Choose the next action, or `null` to hold. */
  decide(ctx: Ctx): Decision | null;

  /**
   * Optional periodic consolidation — the step where observations stop being
   * data points and become strategy. Agents that run for weeks all do some
   * version of it, and it is where one bad belief becomes durable policy.
   */
  consolidate?(step: number, beliefId: string): Belief | null;
}
