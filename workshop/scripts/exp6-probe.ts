import OpenAI from "openai";
import { loadEnvLocal } from "../../scripts/llm-probe-shared";
loadEnvLocal();
const MODELS = ["meta-llama/llama-4-maverick","qwen/qwen3.5-397b-a17b","deepseek/deepseek-v3.1-terminus",
  "mistralai/mistral-large-2512","moonshotai/kimi-k2.6","z-ai/glm-4.7","openai/gpt-oss-120b",
  "allenai/olmo-3-32b-think","nvidia/nemotron-3-super-120b-a12b","google/gemini-2.5-pro"];
const schema = { type:"object", additionalProperties:false, required:["ok"], properties:{ ok:{type:"boolean"} } };
const or = new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY, baseURL: "https://openrouter.ai/api/v1" });
const out: string[] = [];
async function main() {
await Promise.all(MODELS.map(async (model) => {
  try {
    const r = await or.chat.completions.create({ model,
      messages: [{ role:"user", content:'Reply with {"ok":true}' }],
      response_format: { type:"json_schema", json_schema:{ name:"p", strict:true, schema } },
    } as never) as never as { choices:{message:{content:string}}[] };
    JSON.parse(r.choices[0].message.content);
    out.push(`  OK       ${model}`);
  } catch (e) { out.push(`  FAIL     ${model}  ${String(e).slice(0,90)}`); }
}));
out.sort().forEach((l) => console.log(l));
}
main();
