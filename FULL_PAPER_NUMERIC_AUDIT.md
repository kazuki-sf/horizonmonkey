# Full-paper numeric audit

Generated 2026-08-25 13:56 by workshop/analysis/audit_full_paper.py against paper/output/main.pdf.

| claim | printed | recomputed | source | verdict |
|---|---|---|---|---|
| Exp7 delta | 84.7 | 84.7 | runs/exp7 | PASS |
| Exp1 aligned | 236/236 | 236/236 | runs/paper | PASS |
| Exp1 misaligned | 464/784 | 464/784 | runs/paper | PASS |
| Exp6 on-path | 3026/3077 | 3026/3077 | runs/exp6 | PASS |
| Exp8 hedge-padded | -3.3 | -3.3 | runs/exp8 | PASS |
| Exp8 caveat-padded | -46.0 | -46.0 | runs/exp8 | PASS |
| Exp10 total/contrast | 1680/1440 | 1680/1440 | runs/exp10* | PASS |
| Exp10 removed | 303/480 | 303/480 | runs/exp10* | PASS |
| Exp10 retained | 300/960 | 300/960 | runs/exp10* | PASS |
| Exp10 pooled | 31.9 | 31.9 | runs/exp10* | PASS |
| Exp10 primary/repl | 29.2/34.6 | 29.2/34.6 | runs/exp10* | PASS |
| Exp10 fluent/telegraphic | 40.6/23.1 | 40.6/23.1 | runs/exp10* | PASS |
| Exp10 prohibition inc | 18.3 | 18.3 | runs/exp10* | PASS |
| Exp3B corrupted-direction | 139/150->3/150 | 139/150->3/150 | exp3b-v1 | PASS |
| Exp3B unguarded | 39/150->0/150 | 39/150->0/150 | exp3b-v1 | PASS |
| Exp5 complete deletion | 0/360 | 0/360 | exp5-v2 | PASS |
| Exp5 target qualifier | 100,100,100,97,92,83 | 100,100,100,97,92,83 | exp5-scores | PASS |
| Exp5 scope qualifier | 100,100,96,83,73,61 | 100,100,96,83,73,61 | exp5-scores | PASS |
| Exp5 prohibition | 80,55,43,52,48,42 | 80,55,43,52,48,42 | exp5-v2 | PASS |
| Exp9 risky action | 0/150,0/150,28/150 | 0/150,0/150,28/150 | runs/exp9 | PASS |
| Exp9 23%/61%/-38/-30 | 23/61/-38.0/-30.0 | 23/61/-38.0/-30.0 | runs/exp9 | PASS |
| stability flips | 32/127 | 32/127 | exp9-sens | PASS |

22/22 recompute exactly; * = value matches but token not independently located in PDF text
