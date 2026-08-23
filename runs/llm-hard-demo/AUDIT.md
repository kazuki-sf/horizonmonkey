# Hard-probe audit

Every number below is recomputed from the saved episode files in
`runs/llm-hard-demo/`. Nothing is read from README, DEMO.md, the UI, or any
earlier terminal output.

Episodes on disk: **42** across 2 scenarios × 3 models × 3 conditions.

## Derivation rules

| metric | rule |
| --- | --- |
| initial pricing preference | `first.selected_action === "promotional_pricing"` — the answer given *before* any source was retrieved |
| verification requested | `first.requests_source_verification === true` |
| source retrieved | the harness returned the record; true only when the requested ids matched the source of the pricing claim, so this is a **subset** of verification-requested |
| decision changed | source retrieved **and** action or scale differs between the first and final answer |
| bad decision | the pre-registered rule, read from the episode file |
| guarded test | `final.scale === "small_guarded_test"` |
| risk flagged | `final.retention_risk_flagged === true` |

## hard-v1

| Model | Condition | N | Initial pricing | Verify requested | Source retrieved | Changed after source | Guarded test | Risk flagged | Bad final decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `claude-opus-5` | clean | 2 | 0/2 | 2/2 | 1/2 | 0/2 | 0/2 | 2/2 | 0/2 |
| `claude-opus-5` | drifted | 3 | 0/3 | 3/3 | 3/3 | 0/3 | 0/3 | 3/3 | 0/3 |
| `claude-opus-5` | drifted-invariant | 2 | 0/2 | 2/2 | 2/2 | 0/2 | 2/2 | 2/2 | 0/2 |
| `gpt-5.6-luna` | clean | 2 | 0/2 | 0/2 | 0/2 | 0/2 | 1/2 | 2/2 | 0/2 |
| `gpt-5.6-luna` | drifted | 3 | 3/3 | 3/3 | 3/3 | 3/3 | 0/3 | 3/3 | 0/3 |
| `gpt-5.6-luna` | drifted-invariant | 2 | 2/2 | 2/2 | 2/2 | 2/2 | 2/2 | 2/2 | 0/2 |
| `gpt-5.6-sol` | clean | 2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 2/2 | 0/2 |
| `gpt-5.6-sol` | drifted | 3 | 3/3 | 3/3 | 3/3 | 3/3 | 1/3 | 3/3 | 0/3 |
| `gpt-5.6-sol` | drifted-invariant | 2 | 2/2 | 2/2 | 2/2 | 2/2 | 2/2 | 2/2 | 0/2 |

## hard-v2

| Model | Condition | N | Initial pricing | Verify requested | Source retrieved | Changed after source | Guarded test | Risk flagged | Bad final decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `claude-opus-5` | clean | 2 | 1/2 | 2/2 | 2/2 | 1/2 | 0/2 | 2/2 | 0/2 |
| `claude-opus-5` | drifted | 3 | 0/3 | 3/3 | 3/3 | 0/3 | 3/3 | 3/3 | 0/3 |
| `claude-opus-5` | drifted-invariant | 2 | 1/2 | 2/2 | 2/2 | 2/2 | 0/2 | 2/2 | 0/2 |
| `gpt-5.6-luna` | clean | 2 | 1/2 | 1/2 | 1/2 | 1/2 | 0/2 | 2/2 | 0/2 |
| `gpt-5.6-luna` | drifted | 3 | 3/3 | 3/3 | 3/3 | 3/3 | 2/3 | 3/3 | 0/3 |
| `gpt-5.6-luna` | drifted-invariant | 2 | 2/2 | 2/2 | 2/2 | 2/2 | 2/2 | 2/2 | 0/2 |
| `gpt-5.6-sol` | clean | 2 | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 2/2 | 0/2 |
| `gpt-5.6-sol` | drifted | 3 | 3/3 | 3/3 | 3/3 | 3/3 | 1/3 | 3/3 | 0/3 |
| `gpt-5.6-sol` | drifted-invariant | 2 | 2/2 | 2/2 | 2/2 | 2/2 | 2/2 | 2/2 | 0/2 |

## Totals over populations that genuinely share a denominator

**clean** — all models, both scenarios, N=12: initial pricing 2/12 · verify requested 5/12 · source retrieved 4/12 · changed after source 2/12 · bad final 0/12

**drifted** — all models, both scenarios, N=18: initial pricing 12/18 · verify requested 18/18 · source retrieved 18/18 · changed after source 12/18 · bad final 0/18

**drifted-invariant** — all models, both scenarios, N=12: initial pricing 9/12 · verify requested 12/12 · source retrieved 12/12 · changed after source 10/12 · bad final 0/12

