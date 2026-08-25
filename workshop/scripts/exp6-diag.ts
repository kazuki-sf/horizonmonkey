import OpenAI from "openai";
import { loadEnvLocal } from "../../scripts/llm-probe-shared";
import { WORLDS, lineage6, situationDose, schema6 } from "./exp6-worlds";
loadEnvLocal();
const model = process.argv[2];
const maxTok = Number(process.argv[3] ?? 32000);
const or = new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY, baseURL: "https://openrouter.ai/api/v1",
                        timeout: Number(process.argv[4] ?? 90000), maxRetries: 0 });
const w = WORLDS[0];
const user = situationDose(w, lineage6(w, "drifted"), 2, "A");
async function main() {
  const t0 = Date.now();
  try {
    const r = await or.chat.completions.create({
      model, max_tokens: maxTok, reasoning: { effort: "medium" }, provider: { require_parameters: true },
      messages: [{ role: "system", content: w.system }, { role: "user", content: user }],
      response_format: { type: "json_schema", json_schema: { name: "answer", strict: true, schema: schema6(w) } },
    } as never) as never as { choices: { message: { content: string | null } }[]; usage: Record<string, number> };
    const c = r.choices[0].message.content;
    const secs = ((Date.now() - t0) / 1000).toFixed(0);
    console.log(`${model}  max_tokens=${maxTok}  ${secs}s  usage=${JSON.stringify(r.usage)}`);
    console.log("  content len:", c === null ? "NULL" : String(c).length);
    console.log("  first 260:", JSON.stringify(String(c).slice(0, 260)));
    const clean = String(c).trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
    try { console.log("  parsed keys:", Object.keys(JSON.parse(clean))); }
    catch (e) { console.log("  PARSE FAIL:", String(e).slice(0, 90), "| tail:", JSON.stringify(clean.slice(-120))); }
  } catch (e) {
    console.log(`${model}  REQUEST FAILED after ${((Date.now()-t0)/1000).toFixed(0)}s: ${String(e).slice(0, 160)}`);
  }
}
main();
