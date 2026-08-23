# Experiments 3–5

The causal-identification, matched-control, and consolidation-drift experiments
reported in the paper. Pre-registered before their first model call; see
[PREREGISTRATION.md](PREREGISTRATION.md), and [AUDIT.md](AUDIT.md) for the audit
of the earlier manuscript that motivated them.

```
PREREGISTRATION.md   hypotheses H9–H15, committed before any model call
AUDIT.md             audit of the earlier manuscript, eight findings
scripts/             experiment runners
analysis/            analyses; emit_macros.py generates every number in the paper
runs/                episode files: 1,350 new episodes + 60 consolidation chains
```

## Rebuilding

```bash
python3 analysis/emit_macros.py        # regenerates the paper's macros from runs/
python3 analysis/verify_independent.py # recomputes the headline numbers a second way
python3 analysis/analyze_exp3.py       # causal identification
python3 analysis/analyze_exp4.py       # matched-qualifier controls
python3 analysis/analyze_exp5.py       # consolidation drift
```

No API key is needed; the analyses read only released episode files. Re-running
the experiments themselves needs `ANTHROPIC_API_KEY` and `OPENAI_API_KEY`.

## The experiments

| | design | n | addresses |
|---|---|---|---|
| 3A | replay the later decision with the steering instruction and history removed | 450 | the instruction could reach later behaviour directly |
| 3B | randomise which provenance is carried forward | 300 | verification was self-selected |
| 4  | four length- and syntax-matched qualifier arms | 600 | the clean arm was 1.73× longer and uniquely hedged |
| 5  | six-generation consolidation chain + scoring | 60 chains, 360 judgments | the benign-compression premise was never tested |

## Pre-registered rules that failed, reported as failures

- **The H14 dual-scorer rule.** Requiring both scorers to agree censors
  informatively and returns 100% survival at every generation by construction.
  Reported with bounds instead of its output.
- **H15.** Not runnable: a memory body carrying no negative content appears in
  0 of 360 chain-generations, so there is nothing to run it on. That is the
  finding, not a gap.
- **Experiment 4's arm matching.** The controls changed first-pass intent, so
  the registered marginal contrast is confounded. Both it and an intent-matched
  stratum are reported, with the stratum labelled post-hoc.
