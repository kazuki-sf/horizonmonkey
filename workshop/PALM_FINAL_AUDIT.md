# PALM final audit

Paper: 8 content pages + references (9 total), limit 9. 0 overfull boxes,
0 undefined references, 0 unresolved macros, 0 identifying strings in text or
PDF metadata, 15 rendered references, no geometry/font/spacing change.

133 macros expand in the paper; `emit_macros710.py` regenerates
byte-identically from `runs/`, so no printed value is stale or hand-typed.

## Final headline claims

**C1.** Exogenous working-plan assignments causally redirect scarce provenance
verification: **+84.7 points**, with `intended_action` removed from the response
schema so the agent cannot narrate its choice, positive in 6 of 6 models. *The
assignment names its own topic, so this identifies the intervention and not
internal plan state as distinct from topical salience.* Both sentences appear
together in the abstract, the contribution bullet and §3.

**C2.** A decision-relevant constraint substantially suppresses verification:
**−46.0 points** against a length-matched neutral clause, and **+31.9 points**
over 1,440 episodes when numeric content and clause structure are held constant,
with a pre-registered independent replication and positivity within both
registers. **Magnitude varies by an order of magnitude across models** (−8.8 to
+91.2; +7.8/+13.4 excluding two); we claim the direction, not the size.

**C3.** What the agent holds causally changes what it decides:
**139/150 → 3/150**. Upstream and downstream are identified **separately**, not
end to end.

**C4.** The benign 6-generation pipeline we tested never produced complete
negative deletion (**0/360**) --- while scope restrictions fell to 61% and
explicit prohibitions from 48/60 to 25/60 within that same horizon. The
allocation dependence is demonstrated; the natural prevalence of the corruption
that would make it harmful is not.

## Claims weakened

| was | is |
|---|---|
| "Allocation is causally conditioned on the agent's working plan" | "Exogenous working-plan assignments causally redirect it", with the salience bound in the same breath |
| "Verification is plan-conditioned, causally" | "An exogenous plan assignment redirects verification" |
| "A memory whose constraint is already written down gives the agent nothing to recover" | behavioural statement, plus an explicit identified / consistent-with / not-identified split |
| §4 titled "What makes a memory look already resolved?" | "How does memory content change verification?" |
| "allocation is distorted by the memory's form" | "also depends on the memory's content" |
| "the allocation vulnerability is real" | "the allocation dependence is real" |
| retrieval and verification "have different right answers" | "need not induce the same ranking", with the loss model we lack named |
| "we make no claim about what an optimal scheduler would do" | we could not identify one: no corruption prior, no future-context distribution, no loss model |
| "Every experiment is pre-registered before its first model call" | confirmatory experiments and primary contrasts are; amendments and exploratory analyses are labelled in the record |
| "0/720 false positives" as scorer validation | specificity 0/720 **and** sensitivity 240/240, plus: the scorer is `claude-opus-5`, one of the six consolidators, so not independent; no human validation |
| "no current architecture makes this explicitly" | "rarely treated as a distinct control problem" |

## Claims removed

- "Silence is stealthier than qualification" and the hedging effect --- falsified
  by our own pre-registered length control (−3.3, *p* = 0.56), stated as a
  falsification in the main text rather than deleted quietly.
- "The natural failure mode is harder to catch than the original" --- §6 now says
  we cannot tell, and declines to interpret the −1.3.
- "Verified less because the agent already ruled the action out."
- "Telegraphic register explains it" and "an unquantified claim invites
  verification" --- both tested in Experiment 10, both refuted, the second with
  its sign reversed.
- Any suggestion that ordinary consolidation produces the installed corruption.

## Remaining potentially fatal reviewer objections

1. **The plan effect may be topical salience.** Not repairable by wording ---
   only by the discriminating arm, documented in
   `POST_PALM_DECISIVE_EXPERIMENT.md` and deliberately not run. The paper states
   the boundary in all three places the claim appears. A reviewer may still hold
   that the title over-promises. **This is the objection most likely to sink the
   paper, and it is honestly disclosed rather than hidden.**
2. **No arm tests a constraint that is false or stale.** Every constraint is
   true, so lower verification may be correct triage. §7 says so explicitly. A
   reviewer may conclude the safety framing is not yet earned. It is the more
   important of the two open experiments.
3. **Two of six models carry most of C2's magnitude.** Stated beside every
   pooled figure, in the figure, and in limitations.

## Remaining non-fatal limitations

Six memories against production stores of hundreds, named once in Setup;
synthetic scenarios; one world for the mechanism experiments; prompting and
structured-output dependence; 25.2% episode-level flip rate on byte-identical
prompts, reported as a reason small effects need replication and **not** as a
universal floor; the scorer's non-independence; no evaluated scheduler; the
downstream result is strong but close to tautological and is positioned as
closing a consequence rather than as a discovery.

## Novelty positioning

The contribution is not that language models seek confirming evidence; Wason and
Klayman--Ha are cited and the paper says explicitly that it does not claim that
finding restated. The new object is that **verification of inherited provenance
is a scarce resource whose allocation is measurable, exogenously manipulable,
and consequential for the agent's later decision** --- something that exists only
once memory persists across sessions and a budget forbids re-deriving all of it.
Against the nearest neighbour, `fei2026selection` on selection-layer integrity,
the boundary is stated: their threat is what retrieval puts in front of the
agent, ours is which of the records already in front of it the agent chooses to
re-derive.

## Suggested reviewer score

**7 / 10, confidence 4 / 5.** The pre-Phase-1 review scored this 5, leaning
reject, on wording over sound data; all four blockers and every major item are
fixed. It is not an 8 because objections 1 and 2 are real and open, and closing
either requires an experiment this revision deliberately did not run.

## Submission status

**READY TO SUBMIT.**

I would defend every sentence under hostile questioning, including the two open
objections, which the paper states rather than conceals.

**One action item before upload:** if a supplementary bundle is attached, it must
be a **blinded snapshot**, not a link to the repository --- the repository's
commit metadata carries the author's name. The PDF itself is clean: no
identifying strings in the rendered text or the metadata.
