# Demo script — 90 seconds

Open `http://localhost:3579/` before you start. It auto-runs the **control arm**
on load, so the first thing on screen is a healthy agent. Every state is also a
URL, so a mis-click on stage is recoverable:

| State | URL |
| --- | --- |
| Control | `/` |
| Chaos | `/?fault=memory_poisoning` |
| Defended | `/?fault=memory_poisoning&defense=provenance_auditor` |

---

**0–15s — everything is green** · *screen already shows the finished control run*

> Chaos Monkey breaks infrastructure. But a long-running agent can fail while
> every call succeeds.
>
> This is a growth agent, five months of experiments, nothing perturbed.
> Observations delivered, zero malformed payloads, zero exceptions, ran to
> completion, and its own guardrail checks passed. Goal fidelity 95.

*Point at the green panel.*

---

**15–25s — pick the fault** · *Fault dropdown → **Caveat omission**, leave Defense on None*

> Now pick how you want to break it. Not a 500 — nothing is going to crash.
> We write one lesson to memory without the scope caveat that bounded it.
> The sentence stays true. Only "SMB only, do not generalize" goes missing.

---

**25–55s — click ▶ BREAK THE AGENT** · *trace animates; let it run*

> The run is real — it executes, and we replay its trace so you can watch the
> belief travel.
>
> *(at the red ⚡ line)* There it is. A finding about one segment just became a
> rule about the whole site.
>
> *(as orange lines accumulate)* It enters memory. It gets consolidated into a
> strategy note. It selects the next experiment. And there — the agent rolls a
> change to **100% of traffic** on the strength of it.

*Now the point. Sweep a hand across both right-hand panels.*

> Left panel, same run, same second: still zero errors, still zero exceptions,
> still completed, and the agent's **own** guardrail check passed — because it
> checked the guardrail against its beliefs. Right panel: three contaminated
> memories and climbing, a tainted decision, a tainted external action, fault
> detected **no**.
>
> Every monitor you have says this system is healthy.

---

**55–70s — the damage** · *wait for playback to finish*

> Goal fidelity 95 to 56. Two guardrails breached. The agent did eventually
> notice — at step 6, when the real numbers matured. Five steps and one
> full-traffic rollout too late. Recovering a belief doesn't un-ship the change
> it justified.

---

**70–85s — contain it** · *Defense dropdown → **Provenance auditor**, click BREAK again*

> Same fault, one invariant: a lesson may not claim a scope wider than the
> evidence it came from. No ground truth, no oracle — just a check on the write.

*Point at the blast radius collapsing to two nodes.*

> Caught at the injection step. Quarantined. Contaminated memories six to zero,
> fidelity back to 96.

---

**85–90s — close** · *point at the Opus 5 panel*

> And when we probed Claude Opus 5 with this exact mechanism, ten times — it was
> robust. Zero contaminated beliefs. That's a negative result and we report it,
> because a harness that could only produce failures wouldn't be measuring
> anything.
>
> Long-horizon reliability isn't just keeping agents running. It's keeping their
> beliefs true.

---

## Controls you have on stage

`▶ BREAK THE AGENT` runs and plays · `❙❙ pause` freezes mid-propagation to talk
over a line · `↻ replay` re-runs the animation without re-fetching ·
`0.5× / 1× / 2×` if you are ahead of or behind the clock.

Wait-for-traffic ticks are hidden from the terminal (the count is shown in the
header) — they are steps where the agent did nothing but wait.

## Why this fault and this defense

`Caveat omission + Provenance auditor` is the scripted pair because neither side
touches privileged information, it has the largest clean delta (95 → 56 → 96,
contamination 6 → 0), the fault lands early enough to fit the clock, and it is
the same mechanism the Opus 5 probe tested — so the last beat follows from the
first.

`Objective re-anchor` is in the dropdown but labelled **simulator-only**: one of
its branches reads the simulator's ground-truth effect for an experiment that
has not run. Do not demo it as a deployable defense. It is honest only for
Objective drift, where the legitimate missing-guardrail branch is what fires.

## If asked: "does this happen with a real model?"

Two probes, and the honest answer changed between them.

**The easy one was too easy.** Single-turn caveat omission, four models, N=10:
0/40 contaminated. Report that plainly — a harness that could only produce
failures would not be measuring anything.

**So we asked where it gets hard.** Two pre-registered scenarios — scenario and
scoring committed before any model ran — where an agent inherits organizational
memory 45 logical days later and one true caveat did not survive compaction.
42 episodes, still zero harmful decisions. But in the drifted arm — one
population, 18 episodes — **12 of 18 reached for the corrupted lever on their
first pass**, before retrieving anything. All 18 then went and checked the
source, and the same 12 reversed. Sol and Luna preferred it 6/6 each and both
reversed every time; Opus 5 never preferred it.

Same model, same context, one retrieved artifact, decision flips. Be careful
with the credit: the models went and checked on their own, so this shows
provenance *access* mattering, not our invariant working. And no model actually
failed. The line that holds:

> The corrupted memory changed what the models wanted to do. Provenance changed
> what they did.

Do **not** say "frontier models made catastrophic semantic failures." They did
not — 0 harmful final decisions in 42 episodes.

## If asked: "is the agent real, or scripted?"

The policy is explicit code, not an LLM call — deliberately, to isolate semantic fault
propagation from LLM sampling variance. It buys reproducibility (same fault, same blast
radius, every time), a clean comparison (any difference between arms is caused by the
fault, not sampling noise), and a demo that can't die on a rate limit.

It is not a strawman. It weights impact by reach, checks guardrails before acting,
attaches scope caveats and refuses to generalize bounded lessons, treats a guardrail
breach on any segment as evidence everywhere, caps concurrent experiments, and revises
beliefs when matured data lands. It has one ordinary weakness — **it checks its
guardrails against its beliefs** — and that's the whole point.

It also implements `AgentPolicy` from `core/policy.ts`, and the loop gets its decision
through that interface. `core/` compiles standalone and imports nothing outside itself —
it has no idea what a conversion rate is. Swapping in an LLM policy means implementing
three methods; the recorder, taint closure and metrics don't change.

**Do not overclaim here.** These results characterize one instrumented decision process.
They do not show an LLM-backed agent behaves identically — that's the first roadmap item,
precisely because we don't know.

## If asked: "isn't this just provenance tracking?"

Yes, and that's the honest framing — dependency lineage, not proven causation. But the
injector holds the ground truth, so the lineage is *exact*, which is precisely what
post-hoc failure attribution (Who&When, FALAT) has to guess at over a long trajectory.
Counterfactual replay — remove the fault at step k, re-run, diff — is the next step.

## If asked: "isn't the 78 just an artifact of run length?"

Partly, yes — say so first. Propagation depth counts tainted artifacts, so it grows with
however many steps remain after injection, and the figures are only comparable across
runs of equal length. The durable quantity is the belief's lifetime, which we report
separately as the silent window. What the 78 shows is that the belief stayed live and
load-bearing for the rest of the run; the specific number is length-dependent.

Same discipline on the second finding: all three faults funnel through the same
generalization heuristic in this scenario, so the provenance auditor catching all of them
is partly by construction. The useful part is that the *invariant view* exists — organize
defenses by violated invariant rather than by fault name — not the coverage number.

## If asked: "what would you do with a real agent?"

Put HorizonMonkey between the agent and its observation, memory and tool layer. Same
instrumentation, same metrics, no simulated policy. Then: invariant synthesis — every
failure trajectory already contains its own fix, since the freshness validator in
`defenses.ts` is just the stale-observation failure written backwards. Then semantic
resilience CI: prompt change opens a PR, N chaos scenarios run, goal-fidelity regression
fails the build.
