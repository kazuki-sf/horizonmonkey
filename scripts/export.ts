import { writeFileSync } from "node:fs";
import { compare } from "../examples/growth-agent/compare";
import type { FaultType } from "../core/types";
import type { DefenseId } from "../examples/growth-agent/domain";
import { specFor } from "../examples/growth-agent/faults";

// Freezes one run per fault, with and without its natural defense, so the
// numbers in the README are reproducible without starting the server.
const NATURAL: Record<string, DefenseId> = {
  stale_observation: "freshness_validator",
  goal_mutation: "guardrail_checker",
  memory_poisoning: "provenance_auditor",
  numeric_perturbation: "freshness_validator",
};

const rows: string[] = [];
for (const f of Object.keys(NATURAL) as FaultType[]) {
  const bare = compare(f, []);
  const def = compare(f, [NATURAL[f]]);
  writeFileSync(`runs/${f}.json`, JSON.stringify(bare, null, 2));
  writeFileSync(`runs/${f}--defended.json`, JSON.stringify(def, null, 2));
  const b = bare.baseline.summary;
  const c = bare.chaos.summary;
  const d = def.defended!.summary;
  rows.push(
    `| ${specFor(f).label} | ${b.goalFidelity} | ${c.goalFidelity} | ${c.propagationDepth} | ${c.memoryContamination} | ${c.affectedDecisions} / ${c.affectedActions} | ${c.faultDetected ? "yes" : "**no**"} | ${d.goalFidelity} | ${d.propagationDepth} | ${d.memoryContamination} |`
  );
}
console.log(
  "| Fault | Control | Chaos | Propagation | Contaminated memory | Decisions / actions | Caught by an invariant | Defended fidelity | Defended propagation | Defended contamination |"
);
console.log("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");
console.log(rows.join("\n"));
