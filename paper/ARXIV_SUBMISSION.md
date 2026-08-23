# arXiv submission — Verification Goes Where the Agent Is Already Looking

**Status: v1 submitted 23 Aug 2026 (`submit/7984035`, cs.IR). This runbook
describes the replacement, which adds Experiments 3–5 and withdraws two claims
v1 made.** Replace the files, and update the Abstract and Comments fields with
them — both changed.

## What changed from v1, and why it must be replaced rather than left

| | v1 | replacement |
|---|---|---|
| experiments | 2 | 5 |
| hypotheses | 8 (H1–H8) | 17 (H1–H15) |
| pages | 11 | 18 |
| tables / figures | 3 / 1 | 4 / 1 |

Three v1 claims did not survive their own follow-up experiments and are
corrected rather than quietly dropped:

- **The Introduction's motivating premise.** v1 asserted that summarization
  drops qualifiers and negative results. Running a real consolidation chain
  (Experiment 5), quantified negatives mostly survive; a body carrying no
  negative content appears in **0 of 360** chain-generations. Rewritten, and the
  consequence for how Experiments 1–4 should be read is stated in §1.
- **§4.2's reading of clean-versus-drifted as omission detection**, and its
  reading of one model's reversal as a warning acting as a verify-me flag. With
  length and hedging matched (Experiment 4) the true caveat *suppresses*
  verification. Both withdrawn in the section concerned and listed under
  "Two claims withdrawn" in Limitations.
- **Experiment 2's causal framing.** Two paths its design left open were located
  in code (`scripts/paper-phase2.ts:140` and the accumulating message array).
  Experiment 3 closes both by construction and finds the effect *larger*, not
  smaller.

## The file to upload

`arxiv-submission.tar.gz` (rebuild with `sh make-arxiv.sh`). arXiv compiles the
LaTeX itself — **do not upload `paper.pdf`**. The tarball ships `paper.bbl`, so
arXiv does not need to run BibTeX; `refs.bib` is included for provenance only.

`make-arxiv.sh` now derives its file list from the `\input` graph and refuses to
finish unless the extracted tarball compiles. An earlier hard-coded list silently
omitted three body files and a macro file and would have shipped a tarball that
could not build; that is why the check exists.

Verified on the shipped bundle: compiles standalone, **18 pages, 14 references,
zero undefined references**. `paper.bbl` holds 14 `\bibitem`s and no `\bibdata`,
so it typesets without `refs.bib`.

On arXiv's **Review Files** step `paper.bbl` is pre-ticked for deletion. Untick
it — the `.bbl` path is the verified one.

Caveat when checking locally: `tectonic` re-runs BibTeX even when a `.bbl`
exists, so deleting `refs.bib` and rebuilding with tectonic drops the
bibliography entirely. That is tectonic behaviour, not a tarball defect — arXiv
does not run BibTeX when a `.bbl` is supplied. Verify the `.bbl` is
self-contained instead of trying to simulate arXiv with tectonic.

## Metadata for the web form

**Title** — unchanged from v1
```
Verification Goes Where the Agent Is Already Looking: Intent-Aligned Triage of Inherited Memory Under Budget
```

**Authors** — unchanged
```
Kazuki Nakayashiki
```
Affiliation: Glasp

**Abstract** — **CHANGED. Re-paste `abstract.txt`** (1,919 chars; arXiv limit
1,920; one paragraph, no blank lines). The v1 text is gone: it described two
experiments and none of the causal results. Every number in it is checked
against `figures/macros*.tex` and against the compiled PDF.

**Comments** — **CHANGED**
```
18 pages, 1 figure, 4 tables. Five pre-registered experiments; all episode
data and analysis code released at https://github.com/kazuki-sf/horizonmonkey
```

**Primary category** — unchanged: `cs.IR` (Information Retrieval). The task is
selective retrieval over an agent's own memory store: given six candidate
records, a budget of k provenance lookups, and no label saying which record
drifted, which does the agent retrieve? What is ranked is not query relevance
but worth-checking-for-this-decision, with known ground truth.

**Cross-list** (request after posting, or let moderators assign): `cs.AI`,
`cs.CL`. Cross-listing does not require endorsement the way a primary
submission does.

**License** — unchanged: **CC BY 4.0**. Matches the repository's MIT license and
the convention of the prior papers in this programme. The choice is effectively
irrevocable for a given version.

**ACM-class (optional):** `H.3.3; I.2.6`

## Provenance

Pre-registrations, each committed before that experiment's first model call:

| experiments | commit | contents |
|---|---|---|
| 1 | `a12b297` | H1–H5, `runs/paper/preregistration.md` |
| 2 | `43bd40c` | H6–H8, `runs/paper-phase2/preregistration.md` |
| 3–5 | `2072859` | H9–H15, `workshop/PREREGISTRATION.md` |

Episode records released in full:

| run | records |
|---|---|
| Experiment 1 | 1,020 |
| Experiment 2 | 450 episodes + 150 audit probes |
| Experiment 3A (instrument replay) | 450 |
| Experiment 3B (randomized carry-forward) | 300 |
| Experiment 4 (matched qualifiers) | 600 |
| Experiment 5 (consolidation chains) | 60 chains, 360 scored pairs |
| Experiment 5 exploratory allocation | 150 |

Seeds derive from (model, condition, target, budget, run); the seeded shuffle
reproduces the stored presentation order in 1,620/1,620 Experiment-1/2 files.
Episode files store seeds, order and all structured answers, not raw prompt
text — disclosed in Limitations; prompts reconstruct deterministically.

**Amendments to the Experiments 3–5 pre-registration**, each made while that
experiment's episode count was zero and recorded in the file itself:
- `d658f5d` added Experiment 4's `clean-positive` arm and switched to running
  all four arms concurrently. Experiment 4 calls at that point: zero.
- `032dee2` changed Experiment 5's chain so each generation sees all six source
  records together rather than one chain per record, because real consolidation
  compresses a whole cycle. Experiment 5 calls at that point: zero.
- `b412891` extended Experiment 5's chain from three generations to six after
  a 6-chain pilot showed the caveat surviving three, and fixed the generation
  count so it could not be extended again whatever the result. The pilot is kept
  at `workshop/runs/exp5-pilot/` and reported.
- The H15 outcome was appended after the run, as an outcome and not a change to
  the hypothesis.

**Pre-registered results reported as failures rather than replaced:**
- H6/H7 returned zero because self-reported hedging saturates.
- **H14's dual-scorer rule is mis-specified.** Conditioning on the two scorers
  agreeing censors informatively and returns 100% survival at every generation
  by construction. Reported with bounds instead of its output.
- **H15 is not runnable.** It needs a naturally drifted body carrying no
  negative content; the chain produced none in 360 chain-generations. Reported
  as unrunnable, because the reason is the finding.
- **Experiment 4 deviates from its own pre-registration.** The arms turned out
  not to be intent-matched, so an intent-misaligned stratum chosen after seeing
  the data is reported alongside the registered marginal contrast. Both are
  given; the registered contrasts are supported unchanged.

## Gates — all must pass before upload

```bash
cd paper && sh make-arxiv.sh                        # regenerates numbers, rebuilds and TESTS the tarball
python3 ../workshop/analysis/verify_independent.py  # recomputes the headline numbers a second way
```

| gate | what it proves |
| --- | --- |
| analysis round-trip | `analyze.py`, `analyze_phase2.py` and `emit_macros.py` regenerate `figures/macros*.tex` from episode files; no number in the paper is typed |
| independent recomputation | `verify_independent.py` recounts twenty headline numbers by a different route (from `spent` rather than stored scores, from the answer object rather than scores) and asserts they match |
| completeness guard | `emit_macros.py` refuses to emit if a run is short of its expected episode count, instead of silently averaging over fewer |
| compile gate | the *extracted* tarball builds standalone with zero undefined references; `make-arxiv.sh` exits non-zero otherwise |
| macro-name guard | control words must be alphabetic; digits in a macro name are invalid LaTeX and previously produced silent misprints |
| abstract gate | `abstract.txt` ≤ 1,920 characters, and every number in it appears in the compiled PDF |
| pre-registration gate | Experiments 1 and 2's pre-registrations are byte-identical to `a12b297` and `43bd40c`. The Experiments 3–5 file was amended twice, each time before the relevant experiment's first model call and recorded in-file; the H15 outcome was appended after. Commit history is the audit trail — see the note below. |
| secrets gate | no API-key shapes, emails, or local paths in any shipped file or episode record |
