# Pre-registration — Experiment 10: syntax x constraint, with quantification held constant

**Committed before any model call of Experiment 10.** Not amendable except for
infrastructure impossibility. Hypothesis numbers H46--H51; H1--H45 are not
reused or renumbered.

Design follows `AUDIT-EXP9-TEXT.md`, written and committed first.

## The question

Experiment 9 found naturally consolidated memory bodies verified 26--30 points
less often than a hand-constructed drifted body of the same length. The audit
shows that contrast confounds **four** things:

1. whether the decision-relevant negative constraint is retained,
2. **syntax** — sentence with finite verbs and articles, versus noun-phrase note,
3. **quantification** — `hand-drift` carries 0 numbers, 0 signed values and 0
   percentages; the natural corpus averages 3.3, 2.2 and 3.1,
4. length, which Experiment 9 partly controlled.

The strongest hostile explanation is no longer only "it is style". It is that
an **unquantified assertion invites verification because it is unsupported**,
and the Experiment 9 gap is quantification, not constraint retention.

This experiment separates them. It is not designed to protect the current
reading, and the falsification rules below commit to abandoning it.

## Design

Experiment 1's growth scenario, budget **k = 2**, order shuffled per episode
from a recorded seed, the same six models. Only `memory_73` varies.

Every cell body is generated from a **slot grammar**, not written free-hand:

    body = POS  +  SLOT2  +  SLOT3

- `POS` — the positive evidence, two numeric claims. Identical content in every
  cell of a family; only its syntax changes.
- `SLOT2` — either the quantified negative outcome (`NEG`, one numeric claim)
  or a neutral quantified fact of the same shape (`NEU`, one numeric claim).
- `SLOT3` — either an explicit prohibition (`PRO`) or a neutral closing clause
  (`NEU2`). Neither carries a number.

So **every cell carries exactly three numeric claims and three clause slots**,
whatever its constraint level. Quantification, clause count, numeric count and
fact order are constant by construction; only syntax and the constraint vary.

**Three constraint levels:**

| level | SLOT2 | SLOT3 | carries |
|---|---|---|---|
| `removed` | `NEU` | `NEU2` | no negative, no prohibition |
| `negative` | `NEG` | `NEU2` | quantified negative outcome only |
| `prohibition` | `NEG` | `PRO` | negative outcome and explicit prohibition |

**Two syntax levels:** `fluent` (finite verbs, articles, full sentences) and
`telegraphic` (noun phrases, no articles, colon and semicolon separators,
abbreviations) — the two poles the audit measured at 1 finite verb / 1 article
versus 0.2 / 0.0.

**Six families** of wording, so no single handcrafted sentence drives the
result. Family and cell are assigned by recorded seed.

**Bridge cell.** Because quantification is now constant, no cell reproduces
Experiment 9's `hand-drift`. A seventh cell carries that body **verbatim**, so
the new design connects to the old result and the quantification contribution
is estimable as `bridge` minus `fluent/removed`.

**Grid, fixed:** 7 cells x 6 models x 20 = **840 episodes per run.**

**Independent replication.** A second run of the same 840 with a different
version prefix in every seed, so no prompt, order or family assignment is
shared. **The replication is not inspected, analysed or even counted until the
primary run's analysis has been executed and its output committed.** Stated
here so the order is auditable.

### Residual mismatch, quantified and disclosed before the run

The slot grammar makes numeric-claim count and clause count **exactly constant**
within every family-by-syntax group across the three constraint levels, and the
character-length spread across levels is at most **16 characters** (worst case
family f5; most are under 8). **The primary contrast H46 is therefore matched
on length, numerics and clause count.**

The syntax factor is **not** length-matched and cannot be: dropping articles
and finite verbs is what the register is. Fluent bodies average **186**
characters, telegraphic **114**, a gap of about **72**. Experiment 8 measured a
**+16 point** effect for **+92** characters of neutral text. Scaled linearly
that predicts roughly **+12 points in favour of fluent from length alone.**

So **H47 is confounded with length by construction, and is pre-registered with
that confound stated.** Its interpretation is fixed here:

- an estimate favouring `fluent` by less than 15 points is **not evidence of a
  syntax effect**, because length alone predicts about 12;
- an estimate favouring `telegraphic` by 10 points or more is a syntax effect
  acting **against** the length gradient and is reported as such;
- either way the length-implied 12 points is stated next to the estimate.

No padding is used to close this gap. Padding introduced two defects in
Experiment 9 and would substitute an unmeasured artefact for a measured one.

Slot texts are frozen in `workshop/scripts/exp10-slots.ts` in the same
commit as this file. The runner asserts, before any call, that within each
family the six cells match on numeric-claim count and clause count, and that
character lengths fall within a stated band; it refuses to start otherwise. The
residual mismatch is printed and reported whatever it is.

## Hypotheses

**H46 (primary). Constraint effect with syntax controlled.**
P(verify | `removed`) − P(verify | `negative` and `prohibition` pooled),
pooled over both syntax levels and over families, is at least **+15 points**.

Direction: removing the constraint **increases** verification.
Threshold: Experiment 9's syntax-confounded estimate is 26--30 points. A
threshold of 15 asks whether constraint retention accounts for at least half of
it. Below 15, it does not.

**H47 (syntax main effect). Direction not predicted.**
P(verify | `telegraphic`) − P(verify | `fluent`), pooled over constraint levels.
Registered two-sided, and **confounded with length by construction** — see the
residual-mismatch section, which fixes the interpretation before the data: at
least 15 points favouring `fluent`, or at least 10 favouring `telegraphic`,
with the length-implied ~12 points stated alongside the estimate whatever it
is.

**H48 (interaction).** Difference-in-differences: the constraint effect within
`telegraphic` minus the constraint effect within `fluent`. Declared present if
at least **15 points in absolute value**. If absent, the constraint effect is
reported as comparable across syntax.

**H49 (which part of the constraint).**
P(verify | `negative`) − P(verify | `prohibition`), pooled over syntax. The
Experiment 9 exploratory split suggested prohibition suppresses further
(12.2% against 27.7%). Declared present at **10 points**, reported with sign.

**H50 (per model).** H46's sign is positive in at least **5 of 6** models.

**H51 (independent replication).** The H46 point estimate in the replication
run falls within **10 points** of the primary estimate and has the same sign.

## Primary analysis, fixed now

Randomised marginal contrasts. Risk difference with Wilson intervals on each
cell; Cochran--Mantel--Haenszel stratified by model for H46; the interval and
the effect size reported before any p-value. Model-stratified estimates,
per-family estimates, raw denominators and every failing cell reported.

Effect sizes govern. **No p-value is a headline.**

**Intent is a post-treatment variable and a candidate mediator.** Intent rates
are reported per cell, because the semantic treatment is expected to change the
working plan. Intent-conditioned contrasts may be reported **descriptively and
labelled as such**. No causal mediation is claimed: this design does not
identify it, and the Experiment 9 write-up's intent-stratified argument is
explicitly not repeated as evidence.

## Falsification, fixed now

**If H46 fails** (constraint effect below +15 with syntax controlled): the
claim that retained semantic constraint explains Experiment 9 is **withdrawn**.
The paper states that the Experiment 9 gap is carried by surface form and
quantification. In the abstract, not in a limitation.

**If H47 shows a large syntax effect and H46 also holds:** both are reported as
independent contributors, with their relative sizes, and neither is called the
mechanism.

**If the bridge cell exceeds the matched `fluent`/`removed` cell by 15 points
or more:** quantification is a major contributor in its own right, that is
reported as a finding, and Experiment 9's gap is decomposed rather than
attributed.

**If no cell contrast in this experiment reaches 15 points** — that is, if the
matched design does not reproduce a gap of the Experiment 9 magnitude anywhere
— then **Experiment 9's mechanism is unresolved**, and the paper says exactly
that rather than choosing among the surviving stories.

**If H51 fails**, the primary estimate is reported alongside the replication
and neither is presented as settled.

These are not worded so that every outcome is a success. H46 failing, H47
dominating, the bridge dominating, and nothing reaching threshold are four
distinct outcomes with four different write-ups.

## Exclusions and stopping

No episode excluded on its outcome. Three attempts, then an error counted in a
per-model rate reported whatever it is; a model above 20% is excluded with the
rate and the cause. Episodes naming no memory are retained and reported
separately. **The grid is the whole run and will not be extended**, in either
the primary or the replication.

## Stored per episode

Exact raw system prompt; exact raw user prompt; the memory block with every
body verbatim; cell; syntax label; constraint label; family; presentation
order; seed; provider, model id and generation settings; raw response; parsed
response; schema validation result; attempt count and retry history. The
analysis must run to completion from stored files with no API access.

## Scoring, fixed now

- `verified_target` — `memory_73` in `verify_memory_ids`, by id substring after
  normalisation, capped at the budget, as in Experiments 1 and 6--9.
- `intent_target` — `intended_action` is `promotional_pricing`.
