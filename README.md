# HorizonMonkey

**Semantic chaos engineering for long-horizon agents.**
*Break the agent's beliefs before reality does.*

Built for the Long Horizon Agents Hackathon (Coframe / AGI House).

---

## The problem

A server fails loudly. It returns a 500, a timeout, a truncated body — and every layer
above it knows something went wrong.

A long-horizon agent fails quietly. Every call returns 200. Every payload validates.
Something slightly wrong enters the belief set, becomes a lesson, becomes a policy, and
twenty steps later the agent confidently ships the wrong thing. Nothing in the trace
looks like an error, because nothing *was* an error.

The failure this project targets is the one in between an attack and an outage:

```
Analytics returns 200 OK
Payload is complete and schema-valid
The aggregate behind it is a cached day-2 snapshot
Retention has not churned yet, so a 40% discount reads as a clean win
The agent writes it down
Five steps later a site-wide discount is live
```

No attacker. No failed call. Just staleness.

## What HorizonMonkey does

It injects small, *plausible* semantic faults into a running agent's observations,
memory and objective, then measures how far the resulting belief travels:

- **Propagation depth** — how many downstream artifacts inherited the fault
- **Memory contamination** — how many durable beliefs are derived from it
- **Affected decisions / actions** — how much of the agent's behaviour it touched
- **Detection latency** — how long before any invariant noticed
- **Silent window** — how long the corrupted belief was load-bearing
- **Goal fidelity** — scored structurally against canonical ground truth, 0–100

Every run is a controlled comparison: a control arm, a chaos arm, and a defended arm.

```bash
npm install
npm run dev        # http://localhost:3579
npm run sim        # the same comparison in the terminal, no browser
```

No API key and no network access required — see *Why the agent is deterministic* below.

## Results

24 logical steps ≈ five months of simulated growth work. Control run scores **95**.

| Fault | Control | Chaos | Propagation | Contaminated memory | Decisions / actions | Caught | Defended fidelity | Defended propagation | Defended contamination |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Stale observation | 95 | 72 | 8 | 2 | 1 / 1 | **no** | 96 | 6 | 0 |
| Objective drift | 95 | **47** | 39 | 0 | 13 / 13 | **no** | 95 | 4 | 0 |
| Caveat omission | 95 | **56** | 11 | 6 | 1 / 1 | **no** | 96 | 1 | 0 |
| Metric drift | 95 | 73 | 13 | 1 | 2 / 2 | **no** | *74* | *13* | *1* |

Reproduce with `npm run sim`; frozen traces are in [`runs/`](runs/).

**Note the last row.** The freshness validator does not catch metric drift, and the
number does not move. The drifted reading is fully matured and internally consistent, so
a freshness check has nothing to object to; catching it needs cross-source
reconciliation, which is not implemented. A harness whose defenses always work is not
measuring anything, so that result is reported as-is in the UI rather than tuned away.

## The four faults

Every one of them is schema-valid, internally consistent, and defensible to a human
reviewer. A fault that looks wrong is a fault the agent would catch, which teaches us
nothing.

| Fault | Mechanism | Why nobody would flag it |
| --- | --- | --- |
| **Stale observation** | The analytics aggregate cache serves a day-2 snapshot as a completed 30-day result | Every number is real. Retention just has not churned yet. |
| **Objective drift** | A summarization pass rewrites the working objective and drops a guardrail | Reads like a faithful paraphrase — but it swapped the optimization target. |
| **Caveat omission** | A lesson is written without the scope qualifier that bounded it | The retained sentence is *true*. Collapsing signup really did lift SMB signups 15%. |
| **Metric drift** | Two metrics move inside their own confidence interval | Below any anomaly threshold — but it clears the bar the agent uses to generalize. |

## Why this is not the same as existing work

Fault injection for agents is not new, and this does not claim otherwise.

- **[AgentChaos](https://arxiv.org/abs/2608.06790)** injects at the LLM transport layer —
  server errors, timeouts, malformed responses, truncation. That is the *plumbing*
  failing. Here the plumbing is perfect.
- **Memory-poisoning research** ([AgentPoison](https://arxiv.org/html/2606.04329v1), MPBench,
  MemEvoBench) studies an adversary planting content to hijack behaviour. That is a
  security model. Here there is no adversary — just an ordinary staleness or
  summarization defect that any production analytics stack produces on a bad day.
- **Failure attribution** ([Who&When](https://arxiv.org/html/2607.09996v1), FALAT,
  AgentTracer) tries to work out, after the fact, which step broke a long trajectory —
  and finds it hard, precisely because downstream steps stay locally reasonable.

The gap between them is the case with **no attacker and no failed call**: benign
operational drift, in a system whose horizon is long enough for it to compound. That is
what this measures. And because the injector holds the ground truth, it produces the
labelled propagation that post-hoc attribution has to guess at.

## Architecture

```
CANONICAL WORLD STATE        what is actually true
        │
   observation layer         what the agent is allowed to see
        │
   FAULT INJECTOR            a plausible, schema-valid distortion
        │
  AGENT PERCEIVED STATE      what the agent believes
        │
   belief-driven policy  →  decisions  →  actions  →  ships
```

```
core/
  types.ts        trace, fault, memory, observation model
  agent.ts        the growth agent's decision policy
  faults.ts       the four injectors
  defenses.ts     three invariants a real team could ship today
  propagation.ts  taint closure and blast-radius graph
  evaluator.ts    structural goal-fidelity scoring
  run.ts          environment and agent loop
  compare.ts      control / chaos / defended, in one call
scenarios/growth.ts   the synthetic SaaS business
app/                  Next.js UI
runs/                 frozen traces
```

### The agent is not a strawman

It weights impact by reach. It checks guardrails before acting. It attaches scope
caveats to lessons and refuses to generalize a bounded one. It treats a guardrail breach
on any segment as evidence about the intervention everywhere. It caps concurrent
experiments. It revises beliefs when matured data arrives.

It has exactly one ordinary weakness, and it is the point of the project:

> **It evaluates its guardrails against its beliefs.**

There is also a hard rule in the policy: *an untested change never goes to all traffic.*
You test on a segment and roll out once you believe it works. That is ordinary release
discipline, and it has a consequence worth stating plainly — **the only route to a
full-traffic rollout runs through the belief set.** Which is why corrupting a belief is
the only way to make this agent do real damage, and why the control arm never does.

### Recovery is not the same as undo

In three of the four faults the agent eventually corrects itself — the real numbers
mature, belief revision fires, the contaminated lesson is superseded. It still scores
72, 56 and 73, because by then the discount has been live on all traffic for a month.
Long-horizon reliability is not only about whether an agent notices. It is about how
much it has already committed by the time it does.

### Why the agent is deterministic

The agent's policy is explicit code, not an LLM call. This is a deliberate trade, and it
buys three things a hackathon demo needs: runs are **reproducible** (the same fault
produces the same blast radius every time, so the numbers in this README are checkable),
the comparison is **clean** (a difference between the control and chaos arms is caused by
the fault and nothing else — no sampling noise), and the demo **cannot fail live** on a
missing key or a rate limit.

The instrumentation — trace, provenance, taint closure, evaluator — is entirely
independent of what makes the decisions. Swapping the policy for an LLM means replacing
`GrowthAgent.decide()` and `lessonFrom()` with a structured-output call; nothing else in
`core/` changes. That is the intended next step, not a rewrite.

## Honest limits

- **Taint is dependency lineage, not proven causation.** An event is marked when it was
  derived, transitively, from a corrupted artifact. That is a strictly weaker claim than
  "the fault caused this decision" — but unlike post-hoc attribution it is exact.
  True counterfactual attribution (replay the trajectory with the fault removed at step
  *k*) is future work.
- **One scenario, one agent architecture.** The interesting comparative question — do
  different agent architectures have different semantic blast radii, the way AgentChaos
  found for transport faults — needs more than one agent.
- **Goal fidelity is a hand-built scoring function** over ground truth. It is structural
  and reproducible rather than an LLM judge, which makes it honest but also narrow to
  this scenario.

## Where this goes

The measurement is the product. The next steps are the ones that make it a tool rather
than a demo:

1. **Counterfactual replay** — remove the fault at step *k*, re-run, diff. Turns lineage
   into attribution.
2. **A real agent under test.** HorizonMonkey as a proxy in front of an existing agent's
   observation, memory and tool layer, rather than a simulated policy.
3. **Invariant synthesis.** Every failure trajectory already contains its own fix: the
   freshness validator in `defenses.ts` is just the stale-observation failure written
   backwards. Generate the invariant from the failure, then re-run to confirm the blast
   radius shrank.
4. **Agent reliability CI.** A prompt change opens a PR, fifty semantic chaos scenarios
   run, and goal-fidelity regression fails the build.

## For Coframe specifically

Coframe already has the agent runtime, the tracing, the experimentation and the causal
machinery. This is not another agent framework — it is a diagnostic layer you would run
*against* one.

The question it answers:

> **What is the semantic blast radius of one wrong learned belief inside a self-improving
> growth agent?**

If a growth agent runs thousands of experiments, one conclusion generalized past its
cohort — one metric read before it matured, one guardrail lost in a summarization —
becomes a belief that shapes every later experiment. Uptime monitoring cannot see it.
Every call succeeded.
