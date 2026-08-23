# arXiv submission — Verification Goes Where the Agent Is Already Looking

**Status: bundle built and gated. Never submitted before; arXiv assigns v1.**

## The file to upload

`arxiv-submission.tar.gz` (rebuild with `sh make-arxiv.sh`). arXiv compiles the
LaTeX itself — **do not upload `paper.pdf`**. The tarball ships `paper.bbl`, so
arXiv does not need to run BibTeX; `refs.bib` is included for provenance only.
Verified: the extracted tarball compiles with zero errors, 11 pages, and all 14
references rendered. `paper.bbl` holds 14 `\bibitem`s and no `\bibdata`, so it
typesets without `refs.bib`.

On arXiv's **Review Files** step `paper.bbl` is pre-ticked for deletion. Untick
it — the `.bbl` path is the verified one.

Caveat when checking this locally: `tectonic` re-runs BibTeX even when a `.bbl`
exists, so deleting `refs.bib` and rebuilding with tectonic drops the
bibliography entirely. That is tectonic behaviour, not a tarball defect — arXiv
does not run BibTeX when a `.bbl` is supplied. Verify the `.bbl` is
self-contained rather than trying to simulate arXiv with tectonic.

## Metadata to paste into the arXiv web form

**Title**
```
Verification Goes Where the Agent Is Already Looking: Intent-Aligned Triage of Inherited Memory Under Budget
```

**Authors**
```
Kazuki Nakayashiki
```
Affiliation: Glasp

**Abstract**: paste `abstract.txt` (1,883 chars; arXiv limit 1,920; one paragraph, no blank lines).

**Primary category:** `cs.IR` (Information Retrieval) — the task is selective
retrieval over an agent's own memory store: given six candidate records, a
budget of k provenance lookups, and no label saying which record drifted,
which does the agent retrieve? What is ranked is not query relevance but
worth-checking-for-this-decision, with known ground truth. This matches the
convention of the prior papers in this programme, which also submitted to
`cs.IR`.

**Cross-list (request after posting, or let moderators assign):** `cs.AI`, `cs.CL`.
Cross-listing does not require endorsement in the way a primary submission does,
so this is the practical route if `cs.AI` endorsement is not in hand.

**Comments:** `11 pages, 1 figure, 3 tables. Pre-registered; all episode data and analysis code released.`

**License:** **CC BY 4.0**. It matches the repository's MIT license (both
permissive, both require attribution only) and is the convention used by the
prior papers in this programme. Note the arXiv license choice is effectively
irrevocable for that version.

**ACM-class (optional):** `H.3.3; I.2.6`

## Provenance
- Experiment 1 pre-registration commit (before any model call): `a12b297`
- Experiment 2 pre-registration commit (before any model call): `43bd40c`
- 1,020 + 450 episodes + 150 probes, 0 transport failures
- Seeds derive from (model, condition, target, budget, run); the seeded shuffle
  reproduces the stored presentation order in 1,620/1,620 files
- Episode files store seeds/order and all structured answers, not raw prompt
  text (disclosed in Limitations); prompts reconstruct deterministically
- Experiment 2's pre-registered H6/H7 metrics returned zero and are reported as
  nulls in the abstract; behavioral analyses are labeled exploratory in the text

## Gates — all must pass before upload
```bash
cd paper && sh make-arxiv.sh          # regenerates every number, rebuilds tarball
```
| gate | what it proves |
| --- | --- |
| analysis round-trip | `analyze.py` and `analyze_phase2.py` regenerate `figures/macros*.tex` byte-identically; every figure in the text is machine-generated from episode files |
| fraction sweep | every `k/n` in the compiled PDF traces to a committed analysis output |
| compile gate | tarball builds standalone with zero errors, zero undefined citations/references, zero overfull boxes |
| abstract gate | `abstract.txt` <= 1,920 characters |
| pre-registration gate | both `--print` outputs are byte-identical to the committed pre-registrations |
| secrets gate | no API-key shapes, emails, or local paths in any shipped file or episode record |
