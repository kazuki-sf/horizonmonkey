/**
 * Experiment 3A — randomized-instrument replay.  workshop/PREREGISTRATION.md
 *
 * Replays ONLY phase 2 for each of the 450 existing Experiment-2 episodes, as a
 * fresh session with no triage invariant (any arm) and no conversation history,
 * carrying forward exactly the source records that episode's phase 1 spent its
 * budget on.  Triage assignment stays randomized upstream but can no longer
 * reach the phase-2 answer except through what was carried forward.
 *
 *   npx tsx workshop/scripts/exp3a-replay.ts [--smoke]
 */
import { readFileSync } from "node:fs";
import { globSync } from "node:fs";
import { replayPrompt, ask, score, save, done, lineage, SYSTEM, type A } from "./replay-shared";

const VERSION = "exp3a-v1";
const OUT = "workshop/runs/exp3a-v1";
const SMOKE = process.argv.includes("--smoke");

type Ep = { model: string; condition: "clean"|"drifted"|"drifted-triage"; run: number; order: string[]; spent: string[];
            scores: { verified_73: boolean; p2_action: string; p2_scale: string } };

const files = globSync("runs/paper-phase2/phase2-v1/**/*.json");
const eps: Ep[] = files.map((f) => JSON.parse(readFileSync(f, "utf8"))).filter((e) => "spent" in e);
console.log(`source episodes: ${eps.length}`);

const work = SMOKE ? eps.filter((e) => e.run <= 1) : eps;
console.log(`replaying: ${work.length} episodes  ->  ${OUT}\n`);

let n = 0, skipped = 0;
const LIMIT = 4;


async function one(e: Ep) {
  const dir = `${OUT}/${e.model}/${e.condition}`;
  const name = String(e.run).padStart(3, "0");
  if (done(dir, name)) { skipped++; return; }

  // bodies for this episode's condition, in this episode's stored order
  const byId = Object.fromEntries(lineage(e.condition, "memory_73").map((m) => [m.id, m]));
  const bodies = e.order.map((id) => byId[id]);
  const recovered = e.spent.length ? e.spent : [];
  const user = replayPrompt(bodies, recovered);

  const t0 = Date.now();
  const r = await ask(e.model, SYSTEM, user);              // SYSTEM only — never INVARIANT
  const a = JSON.parse(r.text) as A;
  save(dir, name, {
    version: VERSION, model: e.model, condition: e.condition, run: e.run,
    order: e.order, carried: recovered,
    verified_73_in_phase1: e.spent.includes("memory_73"),
    original_p2_action: e.scores.p2_action, original_p2_scale: e.scores.p2_scale,
    answer: a, scores: score(a), usage: r.usage, elapsed_ms: Date.now() - t0,
  });
  n++;
  if (n % 25 === 0) console.log(`  ${n} done (${skipped} already on disk)`);
}

const queue = [...work];
async function worker() { while (queue.length) { const e = queue.shift()!; try { await one(e); } catch (err) { console.error(`FAIL ${e.model}/${e.condition}/${e.run}:`, String(err).slice(0,200)); } } }
async function main() {
  await Promise.all(Array.from({ length: LIMIT }, worker));
  console.log(`\ndone: ${n} written, ${skipped} skipped (already present)`);
}
main();
