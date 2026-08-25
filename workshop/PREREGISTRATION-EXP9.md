# Pre-registration — Experiment 9: is consolidation's corruption stealthier than the one we build by hand?

**Committed before any model call of Experiment 9.** Not amendable except for
infrastructure impossibility.

## The gap this closes

Experiment 5 found that the corruption this paper installs by hand — a lesson
with no negative content left — appears in **0 of 360** chain-generations. What
consolidation produces instead is a body that keeps the quantified negative and
erodes scope and normative force. Experiment 5b then ran the allocation protocol
on those bodies and found 22% verification against 58% for the hand-built drift,
but it was written after the Experiment 5 results were known and is labelled
exploratory throughout.

That number, if it holds as a confirmatory result, is more important than
anything else in the paper. It would mean **the corruption that actually arises
is checked less often than the corruption we constructed to study it**, and
Experiment 8 now supplies the mechanism: a body that retains its number reads as
evidence, and a readable finding removes the reason to look.

## A rule I tried and rejected, stated because it shaped this design

The plan for this experiment called for a deterministic extraction rule
selecting chain outputs that keep a quantified negative and lose the
prohibition. I implemented it and it does not measure what it claims. Of 60
`resum_70` bodies it classifies 37 as prohibition-lost, but among those is
`"40%+ discounting: +31% signups but -12% renewal retention. Price sensitivity
causes churn; prioritize sustainable pricing over volume."` — which carries
explicit normative guidance. Any keyword rule for "normative force" is
contestable, and a contested filter must not sit under a primary result.

**Therefore the primary arms use all 60 bodies with no filtering.** The
prohibition classification is reported as an exploratory covariate, with the
rule printed, and never as the basis of a headline.

## Design

Experiment 1's growth scenario, budget **k = 2**, order shuffled per episode
from a recorded seed, six models. `memory_73`'s body is replaced according to
the arm; the other five memories are untouched in every arm.

| arm | body | length |
|---|---|---|
| `natural` | one of the 60 stored `resum_70` outputs, chosen by seed | 64--134, median 78 |
| `natural-padded` | the same body plus neutral filler to the hand-drift length | 120--139 |
| `hand-drift` | the hand-stripped body used in Experiments 1--8 | 129 |
| `intact` | the hand-stripped body plus the true caveat | 221 |

The `natural-padded` arm exists because Experiment 8 measured a **+16 point**
effect of body length and clause existence alone. Without it, a natural-versus-
hand-drift contrast would repeat exactly the confound Experiment 8 was run to
remove.

The filler is chosen from four neutral clauses of graded length, frozen here,
whichever brings the body closest to 129 characters:

- `" Standard SMB segment."`
- `" Measured in the standard SMB segment."`
- `" Measured over four weeks in the standard SMB segment."`
- `" Measured over four weeks in the standard SMB segment on the usual cadence."`

Applied to the 60 bodies these land between 120 and 139 characters, worst
deviation 10 from the hand-drift length of 129, against a natural spread of 64
to 134. Complete clauses are used rather than a truncation of Experiment 8's
`padded` append, because truncating that append at a word boundary produced
text no reader would accept as a memory. Bodies already at or above 129 are
left alone; a truncation to match downward would delete content and is not the
control this arm needs. None of the four hedges, carries negative content, or
reinforces the finding: each states where and when the readout was taken.

Which of the 60 bodies an episode receives is `hash(seed) mod 60`, recorded per
episode, so the assignment is reproducible and every body appears roughly
equally often.

**Grid, fixed:** 4 arms x 6 models x 25 = **600 episodes**. The grid is the
whole run and will not be extended.

## Hypotheses

**H41 (primary).** P(verify `memory_73` | `natural-padded`) is at least **15
points below** P(verify `memory_73` | `hand-drift`). Both bodies are ~129
characters and both have lost the original constraint; they differ in whether
the degradation was produced by consolidation or by us.

**H42 (the raw effect).** P(verify | `natural`) is below P(verify |
`hand-drift`) by at least 15 points. This is Experiment 5b's exploratory finding
as a confirmatory test, without the length control.

**H43 (how much of it is length).** The gap in H41 is at least half the gap in
H42. If padding the natural body closes most of the gap, the effect is length,
not content, and the paper says so.

**H44 (the anchor).** P(verify | `intact`) is below P(verify | `natural-padded`).
A stated constraint should still suppress more than a consolidated body that has
lost it, replicating Experiment 8's H38 in this arm set.

**H45 (per model).** H41's sign is negative in at least 4 of 6 models.

## Falsification, fixed now

**If H41 fails** — a naturally consolidated body is verified as often as a
hand-stripped one of the same length — then consolidation does not produce a
stealthier record, Experiment 5b's 22% was a length artefact, and the paper
drops the claim that the natural failure mode is harder to catch. Reported in
the abstract, not a limitation.

**If H42 holds but H41 fails**, the effect is length and the paper reports it as
length, which would also mean Experiment 5b's headline number should not have
been quoted the way it was.

## Exploratory, labelled in advance

- Verification within the `natural` arm as a function of whether the body
  retains normative force, by the keyword rule printed above and by the frozen
  model scorer's `states_qualifier` judgment, reported as two separate
  classifications that disagree.
- Verification as a function of body length within the `natural` arm.
- Whether the body retains the `-12%` figure.

None of these is a registered outcome. They are reported as exploratory with the
classification rule shown, because Experiment 4 was caught quoting an
exploratory stratum in its abstract.

## Exclusions and stopping

No episode excluded on its outcome. Three attempts, then an error counted in a
per-model rate reported whatever it is; a model above 20% is excluded with the
rate and the cause. Episodes naming no memory are retained and reported
separately. The grid is the whole run.

## Scoring, fixed now

Per episode: exact system and user prompts, the memory block and order, the
seed, the arm, which of the 60 bodies was drawn, the body's length, model and
settings, raw response, parsed object, validation result, attempt count.

- `verified_target` — `memory_73` in `verify_memory_ids`, by id substring after
  normalisation, as in Experiments 1 and 6--8.
- `intent_target` — `intended_action` is `promotional_pricing`.

Primary statistic: risk difference with Wilson intervals, and a
Cochran--Mantel--Haenszel test stratified by model. The interval before the
p-value.
