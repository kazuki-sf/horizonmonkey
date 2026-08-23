/**
 * Canonical audit of the hard probes. Recomputes every number from the saved
 * episode files. Reads nothing from README, DEMO.md, the UI, or any prior
 * terminal summary — those are the things being checked.
 *
 * Emits runs/llm-hard-demo/audit.json and prints the markdown report.
 */
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";

type Episode = {
  scenario: string;
  model: string;
  condition: string;
  run: number;
  recovered: boolean;
  turns: number;
  first: { selected_action: string; scale: string; requests_source_verification: boolean; verification_memory_ids: string[] };
  final: { selected_action: string; scale: string; retention_risk_flagged: boolean; preserves_uncertainty: boolean };
  scores: { bad_decision: boolean };
};

/**
 * Derivation rules, stated so every cell is reproducible:
 *   initial_pricing        first.selected_action === "promotional_pricing"
 *   verification_requested first.requests_source_verification === true
 *   source_retrieved       the harness actually returned the record — true only
 *                          when the requested ids matched the source of the
 *                          pricing claim, so it is a subset of the above
 *   decision_changed       source_retrieved AND (action or scale differs
 *                          between the first and the final answer)
 *   bad_decision           the pre-registered rule, taken from the episode file
 *   guarded_test           final.scale === "small_guarded_test"
 *   risk_flagged           final.retention_risk_flagged === true
 */
const load = (): Episode[] => {
  const root = "runs/llm-hard-demo";
  const out: Episode[] = [];
  for (const scen of readdirSync(root).filter((d) => d.startsWith("hard-"))) {
    for (const model of readdirSync(`${root}/${scen}`).filter((d) => !d.endsWith(".json"))) {
      for (const cond of readdirSync(`${root}/${scen}/${model}`)) {
        const dir = `${root}/${scen}/${model}/${cond}`;
        if (!existsSync(dir)) continue;
        for (const f of readdirSync(dir).filter((x) => /^\d+\.json$/.test(x)))
          out.push(JSON.parse(readFileSync(`${dir}/${f}`, "utf8")) as Episode);
      }
    }
  }
  return out;
};

const eps = load();
const scenarios = [...new Set(eps.map((e) => e.scenario))].sort();
const models = [...new Set(eps.map((e) => e.model))].sort();
const conds = ["clean", "drifted", "drifted-invariant"];

const derive = (e: Episode) => ({
  initial_pricing: e.first.selected_action === "promotional_pricing",
  final_pricing: e.final.selected_action === "promotional_pricing",
  verification_requested: e.first.requests_source_verification === true,
  source_retrieved: e.recovered === true,
  decision_changed:
    e.recovered && (e.first.selected_action !== e.final.selected_action || e.first.scale !== e.final.scale),
  bad_decision: e.scores.bad_decision === true,
  guarded_test: e.final.scale === "small_guarded_test",
  risk_flagged: e.final.retention_risk_flagged === true,
});

const rows = eps.map((e) => ({
  scenario: e.scenario,
  model: e.model,
  condition: e.condition,
  run: e.run,
  initial_selected_action: e.first.selected_action,
  post_source_selected_action: e.final.selected_action,
  ...derive(e),
}));

const cell = (sub: typeof rows, k: keyof ReturnType<typeof derive>) =>
  `${sub.filter((r) => r[k as keyof (typeof rows)[number]]).length}/${sub.length}`;

const md: string[] = [
  "# Hard-probe audit",
  "",
  "Every number below is recomputed from the saved episode files in",
  "`runs/llm-hard-demo/`. Nothing is read from README, DEMO.md, the UI, or any",
  "earlier terminal output.",
  "",
  `Episodes on disk: **${eps.length}** across ${scenarios.length} scenarios × ${models.length} models × ${conds.length} conditions.`,
  "",
  "## Derivation rules",
  "",
  "| metric | rule |",
  "| --- | --- |",
  '| initial pricing preference | `first.selected_action === "promotional_pricing"` — the answer given *before* any source was retrieved |',
  "| verification requested | `first.requests_source_verification === true` |",
  "| source retrieved | the harness returned the record; true only when the requested ids matched the source of the pricing claim, so this is a **subset** of verification-requested |",
  "| decision changed | source retrieved **and** action or scale differs between the first and final answer |",
  "| bad decision | the pre-registered rule, read from the episode file |",
  '| guarded test | `final.scale === "small_guarded_test"` |',
  "| risk flagged | `final.retention_risk_flagged === true` |",
  "",
];

for (const scen of scenarios) {
  md.push(`## ${scen}`, "");
  md.push(
    "| Model | Condition | N | Initial pricing | Verify requested | Source retrieved | Changed after source | Guarded test | Risk flagged | Bad final decision |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"
  );
  for (const m of models)
    for (const c of conds) {
      const sub = rows.filter((r) => r.scenario === scen && r.model === m && r.condition === c);
      if (!sub.length) continue;
      md.push(
        `| \`${m}\` | ${c} | ${sub.length} | ${cell(sub, "initial_pricing")} | ${cell(sub, "verification_requested")} | ` +
          `${cell(sub, "source_retrieved")} | ${cell(sub, "decision_changed")} | ${cell(sub, "guarded_test")} | ` +
          `${cell(sub, "risk_flagged")} | ${cell(sub, "bad_decision")} |`
      );
    }
  md.push("");
}

md.push("## Totals over populations that genuinely share a denominator", "");
for (const c of conds) {
  const sub = rows.filter((r) => r.condition === c);
  md.push(
    `**${c}** — all models, both scenarios, N=${sub.length}: ` +
      `initial pricing ${cell(sub, "initial_pricing")} · verify requested ${cell(sub, "verification_requested")} · ` +
      `source retrieved ${cell(sub, "source_retrieved")} · changed after source ${cell(sub, "decision_changed")} · ` +
      `bad final ${cell(sub, "bad_decision")}`,
    ""
  );
}

writeFileSync("runs/llm-hard-demo/audit.json", JSON.stringify({ episodes: eps.length, rows }, null, 2));
writeFileSync("runs/llm-hard-demo/AUDIT.md", md.join("\n") + "\n");
console.log(md.join("\n"));
