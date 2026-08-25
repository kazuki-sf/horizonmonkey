# Canonical claim ledger

Every figure recomputed from stored episode files on 2026-08-25, not from prose.
Where an emitter defines a quantity, the emitter's definition governs and is
named. Verified: `emit_macros710.py` regenerates byte-identically from `runs/`.

Status vocabulary: **CONFIRMATORY** (pre-registered, threshold met) ·
**REPLICATED** (independently reproduced on disjoint seeds) · **EXPLORATORY** ·
**FALSIFIED** · **BOUNDARY** · **UNTESTED**.

---

## A — Verification allocation is a distinct problem  ·  CONCEPTUAL

**Claim.** Provenance availability does not guarantee provenance use. An agent
holding more inherited beliefs than it can re-derive must allocate scarce
verification effort, and that allocation is measurable, manipulable and
consequential.

**Not the novelty:** confirmation bias in language models; the positive-test
strategy; provenance storage; generic tool-call budgeting.
**Allowed:** framing, motivation, discussion.  **Not allowed:** any empirical
claim on its own. **Placement:** Abstract, Introduction, Discussion.

---

## B — Exogenous plan assignment redirects verification  ·  CONFIRMATORY

**Effect.** Verify-only elicitation, `intended_action` removed from the schema:
pricing plan **137/150** against onboarding **10/150** = **+84.7 points**.
Mirror (an onboarding memory): **140/150** against **13/150** = **+84.7**.
Positive in **6 of 6** models, CMH χ² = 219.4. 900 episodes, 0 errors.
No-plan baseline **99/150 = 66.0%**; pricing **+25.3**, onboarding **−59.3** —
most of the effect is steering attention *away*.

**Supporting.** Observational signature: Exp 1, **236/236** plan-backed against
**464/784** otherwise (aligned = the target backs the first-pass
`intended_action`, per `emit_macros.py:44`). Exp 6, 6,700 episodes, 16 models,
11 organizations, 2 worlds: **3026/3077** on-path.

**Allowed:** "exogenous working-plan assignments causally redirect verification."
**NOT allowed:** that internal plan state was isolated. The intervention bundles
plan state, the topical salience of naming the plan, and directive framing
(leadership sets the direction). This bound must sit beside the claim, not in
limitations alone.
**Heterogeneity:** 6/6 positive; magnitude not decomposed per model.
**Registered failure to report:** H32 breached — verify-only exceeds joint by
**19.3** against a 15-point ceiling.
**Descriptive only:** joint arm, agents keeping the plan verify **71/71**, those
abandoning it **44/79**. Post-treatment; not mediation evidence.
**Placement:** Abstract, main §3.

---

## C — A decision-relevant constraint suppresses verification  ·  CONFIRMATORY

**Effect.** Exp 8, 750 episodes: true caveat **36/150 = 24.0%** against the
length-matched neutral clause **105/150 = 70.0%** = **−46.0 points** at fixed
length (91–92-character appends).

**Allowed:** "changing the semantic constraint changes verification behaviour."
**Labelled interpretation only:** that a stated constraint lowers the perceived
marginal value of the source, or moves the action out of the active decision
set. **NOT allowed:** any claim about the model's internal reasoning; no probe
measures it, and constraint content also moves the working plan, which is
post-treatment.
**Placement:** Abstract, main §4.

---

## D — The constraint effect survives register and quantification  ·  REPLICATED

**Effect.** Exp 10, slot grammar holding numeric claims and clause slots
constant, 6 wording families, length matched within register.
Removed **303/480** against retained **300/960** = **+31.9 points**, χ² = 168.5.
**Primary +29.2, pre-registered independent replication +34.6** (opened only
after the primary analysis was committed).
Within fluent **+40.6**, within telegraphic **+23.1**. All 6 families positive
(**+22.0 to +40.3**).

**Structure, which must be stated:** 1,680 episodes total = six cells of 240 plus
a 240-episode bridge; the bridge has no constraint level and is excluded; the
pre-registered estimand **pools two constraint-retaining levels** against
removed, hence 960 against 480 over **1,440** episodes. Not a balanced binary RCT.

**Heterogeneity — belongs beside the headline, never in limitations alone:**

| model | primary | replication |
|---|---|---|
| claude-opus-5 | +91.25 | +98.75 |
| gpt-5.6-sol | +52.50 | +55.00 |
| gpt-5.6-luna | +22.50 | +21.25 |
| gpt-5.6-terra | +13.75 | +16.25 |
| claude-haiku-4-5 | +3.75 | +3.75 |
| claude-sonnet-5 | **−8.75** | **+12.50** |

Excluding opus and sol: **+7.8** primary, **+13.4** replication.
**NOT allowed:** "LLM agents show a 31.9-point effect."
**Allowed:** the pooled effect with the statement that direction generalises
better than magnitude.
**Sonnet:** the only sign difference across runs, and the least stable model on
identical prompts. Report both runs; **do not call the first result noise.**
**Alternatives refuted here:** register alone (marginal syntax contrast **−2.1**,
reported as an estimate, not a null — the design does not identify a causal main
effect of style); quantification (**bridge −10.4**, sign reversed — the
unquantified body is checked *less*).
**Placement:** Abstract, main §4, per-model figure.

---

## E — Explicit prohibition adds beyond a quantified negative  ·  CONFIRMATORY

**Effect.** Exp 10: negative-only **40%** against negative-plus-prohibition
**22%** = **+18.3 points** of additional suppression.
**Relevance:** connects to G, where the quantified negative is the durable
component and the prohibition is the fragile one. **Do not** present that
juxtaposition as a demonstrated harmful chain.
**Placement:** main §4, secondary.

---

## F — Recovered provenance changes the later decision  ·  CONFIRMATORY

**Effect.** Randomised carry-forward, 300 episodes: corrupted-direction rate
**139/150 → 3/150**; unguarded commitment **39/150 → 0/150**; all 6 models same
direction.
**Allowed:** "what provenance the later agent holds causally changes its
decision."
**NOT allowed:** plan → allocation → recovered evidence → harm as one identified
chain. Upstream (B) and downstream (F) are identified **separately**.
**Framing:** this closes the operational consequence; it is not the novel
mechanism, and a reviewer will fairly call it close to tautological.
**Placement:** Abstract (one clause), main §5.

---

## G — The tested consolidation pipeline did not produce the installed corruption  ·  BOUNDARY

**Taxonomy, which the section depends on:** *negative outcome* (retention −12pp)
· *scope constraint* · *prohibition* · *complete negative deletion* (no adverse
outcome and no warning of any kind).

**What survived.** Complete negative deletion: **0/360** chain-generations.
Quantified negative: **60/60 chains at every one of the six generations**
(100, 100, 100, 100, 100, 100%) — deterministic keyword detection, not a model
judgment. Of 59 distinct final bodies, **56** carry a number attached to a
negative outcome or a churn/retention term.

**What did not.** Target qualifier **100, 100, 100, 97, 92, 83%** (ending
50/60). Scope restrictions **100, 100, 96, 83, 73, 61%** (ending 110/180) —
monotone. Explicit prohibition **80, 55, 43, 52, 48, 42%**, **48/60 → 25/60**,
**not monotone**, so report the level and not a trend.

**Downstream.** Consolidated bodies plan the risky action **0/150**, identical to
the intact original **0/150**, against **28/150** for the hand-stripped body.
Verification: natural **22.7%**, hand-drift **60.7%** (**−38.0** raw, **−30.0**
under the pre-registered length control, H41). Against intact: **−1.3** —
**do not interpret**; smaller than run-to-run variability and never replicated.

**Scorer, disclosed in full.** Frozen scorer is **`claude-opus-5`, also one of
the six consolidator models — not independent.** Specificity **0/720** on the
two records with no qualifier in source; sensitivity **240/240** at generation 1
on the four that have one. **No human validation.**

**NOT allowed:** "consolidation preserved all important constraints"; that
0/360 means nothing eroded; extrapolation past 6 generations, this pipeline,
these models or this scenario.
**Placement:** Abstract (one sentence), main §6.

---

## Withdrawn — active claims only in a falsification paragraph

| withdrawn claim | what killed it |
|---|---|
| "Silence is stealthier than qualification" | Exp 8 padded control: hedge 66.7% vs padded 70.0% = **−3.3, p = 0.56** |
| Generic hedging attracts provenance scrutiny | same |
| The Exp 8 contrast identified a pure length effect | the **+16.0** silent-deletion-to-neutral gap bundles length, clause existence and neutral content |
| Natural consolidation is stealthier than the intact memory | Exp 9: **−1.3**, intervals overlap, never replicated |
| Telegraphic register explains the Exp 9 difference | Exp 10: **−2.1** marginal, and the effect is positive within both registers |
| Unquantified claims trigger more checking | Exp 10 bridge: **−10.4**, sign reversed |
| Punctuation explains the Exp 9 effect | same 23 bodies both ways: **−8.7**, exact McNemar **p = 0.774** |
| Low verification because the risky action was already rejected | hand-drift no-intent stratum still **51.6%**; three models have zero intent variance and show **−25.3** |
| Experiment 5b is confirmatory | it is exploratory. Only permitted framing: *an exploratory Experiment-5b observation was later reproduced in a pre-registered experiment* |
| Internal plan state isolated causally | the assignment bundles plan, salience and directive framing |
| The observed policy is normatively wrong | every constraint in every arm is **true** |
| The paper identifies an optimal scheduler | needs a corruption prior, a future-context distribution and a loss model |
| The benign pipeline produced the hand-installed deletion | **0/360** |

---

## Constraints on reporting, everywhere

**H1 — Stochastic instability.** 127 byte-identical prompts, re-run:
**32 flip (25.2%)**, 8.7% to 42.1% by model, `claude-sonnet-5` least stable; the
aggregate moved **+6.3 points** from sampling alone. **Not** a universal floor
below which effects are zero — it means small effects need replication before
interpretation.

**H2 — Heterogeneity beside every pooled figure.** See D.

**H3 — Register modulates without producing.** +40.6 fluent against +23.1
telegraphic. Reported, not explained.

**H4 — Pre-registration language.** Confirmatory experiments and primary
contrasts are pre-registered before the first model call (verified: prereg
commits precede first episode files by 9–355 s for all six timed experiments),
with analysis committed in advance. But `PREREGISTRATION.md` carries 3
amendments, `PREREGISTRATION-EXP6.md` 22, and Exp 5b was exploratory. Do not
write a blanket claim stronger than that.

---

## UNTESTED — and named as such in the paper

**U1.** Plan state separated from topical salience and directive framing.
**U2.** A constraint that is **false or stale**, whose provenance would overturn
the visible text. This is the case the safety motivation turns on, and no arm
anywhere runs it. Both designs are in `NEXT_DECISIVE_EXPERIMENTS.md`.
**U3.** Horizons beyond six consolidation generations.
**U4.** Stores of production scale; six memories is the geometry throughout.
