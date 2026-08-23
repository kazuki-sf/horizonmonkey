/**
 * The same caveat-omission probe, run against OpenAI models.
 *
 * Fairness is enforced by construction rather than by discipline: the system
 * prompt, both readouts, the invariant wording, the output schema and the
 * scorer are imported from `llm-probe-shared.ts` — the identical objects the
 * Anthropic runner uses. Only the transport differs. No prompt is tuned per
 * model, and no model gets an easier or harder version of the task.
 *
 *   npx tsx scripts/llm-validation-openai.ts --smoke     # 1 per condition per model
 *   npx tsx scripts/llm-validation-openai.ts --n 10      # the real run
 *   npx tsx scripts/llm-validation-openai.ts --n 10 --models gpt-5.6-sol
 */
import OpenAI from "openai";
import { mkdirSync, writeFileSync } from "node:fs";
import {
  CONDITIONS,
  SCHEMA,
  loadEnvLocal,
  score,
  unsupportedExplanation,
  type Answer,
  type Condition,
  type Scores,
} from "./llm-probe-shared";

const DEFAULT_MODELS = ["gpt-5.6-sol", "gpt-5.6-terra", "gpt-5.6-luna"];
const EFFORT = "medium" as const;

const argv = process.argv.slice(2);
const flag = (n: string) => argv.includes(n);
const val = (n: string) => {
  const i = argv.indexOf(n);
  return i >= 0 ? argv[i + 1] : undefined;
};

loadEnvLocal();
if (!process.env.OPENAI_API_KEY) {
  console.error(
    "No OPENAI_API_KEY found. Put it in .env.local as OPENAI_API_KEY=sk-... (gitignored)."
  );
  process.exit(1);
}

const client = new OpenAI();
let parseFailures = 0;

async function callOnce(
  model: string,
  cond: Condition,
  attempt = 1
): Promise<{ answer: Answer; usage: unknown; raw: string }> {
  const { system, user } = CONDITIONS[cond];
  const res = await client.responses.create({
    model,
    instructions: system,
    input: user,
    reasoning: { effort: EFFORT },
    text: {
      format: {
        type: "json_schema",
        name: "growth_agent_decision",
        strict: true,
        schema: SCHEMA as unknown as Record<string, unknown>,
      },
    },
  });
  const raw = res.output_text ?? "";
  try {
    return { answer: JSON.parse(raw) as Answer, usage: res.usage, raw };
  } catch (e) {
    parseFailures++;
    console.log(`  [unparseable output · ${model} · ${cond} · attempt ${attempt} — retrying]`);
    if (attempt >= 3) throw e;
    return callOnce(model, cond, attempt + 1);
  }
}

type Row = { model: string; condition: Condition; run: number; scores: Scores; unsupported: boolean; answer: Answer };

async function main() {
  const models = (val("--models") ?? DEFAULT_MODELS.join(",")).split(",");
  const N = flag("--smoke") ? 1 : Number(val("--n") ?? 1);
  const smoke = flag("--smoke");
  const rows: Row[] = [];

  for (const model of models) {
    for (const cond of Object.keys(CONDITIONS) as Condition[]) {
      const dir = `runs/llm-validation/${model}/${cond}`;
      if (!smoke) mkdirSync(dir, { recursive: true });
      for (let i = 1; i <= N; i++) {
        const t0 = Date.now();
        const { answer, usage, raw } = await callOnce(model, cond);
        const scores = score(answer);
        const unsupported = unsupportedExplanation(answer);
        rows.push({ model, condition: cond, run: i, scores, unsupported, answer });
        if (!smoke) {
          writeFileSync(
            `${dir}/${String(i).padStart(2, "0")}.json`,
            JSON.stringify(
              {
                model,
                condition: cond,
                run: i,
                reasoning: { effort: EFFORT },
                request: CONDITIONS[cond],
                answer,
                scores,
                unsupported_explanation: unsupported,
                usage,
                raw,
                elapsed_ms: Date.now() - t0,
              },
              null,
              2
            )
          );
        }
        console.log(
          `${model.padEnd(14)} ${cond.padEnd(16)} ${String(i).padStart(2)}  ` +
            `scope=${answer.generalization_scope.padEnd(18)} valence=${answer.lesson_valence.padEnd(13)} ` +
            `promote=${answer.promote_to_memory ? "Y" : "n"} asks=${answer.requests_more_evidence ? "Y" : "n"} ` +
            `named_gap=${scores.named_the_gap ? "Y" : "n"} unsupported=${unsupported ? "Y" : "n"} ` +
            `CONTAM=${scores.contaminated_memory ? "YES" : "no "}`
        );
      }
    }
  }

  if (smoke) {
    console.log(`\nsmoke test complete · ${rows.length} calls · unparseable retried: ${parseFailures}`);
    return;
  }

  const rate = (m: string, c: Condition, f: (r: Row) => boolean) => {
    const g = rows.filter((r) => r.model === m && r.condition === c);
    return `${g.filter(f).length}/${g.length}`;
  };
  for (const cond of Object.keys(CONDITIONS) as Condition[]) {
    console.log(`\n=== ${cond} ===`);
    console.log("model           contaminated  unsafe-gen  asks-more  names-gap  unsupported-reason");
    for (const m of models) {
      console.log(
        `${m.padEnd(15)} ${rate(m, cond, (r) => r.scores.contaminated_memory).padEnd(13)} ` +
          `${rate(m, cond, (r) => r.scores.unsafe_generalization).padEnd(11)} ` +
          `${rate(m, cond, (r) => r.scores.requested_more_evidence).padEnd(10)} ` +
          `${rate(m, cond, (r) => r.scores.named_the_gap).padEnd(10)} ` +
          `${rate(m, cond, (r) => r.unsupported)}`
      );
    }
  }
  for (const m of models)
    writeFileSync(
      `runs/llm-validation/${m}/summary.json`,
      JSON.stringify({ model: m, n: N, reasoning: { effort: EFFORT }, rows: rows.filter((r) => r.model === m) }, null, 2)
    );
  if (parseFailures) console.log(`\nunparseable generations retried: ${parseFailures}`);
}

void main();
