# HorizonMonkey

**Semantic chaos engineering for long-horizon agents.**
*Break the agent's beliefs before reality does.*

**▶ Live demo — https://horizonmonkey.vercel.app**
Pick a fault, press run, and watch the recorded trace replay step by step. The
deployed demo is pure deterministic simulation: no API keys, no model calls.

Long-horizon agents do not only fail when APIs crash. They can fail while every call
succeeds: one stale observation, one dropped caveat, or one subtly mutated objective
becomes a belief, enters memory, and compounds through hundreds of later decisions.

HorizonMonkey is an experimental harness for measuring that **semantic blast radius** —
how far a small, plausible, schema-valid corruption travels through an agent's memory
and future decisions before anything notices.

```
Your agent / agent policy
          ↓
   HorizonMonkey harness
          ↓
  semantic fault injection
  trace + provenance tracking
  taint propagation analysis
  blast-radius measurement
```

Built at the Long Horizon Agents Hackathon (Coframe / AGI House). The reference scenario
is a Coframe-style growth agent; that is the **example**, not the product.

---

## The failure this targets

```
Analytics returns 200 OK
Payload is complete and schema-valid
The aggregate behind it is a cached day-2 snapshot
Retention has not churned yet, so a 40% discount reads as a clean win
The agent writes it down
Five steps later a site-wide discount is live
```

No attacker. No failed call. Just staleness.

## Quick start

```bash
npm install
npm run dev                              # http://localhost:3579
npm run sim                              # the same comparison in the terminal
npx tsx scripts/matrix.ts                # full fault x defense matrix
npx tsx scripts/trace.ts goal_mutation   # one annotated trajectory
```

No API key and no network access required — see
[Why the reference agent is deterministic](#why-the-reference-agent-is-deterministic).

## Results

The reference scenario runs 24 logical steps ≈ five months of simulated growth work.
The control run — same agent, no fault — scores **95** and breaches no guardrail.

Cells are `goal fidelity · propagation depth / contaminated memories`:

| Fault | no defense | Freshness validator | Objective re-anchor | Provenance auditor | all three |
| --- | --- | --- | --- | --- | --- |
| **Stale observation** | 72 · 8/2 | **96 · 6/0** | 71 · 14/5 | **95 · 6/0** | 96 · 6/0 |
| **Objective drift** | **47** · 39/0 | 48 · 39/0 | **95 · 4/0** | 47 · 39/0 | 96 · 4/0 |
| **Caveat omission** | **56** · 11/6 | **96 · 1/0** | 89 · 78/6 | **96 · 1/0** | 96 · 1/0 |
| **Metric drift** | 73 · 13/1 | 74 · 13/1 | 76 · 58/1 | **95 · 6/0** | 96 · 6/0 |

Reproduce with `npm run sim` and `npx tsx scripts/matrix.ts`; frozen traces are in
[`runs/`](runs/). **Not one of the four faults was caught by any invariant in the
undefended column, and every tool call in every run returned successfully.**

### Three observations from this simulation

These come from one deterministic scenario with one agent architecture. They are
hypotheses worth testing elsewhere, not properties of agents in general.

**A. Preventing bad actions is not the same as repairing bad beliefs.** Objective
re-anchor takes caveat omission from 56 to 89 — the business is protected, the bad
rollout never ships. But contamination stays at 6 and propagation goes from 11 events to
78, because the corrupted belief is still live and the policy keeps re-deriving from it
and getting stopped at the gate. This suggests two distinct axes worth measuring
separately: *external damage* and *internal semantic contamination*.

> Caveat on the number itself: propagation depth counts tainted artifacts, so it grows
> with however many steps remain after injection. The 78 is partly a function of run
> length, and these figures are only comparable across runs of equal length. The
> durable quantity is the belief's lifetime (`silentFailureWindow`), not the raw count.

**B. Defenses may generalize across nominal fault categories.** The provenance auditor
catches stale observations and metric drift as well as the caveat omission it was written
for — because what all three ultimately do is make a result look strong enough to
generalize past the segment it was measured on. This motivates organizing defenses around
**violated invariants** rather than one defense per named fault.

> Caveat: in this scenario all three faults funnel through the same generalization
> heuristic in the policy, so the convergence is partly by construction. That the
> invariant view *exists* is the interesting part; its coverage here is not evidence
> about coverage elsewhere.

**C. Defenses have costs.** The freshness validator records false positives: it also
blocks a legitimately immature reading of a genuinely good intervention. That is tracked
(`falsePositives`) rather than hidden, because an invariant that fires on everything
would score perfectly on this matrix and be useless in production. Long-horizon agent
reliability is a trade-off between resilience, autonomy, utility, and unnecessary
intervention.

## A real-model check on one mechanism

The study above is a deterministic simulation. To see whether one of its
mechanisms shows up in a real frontier model, we ran a **separate, isolated
probe** — `scripts/llm-validation.ts`, importing nothing from the demo.

**Scope, so this is not over-read:** it is a *single-decision* probe, not a
long-horizon agent run. It tests only the moment where contamination enters —
does an incomplete-but-plausible experiment readout cause a model to promote an
over-generalized belief into durable memory? It says nothing about propagation
over a trajectory, and it is not a benchmark.

Three conditions, `claude-opus-5`, N=10 each, differing **only** in the retention
line and the analyst note. Both prior durable memories carry a retention figure,
so the absence is a real derivable signal rather than a trick; nothing in the
payload announces that anything was removed, and the model is never told the
withheld value.

Three conditions, N=10 each, differing **only** in the retention line and the
analyst note. Both prior durable memories carry a retention figure, so the
absence is a real derivable signal rather than a trick; nothing in the payload
announces that anything was removed, and the model is never told the withheld
value. Four models saw byte-identical prompts — the runners import the same
objects — at their default/`medium` reasoning setting.

**Caveat omitted, no defense:**

| Model | Contaminated | Unsafe generalization | Asked for evidence | Named the gap | Unsupported reason |
| --- | --- | --- | --- | --- | --- |
| `claude-opus-5` | **0/10** | 0/10 | 10/10 | 10/10 | 4/10 |
| `gpt-5.6-sol` | **0/10** | 0/10 | 10/10 | 10/10 | 0/10 |
| `gpt-5.6-terra` | **0/10** | 0/10 | 10/10 | 10/10 | 0/10 |
| `gpt-5.6-luna` | **0/10** | 0/10 | 10/10 | 10/10 | 0/10 |

Control arm (retention present) and the added-invariant arm are both 0/10
contaminated for every model; full tables via `npx tsx scripts/llm-probe-report.ts`,
which recomputes every cell from the stored raw responses with one shared scorer.

**The mechanism did not replicate — in any of the four models.** None wrote a
contaminated durable belief in any condition. All forty faulted runs located the
omission and recorded it rather than papering over it. One Opus 5 memory read:

> `30-day retention NOT REPORTED (cohort not yet matured; guardrail unverified)`
> … `Do NOT treat this as a validated win`

The cleanest signal is the contrast: models ask for more evidence **0–1/10**
times when nothing is missing and **10/10** times when the retention line is
removed. Detection of the omission is reliable across every model and tier we
tried, including the cheapest.

The most defensible reading is not that these models are semantically robust in
general. It is that **this probe is too easy** — one well-framed question with
the whole context in front of you, and a single omission from a small table.
That is precisely the motivation for the harder test it does not perform:
information compressed across several generations of memory, evidence going
stale over time, caveats disappearing through repeated summarization, a model
retrieving beliefs an earlier version of itself wrote, and the fault landing
tens of steps before the decision it corrupts. The deterministic simulation
reaches that horizon; this probe does not.

We are not claiming any tier is more robust than another. Four models at 0/10
separates "essentially never" from "essentially always" and nothing finer.

The explicit invariant (condition C) therefore has no headroom on the headline
metrics — condition B already saturates them for every model. It moves one
secondary behaviour, and only for Opus 5: told not to infer a missing value, it
stops inventing a benign explanation for the gap (**4/10 → 1/10** confabulated a
reason such as "cohort not yet matured", which the readout does not support — it
says *concluded, day 51*). The GPT-5.6 models scored 0/10 on that measure in
every condition, so there was nothing for the invariant to improve.

### Where it actually gets hard

Because the single-turn version was too easy, we asked where the problem becomes
difficult: after a finding has been compressed, inherited, and separated from
its evidence. Two scenarios, each **pre-registered — scenario text and scoring
rule committed before any model was called** — with `claude-opus-5`,
`gpt-5.6-sol` and `gpt-5.6-luna`.

An agent inherits organizational memory 45 logical days after the experiments
that produced it. One true caveat — *"materially reduced 30-day retention, do not
generalize"* — did not survive a quarterly compaction. Nothing false is ever
shown; nothing marks the omission.

| | clean | drifted | drifted + provenance invariant |
| --- | --- | --- | --- |
| Episodes | 12 | 18 | 12 |
| Consequential bad decision | 0/12 | **0/18** | 0/12 |
| Retrieved the source record | 4/12 | **18/18** | 12/12 |
| Decision changed after retrieval | 2/4 | **12/18** | 10/12 |

**Zero harmful decisions again — but the zero is not the finding.** Reading the
drifted arm only, one population of 18: **12/18 preferred the corrupted lever on
their first pass**, before any source was retrieved. All 18 then went and
retrieved the source, and **the same 12 reversed** — the set that wanted it and
the set that changed are identical. Split by model: `gpt-5.6-sol` 6/6 and
`gpt-5.6-luna` 6/6 preferred it first and all reversed; `claude-opus-5` never
preferred it (0/6) and so never had anything to reverse.

That is a within-episode comparison: same model, same context, one retrieved
artifact, decision changes. Two limits on how far it can be pushed. The models
initiated retrieval **themselves** — 18/18 in the drifted arm against 4/12 when
the caveat was intact — so this shows that *access* to provenance enabled
recovery, not that our explicit invariant caused it; the invariant arm has no
headroom left to demonstrate anything. And nothing here shows a model failing:
the harmful-decision count is 0/18. The defensible claim is that the corrupted
memory changed what the models wanted to do, and provenance changed what they
did.

Every number above is recomputed from the saved episodes by
[`scripts/llm-hard-audit.ts`](scripts/llm-hard-audit.ts); the per-model,
per-condition breakdown is in [`runs/llm-hard-demo/AUDIT.md`](runs/llm-hard-demo/AUDIT.md).

The first version of this scenario was **invalid, and is reported as such**: no
model ever selected the corrupted option, because the situation made a different
answer obvious, so the failure metric could not fire. That diagnosis produced v2
rather than a tuned v1; both are in [`runs/llm-hard-demo/`](runs/llm-hard-demo/)
with every raw response.

A third scenario, **v3, is exploratory and reported as such**: four generations of
lineage, where the first artifact provenance returns is itself a compressed
summary that already lost the caveat, so one lookup is no longer enough. Twelve
episodes only. Opus 5 and Sol walked to the generation that still held the
caveat every time; Luna varied — one episode retrieved the drifted weekly review,
found it plausible, stopped there, and chose promotional pricing on the strength
of the inherited claim. It hedged the action into a guarded test with retention
stop-conditions, so the pre-registered rule correctly did not score it a harmful
decision. That separation is the useful part: **the epistemic failure occurred —
stopping at a compressed intermediate — while the behavioural failure did not.**
Twelve episodes cannot establish a rate; it is a direction to test properly.

```bash
npx tsx scripts/llm-hard-demo-v2.ts --print   # scenario + pre-registered scoring, no API call
npx tsx scripts/llm-hard-demo-v2.ts --smoke   # 21 episodes, ~10 min
npx tsx scripts/llm-hard-demo-v3.ts --print   # multi-hop lineage + scoring
npx tsx scripts/llm-hard-audit.ts             # recompute every hard-probe number, no API calls
```

### What this does and does not license us to say

It does **not** show that HorizonMonkey was validated on a long-horizon LLM
agent. It was not. A model answering one well-framed question with the whole
context in front of it is the easiest version of this problem; a model on step
40 of a run, retrieving a compressed memory written by an earlier version of
itself, is not the same test, and this probe does not reach it.

What it does show is that the specific fault the deterministic policy fell for —
a lesson written without the constraint that bounded it — is one a frontier
model catches when it is handed the readout directly. That is a real negative
result for this mechanism at this horizon, and it is reported as one.

Two caveats we can see in our own design. The faulted readout leaves a *second*
route to caution — signup +31% against qualified leads +2% implicates the other
guardrail on its own — so robustness cannot be attributed to noticing the
omission alone, though every run named the omission explicitly. And N=10
separates "essentially always" from "essentially never"; it does not estimate
rates in between.

Two instrument problems surfaced while running it, both fixed and both worth
recording. The first scorer counted any broad generalization as unsafe, which
mislabelled the *control* arm — a model broadcasting "this intervention breached
a guardrail" beyond the tested segment is being prudent, not contaminated;
scoring is now valence-aware. And one generation emitted a 16,000-character
decimal for `confidence` that exhausted `max_tokens` and truncated the JSON, so
that field is now an integer. Confidence is unusable in this run regardless —
two control responses answered on a 0–1 scale against an integer field — and it
was only ever a descriptive variable, never a calibrated probability.

Raw responses for all 30 runs, including prompts and token usage, are in
[`runs/llm-validation/`](runs/llm-validation/). Reproduce with:

```bash
npx tsx scripts/llm-validation.ts --print      # the exact prompts and their diff, no API call
npx tsx scripts/llm-validation.ts --selftest   # scorer checks against hand-written inputs
npx tsx scripts/llm-validation.ts --n 10       # needs ANTHROPIC_API_KEY; ~$0.85, ~6 min
npx tsx scripts/llm-validation-openai.ts --smoke   # 9 calls, needs OPENAI_API_KEY
npx tsx scripts/llm-validation-openai.ts --n 10    # 90 calls, ~12 min
npx tsx scripts/llm-probe-report.ts           # four-model table, recomputed, no API calls
```

## The four faults

Each is schema-valid, internally consistent, and defensible to a human reviewer. A fault
that looks wrong is a fault the agent would catch, which teaches us nothing.

| Fault | Mechanism | Why nobody would flag it |
| --- | --- | --- |
| **Stale observation** | The analytics aggregate cache serves a day-2 snapshot as a completed 30-day result | Every number is real. Retention just has not churned yet. |
| **Objective drift** | A summarization pass rewrites the working objective and drops a guardrail | Reads like a faithful paraphrase — but it swapped the optimization target. |
| **Caveat omission** | A lesson is written without the scope qualifier that bounded it | The retained sentence is *true*. Collapsing signup really did lift SMB signups 15%. |
| **Metric drift** | Two metrics move inside their own confidence interval | Below any anomaly threshold — but it clears the bar the agent uses to generalize. |

## Repository layout

```
core/                    the harness — imports nothing outside core/
  types.ts               trace events, faults, detections, blast-radius shape
  trace.ts               TraceRecorder: artifact ids, provenance edges, detections
  faults.ts              fault-injector base: arming, targeting, before/after capture
  propagation.ts         taint closure, blast graph, trajectory divergence
  metrics.ts             blast radius computed from trace + fault ledger alone
  policy.ts              AgentPolicy — the seam where an agent plugs in

examples/growth-agent/   the reference scenario
  world.ts               synthetic SaaS business and ground-truth effects
  domain.ts              domain types (metrics, segments, experiments, memory)
  policy.ts              the deterministic growth policy (implements AgentPolicy)
  faults.ts              the four faults, expressed against this domain
  defenses.ts            three invariants a real team could ship today
  evaluator.ts           goal fidelity, scored structurally against ground truth
  loop.ts                environment and agent loop
  compare.ts             control / chaos / defended, in one call

app/                     Next.js UI
runs/                    frozen traces
scripts/snapshot.ts      refactor safety net: key-sorted dump of all 20 runs
```

`core/` compiles standalone. Nothing in it knows what a conversion rate is.

## Use HorizonMonkey with your agent

The harness measures any trajectory that records **where each artifact came from**. That
is the whole contract — everything else (taint, contamination counts, blast radius,
detection latency) falls out of those provenance edges.

Implement the policy seam:

```ts
import type { AgentPolicy } from "horizonmonkey/core/policy";

class MyLLMPolicy implements AgentPolicy<Ctx, Obs, Belief, Decision> {
  readonly id = "my-agent/claude";

  async interpret(obs: Obs, step: number, beliefId: string) {
    // structured-output call; return the belief plus the ids it came from
  }
  commit(belief: Belief) { /* returns beliefs this supersedes */ }
  decide(ctx: Ctx) { /* structured-output call; return sourceIds */ }
}
```

Record the trajectory and read the blast radius:

```ts
const recorder = new TraceRecorder();

recorder.record({
  id: "mem_22",
  step,
  type: "memory_write",
  summary: "Discount strategy is broadly successful",
  inputIds: ["obs_12", "exp_103"],   // <- the only thing you must get right
});

propagate(recorder.events);
const radius = summarizeBlastRadius({
  trace: recorder.events,
  faults: injector.faults,
  detections: recorder.detections,
  recoveryStep,
  maxSteps,
});
```

**What is deliberately not provided yet:** a generic runtime that drives your agent. The
environment loop belongs to the scenario, because "what a step is" differs per agent. To
test your own agent today you write your own loop and call the recorder from it —
`examples/growth-agent/loop.ts` is a worked example of exactly that, and the fault
injector base handles the bookkeeping. Adapters for real agent runtimes (LangGraph,
OpenAI Agents SDK, Claude/custom loops, MCP and tool proxies) are future work; none are
implemented, and the API sketch above is not claimed to be stable.

## The reference scenario

`examples/growth-agent/` is a **controlled long-horizon decision environment for
demonstrating fault propagation** — not a CRO product, not a growth tool, and not a claim
about how any real growth agent behaves. It exists because semantic corruption needs a
domain where "subtly wrong" has consequences you can score.

It works because the environment contains a structural trap: the only high-reach wins
available are volume plays that destroy retention and revenue while looking like
successes on the fast metrics.

### The agent is not a strawman

It weights impact by reach. It checks guardrails before acting. It attaches scope caveats
to lessons and refuses to generalize a bounded one. It treats a guardrail breach on any
segment as evidence about the intervention everywhere. It caps concurrent experiments. It
revises beliefs when matured data arrives.

It has exactly one ordinary weakness, and it is the point of the project:

> **It evaluates its guardrails against its beliefs.**

There is also a hard rule in the policy: *an untested change never goes to all traffic.*
You test on a segment and roll out once you believe it works. That is ordinary release
discipline, and it has a consequence worth stating plainly — **the only route to a
full-traffic rollout runs through the belief set.** Which is why corrupting a belief is
the only way to make this agent do real damage, and why the control arm never does.

### Recovery is not the same as undo

In three of the four faults the agent eventually corrects itself — the real numbers
mature, belief revision fires, the contaminated lesson is superseded. It still scores 72,
56 and 73, because by then the discount has been live on all traffic for a month.
Long-horizon reliability is not only about whether an agent notices. It is about how much
it has already committed by the time it does.

### Why the reference agent is deterministic

For this experiment we intentionally use a deterministic reference policy to isolate
semantic fault propagation from LLM sampling variance. It buys three things: runs are
**reproducible** (the same fault produces the same blast radius every time, so the numbers
above are checkable), the comparison is **clean** (any difference between the control and
chaos arms is caused by the fault and nothing else), and the demo **cannot fail live** on
a missing key or a rate limit.

HorizonMonkey's instrumentation layer is independent of that policy and can be connected
to an LLM-backed agent: `GrowthAgent` implements `AgentPolicy`, the loop obtains its
decision through that interface, and nothing in `core/` inspects how a decision was
reached — only what it was derived from.

**These results do not show that an LLM-backed agent behaves identically.** They
characterize how one instrumented long-horizon decision process responds to semantic
corruption. Running the same faults against an LLM policy is the first item on the
roadmap, precisely because the answer is not known.

## Positioning

Fault injection for agents is not new, and this claims no firsts.

- **[AgentChaos](https://arxiv.org/abs/2608.06790)** injects at the LLM transport layer —
  server errors, timeouts, malformed responses, truncation. That is the *plumbing*
  failing. Here the plumbing is perfect.
- **Memory-poisoning research** ([AgentPoison](https://arxiv.org/html/2606.04329v1),
  MPBench, MemEvoBench) studies an adversary planting content to hijack behaviour. That is
  a security model. Here there is no adversary.
- **Failure attribution** ([Who&When](https://arxiv.org/html/2607.09996v1), FALAT,
  AgentTracer) tries to determine, after the fact, which step broke a long trajectory —
  and finds it hard, precisely because downstream steps stay locally reasonable.

HorizonMonkey focuses on **non-adversarial operational semantic drift in long-horizon
agents**: plausible faults in observations, objectives, metrics and remembered caveats
that propagate silently through otherwise successful execution.

A second distinction: because the harness injects the perturbation itself, it has exact
**ground-truth injection provenance**, and can measure downstream **dependency/taint
propagation** directly rather than attempting post-hoc failure localization.

That is deliberately not a claim of proven causal attribution. An event is marked when it
was derived, transitively, from a corrupted artifact — a strictly weaker statement than
"the fault caused this decision," and one this harness can make exactly.

## Honest limits

- **Taint is dependency lineage, not proven causation.** Counterfactual replay — remove
  the fault at step *k*, re-run, diff — is future work.
- **One scenario, one agent architecture, one deterministic policy.** The comparative
  question — do different agent architectures have different semantic blast radii, the way
  AgentChaos found for transport faults — needs more than one agent.
- **Goal fidelity is a hand-built scoring function** over ground truth. Structural and
  reproducible rather than an LLM judge, which makes it honest but narrow to this scenario.
- **Propagation depth scales with run length.** Compare it only across runs of equal
  length; see the caveat under observation A.

## Roadmap

Documentation of intent, not of work completed. None of the following is implemented.

- **Real LLM policy adapter** — run the same faults against a model-backed policy and see
  whether the propagation patterns survive sampling variance
- **LangGraph adapter**, **OpenAI Agents SDK adapter**, **MCP / tool-proxy interception**
- **A larger semantic fault library** — segment mis-mapping, metric redefinition mid-run,
  entity confusion, cross-run memory bleed
- **Counterfactual replay** — turn lineage into attribution
- **Automatic invariant / verifier generation** — every failure trajectory already contains
  its own fix; the freshness validator is the stale-observation failure written backwards
- **Semantic resilience CI** — a prompt change opens a PR, N chaos scenarios run,
  goal-fidelity regression fails the build
- **Benchmark suite across agent architectures**

## For Coframe specifically

Coframe already has the agent runtime, the tracing, the experimentation and the causal
machinery. This is not another agent framework — it is a diagnostic layer you would run
*against* one.

The question it is built to answer:

> **What is the semantic blast radius of one wrong learned belief inside a self-improving
> growth agent?**

If a growth agent runs thousands of experiments, one conclusion generalized past its
cohort — one metric read before it matured, one guardrail lost in a summarization —
becomes a belief that shapes every later experiment. Uptime monitoring cannot see it.
Every call succeeded.

---

`hackathon-demo` tags the submitted state. Behavioural equivalence across later refactors
is verified with `scripts/snapshot.ts`, which dumps all four faults across all five
defense combinations as key-sorted JSON for byte comparison.
