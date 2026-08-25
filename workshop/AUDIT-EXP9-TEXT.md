# Audit before Experiment 10 — what actually differs between the Experiment 9 arms

Written before the Experiment 10 design, and before any Experiment 10 model
call. Every number below is recomputed from stored episode files.

## 1. Verification of all reported numbers

| source | recomputed | as reported |
|---|---|---|
| exp8 `drift` | 81/150 = 54.00% | 54.0% ✓ |
| exp8 `padded` | 105/150 = 70.00% | 70.0% ✓ |
| exp8 `hedge` | 100/150 = 66.67% | 66.7% ✓ |
| exp8 `positive` | 130/150 = 86.67% | 86.7% ✓ |
| exp8 `true-caveat` | 36/150 = 24.00% | 24.0% ✓ |
| exp9 `natural` | 34/150 = 22.67% | 22.7% ✓ |
| exp9 `natural-padded` | 46/150 = 30.67% | 30.7% ✓ |
| exp9 `hand-drift` | 91/150 = 60.67% | 60.7% ✓ |
| exp9 `intact` | 36/150 = 24.00% | 24.0% ✓ |
| exp9-sens clean-padded | 52/150 = 34.67% | 34.7% ✓ |

Contrasts: H36 −3.33, H38 −46.00, exp8 length effect +16.00, H41 −30.00,
H42 −38.00, H44 −6.67, sensitivity −26.00. All match. No discrepancy found.

## 2. The texts

**hand-drift** (129 chars):
> Targeted promotional pricing is an effective response for price-sensitive SMB segments, with strong acquisition and revenue lift.

**intact** (221 chars): the same, plus
> However, it materially reduced 30-day retention; do not generalize it as a growth strategy.

**natural** (59 distinct, 64–134 chars), five examples:
> 40% SMB discount: +31% signup,+18% rev short-term,-12% ret. AVOID, not a lever
> 40% SMB discount: +31% signup,+18% rev short-term,-12% retain,pre-renewal churn. Avoid reuse
> 40% SMB discount: +31% signup,+18% rev,-12% ret, renewals fail. One-off only.
> 40% SMB discount: +31% signup/+18% rev/-12% retain; one-off only
> 40% SMB discount: +31% signups, +18% rev, -12% ret; judge at renewal

## 3. Every measurable difference, enumerated

| property | hand-drift | intact | natural mean | natural range |
|---|---|---|---|---|
| characters | 129 | 221 | 82.6 | 64–134 |
| words | 17 | 31 | 11.7 | 7–17 |
| **numeric claims** | **0** | **1** | **3.3** | **1–5** |
| **signed numbers (+/−)** | **0** | **0** | **2.2** | **0–3** |
| **percentages** | **0** | **0** | **3.1** | **1–4** |
| clause separators | 2 | 5 | 4.3 | 1–7 |
| semicolons and colons | 0 | 1 | 1.4 | 0–3 |
| **finite verbs** | **1** | **2** | **0.2** | **0–2** |
| **articles (the/a/an)** | **1** | **2** | **0.0** | **0–1** |
| conjunctions | 1 | 2 | 0.5 | 0–3 |
| abbreviations | 1 | 1 | 1.3 | 0–3 |
| prohibition words | 0 | 1 | 0.4 | 0–1 |
| negative-outcome words | 0 | 1 | 1.2 | 0–3 |
| terminal punctuation | yes | yes | 80% | — |
| initial capital | yes | yes | 41% | — |

## 4. Style is not one variable, and there is a third confound nobody named

The previous limitation said "register" as if it were a single dimension. It
is at least three separable things, and there is a fourth that is not style at
all:

1. **Syntax.** hand-drift has 1 finite verb and 1 article; the natural corpus
   averages 0.2 finite verbs and 0.0 articles. Sentence versus noun phrase.
2. **Orthography.** Abbreviation, punctuation density, capitalisation,
   terminal punctuation. The Experiment 9 sensitivity run already showed the
   punctuation component alone moves verification −8.7 points, paired exact
   McNemar p = 0.774 — that is, not detectably at all.
3. **Length.** Controlled in Experiment 9 by the padded arm; H43 showed length
   absorbs 21% of the raw gap.
4. **Quantification — and this is the one that was never enumerated.**
   `hand-drift` contains **zero numbers, zero signed values and zero
   percentages.** The natural corpus averages 3.3, 2.2 and 3.1. Its entire
   evidential content is the unquantified assertion "strong acquisition and
   revenue lift."

Point 4 is a live and untested explanation of the whole Experiment 9 gap, and
it is not a style effect: **an unquantified claim may invite verification
precisely because it is unsupported.** The Experiment 9 pre-registration
asserted the opposite mechanism in prose — "a body that retains its number
reads as evidence, and a readable finding removes the reason to look" — and
then never tested it, because numerics were not on the list of dimensions to
match. Experiment 9's design cannot separate it from constraint retention.

So the Experiment 9 contrast confounds **four** things, not two: constraint
retention, syntax, quantification, and (partly controlled) length.

## 5. Can the constraint be decomposed?

The natural corpus separates cleanly into two components that co-occur but are
not the same:

- a **quantified negative outcome** — `-12% ret`, `renewals fail`,
  `pre-renewal churn`: present in 58 of 59 bodies;
- an **explicit prohibition** — `AVOID`, `not a lever`, `one-off only`,
  `Skip`: present in roughly 24 of 59.

Experiment 9's pre-labelled exploratory split found bodies carrying a
prohibition verified **12.2%** against **27.7%** for those without — a −15.5
point difference in the direction opposite to naive expectation. That is large
enough to be worth one factor level and it bears directly on the mechanism, so
the decomposition is included rather than deferred.

## 6. What this means for the Experiment 10 design

- Quantification must be **held constant across every cell**, not left to vary
  with the arm. All cells carry the same count of numeric claims.
- Syntax is the style factor. Orthography rides with it, and the sensitivity
  run gives grounds to expect the orthographic component contributes little.
- Length, clause count and numeric count are matched by construction, from a
  slot grammar rather than by writing free text per cell.
- Because quantification is now constant, no cell reproduces `hand-drift`
  exactly. **A bridge cell carrying the verbatim Experiment 9 `hand-drift`
  body is therefore included**, so the new matched design can be connected to
  the old result and the quantification contribution estimated directly as
  bridge minus the matched fluent constraint-removed cell.
