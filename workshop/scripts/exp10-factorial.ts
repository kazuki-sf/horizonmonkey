/**
 * EXPERIMENT 10 — syntax x constraint, quantification held constant.
 *
 * Pre-registered in workshop/PREREGISTRATION-EXP10.md, committed with the slot
 * grammar before this file made any call.
 *
 *   npx tsx workshop/scripts/exp10-factorial.ts --print
 *   npx tsx workshop/scripts/exp10-factorial.ts --smoke
 *   npx tsx workshop/scripts/exp10-factorial.ts               primary run
 *   npx tsx workshop/scripts/exp10-factorial.ts --replication  DO NOT RUN until
 *                                                             the primary is analysed
 */
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { loadEnvLocal } from "../../scripts/llm-probe-shared";
import { lineage, SYSTEM, situation, SCHEMA } from "../../scripts/paper-experiment";
import { FAMILIES, bodyFor, shape, type Syntax, type Level, type Cell } from "./exp10-slots";

loadEnvLocal();

const REPL = process.argv.includes("--replication");
export const VERSION = REPL ? "exp10-r1" : "exp10-v1";
const OUT = REPL ? "runs/exp10-repl" : "runs/exp10";
const MODELS = ["claude-opus-5","claude-sonnet-5","claude-haiku-4-5","gpt-5.6-sol","gpt-5.6-terra","gpt-5.6-luna"];
const BUDGET = 2;
const ATTEMPTS = 3;

const SYNTAXES: Syntax[] = ["fluent", "telegraphic"];
const LEVELS: Level[] = ["removed", "negative", "prohibition"];
const CELLS: Cell[] = [...SYNTAXES.flatMap((s) => LEVELS.map((l) => `${s}/${l}` as Cell)), "bridge"];

/** Experiment 9's hand-drift body, verbatim, as the bridge to the old result. */
const BRIDGE = lineage("drifted", "memory_73").find((m) => m.id === "memory_73")!.body;

// Pre-registered assertion, checked before any call: within each family and
// syntax, the three constraint levels match on numeric count and clause count.
for (let i = 0; i < FAMILIES.length; i++) for (const s of SYNTAXES) {
  const r = LEVELS.map((l) => shape(bodyFor(i, s, l)));
  const n = new Set(r.map((x) => x.numerics)), c = new Set(r.map((x) => x.clauses));
  if (n.size !== 1 || c.size !== 1)
    throw new Error(`${FAMILIES[i].name}/${s}: numerics ${[...n]} clauses ${[...c]} — the pre-registration says constant`);
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (s: string) => { let h = 2166136261; for (let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);} return h>>>0; };
function shuffled<T>(a0: T[], rnd: () => number): T[] {
  const a = [...a0];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function cellBody(cell: Cell, seed: string) {
  if (cell === "bridge") return { body: BRIDGE, family: null as string | null, syntax: null as Syntax | null, level: null as Level | null };
  const [syntax, level] = cell.split("/") as [Syntax, Level];
  const fi = hash(seed + "|family") % FAMILIES.length;
  return { body: bodyFor(fi, syntax, level), family: FAMILIES[fi].name, syntax, level };
}

async function ask(model: string, system: string, user: string) {
  if (model.startsWith("claude")) {
    const r = await new Anthropic({ timeout: 120_000, maxRetries: 0 }).messages.create({
      model, max_tokens: 16000, system, messages: [{ role: "user", content: user }],
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
    } as never) as never as { content: { text: string }[]; usage: unknown };
    return { text: r.content.map((c) => c.text).join(""), usage: r.usage };
  }
  const r = await new OpenAI({ timeout: 120_000, maxRetries: 0 }).responses.create({
    model, instructions: system, input: user, reasoning: { effort: "medium" },
    text: { format: { type: "json_schema", name: "answer", strict: true, schema: SCHEMA } },
  } as never) as never as { output_text: string; usage: unknown };
  return { text: r.output_text, usage: r.usage };
}

const ACTIONS = ["simplify_onboarding","promotional_pricing","referral_incentive","activation_messaging","enterprise_sales_assist"];
function score(a: { verify_memory_ids: string[]; intended_action: string }) {
  const spent = a.verify_memory_ids.slice(0, BUDGET).map((x) => String(x).trim().toLowerCase());
  return {
    verified_target: spent.some((s) => s.includes("73")),
    intent_target: a.intended_action === "promotional_pricing",
    spent: spent.length, named_ids: spent,
  };
}

async function episode(cell: Cell, model: string, run: number) {
  const name = `${cell.replace("/", "-")}__${model}__${run}`;
  if (existsSync(`${OUT}/${name}.json`)) return { skipped: true } as const;
  const seed = `${VERSION}|${cell}|${model}|${run}`;
  const { body, family, syntax, level } = cellBody(cell, seed);
  const mems = shuffled(
    lineage("drifted", "memory_73").map((m) => (m.id === "memory_73" ? { ...m, body } : m)),
    mulberry32(hash(seed)));
  const user = situation(mems, BUDGET);

  const retries: string[] = [];
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const { text, usage } = await ask(model, SYSTEM, user);
      const clean = String(text).trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
      const answer = JSON.parse(clean);
      if (!answer || !Array.isArray(answer.verify_memory_ids)) throw new Error("no schema-valid object");
      if (!ACTIONS.includes(answer.intended_action)) throw new Error(`intended_action ${JSON.stringify(answer.intended_action)} outside enum`);
      mkdirSync(OUT, { recursive: true });
      writeFileSync(`${OUT}/${name}.json`, JSON.stringify({
        version: VERSION, replication: REPL, cell, syntax, level, family,
        model, run, budget: BUDGET, seed, attempts: attempt, retries,
        target_body: body, target_shape: shape(body),
        order: mems.map((m) => m.id),
        system_prompt: SYSTEM, user_prompt: user, memory_block: mems,
        raw_response: text, answer, usage, validation: "schema-valid", scored: score(answer),
      }, null, 1));
      return { ok: true } as const;
    } catch (e) {
      retries.push(String(e).slice(0, 300));
      if (attempt < ATTEMPTS) await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  mkdirSync(OUT, { recursive: true });
  writeFileSync(`${OUT}/${name}.ERROR.json`, JSON.stringify({
    version: VERSION, cell, model, run, seed, attempts: ATTEMPTS, retries, user_prompt: user,
  }, null, 1));
  return { err: true } as const;
}

async function pool<T>(tasks: (() => Promise<T>)[], width: number) {
  const out: T[] = []; let i = 0;
  await Promise.all(Array.from({ length: width }, async () => {
    while (i < tasks.length) { const j = i++; out[j] = await tasks[j](); }
  }));
  return out;
}

const argv = process.argv.slice(2);
const val = (n: string) => (argv.indexOf(n) >= 0 ? argv[argv.indexOf(n) + 1] : undefined);

if (argv.includes("--print")) {
  console.log(`bridge [${BRIDGE.length}] ${BRIDGE}\n`);
  for (const c of CELLS) if (c !== "bridge") {
    const [s, l] = c.split("/") as [Syntax, Level];
    const L = FAMILIES.map((_, i) => bodyFor(i, s, l).length);
    console.log(`${c.padEnd(24)} chars ${Math.min(...L)}-${Math.max(...L)}`);
    console.log(`   ${bodyFor(0, s, l)}`);
  }
  process.exit(0);
}

const N = argv.includes("--smoke") ? 2 : 20;
const runCells = (val("--cell") ? [val("--cell")] : CELLS) as Cell[];
const runModels = val("--models") ? MODELS.filter((m) => val("--models")!.split(",").some((o) => m.includes(o))) : MODELS;
const tasks: (() => Promise<unknown>)[] = [];
for (const c of runCells) for (const m of runModels) for (let r = 0; r < N; r++) tasks.push(() => episode(c, m, r));

console.log(`${VERSION}${REPL ? "  [REPLICATION]" : ""}: ${tasks.length} episodes, budget ${BUDGET}, ${runCells.length} cells, ${FAMILIES.length} families -> ${OUT}`);
let done = 0; const t0 = Date.now();
pool(tasks.map((t) => async () => {
  const r = await t(); done++;
  if (done % 25 === 0 || done === tasks.length) process.stdout.write(`\r  ${done}/${tasks.length}`);
  return r;
}), 8).then((rs) => {
  const n = (k: string) => rs.filter((r: never) => (r as Record<string, boolean>)[k]).length;
  console.log(`\ndone in ${((Date.now()-t0)/1000).toFixed(0)}s — ok ${n("ok")}, skipped ${n("skipped")}, errors ${n("err")}`);
});
