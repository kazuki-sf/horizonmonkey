/**
 * EXPERIMENT 9 — is consolidation's corruption stealthier than the one we build by hand?
 *
 * Pre-registered in workshop/PREREGISTRATION-EXP9.md, committed before this
 * file made any call. Four arms, 6 models, 25 each = 600 episodes.
 *
 *   npx tsx workshop/scripts/exp9-natural.ts --print   inspect the bodies only
 *   npx tsx workshop/scripts/exp9-natural.ts --smoke
 *   npx tsx workshop/scripts/exp9-natural.ts
 *
 * The natural bodies are the 60 stored resum_70 outputs of Experiment 5, taken
 * unfiltered. The pre-registration explains why no extraction rule is applied.
 */
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { mkdirSync, writeFileSync, existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { loadEnvLocal } from "../../scripts/llm-probe-shared";
import { lineage, SYSTEM, situation, SCHEMA } from "../../scripts/paper-experiment";

loadEnvLocal();

export const VERSION = "exp9-v1";
const MODELS = ["claude-opus-5","claude-sonnet-5","claude-haiku-4-5","gpt-5.6-sol","gpt-5.6-terra","gpt-5.6-luna"];
const BUDGET = 2;
const ATTEMPTS = 3;
const CLEAN = process.argv.includes("--clean-padding");
const OUT = CLEAN ? "runs/exp9-sens" : "runs/exp9";
const CHAINS = "workshop/runs/exp5-v2";

const TRUE_CAVEAT = " However, it materially reduced 30-day retention; do not generalize it as a growth strategy.";

/** Every resum_70 body for memory_73, in a stable order: model then rep. */
function naturalBodies(): { body: string; model: string; rep: number }[] {
  const out: { body: string; model: string; rep: number }[] = [];
  const walk = (d: string) => {
    for (const e of readdirSync(d)) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) walk(p);
      else if (e.endsWith(".json")) {
        const c = JSON.parse(readFileSync(p, "utf8"));
        const g = c.generations?.[c.generations.length - 1];
        if (g?.memory_73) out.push({ body: g.memory_73, model: c.model, rep: c.rep });
      }
    }
  };
  walk(CHAINS);
  out.sort((a, b) => (a.model === b.model ? a.rep - b.rep : a.model < b.model ? -1 : 1));
  return out;
}
const NATURAL = naturalBodies();

/** Neutral, complete clauses of graded length. The one chosen is whichever
 *  brings the body closest to the hand-drift length. None hedges, none carries
 *  negative content, none reinforces the finding: they state where and when the
 *  readout was taken. */
const FILLERS = [
  "",
  " Standard SMB segment.",
  " Measured in the standard SMB segment.",
  " Measured over four weeks in the standard SMB segment.",
  " Measured over four weeks in the standard SMB segment on the usual cadence.",
];
function padTo(body: string, target: number, terminate = false): string {
  // `terminate` closes a body that ends without punctuation before appending, so
  // the filler does not run on into it. Off by default: the registered arm was
  // run without it and its data is not rewritten. See EXP9-FINDINGS.md.
  const b = terminate && !/[.!?;]$/.test(body.trim()) ? body.trimEnd() + "." : body;
  let best = b, bestGap = Math.abs(b.length - target);
  for (const f of FILLERS) {
    const g = Math.abs(b.length + f.length - target);
    if (g < bestGap) { bestGap = g; best = b + f; }
  }
  return best;
}

const HAND_DRIFT = lineage("drifted", "memory_73").find((m) => m.id === "memory_73")!.body;
const TARGET_LEN = HAND_DRIFT.length;

type Arm = "natural" | "natural-padded" | "hand-drift" | "intact";
const ARMS: Arm[] = ["natural", "natural-padded", "hand-drift", "intact"];

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

/** The body this arm shows for memory_73, and which natural chain it came from. */
function targetBody(arm: Arm, seed: string) {
  if (arm === "hand-drift") return { body: HAND_DRIFT, source: null as null | number };
  if (arm === "intact") return { body: HAND_DRIFT + TRUE_CAVEAT, source: null };
  const idx = hash(seed + "|body") % NATURAL.length;
  const nat = NATURAL[idx].body;
  return { body: arm === "natural" ? nat : padTo(nat, TARGET_LEN, CLEAN), source: idx };
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

async function episode(arm: Arm, model: string, run: number) {
  const name = `${arm}__${model}__${run}`;
  if (existsSync(`${OUT}/${name}.json`)) return { skipped: true } as const;
  const seed = `${VERSION}|${arm}|${model}|${run}`;
  const { body, source } = targetBody(arm, seed);
  const mems = shuffled(
    lineage("drifted", "memory_73").map((m) => (m.id === "memory_73" ? { ...m, body } : m)),
    mulberry32(hash(seed)));
  const user = situation(mems, BUDGET);

  let last: unknown = null;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const { text, usage } = await ask(model, SYSTEM, user);
      const clean = String(text).trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
      const answer = JSON.parse(clean);
      if (!answer || !Array.isArray(answer.verify_memory_ids)) throw new Error("no schema-valid object");
      if (!ACTIONS.includes(answer.intended_action)) throw new Error("intended_action outside enum");
      mkdirSync(OUT, { recursive: true });
      writeFileSync(`${OUT}/${name}.json`, JSON.stringify({
        version: VERSION, arm, model, run, budget: BUDGET, attempts: attempt, seed,
        target_body: body, target_len: body.length,
        natural_index: source, natural_source: source === null ? null : NATURAL[source],
        order: mems.map((m) => m.id),
        system_prompt: SYSTEM, user_prompt: user, memory_block: mems,
        raw_response: text, answer, usage, scored: score(answer),
      }, null, 1));
      return { ok: true } as const;
    } catch (e) {
      last = e;
      if (attempt < ATTEMPTS) await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  mkdirSync(OUT, { recursive: true });
  writeFileSync(`${OUT}/${name}.ERROR.json`, JSON.stringify({
    version: VERSION, arm, model, run, attempts: ATTEMPTS, seed, error: String(last).slice(0, 800),
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
  const lens = NATURAL.map((n) => n.body.length).sort((a, b) => a - b);
  console.log(`${NATURAL.length} natural bodies, ${new Set(NATURAL.map(n=>n.body)).size} distinct`);
  console.log(`  lengths ${lens[0]}-${lens[lens.length-1]}, median ${lens[Math.floor(lens.length/2)]}`);
  console.log(`  hand-drift ${HAND_DRIFT.length}, intact ${(HAND_DRIFT+TRUE_CAVEAT).length}`);
  const padded = NATURAL.map((n) => padTo(n.body, TARGET_LEN).length);
  const off = padded.map((l) => Math.abs(l - TARGET_LEN));
  console.log(`  padded to ${Math.min(...padded)}-${Math.max(...padded)} (target ${TARGET_LEN}, worst deviation ${Math.max(...off)})`);
  for (const i of [0, 1, 2]) {
    console.log(`\n  [${NATURAL[i].body.length}] ${NATURAL[i].body}`);
    console.log(`  [${padTo(NATURAL[i].body, TARGET_LEN).length}] ${padTo(NATURAL[i].body, TARGET_LEN)}`);
  }
  process.exit(0);
}

const N = argv.includes("--smoke") ? 2 : 25;
const runArms = (val("--arm") ? [val("--arm")] : CLEAN ? ["natural-padded"] : ARMS) as Arm[];
const runModels = val("--models") ? MODELS.filter((m) => val("--models")!.split(",").some((o) => m.includes(o))) : MODELS;
const tasks: (() => Promise<unknown>)[] = [];
for (const a of runArms) for (const m of runModels) for (let r = 0; r < N; r++) tasks.push(() => episode(a, m, r));

console.log(`${VERSION}: ${tasks.length} episodes, budget ${BUDGET}, arms ${runArms.join("/")}, ${NATURAL.length} natural bodies`);
let done = 0; const t0 = Date.now();
pool(tasks.map((t) => async () => {
  const r = await t(); done++;
  if (done % 20 === 0 || done === tasks.length) process.stdout.write(`\r  ${done}/${tasks.length}`);
  return r;
}), 8).then((rs) => {
  const n = (k: string) => rs.filter((r: never) => (r as Record<string, boolean>)[k]).length;
  console.log(`\ndone in ${((Date.now()-t0)/1000).toFixed(0)}s — ok ${n("ok")}, skipped ${n("skipped")}, errors ${n("err")}`);
});
