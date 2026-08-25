# Experiment 9 — the result, and why it does not say what the registration expected

600 episodes, 4 arms, 6 models, 0 errors, 0 episodes naming no memory.
Registered in `PREREGISTRATION-EXP9.md`, committed at `163df50` before any call.

## The registered outcome

| arm | plans the risky action | verifies `memory_73` |
|---|---|---|
| `natural` (consolidated body, median 78 chars) | **0/150** | 34/150 = 22.7% [17, 30] |
| `natural-padded` (same, padded to ~129) | **0/150** | 46/150 = 30.7% [24, 38] |
| `hand-drift` (our constructed corruption, 129) | **28/150 = 18.7%** | 91/150 = 60.7% [53, 68] |
| `intact` (the original, caveat included, 221) | **0/150** | 36/150 = 24.0% [18, 31] |

All five hypotheses pass. H41 primary: `natural-padded` − `hand-drift` = **−30.0
points**, registered threshold −15, CMH stratified by model χ² = 34.0,
p = 5.4e−09, negative in 5 of 6 models. H43: the length control absorbs only
21% of the raw effect, so the gap is not length.

## Why that is not the finding

The registration reads the low natural rate as stealth: *"the corruption that
actually arises is checked less often than the corruption we constructed to
study it."* The intent column, pre-recorded in the scoring section but attached
to no hypothesis, says otherwise.

The consolidated bodies **suppress the risky action completely, and identically
to the intact original** — 0/150 against 0/150 — while our hand-built drift
restores it in 28/150. Verification tracks that exactly: `natural-padded` 30.7%
and `intact` 24.0% have overlapping intervals and are not distinguishable, and
both sit far below `hand-drift`.

So a consolidated memory is verified less than our hand-stripped one **because
it still carries its warning and the agent has already ruled the action out.
There is nothing left to check.** It is not stealthier. It is intact enough to
work.

Reading the bodies makes the point without statistics. Of the 59 distinct
consolidated bodies drawn, 58 retain a quantified negative or a churn or
retention term, and the 59th says renewals stay weak:

- `40% SMB discount: +31% signup, +18% rev short-term, -12% retain, pre-renewal churn. Avoid reuse`
- `40% SMB discount: signup +31%, revenue +18%, but 30-day retention -12%; avoid.`
- `40% SMB discount: rev +18% but retention -12pp, no renewals. Skip.`

Six generations of consolidation shortened the record and made it telegraphic.
It did not remove the constraint.

## What this costs the paper

**Experiment 5b's headline — 22% against 58% — is withdrawn as evidence of a
stealthier natural corruption.** The comparison set a body that still carries
its warning against a body from which we had deleted the warning. The low
number is the warning working.

Per the registration's falsification clause, applied by its intent rather than
its letter, because the clause anticipated H41 failing and not H41 passing
through the opposite mechanism: **the claim that the natural failure mode is
harder to catch comes out, in the abstract, not in a limitation.**

## What survives, and is stronger for it

The mechanism results are untouched. They concern hand-constructed drift and
randomised plans, and none of them depended on Experiment 5b:

- Experiment 7's causal result — an assigned plan moves the single verification
  credit by +84.7 points with `intended_action` removed from the schema — stands.
- Experiment 8's finding — the true caveat suppresses by 46 points at fixed
  length — is **replicated here exactly**: `intact` is 36/150 = 24.0% in this
  run and `true-caveat` was 36/150 = 24.0% in Experiment 8, independent seeds.
  `hand-drift` here is 60.7% against Experiment 8's `drift` 54.0%, within noise.

And the negative result is itself the stronger statement:

> Over six generations of consolidation, in this setting, the safety-relevant
> content survived. The bodies lost length, fluency and scope, and kept the
> number and the prohibition. The failure mode this paper constructs by hand —
> total deletion of the negative — did not arise, and where a body did keep the
> negative it suppressed the risky action as completely as the original did.

That is a claim about a threat model, supported by 360 chain-generations in
Experiment 5 and 300 downstream episodes here, and it is worth more than a
positive result resting on an uncontrolled length comparison.

## Limits, stated plainly

- **Six generations.** Whether the constraint survives twenty is untested. This
  is the obvious Experiment 10 and the honest boundary of the claim.
- **One scenario, one constraint.** The growth world with a single retention
  caveat. Experiment 6 established the allocation result across two worlds and
  16 models; this chain result has not been run that way.
- **H44 passes on a bare sign.** `intact` − `natural-padded` = −6.7 points with
  overlapping intervals. The registration set no threshold for it. It should
  not be quoted as an effect.
- **Register differs.** The consolidated bodies are telegraphic notes; the
  hand-drift is a fluent sentence in the house style of the other five
  memories. The intent column makes this unlikely to be the driver, since
  register cannot explain a 0/150 to 28/150 swing in the planned action, but
  the two are not separated by design.
