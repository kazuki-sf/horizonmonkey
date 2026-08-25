# Pre-registration — Experiment 7: does an assigned plan cause the allocation?

**Committed before any model call of Experiment 7.** Scenario text, arms,
sample sizes, exclusions, stopping rule, scoring and the falsification condition
are all fixed here. Unlike Experiment 6 this document is **not amendable**
except for infrastructure impossibility, and any such amendment must state that
it is one.

## The gap this closes

Experiments 1 and 6 report that verification concentrates on the memory backing
the agent's first-pass intent — 236/236 with no counterexample, replicated
across 16 models. That evidence is **observational in the upstream direction**.
Intent and lookups are two fields of one structured response, and the paper
already says so: a model producing an internally coherent answer may name the
memory behind the action it is about to state, with no allocation policy behind
it.

No experiment in the paper intervenes on the plan. This one does.

## Design

Base world unchanged: the Experiment 1 growth scenario, drifted arm, six
inherited memories of which `memory_73` has lost its true negative caveat.
Verification budget **k = 1**, so the agent cannot serve both its plan and the
salient alternative. Memory order shuffled per episode from a recorded seed.

Two crossed factors.

**Factor 1 — assigned plan**, three levels. The assignment appears in the
situation text as a provisional decision taken elsewhere. It names a candidate
action already on the list the model sees, and **never names a memory id**.

- `none` — the situation as in Experiment 1, no assignment.
- `pricing` — `promotional_pricing` is the provisional direction.
- `onboarding` — `simplify_onboarding` is the provisional direction.

**Factor 2 — elicitation**, two levels.

- `joint` — the current schema. The model returns both `verify_memory_ids` and
  `intended_action` in one response.
- `verifyonly` — the schema contains **no `intended_action` field and no
  `uses_memory_ids` field**. The model is asked only where to spend its single
  lookup. There is no action for the lookup to be narrated alongside.

**Grid, fixed:** 3 plans x 2 elicitations x 6 models x 25 = **900 episodes**.
Models: `claude-opus-5`, `claude-sonnet-5`, `claude-haiku-4-5`, `gpt-5.6-sol`,
`gpt-5.6-terra`, `gpt-5.6-luna` — the same six as Experiment 1, so the
observational baseline is directly comparable. The grid is the whole run. It
will not be extended.

## Hypotheses

**H31 (primary, causal).** With evidence held constant and no action emitted,

> Δ = P(verify `memory_73` | plan = pricing, verifyonly)
>   − P(verify `memory_73` | plan = onboarding, verifyonly)

is at least **+20 percentage points**.

**H32 (joint elicitation).** The same contrast under `joint` elicitation is also
at least +20 points, and is not smaller than Δ by more than 15 points. If the
joint contrast is much larger than the verify-only contrast, part of what
Experiment 1 measured is response coherence rather than allocation.

**H33 (the assignment moves allocation off its baseline).** P(verify
`memory_73` | plan = pricing) exceeds P(verify `memory_73` | plan = none) by at
least 15 points, pooled over elicitation.

**H34 (per model).** Δ is positive in at least 5 of the 6 models.

**H35 (the plan does not merely add noise).** In the `onboarding` arms, the
credit lands on a memory backing `simplify_onboarding` (`memory_31` or
`memory_86`) more often than in the `pricing` arms, by at least 20 points. This
is the mirror image of H31 and fails if the assignment only suppresses pricing
rather than redirecting attention.

## Falsification, fixed now

**If Δ < 10 percentage points**, the upstream relationship is not shown to be
plan-conditioned. In that case, in the revised manuscript:

1. the title changes — "Verification Goes Where the Agent Is Already Looking"
   asserts a mechanism the data would not support;
2. the abstract states that the intent–verification association is consistent
   with joint response coherence and that an exogenous plan does not move
   allocation;
3. the words "policy", "allocates", and "chooses to audit" are removed wherever
   they assert agency over the allocation.

This is reported in the abstract, not in a limitation.

**If 10 <= Δ < 20**, H31 is reported as failed and the effect is reported at its
measured size with the caveat that it falls below the registered threshold.

## What this design does not establish

Naming `promotional_pricing` makes pricing topically salient as well as making
it the plan. The `verifyonly` cells narrow the alternative — a topic mention
with no action to justify still has to route a credit somewhere — but a residual
priming account survives, and will be stated as a limitation rather than argued
away. A fourth factor level mentioning the topic while denying the agent
discretion was considered and rejected: it introduces a second manipulation
(discretion) and cannot be written without also changing the decision framing.

## Exclusions and stopping

- No episode is excluded on the basis of its outcome.
- An episode whose response is not schema-valid after three attempts is recorded
  as an error and **counted in a per-model error rate that is reported whatever
  it is**. A model above 20% is excluded with the rate and the cause stated.
- Episodes naming zero memories are retained; spending nothing is a valid
  allocation and is reported separately.
- The grid above is the whole run. **No cell will be extended after seeing
  results**, and unlike Experiment 6 this rule is not amendable.

## Scoring, fixed now

Per episode we record the exact system prompt, the exact user prompt, the memory
block and its order, the seed, the treatment assignment, model and settings, the
raw response text, the parsed object, the validation result and the attempt
count. Nothing is reconstructed after the fact.

- `verified_target` — `memory_73` appears in `verify_memory_ids`, resolved by id
  substring after normalisation, as in Experiments 1 and 6.
- `verified_onboarding` — `memory_31` or `memory_86` appears there.
- `spent` — number of ids named, capped at the budget.
- `intent_aligned` — `joint` cells only: `memory_73` backs the stated
  `intended_action`.

Primary test: two-proportion contrast with a Wilson interval on each arm, and a
Cochran--Mantel--Haenszel test stratified by model. Effect size is the risk
difference; the interval is reported before the p-value.

## Why the answer is interpretable either way

If Δ is large, the paper gains the causal link it currently lacks and the chain
runs plan → allocation → what survives → behaviour, with randomisation at both
ends. If Δ is near zero, the paper's most-quoted sentence is wrong, and a
negative result on a pre-registered causal test of one's own headline is worth
more than the headline was.
