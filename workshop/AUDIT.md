# Hostile audit of the arXiv manuscript

Scope: `paper/paper.tex` and its bodies, `runs/paper/preregistration.md`,
`runs/paper-phase2/preregistration.md`, `scripts/paper-experiment.ts`,
`scripts/paper-phase2.ts`, `paper/analyze.py`, `paper/analyze_phase2.py`, and
the 1620 released episode files.

Every criticism below points at the file and line that creates it. Findings
marked **[measured]** were computed from the released data during this audit,
not asserted.

---

## A. Claims that are fully supported

**A1. Verification allocation tracks first-pass intent.** **[measured]**
Stronger than the manuscript states. Pooled over all 1020 Experiment-1
episodes -- every condition, budget, target and model -- the corrupted memory
was verified in **236/236** episodes whose first-pass intent was backed by it,
against 464/784 otherwise. The manuscript reports this only within cells
(48/48 at budget 2 drifted; 75/75 in the swap arm) and never states the pooled
figure. The relationship is *completely separated*: there is no counterexample
in the corpus.

**A2. The target-swap result.** §4.3. This is the paper's strongest evidence
and it is clean: the same corruption operator, the same models, the same
budget, moved onto the intent-aligned memory, is caught 75/75. Nothing in the
design privileges the swapped target except its position in the agent's plan.

**A3. Budget monotonicity.** §4.5, and confirmed in the unified model below:
OR 13.2 per additional credit [7.0, 24.8].

**A4. No presentation-order artifact.** **[measured]** In a single model over
all 1020 episodes, target position carries OR 0.99 [0.89, 1.11], p = 0.91.
The randomization control does what §4.6 claims.

**A5. Retrieved caveats change behavior.** §4.6, 74/184 reversals. Descriptive
and correctly described.

**A6. The pre-registered nulls are honestly reported.** §5.3 and Limitations
state that H6/H7 returned zero and why. This is done properly and should be
kept exactly as it is.

## B. Claims that are too strong

**B1. "what is lost is not random -- qualifiers, scope restrictions, and
negative results are precisely the clauses that summaries drop" (Introduction,
p.1).** **[measured, and it is false as stated.]** Running an actual
consolidation chain (Experiment 5 pilot, then 6 generations of re-summarization
down to a 70-character target) the retention caveat on `memory_73` survived in
**6/6 models at every generation**. A quantified negative outcome is the last
thing compression drops, not the first. What *does* erode is the normative
prohibition ("do not generalize this as a growth strategy"), which several
models lose while keeping "-12% retention".
The paper's central motivating sentence therefore describes a mechanism the
paper never tested and which does not reproduce when tested.

**B2. "Verification allocation is its own faculty" (Conclusion).** Not
established. The paper shows allocation dissociates from *stated* support
ratings (H8) and that detection is possible when the target is in path (H3).
"Faculty" implies a stable trait; nothing here tests stability across tasks,
sessions, or time.

**B3. "exactly backwards once the context shifts" (Conclusion).** Rhetoric
carrying a causal claim that Experiment 2 does not identify (see C1, C2).

**B4. "the difference between walking into the corrupted direction 6% of the
time and 79% of the time" (Conclusion).** This is a self-selected contrast
presented in causal language, in the section where the paper is summarizing
what it established. §5.3 labels it exploratory; the Conclusion does not
repeat the label.

**B5. Table 1 caption: "123-132 characters each".** **[measured]** True of the
drifted arm only. In the clean arm the target body is **221 characters**
against 123-132 for every other memory -- 1.73x -- and is the only memory in
the set carrying a `However` clause. The caption states the length balance as a
property of the design without noting that the primary comparison breaks it.

## C. Causal identification problems

**C1. The triage instruction is present during Phase 2.**
`scripts/paper-phase2.ts:140` builds `system = SYSTEM + INVARIANT` for the
triage arm; line 160 passes that same `system` to the Phase-2 call. The
randomized triage -> Phase-2 contrast (21/150 vs 50/150) therefore has two
open paths: through Phase-1 allocation, and directly into Phase-2 reasoning.
The manuscript presents it as the former.

**C2. The whole Phase-1 conversation is carried into Phase 2.**
`scripts/paper-phase2.ts:146-159`: `msgs` accumulates, so the Phase-2 call sees
the model's own Phase-1 rationale, which in the drifted arm frequently contains
an explicit argument for declining pricing. "Verified" and "unverified"
episodes differ in what the model already committed to in writing, not only in
whether the caveat is in its context. Commitment and consistency effects are
not separated from provenance effects.

**C3. The 6/94 vs 44/56 contrast conditions on a post-treatment variable.**
Verification is chosen by the model, so the two groups differ in whatever made
the model choose. §5.3 says so; the Abstract and Conclusion do not.

**[measured -- partial defense, obtainable with no new calls.]** Stratifying on
what Phase 1 recovered, the triage arm shows no detectable direct effect:

| stratum | drifted | drifted-triage | Fisher p |
|---|---|---|---|
| recovered `memory_73` | 6/94 (6%) | 11/140 (8%) | 0.80 |
| did not recover it | 44/56 (79%) | 10/10 (100%) | 0.19 |

while triage moves the mediator hard (63% -> 93% recovery). That pattern is
what complete mediation looks like. It is *not* proof: the stratification is on
a post-treatment variable and can induce collider bias, the second stratum has
n=10 in the triage arm, and the triage text is still in context. Experiments 3A
and 3B are designed to settle it.

## D. Confounds

**D1. The clean arm is not a matched control.** `lineage()` at
`scripts/paper-experiment.ts:118-131` appends the caveat to the target body.
The clean-vs-drifted comparison therefore varies four things at once:
correctness, length (1.73x), presence of a `However` clause, and uniqueness of
having any qualifier in the set. **[measured]**

Direction matters here. The confound predicts *more* verification in clean
(longer, uniquely marked), yet drifted is higher for most models -- so H2's
sign survives it. But the magnitude is uninterpretable, and the Sonnet reversal
that §4.2 reads as a substantive "visible warning acts as a verify-me flag"
finding is exactly what a length/salience sensitivity would produce. The paper
interprets a confound as a mechanism.

**D2. The audit probe (H8) has weak construct validity**, as Limitations
concedes. "Least supported" plausibly measures vagueness and assertiveness. The
probe cannot distinguish "I suspect a qualifier was removed" from "this
sentence is hedgy".

**D3. `defenses.ts:101` reads `iv.trueEffect[choice.segment]`** -- an oracle.
Disclosed in the repo UI as "(simulator-only)" and not used in the paper's
experiments, so this does not affect any paper claim. Noted so it is not
discovered later and read as concealment.

## E. Missing baselines

The paper measures what models do and never asks what they should do. There is
no comparison against random allocation, a pure risk policy, a pure uncertainty
policy, a diversity policy, or an approximate-EVOI policy. §5.1 writes down an
EVOI expression and then never operationalises it. As it stands the EVOI
section is decoration: it motivates Experiment 2 but is not itself evaluated.

A random-allocation baseline is computable from the existing data with no new
calls and should be in the paper. A policy comparison needs a loss function
(see F4) and is a main-conference contribution, not a workshop one.

## F. Highest-value new experiments

Ordered by information gain per call, and all now pre-registered in
`workshop/PREREGISTRATION.md` and running.

**F1 (P0). Randomized-instrument replay -- Experiment 3A.** Replay Phase 2 for
all 450 existing episodes as a fresh session with no triage text and no
history, carrying forward exactly what each episode recovered. Triage
assignment stays randomized upstream and moves recovery 94/150 -> 140/150; in
the replay it cannot reach the outcome except through what was carried forward.
The exclusion restriction is true by construction. This closes C1 and C2 and
converts the mediation story into a randomized encouragement design. 450 calls.

**F2 (P0). Randomized provenance carry-forward -- Experiment 3B.** Assign the
carried-forward records at random instead of letting the model choose. Removes
self-selection entirely and estimates the causal effect of caveat exposure on
later behavior. 300 calls.

**F3 (P3, promoted). Matched-qualifier controls -- Experiment 4.** Four
concurrent arms whose target bodies are 129 / 220 / 221 / 221 characters:
no qualifier, positive elaboration, confidence-weakening note, true caveat.
Separates "reacting to a qualifier" from "reacting to a consequential
negative". 600 calls. Promoted from P3 because D1 is measured, not speculative.

**F4 (P1). Natural consolidation drift -- Experiment 5.** Already producing the
audit's most consequential result (B1). 60 chains x 6 generations.

**Not attempted, and why.** Domain replication and memory-pool scaling (the
reviewer's P2) are the right next step but cannot be done honestly in the time
available: a second domain built quickly would be a paraphrase of the first,
and claiming domain generality from two structurally identical scenarios is
worse than claiming none. Stated as future work.

## G. Analyses possible with existing data

**G1. Done.** The 236/236 pooled separation (A1).

**G2. Done.** Unified Firth-penalised logistic model over all 1020 episodes,
`workshop/analysis/unified_model.py`. Ordinary MLE diverges because
intent-alignment separates the outcome perfectly, which is itself the finding;
Firth keeps every coefficient finite.

| term | OR | 95% CI |
|---|---|---|
| intent aligned | 422 | [26, 6860] |
| drifted | 4.44 | [2.73, 7.20] |
| triage | 13.2 | [7.60, 22.97] |
| budget (+1 credit) | 13.2 | [6.98, 24.81] |
| target position | 0.99 | [0.89, 1.11] |
| swapped target | 3.90 | [1.13, 13.47] |

Model x drift interaction: LR chi2 = 42.1 on 5 df -- the heterogeneity §4.2
describes qualitatively is formally present.

**G3. Done.** The mediation stratification in C3.

**G4. To do.** Random-allocation baseline: with budget k over 6 memories the
chance a uniform policy reaches the target is k/6. At k=2 that is 33%, against
61% observed drifted -- so models are better than random overall, while being
far better than that when the target is in path and worse when it is not. This
decomposition is not in the paper and should be.

## H. Sections to cut, move, or restructure

**H1. Cut the psychological framing to one sentence.** Related Work's
"Positive test strategies" paragraph invites "this is confirmation bias with
extra steps". The Wason/Klayman-Ha citations are worth keeping as a one-line
analogy; the six-decades framing is not.

**H2. Move the audit probe (H8) to an appendix.** It is a secondary result with
a conceded construct problem, and it currently occupies a third of §5.3 while
diluting the allocation story.

**H3. Restructure Experiment 2.** As published it is one narrative. It should
be three labelled parts: a pre-registered null; a confounded observational
contrast; and, now, a randomized replay that settles it.

**H4. Rewrite the Conclusion around an evaluation target.** "Verification
allocation is its own faculty" -> "retrieval relevance and verification
priority are different rankings, and only the first is currently engineered".

**H5. Introduction B1 must be rewritten.** The motivating compression claim is
contradicted by this repository's own new data. The honest version is stronger:
compression preserves quantified negatives and erodes normative prohibitions,
so the realistic drift operator is loss of the constraint, not loss of the fact.
