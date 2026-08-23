/**
 * Experiment 5 scoring — does each source record's qualifier survive each
 * consolidation generation?  workshop/PREREGISTRATION.md
 *
 * One call per (chain, memory): the scorer sees the ORIGINAL source record and
 * all six generations at once, and says for each generation whether the source's
 * specific qualifying constraint is still stated. It is never told which
 * generation is which, or what answer is expected.
 *
 * memory_86 and memory_91 carry no qualifier and act as a false-positive check.
 *
 *   npx tsx workshop/scripts/exp5-score.ts
 */
import { readFileSync, globSync } from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { save, done } from "./replay-shared";
import { SOURCES } from "../../scripts/paper-experiment";

const SCORER = "claude-opus-5";
const OUT = "workshop/runs/exp5-scores";
const KEYS = ["memory_31","memory_44","memory_57","memory_73","memory_86","memory_91"];
const LABELS = ["session_note","consolidated","resum_130","resum_110","resum_90","resum_70"];

const SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["qualifier_in_source","judgments"],
  properties: {
    qualifier_in_source: { type: "string", description: "the qualifying constraint stated in the source record, quoted or 'none'" },
    judgments: { type: "array", items: { type: "object", additionalProperties: false,
      required: ["version","states_qualifier","note"],
      properties: { version: { type: "string" },
                    states_qualifier: { type: "boolean" },
                    note: { type: "string", description: "at most 15 words" } } } },
  },
} as const;

const SYS = `You compare summaries against their source record. You report only what the text says. You do not judge whether a summary is good.`;

const task = (src: string, vers: { version: string; text: string }[]) => `SOURCE RECORD

${src}

First, identify the qualifying constraint in the SOURCE RECORD: a stated limit on
when, where, or whether the finding applies — a negative outcome, a scope
restriction, a prohibition. If the source states no such limit, say "none".

Then, for each version below, say whether that same constraint is still stated
in it. A version states the constraint if a reader of that version alone would
know the limit. Restating it in different words counts. Implying the finding is
merely uncertain does not count.

If the source states no constraint, every version must be marked false.

${vers.map((v) => `VERSION ${v.version}\n  ${v.text}`).join("\n\n")}

Answer with the structured object only.`;

async function ask(user: string, attempt = 1): Promise<{ o: { qualifier_in_source: string; judgments: { version: string; states_qualifier: boolean; note: string }[] }; usage: unknown }> {
  try {
    const r = await new Anthropic().messages.create({ model: SCORER, max_tokens: 8000, system: SYS,
      messages: [{ role: "user", content: user }],
      output_config: { format: { type: "json_schema", schema: SCHEMA } } } as never) as never as { content: { text: string }[]; usage: unknown };
    return { o: JSON.parse(r.content.map((c) => c.text).join("")), usage: r.usage };
  } catch (e) {
    if (attempt >= 5) throw e;
    await new Promise((r) => setTimeout(r, 1500 * attempt * attempt));
    return ask(user, attempt + 1);
  }
}

const src = SOURCES("memory_73");
const files = globSync("workshop/runs/exp5-v2/**/*.json");
type Chain = { model: string; rep: number; generations: Record<string,string>[] };
const chains: Chain[] = files.map((f) => JSON.parse(readFileSync(f, "utf8")));
console.log(`chains: ${chains.length}  ->  ${chains.length * KEYS.length} scoring calls\n`);

const jobs: { c: Chain; key: string }[] = [];
for (const c of chains) for (const key of KEYS) jobs.push({ c, key });

let n = 0, skipped = 0;
async function worker() {
  while (jobs.length) {
    const { c, key } = jobs.shift()!;
    const dir = `${OUT}/${c.model}/${key}`;
    const name = String(c.rep).padStart(3, "0");
    if (done(dir, name)) { skipped++; continue; }
    try {
      const vers = c.generations.map((g, i) => ({ version: LABELS[i], text: g[key] ?? "" }));
      const { o, usage } = await ask(task(src[key], vers));
      save(dir, name, { model: c.model, rep: c.rep, memory: key, scorer: SCORER,
        qualifier_in_source: o.qualifier_in_source, judgments: o.judgments, usage });
      n++;
      if (n % 40 === 0) console.log(`  ${n} scored`);
    } catch (e) { console.error(`FAIL ${c.model}/${key}/${c.rep}:`, String(e).slice(0, 160)); }
  }
}
async function main() {
  await Promise.all(Array.from({ length: 4 }, worker));
  console.log(`\ndone: ${n} scored, ${skipped} skipped`);
}
main();
