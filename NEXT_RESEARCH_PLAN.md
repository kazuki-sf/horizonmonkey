# Next research plan

Written after four adversarial audits of the current manuscript. The purpose is
not to add experiments. It is to remove the strongest alternative explanations
and, where they cannot be removed, to stop making the claim.

---

## 1. What the current work actually establishes

| # | Claim | Evidence | Kind | Strongest alternative explanation |
|---|---|---|---|---|
| C1 | Verification allocation tracks the agent's first-pass intent | Exp 1, 1020 episodes, 236/236 aligned vs 464/784 | **observational** | The model emits intent and lookups in one response; a coherent answer names the memory behind the action it is about to state. No intervention on intent exists. |
| C2 | What the budget recovers causally changes the later decision | Exp 3B, randomised carry-forward, 139/150 vs 3/150 | **randomised** | None surviving. This is the paper's one clean causal link. |
| C3 | A stated caveat suppresses verification; silence is stealthier than an irrelevant hedge | Exp 4, four arms | **randomised marginal, but see below** | The drifted arm is 129 characters and the appended arms are ~221. The three appended arms are matched to each other, not to drift. Length, clause count and information volume are confounded with the silence-vs-hedge contrast, which is the paper's most quoted sentence. |
| C4 | Benign consolidation does not produce the corruption we install | Exp 5, 0/360 | **randomised generative** | None. The finding is negative and robust. |
| C5 | The allocation signature is not an artefact of one scenario or two labs | Exp 6, 6,700 episodes, 16 models, 11 orgs | **randomised placement; observational alignment** | The design became adaptive: six grid extensions past a stopping rule that forbade them, two scenario redesigns after pilots, an admissibility rule written after two failed attempts. Disclosed, but weaker than a frozen replication. |
| C6 | Retrieval relevance is not verification priority | Exp 6 budget-1 arm | **randomised budget, observational allocation** | At budget 2 the agent can serve both. At budget 1 the plan wins per model but loses in one dose-by-world cell. Not settled. |

**The chain the paper wants** is:

> plausible degradation → allocation policy → what survives into later context → behaviour

**C2 closes the second half.** Nothing closes the first half. C1 is the load-bearing
upstream link and it is the one link with no intervention behind it.

---

## 2. The strongest rejection case

Written as a reviewer trying to reject.

> The paper's title asserts a mechanism it never manipulates. Intent and lookup
> are two fields of one structured response; the reported separation is
> consistent with a language model producing an internally coherent answer and
> requires no allocation policy at all. Experiment 3 randomises the *downstream*
> half and is clean, but it presupposes the upstream half. Experiment 4's
> headline contrast is not length-matched in the direction that matters.
> Experiment 6 is large but adaptive, by the authors' own count six times.
> Experiment 5 shows the motivating corruption does not arise naturally, which
> the authors report honestly and which leaves the threat model requiring an
> adversary with write access. No remedy is evaluated. The setting is a six-item
> list, not a memory system.

Of those, the one that kills the paper is the first. Everything else is bounded
or acknowledged.

---

## 3. Decisive experiments, in priority order

### Experiment 7 — randomised plan (PRIORITY 1, blocking)

**Question.** Does an exogenously assigned working plan change where a single
verification credit goes, with the visible evidence held constant?

**Why this and not something else.** It is the only intervention that can
distinguish *allocation policy* from *joint response coherence*. If it fails,
the paper's title claim is not causal and the framing must change.

**Design.** Base scenario unchanged (Exp 1 world, drifted arm, `memory_73`
stripped of its caveat). Budget **k = 1**, so the agent must choose. Memory
order randomised per episode from a recorded seed. Six models.

Two crossed factors:

- **plan** ∈ {none, pricing, onboarding} — assigned in the situation text as a
  provisional decision already taken elsewhere, never naming a memory id and
  never altering the candidate list.
- **elicitation** ∈ {joint, verify-only}
  - *joint*: current schema, the model names both its lookup and its intended
    action in one response.
  - *verify-only*: the schema contains **no `intended_action` field**. The model
    is asked only where to spend its one lookup. There is no action to narrate,
    so joint coherence cannot produce an association.

6 cells × 6 models × 25 = **900 episodes**.

**Primary estimand.**

> Δ = P(verify `memory_73` | plan = pricing, verify-only)
>   − P(verify `memory_73` | plan = onboarding, verify-only)

Everything visible is identical across those two arms; only the assigned plan
differs, and no action is emitted.

**Secondary.** The same contrast under *joint* elicitation, to connect to Exp 1;
and the no-plan arms as the observational baseline.

**Falsification, fixed in advance.** If Δ < 10 percentage points, the upstream
relationship is **not** shown to be plan-conditioned, and the paper must
(a) retitle, (b) state in the abstract that the association is consistent with
response coherence, and (c) drop "policy" language throughout. This is the
condition under which the paper's central framing is wrong, and it is to be
reported in the abstract, not a limitation.

**Confound this design does not remove.** Naming `promotional_pricing` makes
pricing topically salient as well as making it the plan. The verify-only cells
narrow this — a topic mention with no action to justify still has to route a
credit — but a residual priming account survives. It is stated as a limitation
and not argued away. A third factor level that mentions the topic while denying
the agent discretion was considered and rejected as unwriteable without
introducing a second manipulation.

### Experiment 8 — Experiment 4's missing control (PRIORITY 2)

**Problem.** The sentence "silence is stealthier than qualification" compares a
129-character body against ~221-character bodies. Length, clause count and
information volume ride along with the manipulation.

**Design.** Five arms, all matched on character length and clause structure
**including the drift arm**:

1. true caveat (material negative constraint)
2. irrelevant hedge (uncertainty, no material constraint)
3. **neutral padded filler** (same length, no hedge, no constraint) — the arm
   that isolates "there is a second clause" from "the second clause hedges"
4. positive elaboration
5. short drift, retained unmatched, as the link to Exp 4

Contrasts that become identifiable: length (5 vs 3), second-clause existence
(3 vs 5), hedging given a second clause (2 vs 3), material negative content
(1 vs 2). Primary analysis is the randomised marginal contrast. Intent is a
mediator and is modelled as one, never conditioned on as the primary result.

### Experiment 9 — the failure natural consolidation actually produces (PRIORITY 3)

Experiment 5 already shows the interesting thing: numbers survive, **scope and
prohibition erode**. The corruption worth studying is the one the pipeline
makes, not the one we install.

**Deterministic extraction rule, fixed before looking:** from the 360 stored
chain-generations, select every `resum_70` body that (a) retains a quantified
figure present in the source and (b) has lost the population, temporal or
normative clause, judged by the frozen scorer. No hand-picking.

Then run the Exp 1 allocation protocol on those bodies and ask whether a
record that is *factually accurate and scope-degraded* is verified less than one
that is visibly incomplete. Exp 5b already hints at 22% against an intact
caveat's 25%; this makes it the confirmatory question rather than an exploratory
aside.

### Experiment 10 — closing the chain (PRIORITY 4, contingent on 9)

Construct a later context in which the *naturally lost* qualifier is
load-bearing — a population restriction dropped, then a decision about a
different population — and randomise provenance availability at that later
stage exactly as Exp 3B does. This is the only design that connects natural
degradation to behaviour without a hand-built corruption anywhere in the chain.

Run only if Experiment 9 finds the degraded records are systematically missed.
If they are verified at the same rate as anything else, there is no chain to
close and that is the finding.

### Experiment 11 — frozen holdout (PRIORITY 5)

One scenario in a **different geometry**: 20 candidate memories, unequal
relevance, three partially relevant, two potentially consequential stale
records, unequal memories per action. Everything frozen before any call —
scenario, arms, models, n, exclusions, stopping rule, scoring, analysis,
hypotheses. **No amendments except infrastructure impossibility.** This is the
answer to the adaptivity criticism, and it is worth more than another 6,700
episodes in a fourth clone of the same shape.

### Not now

The retrieval-plus-verification prototype and the scheduler baselines
(Priorities 6 and the scheduler section) are the architectural extension. They
are a second paper. Running them before 7–9 resolve would be building a remedy
for a mechanism that is not yet identified.

---

## 4. Analysis standard from here

Effect sizes and intervals first; p-values reported but not headlined. Per-model
and per-world effects always shown, never only pooled — the audits caught pooling
hiding a failed cell twice. Where the design supports it, a mixed-effects fit
with model and world as grouping factors, to answer *how likely is this to hold
for a new model* rather than *is it significant across thousands of episodes*.

## 5. Recording standard from here

Every episode stores the exact system prompt, exact user prompt, memory block
and order, seed, treatment assignment, model and settings, raw response text,
parsed object, validation result, attempt count. No prompt is ever
reconstructed after the fact. This is a change: current episodes store the
order and reconstruct the prompt from it.

## 6. Pre-registration standard from here

Hypotheses, estimands, arms, exclusions, stopping rule, sample sizes, primary
and secondary outcomes, exact tests, and falsification conditions — all
committed before any call, and **the confirmatory dataset is never the one the
design was tuned on**. Experiment 6's six extensions are the thing this rule
exists to prevent.

## 7. Ordering

7 → 8 → 9 → (10 if 9 warrants) → 11. Experiment 7 is blocking: its outcome
decides whether the paper is about an allocation *policy* or about an
allocation *signature*, and that decides the title.

## 8. Files this adds

- `workshop/PREREGISTRATION-EXP7.md`
- `workshop/scripts/exp7-plan.ts` — runner, full-prompt recording
- `workshop/analysis/exp7_analyze.py`
- `runs/exp7/`

## 9. What this does to the current manuscript

Nothing is appended. If Experiment 7 shows Δ is large, the upstream link becomes
causal and the paper is restructured around a two-sided causal chain. If Δ is
small, the title changes and the abstract says the association is consistent
with response coherence. Either way the paper is rewritten from the evidence,
not extended.
