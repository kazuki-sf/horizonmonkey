# Full-paper hostile review — verdict and resolutions

A skeptical TMLR-style review of `paper/output/main.pdf`, run against the claim
ledger and the stored episode files, with ~25 printed numbers independently
recomputed from raw episodes (all exact, including CMH statistics to the
decimal). Scores below are the reviewer's; the resolution column records what
was changed in response before the venue builds were frozen.

## Scores

| dimension | score | one-line justification |
|---|---|---|
| Correctness | 9 | every recomputed number reproduces exactly; faults were disclosure-level |
| Clarity | 7 | disciplined but caveat-dense; question-headed sections |
| Novelty | 6 | verification-allocation framing + manipulability, honestly sized |
| Empirical rigor | 8 | prereg, replication, error accounting, full recomputability |
| Causal identification | 7 | clean randomisation, every boundary stated |
| Robustness | 6 | direction survives; magnitudes swing 100 points across models |
| Ecological validity | 4 | six memories, one scenario family, only-true constraints |
| Reproducibility | 9 | verified independently, not trusted |
| Significance | 6 | boundary result honestly shrinks the paper's own threat model |
| **Overall** | **leaning accept** | claims-supported standard met; conditions below |

## Reviewer conditions, and what was done

| finding | resolution |
|---|---|
| A 17th registered model (`nvidia/nemotron-3.5-lightning`) was dropped (rate-limit stall, below the pre-registered 20-episode floor, outcome-independent) and the manuscript never said so | disclosed in §3, with the rule and that the partial data are outcome-consistent |
| "one pre-registered independent replication" in the abstract reads as an independent team | now "one pre-registered replication run on disjoint seeds, opened only after the primary analysis was committed" |
| §6 led with the unregistered raw −38.0 before the registered −30.0 | the registered primary contrast now leads; the raw gap follows |
| Scorer sensitivity validated only on near-verbatim generation-1 bodies, not the compressed bodies where erosion is claimed | confound stated in §6; the keyword series is flagged as immune to it |
| Fig 2 caption cited the scorer's specificity without naming it as a consolidator model | scorer identity added to the caption |
| "falsified" over-states the power of a −3.3 ± ~10 null | heading and abstract now say the effect "did not survive its own control" / is "unsupported and withdrawn"; the confound identification (+16.0) carries the withdrawal |
| Secondary contrasts (−10.4 bridge, +18.3 prohibition, +16.7 positive) interpreted under the paper's own replication standard | §4 now states the prohibition increment reproduces in both runs (+15.8/+20.8) and the bridge's sign does (−12.5/−8.3); the positive-elaboration contrast is flagged as having no replication run |
| "ten pre-registered experiments" not reconstructible; only six have verifiable timing | abstract now says "ten experiments whose confirmatory contrasts were pre-registered before their first model call" |

## Attacks that found nothing (after genuine attempts)

Bundling disclosure adjacent to every 84.7; heterogeneity adjacent to every
31.9; no normative smuggling (every "harmful" is conditional); §6 is not taped
together (the Exp 9 natural bodies ARE the chain outputs, matched verbatim);
non-monotone prohibition series printed in full; ecological gap named in §2's
opening sentence; H32 breach reported as a breach; Fig 1(b)/Fig 2 coordinates
match recomputation; cross-references all resolve.

## Standing objections no wording can fix (recorded, not papered over)

1. **Same-day, self-certified pre-registration.** Experiments 7–10 were
   designed, registered, run and analysed by one author-agent within a single
   day. Registration minutes before execution constrains within-experiment
   flexibility, not the adaptive path across experiments; Appendix D disclosure
   is the available mitigation.
2. **The safety-motivating case is untested.** No false/stale constraint arm
   exists, so the paper measures allocation and cannot speak to allocation
   *quality*. Named as U2; the discriminating design is in
   `NEXT_DECISIVE_EXPERIMENTS.md`, not run.
3. **Fragility of small contrasts** under a 25% identical-prompt flip rate;
   only the main constraint effect has a replication run.
