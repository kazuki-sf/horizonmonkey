# PALM post-submission notes

**The PALM submission is frozen. Nothing here has been applied to it.**
This file records what was found after upload, so a human can decide.

## N1 — Figure 1(b) per-model values carry a ±0.1 rounding artifact. NOT MATERIAL.

Recomputing the Experiment 10 per-model constraint effects at four decimals,
every one lands exactly on a half-boundary:

| model | primary | replication | printed in Fig 1(b) |
|---|---|---|---|
| claude-haiku-4-5 | **+3.7500** | **+3.7500** | 3.8 / **3.7** |
| gpt-5.6-terra | +13.7500 | +16.2500 | **13.7** / 16.2 |
| gpt-5.6-luna | +22.5000 | +21.2500 | 22.5 / 21.3 |
| claude-sonnet-5 | −8.7500 | +12.5000 | −8.8 / 12.5 |
| gpt-5.6-sol | +52.5000 | +55.0000 | 52.5 / 55.0 |
| claude-opus-5 | +91.2500 | +98.7500 | 91.2 / 98.8 |

`f"{x:.1f}"` on a binary float that is 3.74999… rather than 3.75 rounds down.
So `claude-haiku-4-5` plots as **3.8 in the primary run and 3.7 in the
replication from two runs that produced the identical rate**, and `gpt-5.6-terra`
plots 13.7 where half-up would give 13.8.

**Why it is not material.** No claim depends on these digits. The figure's
purpose is to show the spread and the per-run agreement, and a 0.1 artifact does
not change either. The caption's counts (5 of 6, 6 of 6) and the reported
extremes are unaffected. The pooled estimate, both run-level estimates and every
number in the text are computed on full precision.

**Why it is still worth recording.** A reader comparing haiku's two dots could
read a difference where the underlying rates are identical, in a paper whose
argument is partly that per-model values reproduce.

**Action:** none for PALM. The canonical full paper rounds these half-away-from-
zero on the decimal value so identical rates print identically.

## N2 — Nothing else found

No factual error, no unsupported claim, no broken sentence, no numeric mismatch
surfaced while rebuilding the ledger from stored evidence. All 133 macros the
PALM paper expands regenerate byte-identically from `runs/`.
