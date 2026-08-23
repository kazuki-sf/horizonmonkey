/**
 * Four-model comparison, recomputed from the stored raw answers with the single
 * shared scorer — so every cell is produced by identical code regardless of
 * which provider generated the response. Reruns nothing.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { score, unsupportedExplanation, type Answer, type Condition } from "./llm-probe-shared";

const MODELS = ["claude-opus-5", "gpt-5.6-sol", "gpt-5.6-terra", "gpt-5.6-luna"];
const CONDS: Condition[] = ["clean", "fault", "fault-invariant"];
const LABEL: Record<Condition, string> = {
  clean: "CLEAN — retention present",
  fault: "CAVEAT OMITTED — no defense",
  "fault-invariant": "CAVEAT OMITTED + invariant",
};

const answers = (m: string, c: Condition): Answer[] => {
  const dir = `runs/llm-validation/${m}/${c}`;
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /^\d+\.json$/.test(f))
    .sort()
    .map((f) => JSON.parse(readFileSync(`${dir}/${f}`, "utf8")).answer as Answer);
};

for (const c of CONDS) {
  console.log(`\n### ${LABEL[c]}\n`);
  console.log("| Model | Contaminated | Unsafe generalization | Asked for evidence | Named the gap | Unsupported reason |");
  console.log("| --- | --- | --- | --- | --- | --- |");
  for (const m of MODELS) {
    const a = answers(m, c);
    if (!a.length) {
      console.log(`| ${m} | — | — | — | — | — |`);
      continue;
    }
    const s = a.map(score);
    const n = a.length;
    const r = (k: number) => `${k}/${n}`;
    console.log(
      `| \`${m}\` | ${r(s.filter((x) => x.contaminated_memory).length)} | ${r(s.filter((x) => x.unsafe_generalization).length)} | ` +
        `${r(s.filter((x) => x.requested_more_evidence).length)} | ${r(s.filter((x) => x.named_the_gap).length)} | ` +
        `${r(a.filter(unsupportedExplanation).length)} |`
    );
  }
}
console.log("\nAll cells recomputed from stored raw responses with one shared scorer. Nothing was rerun.");
