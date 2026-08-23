/**
 * Experiment 5 — natural consolidation drift.  workshop/PREREGISTRATION.md
 *
 * Instead of deleting a caveat by hand, run a real consolidation chain and keep
 * whatever it loses:
 *   gen1  session notes   (analyst writes up the cycle)
 *   gen2  consolidation   (notes -> durable organizational lessons)
 *   gen3  re-summarization(durable memory compressed to one-to-two sentences)
 *
 * No generation is told to preserve or drop anything, and none mentions
 * caveats, qualifiers, retention, or scope.
 *
 *   npx tsx workshop/scripts/exp5-drift.ts [--smoke]
 */
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { save, done, MODELS } from "./replay-shared";
import { SOURCES } from "../../scripts/paper-experiment";

const VERSION = "exp5-v2";
const OUT = "workshop/runs/exp5-v2";
const SMOKE = process.argv.includes("--smoke");
const REPS = SMOKE ? 1 : 10;
const KEYS = ["memory_31","memory_44","memory_57","memory_73","memory_86","memory_91"];

const LESSONS_SCHEMA = {
  type: "object", additionalProperties: false, required: ["lessons"],
  properties: { lessons: { type: "object", additionalProperties: false, required: KEYS,
    properties: Object.fromEntries(KEYS.map((k) => [k, { type: "string" }])) } },
} as const;

const SYS = `You are an analyst at Northwind Analytics, a B2B SaaS company, maintaining the team's written record of what has been learned. Write the way a working analyst writes for colleagues who will read this later.`;

const GEN1 = (srcs: string) => `EXPERIMENT ARCHIVE — this cycle's completed experiments

${srcs}

Write up this cycle. For each experiment, produce a short session note in your own words, as you would for the team channel. Key the notes by the memory id given for each experiment.

Answer with the structured object only.`;

const GEN2 = (notes: string) => `SESSION NOTES — this cycle

${notes}

Consolidate these into the team's durable lessons: the standing knowledge future analysts and agent sessions will inherit and reason from. One durable lesson per id.

Answer with the structured object only.`;

const GEN3 = (lessons: string, target: number, cycle: number) => `DURABLE MEMORY — current, start of cycle ${cycle}

${lessons}

Durable memory has to load at the start of every session, and later cycles are competing for the same space. Re-summarize each lesson to around ${target} characters.

Answer with the structured object only.`;

/** Re-summarization rounds: memory is compressed again every cycle as it ages. */
const ROUNDS = [130, 110, 90, 70];

async function ask(model: string, user: string, attempt = 1): Promise<{ lessons: Record<string,string>; usage: unknown }> {
  try {
    if (model.startsWith("claude")) {
      const r = await new Anthropic().messages.create({ model, max_tokens: 16000, system: SYS,
        messages: [{ role: "user", content: user }],
        output_config: { format: { type: "json_schema", schema: LESSONS_SCHEMA } } } as never) as never as { content: { text: string }[]; usage: unknown };
      return { lessons: JSON.parse(r.content.map((c) => c.text).join("")).lessons, usage: r.usage };
    }
    const r = await new OpenAI().responses.create({ model, instructions: SYS, input: user, reasoning: { effort: "medium" },
      text: { format: { type: "json_schema", name: "lessons", strict: true, schema: LESSONS_SCHEMA } } } as never) as never as { output_text: string; usage: unknown };
    return { lessons: JSON.parse(r.output_text).lessons, usage: r.usage };
  } catch (e) {
    if (attempt >= 5) throw e;
    await new Promise((r) => setTimeout(r, 1500 * attempt * attempt));
    return ask(model, user, attempt + 1);
  }
}

const fmt = (o: Record<string,string>) => KEYS.map((k) => `  ${k}\n    ${o[k]}`).join("\n\n");

async function chain(model: string, rep: number) {
  const dir = `${OUT}/${model}`;
  const name = String(rep).padStart(3, "0");
  if (done(dir, name)) return false;

  const src = SOURCES("memory_73");
  const srcBlock = KEYS.map((k) => `  ${k}\n${src[k].split("\n").map((l) => "    " + l).join("\n")}`).join("\n\n");

  const t0 = Date.now(); const usage: unknown[] = [];
  const g1 = await ask(model, GEN1(srcBlock)); usage.push(g1.usage);
  const g2 = await ask(model, GEN2(fmt(g1.lessons))); usage.push(g2.usage);

  const gens: Record<string,string>[] = [g1.lessons, g2.lessons];
  let cur = g2.lessons;
  for (let i = 0; i < ROUNDS.length; i++) {
    const r = await ask(model, GEN3(fmt(cur), ROUNDS[i], i + 2));
    usage.push(r.usage); cur = r.lessons; gens.push(cur);
  }

  save(dir, name, {
    version: VERSION, model, rep, rounds: ROUNDS,
    generations: gens,                       // [notes, consolidated, 130, 110, 90, 70]
    gen_labels: ["session_note","consolidated","resum_130","resum_110","resum_90","resum_70"],
    final: cur,
    lengths: Object.fromEntries(KEYS.map((k) => [k, gens.map((g) => g[k]?.length ?? null)])),
    usage, elapsed_ms: Date.now() - t0,
  });
  return true;
}

const jobs: { model: string; rep: number }[] = [];
for (const m of MODELS) for (let rep = 1; rep <= REPS; rep++) jobs.push({ model: m, rep });
console.log(`Experiment 5: ${jobs.length} chains x 6 generations -> ${OUT}\n`);

let n = 0, skipped = 0;
async function worker() {
  while (jobs.length) {
    const j = jobs.shift()!;
    try { (await chain(j.model, j.rep)) ? n++ : skipped++; }
    catch (e) { console.error(`FAIL ${j.model}/${j.rep}:`, String(e).slice(0, 200)); }
    if (n && n % 10 === 0) console.log(`  ${n} chains done`);
  }
}
async function main() {
  await Promise.all(Array.from({ length: 3 }, worker));
  console.log(`\ndone: ${n} chains written, ${skipped} skipped`);
}
main();
