import OpenAI from "openai";
import { loadEnvLocal } from "../../scripts/llm-probe-shared";
import { WORLDS, lineage6, situationDose, schema6 } from "./exp6-worlds";
loadEnvLocal();
const or = new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY, baseURL: "https://openrouter.ai/api/v1" });
const w = WORLDS[0];
const user = situationDose(w, lineage6(w, "drifted"), 2, "A");
async function main() {
  for (const model of ["z-ai/glm-4.7", "meta-llama/llama-4-maverick"]) {
    const r = await or.chat.completions.create({
      model, messages: [{ role: "system", content: w.system }, { role: "user", content: user }],
      response_format: { type: "json_schema", json_schema: { name: "answer", strict: true, schema: schema6(w) } },
    } as never) as never as Record<string, never>;
    const c = (r as never as { choices: Record<string, never>[] }).choices[0];
    console.log(`\n=== ${model} ===`);
    console.log("  message keys:", Object.keys(c.message ?? {}));
    console.log("  content:", JSON.stringify(String((c.message as never as {content:unknown}).content).slice(0, 120)));
    const reas = (c.message as never as {reasoning?: string}).reasoning;
    console.log("  reasoning present:", reas ? `${String(reas).length} chars` : "no");
    console.log("  finish_reason:", (c as never as {finish_reason:string}).finish_reason);
  }
}
main();
