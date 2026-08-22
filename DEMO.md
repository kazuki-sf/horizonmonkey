# Demo script — 90 seconds

Have the app open at `http://localhost:3579/?fault=stale_observation` before you start.
Every state is a URL, so nothing depends on clicking correctly under pressure.

---

**Open (15s)** — *don't touch the screen yet*

> A server fails loudly. 500, timeout, crash — everything above it knows.
>
> Long-horizon agents fail quietly. Every call returns 200, every payload validates,
> and something slightly wrong enters the belief set. Twenty steps later the agent
> confidently ships the wrong thing, and nothing in the trace looks like an error —
> because nothing was one.

---

**The fault (20s)** — *point at the right-hand panel*

> This is a growth agent running five months of experiments. Its objective is qualified
> revenue, with a hard guardrail: retention can't drop more than 3%.
>
> We inject one fault. The analytics cache serves a day-2 snapshot as a completed
> 30-day result. Look at the two boxes — every number on the right is real. Retention
> just hasn't churned yet. A 40% discount reads as a clean win.
>
> Nothing here is malformed. There's no attacker. This is a Tuesday.

---

**The propagation (25s)** — *point at the trace, then the tree*

> The trace is scrolled to the injection point. Step 5: the fault. Step 5: it becomes a
> lesson. And because the result looks strong and fully matured, the agent promotes it
> from "worked on SMB" to a general rule.
>
> That's the door. This agent has a hard rule that an untested change never goes to all
> traffic — you test on a segment, you roll out once you believe it works. Which means
> the only route to a full-traffic rollout runs through the belief set.
>
> Step 5, it rolls a site-wide 40% discount to 100% of traffic. Goal fidelity: 95 to 72.
> Retention, in reality, down 12%.

---

**Recovery is not undo (10s)**

> The agent does correct itself — at step 10, when the real numbers finally mature. Five
> steps and one site-wide rollout too late. Recovering a belief doesn't un-ship the
> change it justified.

---

**The defense (15s)** — *click "Harden against this fault"*

> One invariant: don't promote a reading to durable memory until its slowest metric has
> matured — and check when the aggregate was *computed*, not what the readout claims.
>
> Caught at the injection step. Contaminated memories: two to zero. Fidelity back to 96.

---

**Close (15s)** — *click "Caveat omission", then "Objective re-anchor"*

> One more, because it surprised us. Here the re-anchor blocks the bad rollout — fidelity
> goes 56 to 89, the business is fine. But contamination stays at six memories and
> propagation goes from eleven events to **seventy-eight**, because the agent keeps
> re-deriving from the same corrupted belief and getting stopped at the gate.
>
> Blocking the action isn't the same as repairing the belief. Business damage and
> semantic blast radius are different axes, and a mitigation can move them in opposite
> directions. You only see that if you measure both.
>
> Fault injection for agents isn't new. AgentChaos does the transport layer; the
> memory-poisoning literature does adversaries. This is the case in between: no attacker,
> no failed call, just ordinary drift in a system whose horizon is long enough for it to
> compound.
>
> For a long-horizon agent, reliability isn't only whether it keeps running. It's whether
> it keeps believing true things.

---

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
