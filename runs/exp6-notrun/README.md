# Episodes kept but not analysed

`nvidia/nemotron-3.5-lightning`, 68 episodes and 10 failures.

The run did not complete. Its failures were dominated by HTTP 429 from the
upstream provider rather than by anything the model produced, and after backing
off hard on 429 the run stalled: no new episode for ten minutes, with an
isolated diagnostic call refused with 429 as well.

Its intent-aligned cell holds 9 episodes, below the 20-episode floor that
workshop/PREREGISTRATION-EXP6.md fixed for H28 before any data existed, so it
would not have been evaluated in any case.

These files are kept for the record and are deliberately outside `runs/exp6/`
so no analysis picks them up. See Amendment 11.
