import type { BlastRadius, Fault, FaultType, TraceEvent } from "../../core/types";

// ============================================================================
// Domain model for the reference scenario: a growth agent running experiments
// against a synthetic SaaS business.
//
// None of this is part of the harness. It is what one long-horizon decision
// environment happens to look like — swap it, and `core/` is unchanged.
// ============================================================================

export type MetricKey = "signup" | "qualified" | "retention" | "revenue";

/** Effect of an intervention, expressed as relative % change vs. control. */
export type Effect = Record<MetricKey, number>;

export type Segment = "enterprise" | "smb" | "developer" | "all";

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

export type DefenseId = "freshness_validator" | "guardrail_checker" | "provenance_auditor";

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

/**
 * Harness-computed blast radius plus the scenario's own outcome scoring.
 * The first half is domain-agnostic; the second half only means something here.
 */
export type RunSummary = BlastRadius & {
  goalFidelity: number;
  fidelityBreakdown: { label: string; score: number; max: number; note: string }[];
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
