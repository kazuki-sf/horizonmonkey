import { runScenario } from "../core/run";
import { firstDivergence } from "../core/propagation";
import type { DefenseId, FaultType } from "../core/types";
import { specFor } from "../core/faults";

const STEPS = 24;
const base = (faultType: FaultType | "none", defenses: DefenseId[] = []) =>
  runScenario({ scenario: "growth", faultType, faultStep: 0, faultTarget: specFor(faultType as FaultType).defaultTarget, defenses, maxSteps: STEPS, engine: "deterministic" });

const baseline = base("none");
const show = (name: string, r: ReturnType<typeof runScenario>) => {
  const s = r.summary;
  const div = firstDivergence(baseline, r);
  console.log(`\n=== ${name} ===`);
  console.log(`  fidelity=${s.goalFidelity}  detected=${s.faultDetected}(lat=${s.detectionLatency})  prop=${s.propagationDepth}  mem=${s.memoryContamination}  dec=${s.affectedDecisions}  act=${s.affectedActions}  recov=${s.recovered}@${s.recoveryStep}  firstDiv=${div}`);
  console.log(`  final: ${s.finalRecommendation}`);
  console.log(`  true cumulative: ${JSON.stringify(s.trueCumulative)}`);
  console.log(`  violations: ${s.guardrailViolations.join(" ; ") || "none"}`);
  console.log(`  launched: ${r.launched.map(e=>e.intervention+":"+e.segment).join(", ")}`);
};

show("BASELINE", baseline);
for (const f of ["stale_observation","memory_poisoning","goal_mutation","numeric_perturbation"] as FaultType[]) {
  show(`FAULT ${f}`, base(f));
}
console.log("\n--- with defenses ---");
show("stale + freshness", base("stale_observation", ["freshness_validator"]));
show("poison + provenance", base("memory_poisoning", ["provenance_auditor"]));
show("goalmut + reanchor", base("goal_mutation", ["guardrail_checker"]));
