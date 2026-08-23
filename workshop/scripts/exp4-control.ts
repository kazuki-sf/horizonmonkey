/**
 * Experiment 4 — matched-qualifier controls.  workshop/PREREGISTRATION.md
 *
 * Addresses D3: in Experiment 1's clean arm the target body is 221 chars
 * against 123-132 for every other memory, and is the only memory carrying a
 * `However` clause.  Four arms, run concurrently, first pass only:
 *
 *   drifted         no qualifier                             (129 chars)
 *   clean-positive  length-matched positive elaboration      (+91)
 *   clean-neutral   length-matched confidence-weakening note (+92)
 *   clean-negative  the true caveat                          (+92)
 *
 *   npx tsx workshop/scripts/exp4-control.ts [--smoke]
 */
import { ask, save, done, MODELS, mulberry32, hash, shuffled, type A } from "./replay-shared";
import { lineage, SYSTEM, situation, BACKING } from "../../scripts/paper-experiment";

const VERSION = "exp4-v1";
const OUT = "workshop/runs/exp4-v1";
const SMOKE = process.argv.includes("--smoke");
const N = SMOKE ? 1 : 25;
const BUDGET = 2;

const TRUE_CAVEAT = " However, it materially reduced 30-day retention; do not generalize it as a growth strategy.";
const NEUTRAL     = " However, the readout pooled two cohorts after a mid-test redefinition; note when citing it.";
const POSITIVE    = " It also cut time-to-first-value for those accounts, and it held across both billing plans.";

// pre-registered: matched on length to within +-2 characters
for (const [n, q] of [["neutral", NEUTRAL], ["positive", POSITIVE]] as const) {
  const d = q.length - TRUE_CAVEAT.length;
  if (Math.abs(d) > 2) throw new Error(`${n} qualifier off by ${d} chars — pre-registration says +-2`);
}
console.log(`qualifier lengths: true=${TRUE_CAVEAT.length} neutral=${NEUTRAL.length} positive=${POSITIVE.length}`);

const ARMS = { drifted: "", "clean-positive": POSITIVE, "clean-neutral": NEUTRAL, "clean-negative": TRUE_CAVEAT } as const;
type Arm = keyof typeof ARMS;

/** Drifted lineage with this arm's qualifier appended to the target. */
function bodies(arm: Arm) {
  return lineage("drifted", "memory_73").map((m) => m.id === "memory_73" ? { ...m, body: m.body + ARMS[arm] } : m);
}

const resolve = (ids: string[], budget: number) => {
  const keys = ["memory_31","memory_44","memory_57","memory_73","memory_86","memory_91"];
  const out: string[] = [];
  for (const raw of ids) {
    const k = keys.find((k) => String(raw).replace(/[^0-9a-z_]/gi, "").toLowerCase().includes(k.replace("memory_", "")) && /\d/.test(String(raw)));
    if (k && !out.includes(k)) out.push(k);
    if (out.length >= budget) break;
  }
  return out;
};

async function one(model: string, arm: Arm, run: number) {
  const dir = `${OUT}/${model}/${arm}`;
  const name = String(run).padStart(3, "0");
  if (done(dir, name)) return false;

  const rnd = mulberry32(hash(`${VERSION}|${model}|${arm}|${run}`));
  const mems = shuffled(bodies(arm), rnd);
  const user = situation(mems, BUDGET);

  const t0 = Date.now();
  const r = await ask(model, SYSTEM, user);
  const a = JSON.parse(r.text) as A;
  const spent = resolve(a.verify_memory_ids, BUDGET);
  const backing = BACKING[a.intended_action] ?? [];
  save(dir, name, {
    version: VERSION, model, arm, run, budget: BUDGET,
    order: mems.map((m) => m.id), position: mems.findIndex((m) => m.id === "memory_73"),
    target_body_len: mems.find((m) => m.id === "memory_73")!.body.length,
    first: a, spent,
    scores: {
      verified_73: spent.includes("memory_73"),
      intended_action: a.intended_action,
      intent_is_pricing: a.intended_action === "promotional_pricing",
      intent_credits: spent.filter((k) => backing.includes(k)).length,
      credits: spent.length,
    },
    usage: r.usage, elapsed_ms: Date.now() - t0,
  });
  return true;
}

type Job = { model: string; arm: Arm; run: number };
const jobs: Job[] = [];
for (const m of MODELS) for (const arm of Object.keys(ARMS) as Arm[]) for (let run = 1; run <= N; run++) jobs.push({ model: m, arm, run });
console.log(`Experiment 4: ${jobs.length} episodes -> ${OUT}\n`);

let n = 0, skipped = 0;
async function worker() {
  while (jobs.length) {
    const j = jobs.shift()!;
    try { (await one(j.model, j.arm, j.run)) ? n++ : skipped++; }
    catch (e) { console.error(`FAIL ${j.model}/${j.arm}/${j.run}:`, String(e).slice(0, 200)); }
    if (n && n % 50 === 0) console.log(`  ${n} done`);
  }
}
async function main() {
  await Promise.all(Array.from({ length: 4 }, worker));
  console.log(`\ndone: ${n} written, ${skipped} skipped`);
}
main();
