# PALM revision plan v2 — acting on the hostile review

Classification: **BLOCKER** could cause rejection or makes a headline claim
inaccurate; **MAJOR** materially improves defensibility; **MINOR** clarity.

## BLOCKER

### B1 — the causal claim names a construct the design cannot isolate
*Current:* `paper.tex:36` "Allocation is causally conditioned on the agent's
working plan"; `paper.tex:87` "Verification is plan-conditioned, causally";
`sec-directs.tex:71` "what the agent is currently trying to do changes which
inherited beliefs it checks".
*Problem:* identifies the plan-**assignment intervention**, not plan state; §3
concedes it cannot separate topical salience. The bound never sits beside the
claim.
*Change:* everywhere, "exogenous plan assignments causally redirect
verification", followed **immediately** by "because the assignment names the
plan's topic, this does not isolate internal plan state from topical salience."
Abstract, bullet and §3 all carry both sentences. **Changes a claim.**

### B2 — title
*Current:* "Plan-Conditioned Verification of Inherited Agent Memory".
*Decision:* **keep**, and defend it in §3. "Plan-conditioned" is a statement
about the conditioning variable in the design --- the assigned plan --- not a
claim that internal plan state is the operative mechanism. It is descriptive of
what was manipulated. The subtitle carries the paper's actual thesis. Adding the
bounding sentence in §3 makes the reading unambiguous; renaming to
"Assignment-Conditioned" would be accurate but opaque. **Wording only.**

### B3 — mechanism language for an unmeasured internal state
*Current:* §4 "gives the agent nothing to recover"; §7 "reads as settled";
§4 title "What makes a memory look already resolved?".
*Change:* behavioural statements throughout. Section title →
**"How does memory content change verification?"**. Add an explicit
identified / consistent-with / not-identified split. **Changes a claim.**

### B4 — normative vocabulary the design does not earn
*Current:* §7 "distorted"; §6 "the allocation vulnerability is real".
*Problem:* every arm's constraint is **true**; declining to re-derive a true
stated constraint may be correct triage. No stale or false constraint is tested.
*Change:* "allocation dependence"; state that lower verification of a true
constraint is locally sensible and becomes a problem only when present
relevance and future expected loss diverge. **Changes a claim.**

## MAJOR

### B5 — the scheduler contrast claims a right answer
*Current:* §7 "These have different right answers."
*Change:* "need not induce the same ranking", and say plainly that identifying
the right ranking would require a corruption prior and a loss model we do not
have. **Changes a claim.**

### B6 — degradation taxonomy
*Change:* a four-term definition list in §6 --- negative outcome, scope
constraint, prohibition, complete negative deletion --- and bind 0/360 to
*complete negative deletion* explicitly, everywhere it appears. **Wording, but
it prevents a misreading of the headline.**

### B7 — scorer validation and independence
*Change:* report sensitivity (240/240 at generation 1) alongside specificity
(0/720); state that the scorer is `claude-opus-5`, one of the six consolidators,
so it is **not independent**; state that the quantified-negative claim is
deterministic keyword detection rather than a model judgment; state that no
manual validation was performed. **Adds a limitation and a supporting fact.**

### B8 — pre-registration statement
*Current:* "Every experiment below is pre-registered before its first model
call."
*Verified:* prereg commits precede first episode files by 9--355 s for all six
timed experiments. But `PREREGISTRATION.md` carries 3 amendments and
`PREREGISTRATION-EXP6.md` 22; Experiment 5b was exploratory.
*Change:* "Confirmatory experiments and their primary contrasts are
pre-registered before the first model call, with the analysis committed in
advance; amendments and exploratory analyses are labelled as such in the
record." **Weakens a claim to what is true.**

### B9 — Experiment 10 arm structure
*Change:* state total 1,680 = 6 factorial cells x 240 + a 240-episode bridge
cell; that the bridge has no constraint level and is excluded from the contrast;
that "retained" **pools two levels**, hence 960 against 480. **Clarity, prevents
a fair objection.**

### B10 — novelty positioning and related work
*Change:* cite and distinguish `fei2026selection`; state the novel object in one
sentence and separate it from the positive-test literature; replace "no current
architecture makes explicitly" with "rarely treated as a distinct control
problem"; qualify "Both assume the record will be consulted". Fix
"\citet{yang2026hetero} report" → "reports". **Wording + one citation.**

### B11 — methods sufficiency
*Change:* name the six models, per-cell episode counts, reasoning-effort
setting, retry and error policy, randomisation unit, the primary outcome
definition, Wilson intervals and CMH stratification. Room exists at 8 of 9.

## MINOR

### B12 — Figure 2 y-axis 50→0. **Presentation, removes a fair "misleading
axis" objection.**
### B13 — abstract: cut to four quantitative anchors; move the falsification
story to a clause without its statistics.
### B14 — remove the abstract/bullet duplication; bullets carry claims, abstract
carries the arc.
### B15 — name the hundreds-vs-six gap once, in Setup.
### B16 — Figure 1 caption shortened; panels legible unaided.

## Not doing

- **No new experiment.** The discriminating cell for B1 and the stale-constraint
  cell for B4 are documented in `POST_PALM_DECISIVE_EXPERIMENT.md` and not run.
- **No geometry, font, margin or spacing change.**
- **No softening of model heterogeneity.** It stays beside every pooled figure.
- **No claim that Sonnet's reversal was noise.**
