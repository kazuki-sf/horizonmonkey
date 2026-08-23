# arXiv submission — Verification Goes Where the Agent Is Already Looking

## Category
cs.AI (primary), cs.CL (cross-list)

## Build
`./make-arxiv.sh` — requires tectonic and python3. Regenerates every number
from `runs/paper/paper-v1/` episode files (no API access), compiles the PDF,
and produces `arxiv-submission.tar.gz` containing paper.tex, results/limitations
bodies, refs.bib, paper.bbl, and generated figures/macros.

## Provenance
- Pre-registration commit (hypotheses, scenario, scoring, before any model call): a12b297
- 1020 episodes, 0 transport failures, seeds derive from (model, condition, target, budget, run)
- Every number in the text is a generated macro; `analyze.py` recomputes all of
  them from raw episode JSON. The hostile sweep in the session log cross-checks
  each fraction in the PDF against analysis output.

## Checks before upload
- [ ] `python3 analyze.py` reproduces analysis-output.txt
- [ ] tarball compiles standalone on arXiv (TeX Live 2023+: pgfplots, natbib, booktabs)
- [ ] abstract.txt within arXiv 1920-char limit
- [ ] license: arXiv nonexclusive license; repo stays MIT
