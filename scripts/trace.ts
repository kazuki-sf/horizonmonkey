import { runScenario } from "../core/run";
import type { FaultType } from "../core/types";
import { specFor } from "../core/faults";
const f = (process.argv[2] ?? "memory_poisoning") as FaultType;
const r = runScenario({ scenario: "growth", faultType: f, faultStep: 0, faultTarget: specFor(f).defaultTarget, defenses: [], maxSteps: 24, engine: "deterministic" });
for (const e of r.trace) {
  if (e.type === "evaluation") continue;
  console.log(`s${String(e.step).padStart(2)} ${e.faultIds.length ? "⚠" : " "} ${e.type.padEnd(15)} ${e.id.padEnd(9)} ${e.summary.slice(0, 96)}`);
}
console.log(JSON.stringify(r.summary, null, 1).slice(0, 900));
