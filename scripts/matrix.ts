import { compare } from "../examples/growth-agent/compare";
import { DEFENSE_CATALOG } from "../examples/growth-agent/defenses";
import { FAULT_CATALOG } from "../examples/growth-agent/faults";
import type { DefenseId } from "../examples/growth-agent/domain";

// The full fault x defense matrix. Printed as markdown for the README, because a
// harness that only reports the pairings that work is not reporting anything.
const combos: { label: string; ids: DefenseId[] }[] = [
  { label: "none", ids: [] },
  ...DEFENSE_CATALOG.map((d) => ({ label: d.label, ids: [d.id] })),
  { label: "all three", ids: DEFENSE_CATALOG.map((d) => d.id) },
];

console.log(`| Fault | ${combos.map((c) => c.label).join(" | ")} |`);
console.log(`| --- | ${combos.map(() => "---").join(" | ")} |`);
for (const f of FAULT_CATALOG) {
  const cells = combos.map((c) => {
    const r = compare(f.type, c.ids);
    const s = (r.defended ?? r.chaos).summary;
    return `${s.goalFidelity} · ${s.propagationDepth}/${s.memoryContamination}`;
  });
  console.log(`| **${f.label}** | ${cells.join(" | ")} |`);
}
console.log("\nCells are `goal fidelity · propagation/contaminated memories`. Control run scores 95.");
