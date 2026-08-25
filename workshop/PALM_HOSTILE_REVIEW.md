# Hostile review — PALM workshop submission #32 (revised, 8pp)

Written before any edit to the revised paper. Every number checked against
stored episode files, not against the prose. Reviewing to reject.

## Summary

The paper studies which inherited memories an agent chooses to verify when it
can follow only $k$ provenance links before acting. It reports that an
exogenously assigned working plan redirects the scarce verification credit by
84.7 points with the action field removed from the response schema; that a
memory carrying a decision-relevant constraint is verified 46 points less than a
length-matched neutral clause, an effect that survives register and
quantification controls at 31.9 points with a pre-registered independent
replication; that randomising which provenance reaches a later agent moves its
decision from 139/150 to 3/150; and that a benign six-generation consolidation
pipeline did not produce the omission the controlled experiments install.

The paper is unusually candid. It reports a falsified prior headline, a breached
registered hypothesis, and an erosion trend that cuts against its own boundary
result. That candour is its best feature and I want to be clear that my
recommendation is not driven by doubt about the data.

## What is genuinely new

The object of study. "Which inherited belief does a budget-limited agent choose
to re-derive?" is not the same question as retrieval relevance, provenance
recording, memory poisoning, or generic tool-budget efficiency, and I am not
aware of prior work that isolates it with a randomised intervention on the
agent's plan. The schema ablation --- removing `intended_action` so the model
cannot narrate the choice it is being tested on --- is a good design idea and it
is the paper's strongest methodological contribution.

## Strengths

1. Pre-registration with committed analysis scripts, verified: Experiments 6--10
   have prereg commits 9--355 seconds before their first episode file.
2. An independent replication of the paper's most contested effect, opened only
   after the primary analysis was committed, with per-model values agreeing to
   within 3 points for 5 of 6 models.
3. A measured stochastic floor (25.2% flip on byte-identical prompts) that the
   paper refuses to convert into a universal threshold.
4. A negative result --- the tested pipeline did not produce the installed
   corruption --- reported as a finding rather than buried.
5. Zero errors across 6,700 + 900 + 750 + 600 + 1,680 episodes, and 0 scoring
   disagreements on an independent rescore.

## Major concerns

### M1. The central causal claim is stated more strongly than the design supports. **This alone justifies rejection in its current wording.**

The abstract says *"Allocation is causally conditioned on the agent's working
plan"* (`paper.tex:36`) and the contribution list says *"Verification is
plan-conditioned, causally"* (`paper.tex:87`). §3 then concedes, correctly, that
the assignment names the plan's topic and *"this design cannot separate the
two."*

What is identified is the causal effect of a **plan-assignment intervention**.
What is claimed in the abstract is the causal effect of **the working plan**.
Those are different, the difference is exactly the confound the paper itself
names, and a reader who stops at the abstract --- which is most reviewers ---
receives the stronger claim. The bounding sentence exists but never appears
beside the claim it bounds. The title, *Plan-Conditioned Verification*, inherits
the same ambiguity.

### M2. Mechanism language asserts an internal state that was never measured.

*"A memory whose constraint is already written down gives the agent nothing to
recover"* (§4) and *"a belief that states its constraint reads as settled"* (§7)
describe what the model concluded. The experiments measure a behavioural
treatment effect: constraint content in, verification rate out. No probe reads
the model's assessment of marginal informational value. The section title
*"What makes a memory look already resolved?"* embeds the same unmeasured claim
in the table of contents.

### M3. The paper treats lower verification as a deficiency when, on its own
evidence, it may be correct behaviour.

Every arm in every experiment states a constraint that is **true**. Declining to
spend a scarce credit re-deriving a true, already-stated constraint is not a
failure; it is arguably good triage. Yet §7 says allocation is *"distorted"* by
the memory's form, and §6 speaks of *"the allocation vulnerability."* The
condition that would make low verification unsafe --- a constraint that is
stale, false, or would be overturned by its own source --- is **not run
anywhere**, as §7 itself admits. The paper's normative vocabulary outruns its
design.

### M4. The scheduler contrast claims a normative fact the paper cannot supply.

§7 says retrieval relevance and verification priority *"have different right
answers."* Establishing a right answer requires a corruption prior, a
future-context distribution and a loss model. The paper has none. The defensible
version is that the two need not induce the same ranking.

### M5. The vocabulary of degradation is not stable, and §6 depends on the
distinction it blurs.

*Caveat*, *constraint*, *qualifier*, *quantified negative*, *scope restriction*,
*prohibition* and *negative content* are used interchangeably. In §6 they come
apart decisively and the paper does not have the words to say so cleanly:
recomputing from `workshop/runs/exp5-v2` and `exp5-scores`, the quantified
negative is present in **60/60 chains at every one of the six generations**, the
scorer's *qualifier stated* judgment falls **100 → 83%**, scope restrictions
fall **100 → 61%**, and explicit prohibitions fall **48/60 → 25/60**. The
headline 0/360 applies only to *complete negative deletion*. A hurried reader
will take it to mean nothing important eroded, which is the opposite of what the
same experiment shows.

### M6. The scorer is not independent of the systems it scores, and only one
direction of its error is validated.

The frozen scorer is **`claude-opus-5`** --- which is also one of the six
consolidator models. The paper reports *"0/720 false positives"*, which is
specificity, computed on `memory_86` and `memory_91`, the two records carrying
no qualifier. Sensitivity is never reported, no manual validation is recorded,
and the scorer's non-independence is never mentioned. (In the scorer's favour,
which the paper also fails to state: at generation 1 it recovers the qualifier
in **240/240** rows where the source has one, and the *quantified negative*
claim is deterministic keyword detection, not a model judgment.)

### M7. The blanket pre-registration statement is stronger than the record.

Setup: *"Every experiment below is pre-registered before its first model call."*
Verified: true for the six experiments whose preregistrations I could time. But
`workshop/PREREGISTRATION.md` carries **three amendments**, two of them written
after a pilot; `PREREGISTRATION-EXP6.md` carries **22**; Experiment 5b was
exploratory throughout. The sentence as written invites a reviewer to check, and
what they find is more nuanced than the sentence.

### M8. Experiment 10's arm structure is opaque, and the two denominators differ
without explanation.

The abstract says 31.9 points over 1,440 episodes; the experiment ran 1,680. The
240-episode bridge cell is excluded because it has no constraint level, and
"constraint retained" **pools two levels** (`negative` and `prohibition`), which
is why the denominators are 480 and 960 rather than balanced. None of this is
stated. It reads as a balanced binary RCT and is not one.

### M9. Novelty is under-positioned against selection-integrity work.

`refs.bib` contains **`fei2026selection`** (arXiv:2606.12290), on integrity of
the selection layer when provenance of individual records is intact --- the
closest adjacent framing in the bibliography --- and the paper **does not cite
it**. Two further entries, `tan2026agentchaos` and `sun2026memory`, are also
uncited. Meanwhile the related-work sentence *"Both assume the record will be
consulted when it matters"* is too broad given exactly that literature, and the
introduction's *"a scheduling decision that no current architecture makes
explicitly"* is an absolute claim about all architectures.

### M10. Model heterogeneity is handled well and must not slip.

Per-model constraint effects run −8.8 to +91.2; excluding `claude-opus-5` and
`gpt-5.6-sol` the effect is +7.8 primary and +13.4 replication, with
`claude-haiku-4-5` at +3.8 in both runs. The paper says this in three places.
It must not be softened, and the pooled magnitude must never appear without it.

## Minor concerns

- **Figure 2's y-axis starts at 50**, making a 100→61% decline look like a
  collapse. For retention percentages this is misleading; use 0--100.
- Figure 1's caption is a dense paragraph; the panels should be readable in
  twenty seconds without it.
- *"\citet{yang2026hetero} report"* --- single author, should be *reports*.
- The abstract carries eleven quantitative anchors (84.7, 44/79, 71/71, −3.3,
  p=0.56, −46.0, 31.9, 1440, 139/150, 3/150, 0/360). A workshop abstract should
  carry three or four.
- The abstract and the findings bullets restate the same numbers; one of them
  should carry the conceptual arc instead.
- Methods are thin for the central result: the main text never names the six
  models, the per-cell episode count, the reasoning-effort setting, the retry
  policy, or the randomisation unit. At 8 of 9 pages there is room.
- *"hundreds of consolidated beliefs"* motivates a six-memory experiment. Fine
  as motivation, but the gap should be named once.

## Questions for authors

1. Can any stored data separate plan state from topical salience? If not, why
   does the abstract claim the former?
2. What is the scorer's sensitivity, and does its overlap with the consolidator
   pool bias the erosion series?
3. Why is `fei2026selection` in the bibliography but not the paper?
4. Is any arm's stated constraint false or stale? If none, on what basis is
   reduced verification described as a vulnerability?
5. What exactly does the pre-registered pooled estimand in Experiment 10 weight?

## Reproducibility

Strong, and better than most workshop submissions I review. Preregistrations,
analysis scripts and every episode file (prompts, seeds, raw responses, scoring)
are retained; macros are generated from the data so no printed number is typed
by hand. **But the main text alone is not sufficient to reproduce the central
result** --- model identities, settings and per-cell counts are absent.

## Novelty assessment

Moderate to high on the object of study, low if read as a demonstration of
confirmation bias in language models. The paper cites Wason and Klayman--Ha and
does not adequately distinguish itself from them: the new thing is not that
agents seek confirming evidence, it is that **verification of inherited
provenance is a scarce resource whose allocation is measurable, manipulable, and
consequential downstream**. That sentence is not in the paper.

## Causal-identification assessment

Two halves identified separately and correctly labelled as such. The upstream
half identifies a plan-assignment intervention, **not** plan state (M1). The
downstream half is clean but close to tautological --- inserting contradicting
evidence into an agent's context changes its decision --- and its role should be
to close the practical consequence, not to be a discovery.

## Ecological-validity assessment

Weak, and honestly so. Six memories, one to three credits, synthetic scenarios,
one world for the mechanism experiments, structured JSON output. The allocation
signature is replicated across 16 models and two further worlds, which helps.
The gap between "hundreds of beliefs" and six is the one a reviewer will name.

## Overall score: **5 / 10** (borderline, leaning reject in current wording)

The evidence would support a 7. The wording does not. M1 alone --- an abstract
claiming causal identification of a construct the design cannot separate from
its confound --- is a standard rejection trigger, and M2, M3 and M4 compound it
by asserting mechanism, normativity and optimality the experiments do not reach.
Every one of these is a **wording** defect over sound data.

## Confidence: **4 / 5**

I recomputed the numbers and read the preregistrations, the analysis scripts and
the stored episodes. I am not certain about the 2026 related-work landscape.

## What would change the score

- **To 7:** fix M1 everywhere the claim appears, including the abstract and the
  title's defence; replace M2's mechanism language with behavioural language;
  drop M3's normative vocabulary or earn it; soften M4; add M5's taxonomy; state
  M6's scorer limitations; qualify M7; make M8's arm structure explicit.
- **To 8:** additionally cite and distinguish `fei2026selection`, sharpen the
  novelty sentence, restore enough methods to reproduce from the main text, and
  fix Figure 2's axis.
- **Above 8:** run the discriminating cell for M1 (topic named, discretion
  denied) or the stale-constraint cell for M3. Neither is required for this
  venue; both would move this from a good workshop paper to a strong one.
