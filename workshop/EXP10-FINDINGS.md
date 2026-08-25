# Experiment 10 — syntax × constraint, with quantification held constant

840 episodes, 7 cells, 6 models, 6 wording families, **0 errors**, 0 episodes
naming no memory. Registered in `PREREGISTRATION-EXP10.md`, committed with the
frozen slot grammar and the frozen analysis before the first call.

Rescoring all 840 raw responses independently of the stored fields gives **0
disagreements**, and no episode named more than two ids, so the budget cap
never discarded anything.

## The question this was built to answer

Experiment 9's gap confounded four things. This design holds **quantification
constant** (every cell carries exactly three numeric claims and three clause
slots), matches length **within** syntax to at most 16 characters, and varies
only syntax and the constraint.

**The Experiment 9 gap survives with style held constant.**

| | removed | retained | effect |
|---|---|---|---|
| **fluent** | 82/120 = 68.3% [60, 76] | 72/240 = 30.0% [25, 36] | **+38.3** |
| **telegraphic** | 61/120 = 50.8% [42, 60] | 74/240 = 30.8% [25, 37] | **+20.0** |

**H46 primary: +29.2 points** pooled (240 against 480), CMH stratified by model
χ² = 70.9. Registered threshold +15. **Supported**, and at essentially the full
magnitude of Experiment 9's 26–30.

## What did not survive

**Syntax does not independently move verification.** H47 is **−5.3 points**
(telegraphic minus fluent), and length alone predicts about −12 from the 72
characters the register costs. The estimate sits inside what length already
explains, so per the pre-registration it is **not declared**. Telegraphic
phrasing is not what suppressed verification in Experiment 9.

**Quantification does not explain it either, and the sign is backwards.** The
bridge cell carries Experiment 9's `hand-drift` body verbatim — zero numbers —
and is verified **55.8%**, against **68.3%** for the matched, quantified
`fluent/removed` cell. That is **−12.5 points**: the *unquantified* body is
verified **less**, not more. The audit's strongest new alternative — that an
unsupported claim invites checking — predicts the opposite direction and is not
supported.

## The heterogeneity, which is the main caveat

H50 passes: the effect is positive in **5 of 6** models. But the magnitude is
concentrated, and this must be read next to the headline:

| model | removed | retained | effect |
|---|---|---|---|
| claude-opus-5 | 95.0% | 3.8% | **+91.2** |
| gpt-5.6-sol | 87.5% | 35.0% | +52.5 |
| gpt-5.6-luna | 27.5% | 5.0% | +22.5 |
| gpt-5.6-terra | 70.0% | 56.2% | +13.7 |
| claude-haiku-4-5 | 12.5% | 8.8% | +3.8 |
| claude-sonnet-5 | 65.0% | 73.8% | **−8.8** |

Excluding `claude-opus-5` the pooled effect is **+16.8**; excluding
`gpt-5.6-sol` it is **+24.5**; **excluding both it is +7.8**, which is inside
the run-to-run variability Experiment 9 measured. Only **3 of 6** models reach
the +15 threshold on their own.

So the honest statement is that the constraint effect is **directionally
consistent and never reverses on wording**, but its size is carried by two of
six models, and one model contradicts it.

**All six wording families show it**, none negative: f1 +14.0, f2 +40.8,
f3 +15.8, f4 +38.3, f5 +31.0, f6 +29.9. No single handcrafted sentence drives
the result.

## Which part of the constraint

H49: `negative` 38.3% against `prohibition` 22.5% = **+15.8 points**, present
at the registered threshold. Both components suppress; the explicit prohibition
suppresses a further 16 points beyond the quantified negative outcome alone.
This matches Experiment 9's pre-labelled exploratory split, which put bodies
carrying a prohibition at 12.2% against 27.7%.

H48 interaction is **present at −18.3**: the constraint effect is larger in
fluent (+38.3) than telegraphic (+20.0). Both are substantial and both positive,
so the constraint effect is not confined to one register, but it is not equal
across them either.

## Intent

Reported per cell only. It is measured after treatment and is a candidate
mediator; **no contrast is computed on it and no mediation is claimed**, and
Experiment 9's intent-stratified argument is not repeated.

fluent/removed 15.0%, telegraphic/removed 4.2%, bridge 14.2%, and **0.0% in all
four constraint-retained cells**.

## Status

The independent replication of the same 840 episodes is registered and has a
disjoint seed prefix. Per the pre-registration it was **not inspected, analysed
or counted until this analysis had been executed and committed.**
