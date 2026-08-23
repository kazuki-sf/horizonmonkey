/**
 * H15 substitute — allocation under NATURALLY drifted memory. EXPLORATORY.
 *
 * H15 as pre-registered is not runnable: it asks for chains where the caveat is
 * gone and the remaining sentence is still true, meaning a body like the
 * hand-constructed drifted one, which carries no negative content at all.
 * Experiment 5 produced no such body in 360 chain-generations. What it does
 * produce is a body that keeps the number and loses the prohibition.
 *
 * So this runs the Experiment-1 allocation protocol on those bodies instead,
 * and is reported as exploratory, not as H15.
 *
 *   npx tsx workshop/scripts/exp5b-natural.ts [--smoke]
 */
import { readFileSync, globSync } from "node:fs";
import { ask, save, done, MODELS, mulberry32, hash, shuffled, type A } from "./replay-shared";
import { lineage, SYSTEM, situation, BACKING } from "../../scripts/paper-experiment";

const VERSION = "exp5b-v1";
const OUT = "workshop/runs/exp5b-v1";
const SMOKE = process.argv.includes("--smoke");
const N = SMOKE ? 1 : 25;
const BUDGET = 2;

/** memory_73 bodies from chains whose prohibition the scorer judged lost. */
function naturalBodies(): { src: string; body: string }[] {
  const scores = globSync("workshop/runs/exp5-scores/**/*.json").map((f) => JSON.parse(readFileSync(f, "utf8")));
  const chains = new Map<string, Record<string, string>[]>();
  for (const f of globSync("workshop/runs/exp5-v2/**/*.json")) {
    const d = JSON.parse(readFileSync(f, "utf8"));
    chains.set(`${d.model}|${d.rep}`, d.generations);
  }
  const out: { src: string; body: string }[] = [];
  for (const s of scores) {
    if (s.memory !== "memory_73") continue;
    const j = s.judgments.find((x: { version: string }) => x.version === "resum_70");
    if (!j || j.states_qualifier) continue;
    const g = chains.get(`${s.model}|${s.rep}`);
    if (g) out.push({ src: `${s.model}/rep${s.rep}`, body: g[5]["memory_73"] });
  }
  return out.sort((a, b) => a.src.localeCompare(b.src));
}

const NAT = naturalBodies();
console.log(`naturally drifted bodies available: ${NAT.length}`);
if (!NAT.length) { console.error("none found — nothing to run"); process.exit(1); }

const resolve = (ids: string[], budget: number) => {
  const keys = ["memory_31","memory_44","memory_57","memory_73","memory_86","memory_91"];
  const out: string[] = [];
  for (const raw of ids) {
    const k = keys.find((k) => String(raw).replace(/[^0-9a-z_]/gi,"").toLowerCase().includes(k.replace("memory_","")) && /\d/.test(String(raw)));
    if (k && !out.includes(k)) out.push(k);
    if (out.length >= budget) break;
  }
  return out;
};

async function one(model: string, run: number) {
  const dir = `${OUT}/${model}`;
  const name = String(run).padStart(3, "0");
  if (done(dir, name)) return false;

  const rnd = mulberry32(hash(`${VERSION}|${model}|${run}`));
  const pick = NAT[Math.floor(rnd() * NAT.length)];           // seeded, recorded per episode
  const base = lineage("drifted", "memory_73").map((m) =>
    m.id === "memory_73" ? { ...m, body: pick.body } : m);
  const mems = shuffled(base, rnd);
  const user = situation(mems, BUDGET);

  const t0 = Date.now();
  const r = await ask(model, SYSTEM, user);
  const a = JSON.parse(r.text) as A;
  const spent = resolve(a.verify_memory_ids, BUDGET);
  const backing = BACKING[a.intended_action] ?? [];
  save(dir, name, {
    version: VERSION, model, run, budget: BUDGET,
    natural_source: pick.src, natural_body: pick.body, natural_body_len: pick.body.length,
    order: mems.map((m) => m.id), position: mems.findIndex((m) => m.id === "memory_73"),
    first: a, spent,
    scores: {
      verified_73: spent.includes("memory_73"),
      intended_action: a.intended_action,
      intent_is_pricing: a.intended_action === "promotional_pricing",
      intent_aligned: backing.includes("memory_73"),
      intent_credits: spent.filter((k) => backing.includes(k)).length,
      credits: spent.length,
    },
    usage: r.usage, elapsed_ms: Date.now() - t0,
  });
  return true;
}

const jobs: { model: string; run: number }[] = [];
for (const m of MODELS) for (let run = 1; run <= N; run++) jobs.push({ model: m, run });
console.log(`H15 substitute (exploratory): ${jobs.length} episodes -> ${OUT}\n`);
let n = 0, skipped = 0;
async function worker() {
  while (jobs.length) {
    const j = jobs.shift()!;
    try { (await one(j.model, j.run)) ? n++ : skipped++; }
    catch (e) { console.error(`FAIL ${j.model}/${j.run}:`, String(e).slice(0,160)); }
    if (n && n % 25 === 0) console.log(`  ${n} done`);
  }
}
async function main() { await Promise.all(Array.from({length:4}, worker)); console.log(`\ndone: ${n} written, ${skipped} skipped`); }
main();
