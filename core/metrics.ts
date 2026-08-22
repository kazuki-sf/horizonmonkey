import type { BlastRadius, Detection, Fault, TraceEvent } from "./types";

// ============================================================================
// Blast-radius metrics.
//
// Everything here is computed from the trace and the fault ledger alone. No
// domain knowledge, no scoring function, no judge. Whatever your agent does,
// if it records provenance these numbers are available.
//
// What outcome *quality* looks like is necessarily scenario-specific; see
// `examples/growth-agent/evaluator.ts` for one way to score it.
// ============================================================================

/**
 * Idle ticks inherit taint because the ranking behind them read a contaminated
 * belief, but the agent did nothing. Counting them would inflate blast radius
 * with non-events.
 */
const NON_ARTIFACT: TraceEvent["type"][] = ["evaluation"];

export type SummarizeInput = {
  trace: TraceEvent[];
  faults: Fault[];
  detections: Detection[];
  recoveryStep: number | null;
  /** Run length, used as the horizon when a fault is never corrected. */
  maxSteps: number;
};

export function summarizeBlastRadius(input: SummarizeInput): BlastRadius {
  const { trace, faults, detections, recoveryStep, maxSteps } = input;

  // A check firing on an artifact carrying no taint is a false positive, not a
  // catch. Counting it would let a noisy invariant look effective.
  const caught = detections.find((d) => d.faultIds.length > 0);
  const injectedAt = faults[0]?.injectedAtStep ?? null;

  const tainted = trace.filter(
    (e) => e.faultIds.length > 0 && !e.isFaultOrigin && !NON_ARTIFACT.includes(e.type)
  );

  return {
    faultDetected: Boolean(caught),
    detectionLatency: caught && injectedAt !== null ? caught.step - injectedAt : null,
    propagationDepth: tainted.length,
    memoryContamination: tainted.filter((e) => e.type === "memory_write" && !e.quarantined).length,
    affectedDecisions: tainted.filter((e) => e.type === "decision").length,
    affectedActions: tainted.filter((e) => e.type === "action").length,
    recovered: recoveryStep !== null,
    recoveryStep,
    falsePositives: detections.filter((d) => d.faultIds.length === 0).length,
    // How long the corrupted belief was load-bearing: from the moment it entered
    // the belief set until something — a defense, or reality arriving late —
    // corrected it. If nothing did, it was load-bearing for the whole run.
    //
    // Note this is bounded by `maxSteps`, and `propagationDepth` grows with run
    // length for the same reason. Compare these across runs of equal length.
    silentFailureWindow: injectedAt === null ? null : (recoveryStep ?? maxSteps) - injectedAt,
    firstDivergenceStep: null,
  };
}
