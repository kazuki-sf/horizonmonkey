# Claim map — what survives, what was falsified, as of Experiment 10

Every number here is recomputed from stored episode files. Effect sizes govern;
no p-value is a headline.

## Survives, and is the paper's spine

**C1 — Verification allocation is caused by the working plan, not merely
correlated with it.**
Experiment 7, 900 episodes. With `intended_action` **removed from the schema**,
so the model never narrates an action, an assigned pricing plan puts the single
verification credit on the pricing memory in **137/150 against 10/150** under an
onboarding plan: **+84.7 points**, positive in 6/6 models, CMH χ² = 219.4. The
mirror contrast is also +84.7. Verify-only *exceeds* joint elicitation by 19.3
points, the opposite of what response-coherence predicts. Models that overturn
the assigned plan still verify its memory 76.7% of the time.
*Status: the causal claim. Unchallenged by anything since.*

**C2 — A memory that states its constraint is checked far less than one of the
same length that does not.**
Experiment 8, 750 episodes: `true-caveat` **24.0%** against same-length
`padded` **70.0%** = **−46.0 points**. Independently replicated in Experiment 9
at 36/150 = 24.0% on disjoint seeds, with per-model breakdowns that differ.
*Status: survives, and is the paper's most counterintuitive finding.*

**C3 — The gap between naturally consolidated and hand-stripped memories is
carried by the decision-relevant constraint, not by surface form.**
Experiment 10, 1,680 episodes across a primary and a registered independent
replication. With quantification held constant, length matched within syntax,
and six wording families: **+31.9 points** pooled, **+40.6 within fluent** and
**+23.1 within telegraphic**. H51 satisfied (+29.2 against +34.6).
*Status: survives, with the heterogeneity caveat in C8.*

**C4 — An explicit prohibition suppresses beyond a quantified negative outcome.**
Experiment 10: **+18.3 points** pooled for `negative` over `prohibition`.
Predicted by Experiment 9's pre-labelled exploratory split (12.2% against 27.7%).
*Status: survives, registered and replicated.*

**C5 — Over six generations, consolidation did not destroy the safety-relevant
content.**
Experiment 5: the hand-built corruption appears in **0 of 360**
chain-generations. Of the 59 distinct consolidated bodies, **58 retain a
quantified negative** and about 24 an explicit prohibition.
*Status: survives. A negative result about the paper's own threat model, and
bounded at six generations.*

## Falsified, and removed from the paper

**F1 — "Silence is stealthier than qualification."**
Experiment 8's registered H36: `hedge` 66.7% against same-length `padded`
70.0% = **−3.3 points, p = 0.56**. The entire +12.7 hedge-versus-drift gap was
length and clause existence (+16.0). *Withdrawn from the abstract, the
introduction and the conclusion.*

**F2 — "The natural failure mode is harder to catch than the original."**
Experiment 9: `natural-padded` 30.7% sits **on top of** `intact` 24.0%, not
below it. *Withdrawn. The interpretation, not the number.*

**F3 — "The consolidated body is verified less because the agent already ruled
the action out."**
My own reading of Experiment 9, refuted by three tests: within `hand-drift`,
episodes planning no risky action still verify **51.6%**; three models plan the
risky action 0/100 times in **all four arms** and still show **−25.3**;
Experiment 8 shows verification is not monotone in intent. *Withdrawn. Intent
is now treated as a post-treatment mediator candidate and no contrast is
computed on it.*

**F4 — "Telegraphic register explains the Experiment 9 gap."**
Experiment 10's H47: **−2.1 points** pooled, where the 72-character length gap
alone predicts about −12. *Not supported. The register objection was the
first-order limitation after Experiment 9 and this experiment removes it.*

**F5 — "An unquantified claim invites verification because it is unsupported."**
The audit's strongest new alternative. Experiment 10's bridge cell carries
Experiment 9's zero-number body verbatim and is verified **10.4 points LESS**
than the matched quantified cell. *Not supported; its predicted direction is
backwards.*

**F6 — "Punctuation and surface form move verification."**
Inferred from a 47.8%-against-27.6% within-arm split. That is a between-body
comparison. Putting the **same 23 bodies** in both forms moves **−8.7 points,
exact McNemar p = 0.774**. *Not supported.*

## Demoted, not withdrawn

**D1 — Experiment 5b's 22% against 58%.**
The number is correct (33/150 and 87/150, recomputed). **Experiment 5b remains
exploratory.** The accurate statement is that *an exploratory Experiment-5b
observation was subsequently reproduced in pre-registered Experiment 9*.

**D2 — Experiment 9's H44** (`intact` − `natural-padded` = −6.7). A registered
sign test with no threshold, inside the measured run-to-run variability, never
replicated. *Not interpreted.*

## Constraints on how this paper may report anything

**C8 — Heterogeneity.** Experiment 10's constraint effect is carried by two of
six models. Excluding `claude-opus-5` and `gpt-5.6-sol` it is **+7.8** primary
and **+13.4** replication. Direction consistent, magnitude not a property of
models in general. **This belongs next to every headline that quotes +31.9.**

**C9 — Run-to-run variability is material.** 127 byte-identical prompts, rerun:
**32 flip, 25.2%**, and the aggregate moved **+6.3 points** from sampling alone.
Per model 8.7% to 42.1%. This is **not** a universal floor below which effects
are zero. It means **small effects require independent replication before they
are interpreted at all**, and it is why `claude-sonnet-5`'s −8.8 in Experiment
10's primary is read against its +12.5 in the replication.

**C10 — Register modulates, even though it does not produce.** The constraint
effect is roughly twice as large in fluent as in telegraphic (+40.6 against
+23.1). Reported, not explained.

## What remains unanswered, and what should not be run

Open: whether the constraint survives **twenty** generations rather than six.

Per the stopping rule now in force, a further experiment must answer a
remaining potentially fatal reviewer objection, and "interesting to know" is no
longer sufficient. Causal plan manipulation, length-confound correction,
natural-degradation replication and style-versus-content identification are
done. **The default next action is the frozen holdout replication of C1**, not
a search for further failure modes; a 20-generation stress test qualifies only
with a distinct boundary question and a frozen stopping rule.
