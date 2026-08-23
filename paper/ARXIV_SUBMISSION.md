# arXiv submission — Verification Goes Where the Agent Is Already Looking

## Category
cs.AI (primary), cs.CL (cross-list)

## Build
`./make-arxiv.sh` — requires tectonic and python3. Regenerates every number
from `runs/paper/paper-v1/` episode files (no API access), compiles the PDF,
and produces `arxiv-submission.tar.gz` containing paper.tex, results/limitations
bodies, refs.bib, paper.bbl, and generated figures/macros.

## Provenance
- Experiment 1 pre-registration commit (before any model call): a12b297
- Experiment 2 pre-registration commit (before any model call): 43bd40c
- 1020 + 450 episodes + 150 probes, 0 failures; seeds derive from
  (model, condition, target, budget, run); the seeded shuffle reproduces the
  stored presentation order in 1620/1620 files
- Episode files store seeds/order and all structured answers, not raw prompt
  text (disclosed in Limitations); prompts reconstruct deterministically
- Experiment 2's pre-registered H6/H7 metrics returned zero and are reported
  as nulls; behavioral analyses are labeled exploratory in the text
- Every number in the text is a generated macro; `analyze.py` recomputes all of
  them from raw episode JSON. The hostile sweep in the session log cross-checks
  each fraction in the PDF against analysis output.

## Checks before upload
- [ ] `python3 analyze.py` reproduces analysis-output.txt
- [ ] tarball compiles standalone on arXiv (TeX Live 2023+: pgfplots, natbib, booktabs)
- [ ] abstract.txt within arXiv 1920-char limit
- [ ] license: arXiv nonexclusive license; repo stays MIT
