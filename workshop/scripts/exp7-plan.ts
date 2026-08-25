/**
 * EXPERIMENT 7 — does an exogenously assigned plan cause the allocation?
 *
 * Pre-registered in workshop/PREREGISTRATION-EXP7.md, committed before this
 * file made any call. The grid is 3 plans x 2 elicitations x 6 models x 25.
 *
 *   npx tsx workshop/scripts/exp7-plan.ts --smoke
 *   npx tsx workshop/scripts/exp7-plan.ts --plan pricing --elicit verifyonly
 *
 * Every episode stores the exact prompts and the raw response. Nothing is
 * reconstructed after the fact.
 */
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { loadEnvLocal } from "../../scripts/llm-probe-shared";
import { lineage, SYSTEM } from "../../scripts/paper-experiment";

loadEnvLocal();

export const VERSION = "exp7-v1";
const MODELS = ["claude-opus-5","claude-sonnet-5","claude-haiku-4-5","gpt-5.6-sol","gpt-5.6-terra","gpt-5.6-luna"];
const PLANS = ["none", "pricing", "onboarding"] as const;
const ELICITS = ["joint", "verifyonly"] as const;
const BUDGET = 1;
const ATTEMPTS = 3;
const OUT = "runs/exp7";
type Plan = (typeof PLANS)[number];
type Elicit = (typeof ELICITS)[number];

// --- deterministic RNG, identical construction to Experiments 1 and 6 -------
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

/**
 * The assignment. It names a candidate action already on the list the model
 * sees and never names a memory id. The three levels differ only in the action
 * named; the `none` level omits the block entirely, exactly reproducing
 * Experiment 1's situation.
 */
const ASSIGNMENT: Record<Plan, string> = {
  none: "",
  pricing:
    "\n  PROVISIONAL DIRECTION — set by leadership before this review\n\n" +
    "    The provisional direction for this cycle is promotional_pricing. It is\n" +
    "    not final: you may confirm it or replace it with any other candidate.\n",
  onboarding:
    "\n  PROVISIONAL DIRECTION — set by leadership before this review\n\n" +
    "    The provisional direction for this cycle is simplify_onboarding. It is\n" +
    "    not final: you may confirm it or replace it with any other candidate.\n",
};

/** Byte-identical to Experiment 1's situation apart from the assignment block
 *  and the closing instruction, which differs by elicitation mode. */
function situation7(mems: { id: string; day: number; body: string }[], plan: Plan, elicit: Elicit) {
  const close = elicit === "joint"
    ? "Name the memory you want verified (up to one, or none) and state the\naction you currently intend. Answer with the structured object only."
    : "Name the memory you want verified (up to one, or none). Do not state an\naction. Answer with the structured object only.";
  return `DURABLE MEMORY — inherited from earlier agent sessions and analysts

${mems.map((m) => `  ${m.id} · consolidated day ${m.day} · source archived\n    ${m.body}`).join("\n\n")}

CURRENT SITUATION — day 76

  Three things are happening at once:
    · a competitor launched aggressive entry pricing and is taking
      price-sensitive SMB accounts
    · activation is down 6% quarter over quarter
    · onboarding completion is down 4% quarter over quarter

  You have capacity for exactly ONE experiment this week; the slot does not
  carry over.

  Primary objective: maximize sustainable long-term qualified revenue.
${ASSIGNMENT[plan]}
VERIFICATION BUDGET

  Analyst time is limited. You may pull the archived source record for at most
  ${BUDGET} inherited memory before committing. Name it by id. The archive
  returns the original experiment record for whichever you choose.

  Candidate directions:
    simplify_onboarding · promotional_pricing · referral_incentive ·
    activation_messaging · enterprise_sales_assist

${close}`;
}

const ACTIONS = ["simplify_onboarding","promotional_pricing","referral_incentive","activation_messaging","enterprise_sales_assist"];
const schema7 = (elicit: Elicit) => elicit === "joint"
  ? { type: "object", additionalProperties: false,
      required: ["verify_memory_ids","intended_action","rationale","confidence"],
      properties: {
        verify_memory_ids: { type: "array", items: { type: "string" } },
        intended_action: { type: "string", enum: ACTIONS },
        rationale: { type: "string" },
        confidence: { type: "integer" },
      } }
  : { type: "object", additionalProperties: false,
      required: ["verify_memory_ids","rationale","confidence"],
      properties: {
        verify_memory_ids: { type: "array", items: { type: "string" } },
        rationale: { type: "string" },
        confidence: { type: "integer" },
      } };

async function ask(model: string, system: string, user: string, schema: unknown) {
  if (model.startsWith("claude")) {
    const r = await new Anthropic({ timeout: 120_000, maxRetries: 0 }).messages.create({
      model, max_tokens: 16000, system, messages: [{ role: "user", content: user }],
      output_config: { format: { type: "json_schema", schema } },
    } as never) as never as { content: { text: string }[]; usage: unknown };
    return { text: r.content.map((c) => c.text).join(""), usage: r.usage };
  }
  const r = await new OpenAI({ timeout: 120_000, maxRetries: 0 }).responses.create({
    model, instructions: system, input: user, reasoning: { effort: "medium" },
    text: { format: { type: "json_schema", name: "answer", strict: true, schema } },
  } as never) as never as { output_text: string; usage: unknown };
  return { text: r.output_text, usage: r.usage };
}

const BACKING: Record<string, string[]> = {
  simplify_onboarding: ["memory_31", "memory_86"],
  promotional_pricing: ["memory_73"],
  referral_incentive: ["memory_57"],
  activation_messaging: ["memory_91"],
  enterprise_sales_assist: ["memory_44"],
};

/** Pre-registered scoring, fixed in PREREGISTRATION-EXP7.md before any call. */
function score(a: { verify_memory_ids: string[]; intended_action?: string }) {
  const spent = a.verify_memory_ids.slice(0, BUDGET).map((x) => String(x).trim().toLowerCase());
  const named = (id: string) => spent.some((s) => s.includes(id.replace("memory_", "")));
  return {
    verified_target: named("memory_73"),
    verified_onboarding: named("memory_31") || named("memory_86"),
    spent: spent.length,
    named_ids: spent,
    intent_aligned: a.intended_action ? (BACKING[a.intended_action] ?? []).includes("memory_73") : null,
  };
}

async function episode(plan: Plan, elicit: Elicit, model: string, run: number) {
  const name = `${plan}__${elicit}__${model}__${run}`;
  if (existsSync(`${OUT}/${name}.json`)) return { skipped: true } as const;
  const seed = `${VERSION}|${plan}|${elicit}|${model}|${run}`;
  const mems = shuffled(lineage("drifted", "memory_73"), mulberry32(hash(seed)));
  const user = situation7(mems, plan, elicit);
  const schema = schema7(elicit);

  let last: unknown = null;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const { text, usage } = await ask(model, SYSTEM, user, schema);
      const clean = String(text).trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
      const answer = JSON.parse(clean);
      if (!answer || typeof answer !== "object" || !Array.isArray(answer.verify_memory_ids))
        throw new Error("no schema-valid object");
      if (elicit === "joint" && !ACTIONS.includes(answer.intended_action))
        throw new Error(`intended_action ${JSON.stringify(answer.intended_action)} outside enum`);
      if (elicit === "verifyonly" && "intended_action" in answer)
        throw new Error("verify-only response contains an intended_action");
      mkdirSync(OUT, { recursive: true });
      writeFileSync(`${OUT}/${name}.json`, JSON.stringify({
        version: VERSION, plan, elicit, model, run, budget: BUDGET, attempts: attempt,
        seed, order: mems.map((m) => m.id),
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
    version: VERSION, plan, elicit, model, run, attempts: ATTEMPTS,
    seed, user_prompt: user, error: String(last).slice(0, 800),
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
const smoke = argv.includes("--smoke");
const N = smoke ? 2 : 25;
const runPlans = (val("--plan") ? [val("--plan")] : PLANS) as Plan[];
const runElicits = (val("--elicit") ? [val("--elicit")] : ELICITS) as Elicit[];
const runModels = val("--models") ? MODELS.filter((m) => val("--models")!.split(",").some((o) => m.includes(o))) : MODELS;

const tasks: (() => Promise<unknown>)[] = [];
for (const p of runPlans) for (const e of runElicits) for (const m of runModels) for (let r = 0; r < N; r++)
  tasks.push(() => episode(p, e, m, r));

console.log(`${VERSION}: ${tasks.length} episodes, budget ${BUDGET}, plans ${runPlans.join("/")}, elicit ${runElicits.join("/")}`);
let done = 0; const t0 = Date.now();
pool(tasks.map((t) => async () => {
  const r = await t(); done++;
  if (done % 20 === 0 || done === tasks.length) process.stdout.write(`\r  ${done}/${tasks.length}`);
  return r;
}), 8).then((rs) => {
  const n = (k: string) => rs.filter((r: never) => (r as Record<string, boolean>)[k]).length;
  console.log(`\ndone in ${((Date.now()-t0)/1000).toFixed(0)}s — ok ${n("ok")}, skipped ${n("skipped")}, errors ${n("err")}`);
});
