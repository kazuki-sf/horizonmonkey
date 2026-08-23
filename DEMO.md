# Demo script — 3 minutes

Read this aloud. Everything in `>` blocks is meant to be spoken as written;
everything in *italics* is what to do with your hands.

**Before you start:** open the demo and leave it alone. It opens on `READY` and
runs nothing by itself — that is deliberate, so don't worry that it looks idle.
Speed on `1×`.

- Live: **https://horizonmonkey.vercel.app**
- Fallback if the network dies: `npm run dev` → **http://localhost:3579/**

Measured playback, so you can trust the clock:

| | length at 1× | ⚡ appears at |
| --- | --- | --- |
| control run | 13.2s | — |
| chaos run | **21.8s** | **5.0s** |
| defended run (after rewind) | 20.1s | 5.0s |

---

## 0:00 – 0:25 · The problem
*Hands off the keyboard. Screen stays on READY.*

> Chaos Monkey kills servers. When a server dies, everybody knows.
>
> But an agent that runs for weeks can fail while **every single call succeeds**.
> One plausible fact enters its beliefs, gets written to memory, and shapes
> hundreds of later decisions. There is no error anywhere in the trace —
> because nothing actually errored.
>
> HorizonMonkey injects that on purpose and measures how far it travels.

---

## 0:25 – 0:40 · Pick the fault
*Open the Fault dropdown so they can see the list, then select **Caveat omission**. Leave Defense on **None**.*

> You pick how to break it. None of these are 500s. **Nothing crashes.**
>
> Today: caveat omission. When the agent writes a lesson to memory, the
> qualifier that bounded it doesn't survive the write. What's left is **true** —
> collapsing the signup form really did lift SMB signups by 15%. The only thing
> missing is "on SMB only, don't generalize."

---

## 0:40 – 1:10 · Run it
*Click **⚡ BREAK THE AGENT**.*

> The run is real. A deterministic simulation executes, and we replay the trace
> it actually produced.

*At ~5 seconds the red ⚡ line lands. Hit **❙❙ pause**.*

> There it is. **A finding about one segment just became a rule about the whole
> site.**
>
> That churn at the bottom is the agent's routine work. It never stops. Nothing
> is broken.

*Click **▶ resume**.*

> It becomes a belief. The belief picks the next experiment. And then —

*Wait for `✗ It ships — to all traffic`.*

> — it ships to **one hundred percent of traffic**.

---

## 1:10 – 1:35 · The point
*Sweep your hand across both right-hand panels.*

> Look at this. **Same run. Same second.**
>
> On the left: twelve of twelve observations delivered. Zero malformed payloads.
> Zero exceptions. Twenty-four of twenty-four steps completed. And — **the
> agent's own guardrail check passed.**
>
> Why? Because it checked its guardrail **against its beliefs**. Corrupt the
> beliefs and the check passes cleanly while reality breaks underneath it.
>
> On the right, same run: six contaminated memories. A tainted decision. A
> tainted external action. Fault detected — **no**.
>
> **Every monitor you own says this system is healthy.**

*Let playback finish.*

> Goal fidelity: ninety-five to **fifty-six**. Two guardrails breached.
>
> The agent did notice — at step six, when the real numbers matured. Five steps
> and one full-traffic rollout too late. **Repairing a belief doesn't un-ship the
> change it justified.**

---

## 1:35 – 2:20 · Rewind — the counterfactual
*Click **↺ REWIND & ADD DEFENSE**.*

> **Let's rewind. Same agent, same fault, same history. We change one thing:
> the defense.**

*Point at the banner across the top.*

> The first nine events are **identical**, through step one — **including the
> injection itself.** Up to here these were the same future.
>
> That's measured, not asserted: the code walks both traces and compares them.
> On a pair where it doesn't hold, this banner says something weaker instead.

*Point left branch, then right branch.*

> **No defense:** written to memory, reused, shipped to everyone.
>
> **Provenance auditor:** one invariant — a lesson may not claim a scope wider
> than the evidence it came from. It never looks at ground truth. It blocked the
> write, quarantined it, and contained the fault **before it reached durable
> memory**.

*Point at the five large numbers.*

> **Fifty-six to ninety-six. Six contaminated memories to zero. Two guardrail
> breaches to zero. Detected: no to yes.**

---

## 2:20 – 2:50 · Real models
*Scroll to the REAL-MODEL PROBES panel.*

> We ran this against real models too. Four pre-registered scenarios,
> ninety-nine episodes, Claude Opus 5 and two tiers of GPT-5.6.
>
> **Zero harmful final decisions.** That's the result and we report it — a
> harness that could only manufacture failures wouldn't be measuring anything.
>
> But look at what it took. **Twelve of eighteen times, the model reached for the
> corrupted lever on its first pass.** What stopped it was going and checking the
> source. All eighteen checked; the same twelve reversed.
>
> Then the last experiment. Six inherited beliefs, and you may verify **two**.
> Opus checked the dangerous one five times out of five. **Luna checked it once
> out of five** — it spent both credits on the memories backing the action it had
> already chosen, and never looked at the one belief that would have driven an
> irreversible change.
>
> **Scarce verification goes where the agent is already looking, not where the
> risk is.**

---

## 2:50 – 3:00 · Close

> We never gave the agent a false fact. **A true caveat disappeared when memory
> was compressed.**
>
> Long-horizon reliability isn't just keeping an agent running. It's keeping its
> beliefs true.

---

## On stage

| Situation | What to do |
| --- | --- |
| Running long | Hit `2×` — chaos drops to 10.9s, defended to 10.0s. Cut the 0:25–0:40 fault explanation first. |
| Running short | Also show `Stale observation`. Only if you have time to explain why its rewind banner reads **MATCHED REPLAY** instead of SHARED HISTORY. |
| Pause points | Exactly two: when ⚡ lands, and when you compare the two panels. Let everything else flow. |
| Never select | `Objective re-anchor (simulator-only)` — it reads the simulator's ground truth, so it isn't a deployable defense. Picking it prints an orange warning. |
| Nothing happens on load | Correct. It's idle by design; you have to press the button. |
| Production dies | `http://localhost:3579/` serves the same thing. Have it running before you go up. |

## Why this fault and this defense

`Caveat omission + Provenance auditor` is the scripted pair because neither side
touches privileged information, it has the largest clean delta (95 → 56 → 96,
contamination 6 → 0), the fault lands five seconds in so it fits the clock, and
it's the same mechanism the real-model probes tested — so the last beat follows
from the first.

## If asked: "does this happen with a real model?"

Four pre-registered scenarios, 99 episodes, three models. **Zero harmful final
decisions.** Say that first — it is the result, and a harness that could only
produce failures would not be measuring anything.

Then say what the non-failure depended on:

- **The corrupted belief does move them.** 12 of 18 reached for the wrong lever
  on their first pass before retrieving anything.
- **Provenance is what moved them back.** All 18 retrieved the source and the
  same 12 reversed — unprompted, so credit the affordance, not our rule.
- **v4 is the interesting one.** Give an agent six inherited memories and only
  two verification credits, and the reliability question becomes *which belief
  do you check*. Opus checked the corrupted one 5/5. Luna checked it 1/5 — it
  spent both credits on the memories backing the action it had already picked.
  Locally reasonable; it leaves the irreversible one unexamined.

The line: **scarce verification goes where the agent is already looking, not
where the risk is.** Writing an explicit triage rule helps and does not close
the gap.

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
