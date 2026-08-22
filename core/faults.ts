import type { Fault, FaultType } from "./types";

// ============================================================================
// Fault injection — the domain-agnostic half.
//
// What generalizes across scenarios is the *bookkeeping*: minting fault ids,
// deciding when a fault is armed, matching it to a named target rather than a
// wall-clock step, and capturing the before/after pair that makes the injection
// auditable afterwards.
//
// What does not generalize is what a stale observation or a dropped caveat
// actually looks like in your domain. Subclass this and implement that part;
// see `examples/growth-agent/faults.ts` for a worked version.
//
// The design rule that matters more than any of the code here: a corrupted
// artifact must remain schema-valid, internally consistent, and defensible to a
// human reviewer. A fault that looks wrong is a fault the agent would catch,
// which teaches us nothing about semantic resilience.
// ============================================================================

export type FaultSpec = {
  type: FaultType;
  label: string;
  blurb: string;
  /** Why a reviewer would wave this through. Worth writing down for every fault. */
  plausibility: string;
  /** Artifact family the fault attaches to, the way a chaos experiment names a service. */
  defaultTarget?: string;
  targetLabel: string;
};

export class BaseFaultInjector {
  readonly faults: Fault[] = [];
  protected fired = false;

  /**
   * `target` names the artifact family the fault attaches to. `atStep` is a
   * floor, not a trigger: the fault arms as soon as the target shows up.
   */
  constructor(
    protected readonly type: FaultType | "none",
    protected readonly atStep: number,
    protected readonly target?: string
  ) {}

  get hasFired() {
    return this.fired;
  }

  /** True when this fault should fire on an artifact belonging to `subject`. */
  protected armed(step: number, subject?: string) {
    if (this.type === "none" || this.fired || step < this.atStep) return false;
    if (this.target && subject && subject !== this.target) return false;
    return true;
  }

  /** Records the injection, including the ground-truth value it replaced. */
  protected record(f: Omit<Fault, "id">): Fault {
    const fault: Fault = { id: `fault_${this.faults.length + 1}`, ...f };
    this.faults.push(fault);
    this.fired = true;
    return fault;
  }
}
