import type { FaultType } from "../../core/types";
import { blastGraph, firstDivergence, type GraphNode } from "../../core/propagation";
import type { DefenseId, RunResult } from "./domain";
import { runScenario } from "./loop";
import { specFor } from "./faults";

// ============================================================================
// A chaos experiment is a comparison, not a run. Nothing here means anything
// without the control arm, so the API always produces all three at once:
// what the agent does undisturbed, what it does under the fault, and what it
// does under the fault with one defense turned on.
// ============================================================================

export type Comparison = {
  baseline: RunResult;
  chaos: RunResult;
  defended: RunResult | null;
  graph: GraphNode[];
  defendedGraph: GraphNode[];
  fault: {
    type: FaultType;
    label: string;
    blurb: string;
    plausibility: string;
    targetLabel: string;
    injectedAtStep: number;
  } | null;
  divergence: {
    firstDivergenceStep: number | null;
    silentFailureWindow: number | null;
    firstTaintedActionStep: number | null;
    defendedFirstDivergenceStep: number | null;
  };
};

const MAX_STEPS = 24;

export function compare(faultType: FaultType, defenses: DefenseId[]): Comparison {
  const spec = specFor(faultType);
  const shared = { scenario: "growth", faultStep: 0, maxSteps: MAX_STEPS, engine: "deterministic" as const };

  const baseline = runScenario({ ...shared, faultType: "none", defenses: [] });
  const chaos = runScenario({ ...shared, faultType, faultTarget: spec.defaultTarget, defenses: [] });
  const defended = defenses.length
    ? runScenario({ ...shared, faultType, faultTarget: spec.defaultTarget, defenses })
    : null;

  const injectedAt = chaos.faults[0]?.injectedAtStep ?? null;
  const firstDiv = firstDivergence(baseline.trace, chaos.trace);
  const firstTaintedAction =
    chaos.trace.find((e) => e.type === "action" && e.faultIds.length > 0)?.step ?? null;

  chaos.summary.firstDivergenceStep = firstDiv;

  // How long the corrupted belief was load-bearing: from the moment it entered
  // the belief set until something — a defense, or reality arriving late —
  // corrected it. If nothing ever did, it was load-bearing for the whole run.
  chaos.summary.silentFailureWindow =
    injectedAt === null
      ? null
      : (chaos.summary.recoveryStep ?? MAX_STEPS) - injectedAt;

  if (defended) {
    defended.summary.firstDivergenceStep = firstDivergence(baseline.trace, defended.trace);
    defended.summary.silentFailureWindow =
      defended.faults[0] ? (defended.summary.recoveryStep ?? MAX_STEPS) - defended.faults[0].injectedAtStep : null;
  }

  return {
    baseline,
    chaos,
    defended,
    graph: blastGraph(chaos.trace),
    defendedGraph: defended ? blastGraph(defended.trace) : [],
    fault: chaos.faults[0]
      ? {
          type: faultType,
          label: spec.label,
          blurb: spec.blurb,
          plausibility: spec.plausibility,
          targetLabel: spec.targetLabel,
          injectedAtStep: chaos.faults[0].injectedAtStep,
        }
      : null,
    divergence: {
      firstDivergenceStep: firstDiv,
      silentFailureWindow: chaos.summary.silentFailureWindow,
      firstTaintedActionStep: firstTaintedAction,
      defendedFirstDivergenceStep: defended?.summary.firstDivergenceStep ?? null,
    },
  };
}
