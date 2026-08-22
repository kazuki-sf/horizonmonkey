// ============================================================================
// HorizonMonkey — harness types.
//
// Nothing in this file knows what domain it is measuring. These are the types
// the instrumentation layer needs in order to record a trajectory, attach
// provenance to it, and compute a semantic blast radius from that provenance.
//
// The layering the harness assumes:
//
//   CANONICAL WORLD STATE   what is actually true
//          |
//   OBSERVATION LAYER       what the agent is allowed to see
//          |
//   FAULT INJECTOR          a plausible, schema-valid distortion
//          |
//   PERCEIVED STATE         what the agent believes
//
// Every artifact the agent produces carries provenance (`inputIds`), so taint
// from an injected fault propagates forward mechanically rather than being
// reconstructed after the fact.
//
// Domain types for the reference scenario live in
// `examples/growth-agent/domain.ts`.
// ============================================================================

export type TraceEventType =
  | "observation"
  | "memory_read"
  | "memory_write"
  | "hypothesis"
  | "decision"
  | "action"
  | "evaluation"
  | "fault_injection"
  | "fault_detection"
  | "recovery";

export type TraceEvent = {
  id: string;
  step: number;
  type: TraceEventType;
  /** One-line human summary, rendered directly in the timeline UI. */
  summary: string;
  detail?: string;
  /** Ids of the artifacts this event was derived from. Drives taint flow. */
  inputIds: string[];
  /** Faults this event is downstream of. Computed, not hand-authored. */
  faultIds: string[];
  /** True when this event is the injection point itself. */
  isFaultOrigin?: boolean;
  /** Set when a defense quarantined or corrected this event. */
  quarantined?: boolean;
  metadata?: Record<string, unknown>;
};

/**
 * Fault classes the harness knows how to account for. These name the *shape* of
 * the corruption, not the domain: a stale observation is a stale observation
 * whether the reading is a conversion rate or a sensor value. What a given fault
 * looks like concretely is defined per scenario.
 */
export type FaultType =
  | "stale_observation"
  | "goal_mutation"
  | "memory_poisoning"
  | "numeric_perturbation";

export type Fault = {
  id: string;
  type: FaultType;
  label: string;
  /** Why a reviewer would wave this through. The whole point of the project. */
  plausibility: string;
  injectedAtStep: number;
  targetId?: string;
  originalValue: unknown;
  corruptedValue: unknown;
  detectedAtStep?: number;
  detectedBy?: string;
  recoveredAtStep?: number;
};

/** A defense firing. `faultIds` empty means it fired on a clean artifact. */
export type DefenseVerdict = {
  fired: boolean;
  defense: string;
  reason: string;
  faultIds: string[];
};

/** One recorded defense activation, used to separate catches from false alarms. */
export type Detection = { step: number; defense: string; faultIds: string[] };

/**
 * Blast-radius metrics. Every field here is computed from the trace and the
 * fault ledger alone — no domain knowledge required.
 */
export type BlastRadius = {
  faultDetected: boolean;
  detectionLatency: number | null;
  propagationDepth: number;
  memoryContamination: number;
  affectedDecisions: number;
  affectedActions: number;
  recovered: boolean;
  recoveryStep: number | null;
  falsePositives: number;
  /** Steps the corrupted belief stayed load-bearing before anything corrected it. */
  silentFailureWindow: number | null;
  firstDivergenceStep: number | null;
};
