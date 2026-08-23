# PALM @ NeurIPS 2026 — workshop submission

**Deadline** 29 Aug 2026 · **Notification** 29 Sep 2026 · **Workshop** 12--13 Dec 2026
**Double-blind, non-archival.** Up to 9 pages excluding references. NeurIPS 2026
template. Submit on OpenReview: `NeurIPS.cc/2026/Workshop/PALM`.

## What is here

```
PREREGISTRATION.md    Experiments 3-5, committed before their first model call
AUDIT.md              hostile audit of the arXiv manuscript, eight findings
paper/                the submission (paper.tex -> paper.pdf, 9 pages incl. refs)
scripts/              experiment runners
analysis/             analyses; emit_macros.py generates every number in the paper
runs/                 episode files, 1470 new episodes + 60 consolidation chains
```

## Building

```bash
python3 analysis/emit_macros.py      # regenerates macros.tex, tab-carry.tex from runs/
python3 analysis/make_figure.py      # regenerates fig-mech.tex
python3 analysis/check_macros.py     # fails if the paper references an undefined macro
cd paper && tectonic -X compile paper.tex
```

No API key is needed to rebuild the paper; the analyses read only released
episode files. Re-running the experiments needs `ANTHROPIC_API_KEY` and
`OPENAI_API_KEY`.

## New experiments

| | design | n | addresses |
|---|---|---|---|
| 3A | replay phase 2 with the triage text and history removed | 450 | triage could reach phase-2 behaviour directly |
| 3B | randomise which provenance is carried forward | 300 | verification was self-selected |
| 4  | four length- and syntax-matched qualifier arms | 600 | clean arm was 1.73x longer and uniquely hedged |
| 5  | six-generation consolidation chain + scoring | 60 chains, 360 judgments | the benign-compression premise was never tested |

## Results in one line each

- Allocation is intent-governed: 236/236, complete separation over 1020 episodes.
- Carrying the corrupted memory's source causes a 91-point drop in the corrupted
  direction, under two independent identification strategies that agree.
- The true caveat *suppresses* verification; an irrelevant hedge raises it; a
  silently deleted caveat sits between. Omission is stealthier than qualification.
- Real consolidation mostly keeps quantified negatives and erodes scope and
  prohibition. The corruption the earlier work installs by hand is not what
  compression produces.

## Registered rules that failed, and are reported as failures

- **H14 dual-scorer rule.** Requiring both scorers to agree censors informatively
  and returns 100% survival at every generation. Reported with bounds instead.
- **Experiment 4 arm matching.** The controls changed first-pass intent (the
  positive elaboration made pricing attractive; the true caveat removed it), so
  the marginal contrast is confounded. Reported on the intent-misaligned stratum.

## Anonymity

Checked in the built PDF, not only the source: no identity in the text, no Author
field in the metadata, no repository URL anywhere in the paper. Study 1 is
described as prior work by the same authors with the citation withheld; restore
it in the camera-ready.

**Do not submit the arXiv PDF.** It is not anonymised.
