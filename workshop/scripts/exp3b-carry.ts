/**
 * Experiment 3B — randomized provenance carry-forward.  workshop/PREREGISTRATION.md
 *
 * Fresh single-call phase-2 session.  What was "already recovered" is assigned
 * at random rather than chosen by the model, so the effect of having the
 * corrupted memory's source in context is identified without self-selection.
 *
 *   carry-target : memory_73's record + one other, drawn uniformly from the five
 *   carry-other  : two of the five non-target records, uniform without replacement
 *
 * Both arms carry exactly two records; only whether one is the target differs.
 *
 *   npx tsx workshop/scripts/exp3b-carry.ts [--smoke]
 */
import { replayPrompt, ask, score, save, done, lineage, SYSTEM, MODELS, NON_TARGET,
         mulberry32, hash, shuffled, type A } from "./replay-shared";

const VERSION = "exp3b-v1";
const OUT = "workshop/runs/exp3b-v1";
const SMOKE = process.argv.includes("--smoke");
const ARMS = ["carry-target", "carry-other"] as const;
const N = SMOKE ? 1 : 25;

/** Which two source records this episode carries forward. Seeded, reproducible. */
export function carried(arm: string, model: string, run: number): string[] {
  const rnd = mulberry32(hash(`${VERSION}|${model}|${arm}|${run}|carry`));
  const pool = shuffled(NON_TARGET, rnd);
  const pair = arm === "carry-target" ? ["memory_73", pool[0]] : [pool[0], pool[1]];
  return shuffled(pair, mulberry32(hash(`${VERSION}|${model}|${arm}|${run}|present`)));
}

async function one(model: string, arm: string, run: number) {
  const dir = `${OUT}/${model}/${arm}`;
  const name = String(run).padStart(3, "0");
  if (done(dir, name)) return false;

  const rnd = mulberry32(hash(`${VERSION}|${model}|${arm}|${run}`));
  const bodies = shuffled(lineage("drifted", "memory_73"), rnd);   // caveat absent in both arms
  const carry = carried(arm, model, run);
  const user = replayPrompt(bodies, carry);

  const t0 = Date.now();
  const r = await ask(model, SYSTEM, user);
  const a = JSON.parse(r.text) as A;
  save(dir, name, {
    version: VERSION, model, arm, run,
    order: bodies.map((m) => m.id), position: bodies.findIndex((m) => m.id === "memory_73"),
    carried: carry, carried_target: carry.includes("memory_73"),
    answer: a, scores: score(a), usage: r.usage, elapsed_ms: Date.now() - t0,
  });
  return true;
}

type Job = { model: string; arm: string; run: number };
const jobs: Job[] = [];
for (const m of MODELS) for (const arm of ARMS) for (let run = 1; run <= N; run++) jobs.push({ model: m, arm, run });
console.log(`Experiment 3B: ${jobs.length} episodes -> ${OUT}\n`);

let n = 0, skipped = 0;
async function worker() {
  while (jobs.length) {
    const j = jobs.shift()!;
    try { (await one(j.model, j.arm, j.run)) ? n++ : skipped++; }
    catch (e) { console.error(`FAIL ${j.model}/${j.arm}/${j.run}:`, String(e).slice(0, 200)); }
    if (n && n % 25 === 0) console.log(`  ${n} done`);
  }
}
async function main() {
  await Promise.all(Array.from({ length: 4 }, worker));
  console.log(`\ndone: ${n} written, ${skipped} skipped`);
}
main();
