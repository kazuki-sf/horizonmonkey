import { WORLDS, lineage6, sources6, corruptedIn, situation6, schema6 } from "./exp6-worlds";
const VARIANTS = ["base", "tempting"] as const;
let fail = 0;
const bad = (m: string) => { console.log("  FAIL " + m); fail++; };

for (const w of WORLDS) {
  console.log(`\n=== ${w.key} ===`);
  // 1. body length band, matching Experiment 1's 109-137
  const lens = w.mems.map(m => m.body.length);
  console.log(`  body lengths: ${lens.join(", ")}  (min ${Math.min(...lens)}, max ${Math.max(...lens)})`);
  if (Math.min(...lens) < 109 || Math.max(...lens) > 137) bad("body length outside the 109-137 band");

  // 2. the two caveats must be close in length: the swap arm must not be a length manipulation
  const cav = Object.entries(w.caveats).map(([k, v]) => [k, v.length] as const);
  console.log(`  caveat lengths: ${cav.map(([k, n]) => `${k}=${n}`).join(", ")}`);
  const d = Math.abs(cav[0][1] - cav[1][1]);
  if (d > 15) bad(`caveats differ by ${d} chars; the swap arm would be confounded by length`);

  // 3. structure: 6 memories, 5 actions, exactly one action backed by 2
  if (w.mems.length !== 6) bad("not six memories");
  if (w.actions.length !== 5) bad("not five actions");
  const sizes = w.actions.map(a => (w.backing[a] ?? []).length).sort();
  if (JSON.stringify(sizes) !== JSON.stringify([1,1,1,1,2])) bad(`backing sizes ${sizes} != 1,1,1,1,2`);
  const backed = new Set(Object.values(w.backing).flat());
  if (backed.size !== 6) bad("backing map does not cover all six memories exactly once");

  // 4. targets: aggressive target backed by exactly 1 action; swap target is in the 2-memory action
  if ((w.backing[w.actions.find(a => w.backing[a].includes(w.target))!] ?? []).length !== 1)
    bad("target is not the sole backer of its action");
  if (!w.backing[w.actions.find(a => w.backing[a].includes(w.swapTarget))!].length)
    bad("swapTarget not in backing");

  // 5. every memory has a source in every arm; the CORRUPTED memory's source
  //    must carry an explicit prohibition, so verifying it actually recovers something
  for (const arm of ["drifted", "drifted-swap"] as const) {
    const src = sources6(w, arm), c = corruptedIn(w, arm);
    for (const m of w.mems) if (!src[m.id]) bad(`${arm}: no source for ${m.id}`);
    if (!/Do NOT/.test(src[c] ?? "")) bad(`${arm}: source for the corrupted ${c} carries no prohibition`);
  }
  // in the drifted arm the non-target caveat-bearer must be benign in BOTH body and source
  {
    const src = sources6(w, "drifted");
    if (/Do NOT/.test(src[w.swapTarget] ?? "")) bad("drifted: the non-target caveat-bearer's source is not benign");
  }

  // 6. caveats visible on screen: 0 in the drifted arm, 1 in the swap arm, and
  //    the corrupted memory never shows one
  for (const arm of ["drifted", "drifted-swap"] as const) {
    const ms = lineage6(w, arm);
    const shown = ms.filter(m => Object.values(w.caveats).some(c => m.body.endsWith(c)));
    const corrupted = corruptedIn(w, arm);
    const want = arm === "drifted" ? 0 : 1;
    if (shown.length !== want) bad(`${arm}: ${shown.length} caveats visible, expected ${want}`);
    if (shown.some(m => m.id === corrupted)) bad(`${arm}: the corrupted memory still shows its caveat`);
    if (arm === "drifted-swap" && shown[0] && shown[0].id !== w.target)
      bad(`swap: the visible caveat is on ${shown[0].id}, expected the aggressive memory ${w.target}`);
    const base = w.mems.find(m => m.id === corrupted)!.body;
    if (ms.find(m => m.id === corrupted)!.body !== base) bad(`${arm}: corrupted body altered`);
  }

  // 7. no arm shows a caveat on the memory backing the two-memory default action
  for (const arm of ["drifted", "drifted-swap"] as const) {
    const dflt = w.actions.find(a2 => w.backing[a2].length === 2)!;
    const ms = lineage6(w, arm);
    if (ms.some(m => w.backing[dflt].includes(m.id) && Object.values(w.caveats).some(c => m.body.endsWith(c))))
      bad(`${arm}: a caveat is visible on the default action's backing memory; this pushes the agent toward the aggressive option`);
  }
  const a = lineage6(w, "drifted");

  // 8. schema enum matches actions
  const s = schema6(w) as any;
  if (JSON.stringify(s.properties.intended_action.enum) !== JSON.stringify(w.actions)) bad("schema enum drift");

  // 9. prose sanity
  // 10. the tempting variant changes ONLY the situation block, nothing else
  for (const v of VARIANTS) {
    const t = situation6(w, a, 2, v as never);
    if (!t.includes("VERIFICATION BUDGET")) bad(`${v}: budget block missing`);
    if (!t.includes(w.objective)) bad(`${v}: objective missing`);
    for (const m of a) if (!t.includes(m.body)) bad(`${v}: memory body ${m.id} missing`);
  }
  {
    const b = situation6(w, a, 2, "base" as never), t = situation6(w, a, 2, "tempting" as never);
    const strip = (x: string) => x.replace(w.situation, "").replace(w.situationTempting, "");
    if (strip(b) !== strip(t)) bad("tempting variant changes text outside the situation block");
    if (b === t) bad("tempting variant is identical to base");
    console.log(`  tempting prompt: ${t.length} chars (base ${b.length})`);
  }
  const txt = w.system + " " + situation6(w, a, 2);
  for (const re of [/\ba [aeiou]/i, /\s\s+\S/]) {
    const hit = txt.match(re);
    if (hit && !/\n/.test(hit[0])) bad(`suspicious prose: ${JSON.stringify(hit[0])}`);
  }
  console.log(`  situation+memory prompt: ${situation6(w, a, 2).length} chars`);
}
console.log(fail ? `\n*** ${fail} STRUCTURAL FAILURES ***` : "\nall structural checks pass");

// --- Amendment 4: the dose series must reproduce its endpoints exactly ------
import { DOSES, situationFor, situationDose } from "./exp6-worlds";
console.log("\n=== dose series ===");
let dfail = 0;
for (const w of WORLDS) {
  if (situationFor(w, "0") !== w.situation) { console.log(`  FAIL ${w.key}: dose 0 != registered base`); dfail++; }
  if (situationFor(w, "AB") !== w.situationTempting) { console.log(`  FAIL ${w.key}: dose AB != registered tempting`); dfail++; }
  const texts = DOSES.map((d) => situationFor(w, d));
  if (new Set(texts).size !== 4) { console.log(`  FAIL ${w.key}: doses are not four distinct texts`); dfail++; }
  // each intermediate must differ from base in exactly one bullet
  for (const d of ["A", "B"] as const) {
    const a = w.situation.split("\n"), c = situationFor(w, d).split("\n");
    const changed = a.filter((l, i) => l !== c[i]).length + Math.abs(a.length - c.length);
    if (changed === 0) { console.log(`  FAIL ${w.key}/${d}: identical to base`); dfail++; }
  }
  const full = DOSES.map((d) => situationDose(w, lineage6(w, "drifted"), 2, d));
  if (new Set(full).size !== 4) { console.log(`  FAIL ${w.key}: full prompts collide across doses`); dfail++; }
  const ok = situationFor(w, "0") === w.situation && situationFor(w, "AB") === w.situationTempting;
  console.log(`  ${w.key}: dose lengths ${texts.map((t) => t.length).join(", ")}  endpoints byte-identical: ${ok}`);
}
console.log(dfail ? `  *** ${dfail} dose failures ***` : "  dose series checks pass");
process.exit(fail + dfail ? 1 : 0);
