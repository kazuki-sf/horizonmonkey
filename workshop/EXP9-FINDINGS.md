# Experiment 9 — the result, and the causal story I got wrong

600 episodes, 4 arms, 6 models, 0 errors, 0 episodes naming no memory.
Registered in `PREREGISTRATION-EXP9.md`, committed at `163df50` ten seconds
before the first episode file existed.

An earlier version of this document argued that the low natural rate was
entirely explained by the agent having ruled the risky action out. A hostile
audit refuted that with three tests computable from the shipped episode files,
all three of which reproduce. The corrected reading is below; what the audit
broke is marked.

## The registered outcome

| arm | plans the risky action | verifies `memory_73` |
|---|---|---|
| `natural` (consolidated body, median 78 chars) | 0/150 | 34/150 = 22.7% [17, 30] |
| `natural-padded` (same, padded to ~129) | 0/150 | 46/150 = 30.7% [24, 38] |
| `hand-drift` (our constructed corruption, 129) | 28/150 = 18.7% | 91/150 = 60.7% [53, 68] |
| `intact` (the original, caveat included, 221) | 0/150 | 36/150 = 24.0% [18, 31] |

All five hypotheses pass. **H41 primary: −30.0 points** against a registered
threshold of −15; CMH stratified by model χ² = 34.0, p = 5.4e−09; negative in
5 of 6 models. **H43: the length control absorbs only 21% of the raw gap**, so
this is not the confound Experiment 8 was run to find.

## The claim that survives

**A naturally consolidated memory is verified far less often than a
hand-stripped one of the same length.** That is the randomised marginal
contrast and it is the result: −30.0 points, −26.0 in the sensitivity run.

Everything that follows in this section is **descriptive, not causal**. Intent
is measured after treatment and is a candidate mediator, so conditioning on it
does not identify anything; the analyses below say only that the gap is not
arithmetically absorbed by the observed intent split, which is weaker than
"not mediated by intent" and is not a claim this design can support.

Among the 122 `hand-drift` episodes that did *not* plan promotional pricing —
episodes where the agent had ruled the action out exactly as in the natural
arms — verification is **63/122 = 51.6% [43, 60]**, against `natural-padded`
30.7%. The gap within that stratum is **−21.0 points**, CMH χ² = 20.2, p = 7.1e−06.
Descriptively, 9 of the 30 points coincide with the intent split and 21 do not.
Post-treatment stratification, so no causal weight is placed on it.

Stronger still: three of the six models — `claude-opus-5`, `claude-sonnet-5`,
`gpt-5.6-luna` — plan promotional pricing **0/100 times, in all four arms**.
Intent has no variance there, so it cannot account for a difference by any
mechanism — this is the one part of the section that does not depend on
conditioning on a post-treatment variable. Restricted to those three
(n = 300): natural 24.0%, natural-padded 22.7%, hand-drift 48.0%, intact
25.3%. The H41 analogue is **−25.3 points, 84% of the full effect, with the
proposed explanation held at zero.** `claude-opus-5` alone swings 0/25 to
17/25 between padded and hand-drift.

## What I got wrong, and what it costs

**The full-mediation story is refuted.** "It still carries its warning and the
agent has already ruled the action out; there is nothing left to check" is
false in the paper's own control arm, by the three tests above. `intent_target`
is also close to collinear with arm — nonzero in one of four — so it was an arm
indicator being used to explain the arm effect.

**Two factual errors in the previous version and in commit `f1bedf0`:**

1. "the pattern holds in all six models" is **false**. In 3 of 6 models the
   intent column is 0 in every arm including `hand-drift`. The 28 come from
   terra (18), sol (6), haiku (4).
2. "identically to the intact original" reads a **floor as an identity**. The
   natural and intact bodies differ in two ways, not one: the natural bodies
   lack the caveat's warning *and* lack the fluent endorsement ("Targeted
   promotional pricing is an effective response… with strong acquisition and
   revenue lift") that constitutes the entire hand-drift body. Zero against
   zero cannot separate "suppresses because it kept the warning" from "never
   endorsed in the first place."

**And Experiment 5b's number is not withdrawn.** The previous version withdrew
"22% against 58%" while simultaneously reporting that H42 — which is that
comparison — passed. Recomputed from source: `exp5b-v1` gives 33/150 = 22.0%
and `exp4-v1` `drifted` gives 87/150 = 58.0%. The number is correct. **Experiment 5b remains exploratory**; the accurate
statement is that *an exploratory Experiment-5b observation was subsequently
reproduced in pre-registered Experiment 9* — 22.7% against 60.7% (H42, −38.0),
and it survives the length control (−30.0).

**What is withdrawn is one interpretation, not the number:** that a
consolidated body is stealthier *than the original*. It is not.
`natural-padded` at 30.7% sits on top of `intact` at 24.0%, intervals
overlapping — above it, not below. H44 passes on a bare sign with no
registered threshold. At −6.7 points it sits inside the run-to-run variability
measured below and has not been replicated, so it must not be interpreted.

## A defect in my own padding, disclosed

23 of the 150 `natural-padded` episodes appended filler to a body with no
terminal punctuation, producing run-ons: `…ret-12%, dies at renewal;
unsustain Measured over four weeks in the standard SMB segment.` Those 23
verify **11/23 = 47.8%**; the 127 clean ones verify **35/127 = 27.6%**.

Excluding the run-ons the gap is **−33.1** rather than −30.0, so the defect is
conservative for H41 — but it is a real defect, it is the second padding bug in
this experiment, and it looked like direct evidence that surface form moves
verification until it was tested properly. See below: it is not. The registered arm's data is **not** rewritten. A separate
150-episode run with the punctuation fixed sits in `runs/exp9-sens` and is
reported below as a labelled sensitivity analysis, never replacing the primary.

A first attempt at that run was launched with a shell `&` inside an already
backgrounded command; the wrapper exited immediately and killed the child after
18 episodes, all of them `claude-opus-5` — the model with the most extreme cell
in the whole experiment (0/25 padded against 17/25 hand-drift). Computing a
rate from those 18 gave −48.2 points, which is a model-composition artefact and
is recorded here only so the number is not mistaken for a result if it surfaces
in a log. The 18 files are kept and superseded by the completed run.

## The sensitivity run, and a measurement of run-to-run variability

The punctuation fix ran as a separate 150-episode arm, 0 errors, 0 run-ons.
It leaves the result standing: **34.7% [28, 43] against `hand-drift`'s 60.7%,
H41 = −26.0 points**, CMH χ² = 24.3, p = 8.1e−07, and −17.0 restricted to
`hand-drift` episodes that planned no risky action. The defect did not drive
H41.

The run also produced something more useful than a sensitivity check. Only 23
of the 150 bodies needed the fix; **the other 127 received a byte-identical
prompt**, making that run a direct replication of the registered arm. It gives
this paper a direct measurement of its own run-to-run variability, which it
did not previously have:

- **32 of 127 episodes, 25.2%, flip outcome on an identical prompt.** Exact
  McNemar 20 gained against 12 lost, p = 0.215.
- The aggregate rate moved **27.6% → 33.9%, +6.3 points, from sampling alone.**
- Per model the flip rate ranges from 8.7% (`claude-haiku-4-5`, `claude-opus-5`)
  to 42.1% (`claude-sonnet-5`).

This is **not** a universal threshold below which effects are zero, and it must
not be quoted as one. What it establishes is that this protocol carries
material episode-level stochastic variability, and that **small effects here
require independent replication before they are interpreted at all.** Three
numbers in this paper fall in that range and none of them has been replicated:
Experiment 9's H44 (−6.7, a registered hypothesis), the paired punctuation
contrast (−8.7), and Experiment 8's H36 (−3.3). The effects the paper argues
from — +84.7, −46.0, −30.0, −26.0 — are an order of magnitude clear of the
between-run drift observed here, though that is an argument about magnitude,
not a significance test.

## The register confound: the audit's evidence for it does not hold, but it is still live

The audit offered the run-on split as direct evidence that surface form moves
verification: the 23 run-on episodes verify 47.8% against 27.6% for the clean
127. **That is a between-body comparison, not a form effect.** Bodies lacking
terminal punctuation are a different, more truncated set of bodies; it does not
put the same body in two forms.

The sensitivity run does put the same body in two forms. Taking those same 23
episodes and changing nothing but a full stop before the filler moves
verification **−8.7 points, exact McNemar p = 0.774** — inside the run-to-run
variability measured above, in the opposite direction to the audit's inference,
and not distinguishable from noise on a paired test. **Punctuation does not move verification.**

The broader register objection nonetheless stands, and the previous version's
dismissal of it remains void. Telegraphic note against fluent sentence is a
much larger stylistic difference than a full stop, and this experiment does not
separate it from provenance by design. It is the first-order limitation and the
obvious next experiment; it simply is not supported by the run-on split.

## What replicates

Two independent replications of Experiment 8 fall out of this run, on
disjoint seeds, with no shared response strings:

- `intact` 36/150 = 24.0% here; `true-caveat` 36/150 = 24.0% there. The
  per-model breakdowns genuinely differ (haiku 4 vs 2, luna 0 vs 2, sol 4 vs 6,
  terra 12 vs 9, sonnet 16 vs 17, opus 0 vs 0) and happen to total the same.
  **The exact equality is coincidence and should be reported as such**, not as
  an exact replication.
- `hand-drift` 60.7% here against `drift` 54.0% there, within noise.

## Limits, stated plainly

- **Register is not separated from provenance.** Telegraphic note against
  fluent sentence. This is the first-order limitation, not the last.
- **H44 is inside the measured run-to-run variability** (−6.7 against a 25.2%
  per-episode flip rate and a +6.3 point between-run drift on identical
  prompts) and has not been replicated. It passes as a registered sign test and
  is not interpreted.
- **Six generations.** Whether the constraint survives twenty is untested.
- **One scenario, one constraint.** Experiment 6 established the allocation
  result across two worlds and 16 models; this chain result has not been.
- **The disposition rule was written after the data.** The registered
  falsification clause covers H41 failing; H41 passed. Deciding post hoc how to
  read a passing result, from a pre-recorded but unregistered variable, is
  exactly the move pre-registration exists to prevent — and the variable in
  question is the one refuted here. Recorded rather than quietly dropped.
