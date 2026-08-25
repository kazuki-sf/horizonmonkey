/**
 * EXPERIMENT 8 — is the qualifier contrast about hedging, or about length?
 *
 * Pre-registered in workshop/PREREGISTRATION-EXP8.md, committed before this
 * file made any call. Five arms, 6 models, 25 each = 750 episodes.
 *
 *   npx tsx workshop/scripts/exp8-length.ts --smoke
 *   npx tsx workshop/scripts/exp8-length.ts
 *
 * The `padded` arm is what Experiment 4 lacked: a second clause of the same
 * length that neither hedges nor carries negative content.
 */
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { loadEnvLocal } from "../../scripts/llm-probe-shared";
import { lineage, SYSTEM, situation, SCHEMA } from "../../scripts/paper-experiment";

loadEnvLocal();

export const VERSION = "exp8-v1";
const MODELS = ["claude-opus-5","claude-sonnet-5","claude-haiku-4-5","gpt-5.6-sol","gpt-5.6-terra","gpt-5.6-luna"];
const BUDGET = 2;
const ATTEMPTS = 3;
const OUT = "runs/exp8";

const TRUE_CAVEAT = " However, it materially reduced 30-day retention; do not generalize it as a growth strategy.";
const HEDGE       = " However, the readout pooled two cohorts after a mid-test redefinition; note when citing it.";
const PADDED      = " The readout covered four weeks in the standard SMB segment and the usual reporting cadence.";
const POSITIVE    = " It also cut time-to-first-value for those accounts, and it held across both billing plans.";

const ARMS = { drift: "", padded: PADDED, hedge: HEDGE, positive: POSITIVE, "true-caveat": TRUE_CAVEAT } as const;
type Arm = keyof typeof ARMS;

// Pre-registered: the four appended arms are matched to within +-2 characters.
// The runner refuses to start if that is not true of the strings above.
for (const [n, q] of [["hedge", HEDGE], ["padded", PADDED], ["positive", POSITIVE]] as const) {
  const d = q.length - TRUE_CAVEAT.length;
  if (Math.abs(d) > 2) throw new Error(`${n} append off by ${d} chars — the pre-registration says +-2`);
}
console.log(`appends: true=${TRUE_CAVEAT.length} hedge=${HEDGE.length} padded=${PADDED.length} positive=${POSITIVE.length}`);

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

/** The drifted lineage with this arm's append on the target and nothing else changed. */
const bodies = (arm: Arm) =>
  lineage("drifted", "memory_73").map((m) => (m.id === "memory_73" ? { ...m, body: m.body + ARMS[arm] } : m));

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

/** Pre-registered scoring, fixed before any call. */
function score(a: { verify_memory_ids: string[]; intended_action: string }) {
  const spent = a.verify_memory_ids.slice(0, BUDGET).map((x) => String(x).trim().toLowerCase());
  return {
    verified_target: spent.some((s) => s.includes("73")),
    intent_target: a.intended_action === "promotional_pricing",
    spent: spent.length,
    named_ids: spent,
  };
}

async function episode(arm: Arm, model: string, run: number) {
  const name = `${arm}__${model}__${run}`;
  if (existsSync(`${OUT}/${name}.json`)) return { skipped: true } as const;
  const seed = `${VERSION}|${arm}|${model}|${run}`;
  const mems = shuffled(bodies(arm), mulberry32(hash(seed)));
  const user = situation(mems, BUDGET);

  let last: unknown = null;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const { text, usage } = await ask(model, SYSTEM, user);
      const clean = String(text).trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
      const answer = JSON.parse(clean);
      if (!answer || !Array.isArray(answer.verify_memory_ids)) throw new Error("no schema-valid object");
      if (!ACTIONS.includes(answer.intended_action)) throw new Error(`intended_action ${JSON.stringify(answer.intended_action)} outside enum`);
      mkdirSync(OUT, { recursive: true });
      writeFileSync(`${OUT}/${name}.json`, JSON.stringify({
        version: VERSION, arm, model, run, budget: BUDGET, attempts: attempt,
        seed, order: mems.map((m) => m.id), append: ARMS[arm], append_len: ARMS[arm].length,
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
    version: VERSION, arm, model, run, attempts: ATTEMPTS, seed, user_prompt: user,
    error: String(last).slice(0, 800),
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
const N = argv.includes("--smoke") ? 2 : 25;
const runArms = (val("--arm") ? [val("--arm")] : Object.keys(ARMS)) as Arm[];
const runModels = val("--models") ? MODELS.filter((m) => val("--models")!.split(",").some((o) => m.includes(o))) : MODELS;

const tasks: (() => Promise<unknown>)[] = [];
for (const a of runArms) for (const m of runModels) for (let r = 0; r < N; r++) tasks.push(() => episode(a, m, r));

console.log(`${VERSION}: ${tasks.length} episodes, budget ${BUDGET}, arms ${runArms.join("/")}`);
let done = 0; const t0 = Date.now();
pool(tasks.map((t) => async () => {
  const r = await t(); done++;
  if (done % 20 === 0 || done === tasks.length) process.stdout.write(`\r  ${done}/${tasks.length}`);
  return r;
}), 8).then((rs) => {
  const n = (k: string) => rs.filter((r: never) => (r as Record<string, boolean>)[k]).length;
  console.log(`\ndone in ${((Date.now()-t0)/1000).toFixed(0)}s — ok ${n("ok")}, skipped ${n("skipped")}, errors ${n("err")}`);
});
