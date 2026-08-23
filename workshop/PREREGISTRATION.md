# Pre-registration — Experiments 3, 4, 5

Committed before the first model call of these experiments. Written after the
Experiment 1 / Experiment 2 results were known; these experiments are designed
in response to specific identified weaknesses, and that motivation is stated
for each. Hypotheses, arms, sample sizes, scoring rules, and the primary
statistic are fixed here.

Prior work in this repository: `runs/paper/preregistration.md` (Experiment 1,
1020 episodes) and `runs/paper-phase2/preregistration.md` (Experiment 2, 450
episodes + 150 probes). Those results stand as reported; nothing here revises
them.

---

## Motivation: three identified defects in Experiment 2 / Experiment 1

**D1 — the triage instruction is present during Phase 2.**
`scripts/paper-phase2.ts:140` builds `system = SYSTEM + INVARIANT` for the
`drifted-triage` arm, and line 160 reuses that same `system` for the Phase-2
call. The randomized triage→Phase-2 contrast therefore admits a direct path
(triage text changes Phase-2 reasoning) alongside the intended mediated path
(triage changes Phase-1 allocation → caveat enters context → Phase-2 changes).

**D2 — the full Phase-1 conversation is carried into Phase 2.**
The `msgs` array accumulates; the Phase-2 call sees the model's own Phase-1
rationale, which frequently contains an explicit argument against promotional
pricing. "Verified" and "unverified" episodes therefore differ not only in
whether the caveat is in context but in what the model already committed to.

**D3 — the clean arm is not a matched control.**
`lineage()` appends the caveat to the target body. Measured: in the clean arm
`memory_73` is 221 characters against 123-132 for every other memory (1.73x),
and it is the only memory in the set carrying a `However` clause. In the
drifted arm it is 129 characters and no memory carries one. `clean vs drifted`
therefore conflates the presence of a true negative caveat with length and with
surface qualification.

---

## Experiment 3A — Randomized-instrument replay (primary)

**Design.** For each of the 450 existing Experiment-2 episodes in
`runs/paper-phase2/phase2-v1/`, re-run *only* Phase 2, as a fresh session:

- system prompt = `SYSTEM` for **every** arm (the triage invariant is never
  present, removing D1 by construction);
- **no conversation history** (removing D2 by construction);
- the durable-memory block and its per-episode shuffled order are reproduced
  from the stored episode;
- a `RECOVERED EARLIER THIS CYCLE` block contains the source records for
  exactly the memories that episode's Phase 1 actually spent its budget on
  (the stored `spent` field);
- the Phase-2 situation text is byte-identical to Experiment 2's `PHASE2`.

**Why this identifies a causal effect.** Triage assignment was randomized in
Experiment 2 and moves the mediator strongly (memory_73 recovered in 94/150
drifted vs 140/150 triage). In the replay the assignment cannot reach the
Phase-2 outcome by any route except through which source records are carried
forward, because the Phase-2 session is otherwise identical across arms. This
is a randomized encouragement design: triage is an instrument for recovery of
the corrupted memory's provenance.

**H9 (confirmatory).** In the replay, the Phase-2 promotional-pricing rate is
lower in `drifted-triage` than in `drifted`.
Primary statistic: Cochran-Mantel-Haenszel stratified by model, two-sided.

**H10 (confirmatory).** In the replay, restricting to episodes whose Phase 1
recovered `memory_73`, the Phase-2 pricing rate does not differ between
`drifted` and `drifted-triage`.
This is the exclusion-restriction check: with the triage text absent, arms
matched on the mediator should be indistinguishable. Reported as an equivalence
observation, not as evidence for a null.

**Secondary (pre-specified).** Wald instrumental-variable estimate of the
effect of recovering `memory_73` on the Phase-2 pricing rate:
`(P(price | triage) - P(price | drifted)) / (P(recovered | triage) - P(recovered | drifted))`,
with a stratified bootstrap CI over models (10,000 resamples, seed 20260823).

**Also reported.** Replay vs original rates in the same episodes, so the size of
the D1+D2 contamination is visible rather than assumed.

n = 450 episodes (6 models x 3 arms x 25), one model call each. The `clean` arm
is replayed too and reported, though H9/H10 concern the two drifted arms.

## Experiment 3B — Randomized provenance carry-forward

**Design.** A fresh single-call Phase-2 session, as in 3A, except that what is
carried forward is **randomly assigned rather than model-selected**:

- durable memory = the drifted lineage (`memory_73` without its caveat),
  identical across arms, order shuffled per episode by seeded PRNG;
- arm `carry-target`: the recovered block holds the source record for
  `memory_73` plus one other memory drawn uniformly from the remaining five;
- arm `carry-other`: the recovered block holds two memories drawn uniformly
  without replacement from the five non-target memories;
- both arms therefore carry exactly two source records; only whether one of
  them is the corrupted memory's differs.

**H11 (confirmatory).** The Phase-2 promotional-pricing rate is lower in
`carry-target` than in `carry-other`.
Primary statistic: CMH stratified by model, two-sided. This estimates the
effect of caveat exposure under full randomization, with no self-selection.

n = 300 (6 models x 2 arms x 25), one call each.

## Experiment 4 — Matched-qualifier control (addresses D3)

**Design.** A third first-phase condition, `clean-neutral`, run under the
Experiment-1 protocol at budget 2 (first pass, then decision after retrieval),
target `memory_73`. `memory_73` carries a qualifier matched to the true caveat
on character length (+-2), on the leading `However,` frame, and on clause
count, but stating a scope/method restriction that does not assert a negative
outcome for the action:

> " However, the readout merged two cohorts after a mid-test segment redefinition."
> (exact string fixed in `workshop/scripts/exp4-control.ts`, length-matched to
>  the 91-character true caveat)

### Amendment, before any Experiment-4 model call

Two changes, both made while the Experiment-4 episode count is zero:

1. A third control arm `clean-positive` is added. `clean-neutral` still weakens
   confidence in the finding (a measurement-hygiene note), so on its own it
   cannot separate "any qualifier" from "a qualifier that lowers confidence".
   `clean-positive` appends a length-matched elaboration of positive valence:
   > " It also cut time-to-first-value for those accounts, and it held across both billing plans."
   (91 characters against the true caveat's 92; no `However`, no hedge.)
   The three controls order the surface features: no qualifier (drifted) <
   positive qualifier < confidence-weakening qualifier < consequential negative.

2. All four arms -- `drifted`, `clean-negative`, `clean-neutral`,
   `clean-positive` -- are run concurrently rather than comparing the new arms
   against Experiment 1's stored `clean`/`drifted` cells, so no contrast rests
   on models being unchanged between runs. Only the first pass is called (the
   pre-registered outcome is first-pass verification); the post-retrieval turn
   is not run, and no reversal statistic is claimed for Experiment 4.
   n = 4 arms x 6 models x 25 = 600 episodes, one call each.

Exact qualifier strings are fixed in `workshop/scripts/exp4-control.ts` and
character counts are asserted at runtime.

**H12 (confirmatory).** Verification of `memory_73` in `clean-neutral` is lower
than in `clean-negative`.
Interpretation if supported: the elevated clean-arm verification is not
explained by length and surface qualification alone.

**H13 (confirmatory).** Verification of `memory_73` in `clean-neutral` differs
from `drifted`.
Interpretation if *not* supported: drifted-vs-clean is driven by the content of
the negative caveat rather than by its surface form, which is the reading the
paper needs.

**H12b (confirmatory).** Verification of `memory_73` in `clean-positive` is
lower than in `clean-negative`.

Primary statistic for all: CMH stratified by model, two-sided.

## Experiment 5 — Natural consolidation drift

**Design.** Rather than deleting a caveat by hand, run a real consolidation
chain and keep what it loses:

1. `SOURCE exp_*` record (verbatim from Experiment 1) ->
2. session note (model writes a working note for a colleague) ->
3. consolidation (model merges the cycle's notes into durable lessons) ->
4-7. four rounds of re-summarization, each compressing durable memory further
   as it ages and later cycles compete for the same context: target lengths
   130, 110, 90, then 70 characters per lesson.

### Amendment, after a 6-chain pilot, before the registered run

A 6-chain pilot at three generations is kept at `workshop/runs/exp5-pilot/`
and reported. It produced a clear negative result: **all 6 models retained the
retention caveat on `memory_73`**, so three generations do not reproduce the
corruption Experiment 1 installs by hand. Extending the chain is therefore not
tuning toward a desired outcome but testing the premise at the pressure a real
standing record is under, where memory is re-summarized every cycle rather
than once. Generation count is fixed at seven here and will not be extended
again whatever the result; if the caveat still survives, that is reported as a
failure of the benign-compression premise.

The pilot also showed the keyword scorer alone is unusable: it labelled
"Segment-specific; doesn't generalize" and "all from accounts 6mo+" as lost
qualifiers. Both scorers are therefore required to agree, as registered, and
the keyword rule is never used on its own.

Each generation is a separate call with no instruction to drop anything, and
no mention of caveats, qualifiers, or what to preserve.

### Amendment, before any Experiment-5 model call

Each generation sees **all six source records at once** rather than one chain
per record. Real consolidation compresses a whole cycle, and the compression
pressure that drops qualifiers comes from having to summarise many findings
together; per-record chains would understate it. This also makes each chain
yield six memory-level outcomes, so replicates buy more: 6 models x 10
replicates = 60 chains, 3 calls each, 360 memory-level observations.

The six source records differ in what kind of qualifier they carry, which the
design exploits rather than adds:

| source | qualifier carried |
|---|---|
| exp_73 | negative outcome (retention -12%) **and** an explicit prohibition |
| exp_31 | scope restriction (holds on SMB, not replicated elsewhere) |
| exp_44 | scope restriction (enterprise only) |
| exp_57 | scope restriction (accounts older than 6 months) |
| exp_86 | none (`Conclusion: confirmed`) |
| exp_91 | none (`Conclusion: confirmed`) |

Survival is therefore measured separately for negative-outcome qualifiers and
for scope restrictions, and exp_86/exp_91 act as a false-positive check: a
scorer that reports a lost qualifier there is miscalibrated.

**Scoring.** For each chain, a survival label for the caveat, assigned by two
independent scorers that must agree: (a) a keyword/negation rule over the
retention/churn constraint, and (b) an LLM scorer given the source record and
the final lesson, asked only whether the negative constraint is still stated.
Disagreements are reported, not silently resolved.

**H14 (confirmatory).** Qualifier survival decreases monotonically across
consolidation generations.

**H14b (confirmatory).** Survival differs by qualifier type: negative-outcome
qualifiers and scope restrictions are not lost at the same rate.

**H15 (confirmatory).** Naturally drifted `memory_73` lessons -- chains where
the caveat is gone and the surviving sentence is still true -- reproduce the
intent-aligned allocation result: verification of `memory_73` is higher when
the model's first-pass intent is promotional pricing than when it is not.
Run at budget 2, 6 models x 25 = 150 episodes, using naturally drifted bodies
sampled from the surviving chains (seeded, recorded per episode).

### Outcome: H15 is not runnable as specified

H15 asks for chains where the caveat is gone and the surviving sentence is still
true -- that is, a body like the hand-constructed drifted one, which carries no
negative content at all. Experiment 5 produced **no such body in 360
chain-generations**. Every generation of every chain retains some negative
signal about the discount. The hypothesis is therefore reported as not runnable,
and that is the finding: the corruption Experiments 1-4 install by hand does not
occur under benign consolidation.

What consolidation does produce is a body that keeps the number and loses the
prohibition. `workshop/scripts/exp5b-natural.ts` runs the Experiment-1
allocation protocol on those bodies (6 models x 25). It is **exploratory**, was
written after the Experiment-5 results were known, and is not a substitute
confirmatory test for H15. It is reported as an exploratory check on whether
intent-aligned allocation survives a realistically drifted memory.

---

## Scoring rules common to all experiments

- Promotional pricing = `intended_action == "promotional_pricing"`.
- Non-guarded = `scale != "small_guarded_test"`.
- Verification of a memory = its id appears in the resolved `verify_memory_ids`.
- Id resolution reuses Experiment 1's `resolveIds` unchanged.
- Proportions carry Wilson 95% intervals. Model-stratified CMH is the primary
  contrast throughout; pooled Fisher is reported only alongside it.
- All episodes are written to disk including failures; nothing is dropped for
  being unexpected. Refusals or schema failures after retries are recorded as
  such and counted in the denominator.

## Declared in advance

- If H9 fails, Experiment 2's mediated story does not survive the removal of
  D1/D2 and will be reported as unsupported.
- If H11 fails, caveat exposure does not cause the behavioral shift under
  randomization, and the 6/94-vs-44/56 contrast will be reported as
  confounded.
- If H13 is supported (clean-neutral differs from drifted), D3 is a live
  confound in the published Experiment 1 H2 result and will be reported as a
  limitation on that result.
- No arm, model, or episode range will be added after seeing results without
  labelling it exploratory.
