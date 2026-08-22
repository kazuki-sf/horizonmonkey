// Canonical, key-sorted dump of every run the demo can produce. Used to prove a
// refactor changed no behaviour: the output must be byte-identical across the
// change. Not part of the demo.
import { compare } from "../examples/growth-agent/compare";
import { FAULT_CATALOG } from "../examples/growth-agent/faults";
import { DEFENSE_CATALOG } from "../examples/growth-agent/defenses";
import type { DefenseId } from "../examples/growth-agent/domain";

const sort = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(sort)
    : v && typeof v === "object"
      ? Object.fromEntries(Object.entries(v as object).sort(([a], [b]) => a.localeCompare(b)).map(([k, x]) => [k, sort(x)]))
      : v;

const combos: DefenseId[][] = [[], ...DEFENSE_CATALOG.map((d) => [d.id]), DEFENSE_CATALOG.map((d) => d.id)];
for (const f of FAULT_CATALOG)
  for (const c of combos)
    console.log(`### ${f.type} [${c.join("+")}]\n` + JSON.stringify(sort(compare(f.type, c)), null, 1));
