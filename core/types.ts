// ============================================================================
// HorizonMonkey — core type model
//
// The harness separates three layers that agent codebases usually conflate:
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
// from an injected fault can be propagated forward mechanically.
// ============================================================================

export type MetricKey = "signup" | "qualified" | "retention" | "revenue";

/** Effect of an intervention, expressed as relative % change vs. control. */
export type Effect = Record<MetricKey, number>;

export type Segment = "enterprise" | "smb" | "developer" | "all";

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

/** A durable lesson the agent has written to long-term memory. */
export type Memory = {
  id: string;
  step: number;
  intervention: string;
  /** Scope the agent believes this lesson applies to. Widening it is the bug. */
  scope: Segment;
  effect: Effect;
  /** Constraints attached to the lesson. Losing these is how over-generalization starts. */
  caveats: string[];
  confidence: number;
  observedOnDay: number;
  /** Days of data behind the reading. Retention needs ~30 to be meaningful. */
  maturityDays: number;
  sourceIds: string[];
  faultIds: string[];
  quarantined?: boolean;
};

export type Objective = {
  primary: string;
  /** Scoring weights the agent actually optimizes. */
  weights: Partial<Record<MetricKey, number>>;
  guardrails: Guardrail[];
};

export type Guardrail = {
  id: string;
  metric: MetricKey;
  /** Minimum tolerated relative change, e.g. -3 means "no worse than -3%". */
  floor: number;
  text: string;
};

export type Experiment = {
  id: string;
  intervention: string;
  segment: Segment;
  launchedOnDay: number;
  /** Day the result is trustworthy for every metric, including laggards. */
  maturesOnDay: number;
  status: "running" | "completed";
  trueEffect: Effect;
  /**
   * Whether the agent promoted the experiment to a permanent change. This is the
   * decision that actually moves the business — running a losing test costs a
   * slice of traffic for a few weeks, shipping a losing test costs everything.
   */
  shipped?: boolean;
};

export type DefenseId =
  | "freshness_validator"
  | "guardrail_checker"
  | "provenance_auditor";

export type RunConfig = {
  scenario: string;
  faultType: FaultType | "none";
  faultStep: number;
  /** Intervention the fault attaches to. Chaos experiments name a target, not a clock tick. */
  faultTarget?: string;
  defenses: DefenseId[];
  maxSteps: number;
  engine: "deterministic" | "llm";
};

export type RunSummary = {
  goalFidelity: number;
  fidelityBreakdown: { label: string; score: number; max: number; note: string }[];
  faultDetected: boolean;
  detectionLatency: number | null;
  propagationDepth: number;
  memoryContamination: number;
  affectedDecisions: number;
  affectedActions: number;
  recovered: boolean;
  recoveryStep: number | null;
  falsePositives: number;
  /** Steps the fault stayed latent before behavior visibly diverged. */
  silentFailureWindow: number | null;
  firstDivergenceStep: number | null;
  finalRecommendation: string;
  guardrailViolations: string[];
  trueCumulative: Effect;
};

export type RunResult = {
  runId: string;
  config: RunConfig;
  objectivePerceived: Objective;
  objectiveCanonical: Objective;
  faults: Fault[];
  trace: TraceEvent[];
  memories: Memory[];
  launched: Experiment[];
  summary: RunSummary;
};

/** What the observation layer hands the agent about one experiment readout. */
export type Observation = {
  id: string;
  experimentId: string;
  intervention: string;
  segment: Segment;
  status: "running" | "completed";
  effect: Effect;
  /** Day the reading was requested. */
  readOnDay: number;
  /** Day the underlying aggregate was actually computed. Diverges under cache staleness. */
  computedOnDay: number;
  /** Day the experiment started, used to reason about how much data is behind a reading. */
  launchedOnDay: number;
  /** Days of data behind the reading. */
  maturityDays: number;
  requiredMaturityDays: number;
  note: string;
  faultIds: string[];
};
