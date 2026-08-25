# PALM revision plan — rebuild the argument around what survived

Deadline **2026-08-30 20:59 JST**. Current PDF is **10 pages**; the limit is 9.
Checkpoint of the submitted PDF and every body file is on disk at
`workshop/paper/frozen-pre-exp10/` (not committed: `workshop/paper` is
gitignored by standing instruction, and the workshop paper is deliberately not
in the public repository).

The repository is the scientific record. This paper is the argument.

## 1. Audit against the claim ledger

The paper predates Experiments 7--10. Three things are wrong with it, in
descending severity.

### 1a. It headlines a claim that has since been falsified

`body-qualifier.tex:98` is a paragraph literally titled **"Silence is stealthier
than qualification"**, asserting that an irrelevant hedge draws more
verification than a silently deleted caveat, at `\FourNeutDriftPreDiff` points
on a pre-registered randomised contrast.

Experiment 8 was run to test exactly this and **falsified it**. With a
same-length non-hedging clause as the control, `hedge` 66.7% against `padded`
70.0% = **−3.3 points, p = 0.56**. The entire gap the paper reports was body
length and the existence of a second clause (`padded` − `drift` = **+16.0**).

This claim appears in **four** places: the abstract (`paper.tex:45--46`), the
contribution list (`paper.tex:101--102`), the section paragraph
(`body-qualifier.tex:98--109`), and panel (a) of the mechanism figure
(`fig-mech.tex:6--26`), whose x-axis has an `irrelevant hedge` bar carrying the
ordering.

### 1b. It omits both of the paper's strongest results

Neither **Experiment 7** (+84.7 points, `intended_action` removed from the
schema) nor **Experiment 10** (+31.9 over 1,680 episodes with a registered
independent replication) appears anywhere. The paper's own contribution list
concedes at `paper.tex:99` that it "identifies the downstream half of the
chain, not the upstream half" --- and Experiment 7 closed the upstream half
after this text was written.

### 1c. It is organised as a research diary

Sections run RQ1, RQ2, RQ3a, RQ3b, scope. Nine pages cannot carry ten
experiments in sequence, and the sequence is not the argument.

## 2. Every passage that must be deleted or rewritten

| location | what it says | action |
|---|---|---|
| `paper.tex:45--46` | abstract: "a memory hedging about something irrelevant is checked more often than one whose material caveat was silently deleted" | **delete**; abstract rewritten last |
| `paper.tex:44--45` | abstract: "with body length and surface hedging matched, a stated caveat suppresses verification" | **keep the claim, restate** from Exp 8's −46.0 against length-matched neutral, not "surface hedging matched" |
| `paper.tex:101--102` | contribution: "an irrelevant hedge attracts more scrutiny than silent deletion" | **delete the clause**, keep the caveat-suppression half |
| `paper.tex:96--99` | "identifies the downstream half of the chain, not the upstream half" | **rewrite**: Exp 7 now identifies the upstream half |
| `body-qualifier.tex:98--109` | the "Silence is stealthier" paragraph | **delete entirely**, replace with the falsification |
| `body-qualifier.tex:73--75` | "A matched-length qualifier that raises a question without answering it raises verification" | **rewrite**: the `padded` control shows this is length and clause existence, not hedging |
| `fig-mech.tex:6--26` panel (a) | four-bar ordering with `irrelevant hedge` | **rebuild** from Exp 8's five arms including `padded`, or cut for space |
| `body-drift.tex:75` | "our own §qualifier says such a record draws less verification, not more" | **rewrite**: Exp 9 shows the consolidated body behaves like the intact original, not like a stealthier corruption |
| `body-drift.tex:53,69` | frames the negative result as a limitation on the controlled sections | **promote**: this is a threat-model boundary, a finding, not an embarrassment |
| `body-scope.tex` (whole) | Experiment 6's grid at full length | **compress to 3 sentences** inside the allocation section; the grid goes to the long form |

Nothing falsified is merely moved out of sight. The revised main text states
that the hedging interpretation was falsified by our own pre-registered test.

## 3. New structure and page budget

Three headline claims, per the ledger. Everything else is support, boundary or
appendix.

> **C1** Scarce provenance verification is plan-conditioned: exogenously
> changing the working plan redirects which memories are verified, with the
> action field removed from the response.
> **C2** Verification also depends on the memory's semantic state: a
> decision-relevant constraint substantially suppresses checking, surviving
> style and quantification controls and an independent replication, with
> magnitude varying substantially across models.
> **C3** What is recovered causally changes later behaviour --- but the benign
> consolidation process we tested did not produce the omission the controlled
> experiments install.

| § | content | source | pages |
|---|---|---|---|
| 1 | Introduction: provenance availability is not provenance use; three findings stated up front | new | 1.25 |
| 2 | Setup: inherited memories, provenance records, budget $k$, one corrupted record, allocation, later decision | compress current §Setup | 0.75 |
| 3 | **What directs verification?** Exp 7 carries the causal weight; Exp 1 motivates; Exp 6 in three sentences | new + `body-scope` compressed | 2.0 |
| 4 | **What makes a memory look already resolved?** Exp 8 falsifies the hedge reading, establishes −46.0; Exp 10 separates constraint from style and quantification, replicates; heterogeneity adjacent | rewrite `body-qualifier` + new | 2.25 |
| 5 | **Does missing provenance matter later?** Exp 3 randomised availability | `body-causal` compressed | 1.0 |
| 6 | **Threat-model boundary.** Exp 5 and 9: the tested pipeline did not produce the omission | `body-drift` compressed and reframed | 0.75 |
| 7 | Discussion: retrieval relevance vs verification priority, as a design implication | `body-discussion` | 0.5 |
| 8 | Limitations | `body-discussion` §Limitations | 0.5 |
| | Related work: folded into §1 | | 0.25 |
| | **total** | | **9.25 → trim to 9** |

Trim candidates in order: the Exp 6 sentences, the mechanism figure panel (a),
the per-model table in §4 (replaced by a figure), §7 prose.

## 4. Rules carried from the ledger into the writing

- **No "style has no effect."** Experiment 10 does not identify a causal main
  effect of style, because fluent and telegraphic necessarily differ in length
  and other register properties. The defensible statement is that **the
  constraint effect is positive within both registers**, and that we find no
  evidence telegraphic register alone explains the Experiment 9 contrast.
- **No linear length transport.** Experiment 8's +16.0 across a 92-character
  manipulation is descriptive context. The "72 characters ≈ 12 points"
  extrapolation used in the Experiment 10 pre-registration to fix H47's
  interpretation **does not enter the paper as a causal adjustment**.
- **No "the reversal was noise."** Sonnet was the least stable model across
  repeated identical prompts and was the only model whose direction changed
  across the two Experiment 10 runs. Both runs are reported; neither is
  cherry-picked.
- **Heterogeneity is adjacent to C2, not in limitations.** Direction
  generalises; magnitude does not. Never "all models" or "universal".
- **Experiment 5b stays exploratory.** The only defensible wording: an
  exploratory Experiment-5b observation was subsequently reproduced in
  pre-registered Experiment 9.
- **No end-to-end mediation claim.** §5 establishes the downstream causal
  effect of recovered provenance, not a chain from plan through verification to
  harm.
- **No optimal scheduler claim.** The scheduler is a design implication.

## 5. Execution order

1. Write `emit_macros7.py` and `emit_macros10.py` --- **no number is typed by
   hand**; every figure in the paper resolves from stored episode files.
2. Rewrite sections in the order 3, 4, 5, 6, 2, 1, 7, 8.
3. Abstract last.
4. Re-evaluate the title against what survived.
5. Compile, check 9 pages with **no geometry, font or spacing changes**.
6. Inspect every rendered page.
7. Double-blind, references, cross-references.
8. Hostile pass for overclaims inherited from the paper's history.
9. Revision report.
