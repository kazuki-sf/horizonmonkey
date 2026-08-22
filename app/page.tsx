"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Comparison } from "../core/compare";
import type { DefenseId, FaultType, RunResult, TraceEvent } from "../core/types";
import type { GraphNode } from "../core/propagation";

const FAULTS: { id: FaultType; label: string }[] = [
  { id: "stale_observation", label: "Stale observation" },
  { id: "goal_mutation", label: "Objective drift" },
  { id: "memory_poisoning", label: "Caveat omission" },
  { id: "numeric_perturbation", label: "Metric drift" },
];

const DEFENSES: { id: DefenseId; label: string }[] = [
  { id: "freshness_validator", label: "Freshness validator" },
  { id: "guardrail_checker", label: "Objective re-anchor" },
  { id: "provenance_auditor", label: "Provenance auditor" },
];

/** Which defense is designed for which fault — used for the one-click demo path. */
const NATURAL_DEFENSE: Record<FaultType, DefenseId> = {
  stale_observation: "freshness_validator",
  goal_mutation: "guardrail_checker",
  memory_poisoning: "provenance_auditor",
  numeric_perturbation: "provenance_auditor",
};

function readUrl(): { fault: FaultType; defenses: DefenseId[] } {
  if (typeof window === "undefined") return { fault: "stale_observation", defenses: [] };
  const q = new URLSearchParams(window.location.search);
  const f = q.get("fault") as FaultType | null;
  const d = (q.get("defense") ?? "").split(",").filter(Boolean) as DefenseId[];
  return {
    fault: FAULTS.some((x) => x.id === f) ? (f as FaultType) : "stale_observation",
    defenses: d.filter((x) => DEFENSES.some((y) => y.id === x)),
  };
}

export default function Page() {
  const [fault, setFault] = useState<FaultType>("stale_observation");
  const [defenses, setDefenses] = useState<DefenseId[]>([]);
  const [data, setData] = useState<Comparison | null>(null);
  const [busy, setBusy] = useState(false);

  // Hydrate from the URL once, so a given fault/defense pairing is linkable.
  useEffect(() => {
    const u = readUrl();
    setFault(u.fault);
    setDefenses(u.defenses);
  }, []);

  const run = useCallback(
    async (f: FaultType, d: DefenseId[]) => {
      setBusy(true);
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ faultType: f, defenses: d }),
      });
      setData(await res.json());
      setBusy(false);
    },
    []
  );

  useEffect(() => {
    void run(fault, defenses);
    const q = new URLSearchParams();
    q.set("fault", fault);
    if (defenses.length) q.set("defense", defenses.join(","));
    window.history.replaceState(null, "", `?${q}`);
  }, [fault, defenses, run]);

  const toggleDefense = (id: DefenseId) =>
    setDefenses((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  return (
    <div className="wrap">
      <header className="top">
        <div className="brand">
          <div className="kicker">Chaos engineering for agent state</div>
          <h1>
            Horizon<span>Monkey</span>
          </h1>
          <p>
            Long-horizon agents rarely fail because a dependency returned 500. They fail because
            something plausible entered the belief set and every decision after it stayed locally
            reasonable. This injects that, then measures how far it travels.
          </p>
        </div>

        <div className="controls">
          <div className="ctrl-row">
            <span className="ctrl-label">Fault</span>
            {FAULTS.map((f) => (
              <button
                key={f.id}
                className="chip"
                data-on={fault === f.id}
                onClick={() => setFault(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="ctrl-row">
            <span className="ctrl-label">Defense</span>
            {DEFENSES.map((d) => (
              <button
                key={d.id}
                className="chip def"
                data-on={defenses.includes(d.id)}
                onClick={() => toggleDefense(d.id)}
              >
                {d.label}
              </button>
            ))}
          </div>
          <div className="ctrl-row">
            <button
              className="run-btn"
              disabled={busy}
              onClick={() => {
                const d = NATURAL_DEFENSE[fault];
                setDefenses((cur) => (cur.includes(d) ? cur : [...cur, d]));
              }}
            >
              {busy ? "running…" : "Harden against this fault →"}
            </button>
            {defenses.length > 0 && (
              <button className="chip" onClick={() => setDefenses([])}>
                clear defenses
              </button>
            )}
          </div>
        </div>
      </header>

      {!data ? (
        <div className="loading">running control arm, chaos arm and defended arm…</div>
      ) : (
        <Results data={data} />
      )}

      <div className="footnote">
        <b>What this measures.</b> Taint here is dependency lineage, not proven causation: an event
        is marked when it was derived, transitively, from a corrupted artifact. That is a weaker
        claim than &ldquo;the fault caused this decision&rdquo; — but because the injector holds the
        ground truth, it is exact, which post-hoc failure attribution over a long trajectory is not.
        Goal fidelity is scored structurally against the canonical world state, never by asking a
        model whether the agent did well. <b>Prior work.</b> Fault injection for agents already
        exists — AgentChaos injects at the LLM transport layer, and the memory-poisoning literature
        studies an adversary planting content. This targets the case in between: no attacker, no
        failed call, just an ordinary staleness or summarization defect that the agent has no reason
        to question.
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Results({ data }: { data: Comparison }) {
  const { baseline, chaos, defended, fault, divergence } = data;
  const active = defended ?? chaos;
  const contained = Boolean(defended);

  return (
    <>
      <Verdict data={data} />

      <div className="cards">
        <Card
          k="Goal fidelity"
          v={
            <>
              <span className="was">{baseline.summary.goalFidelity}</span>
              <span className="arrow">→</span>
              {active.summary.goalFidelity}
            </>
          }
          tone={
            active.summary.goalFidelity >= baseline.summary.goalFidelity - 4
              ? "ok"
              : active.summary.goalFidelity < 65
                ? "bad"
                : "warn"
          }
          sub={contained ? "control → defended" : "control → chaos"}
        />
        <Card
          k="Propagation depth"
          v={String(active.summary.propagationDepth)}
          tone={active.summary.propagationDepth > 6 ? "taint" : "ok"}
          sub={`${chaos.trace.length} trace events total`}
        />
        <Card
          k="Contaminated memory"
          v={String(active.summary.memoryContamination)}
          tone={active.summary.memoryContamination > 0 ? "taint" : "ok"}
          sub="durable beliefs derived from the fault"
        />
        <Card
          k="Affected decisions"
          v={`${active.summary.affectedDecisions} / ${active.summary.affectedActions}`}
          tone={active.summary.affectedDecisions > 0 ? "taint" : "ok"}
          sub="decisions / external actions"
        />
        <Card
          k="Detection"
          v={
            active.summary.faultDetected
              ? `+${active.summary.detectionLatency ?? 0}`
              : "never"
          }
          tone={active.summary.faultDetected ? "ok" : "bad"}
          sub={
            active.summary.faultDetected
              ? `steps after injection · ${activeDefense(active)}`
              : "no invariant caught it"
          }
        />
        <Card
          k="Silent window"
          v={
            divergence.silentFailureWindow === null
              ? "—"
              : `${divergence.silentFailureWindow} steps`
          }
          tone={
            divergence.silentFailureWindow && divergence.silentFailureWindow > 2 ? "warn" : "ok"
          }
          sub={
            active.summary.recovered
              ? `belief load-bearing s${fault?.injectedAtStep}–s${active.summary.recoveryStep}`
              : `injected s${fault?.injectedAtStep} · never corrected`
          }
        />
      </div>

      <div className="grid">
        <div className="panel">
          <h2>
            Trace — {contained ? "defended run" : "chaos run"}
            <em>{active.trace.length} events over {active.config.maxSteps} steps</em>
          </h2>
          <Timeline trace={active.trace} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {fault && (
            <div className="panel fault-detail">
              <h2>
                The fault<em>{fault.label} → {fault.targetLabel}</em>
              </h2>
              <div className="body">
                <div className="why">{fault.plausibility}</div>
                <FaultDiff run={active} />
              </div>
            </div>
          )}

          <div className="panel">
            <h2>
              Where it went<em>dependency lineage from the injection point</em>
            </h2>
            <div className="body">
              <Tree
                nodes={contained ? data.defendedGraph : data.graph}
                rootLabel={fault ? `${fault.label} injected at step ${fault.injectedAtStep}` : "no fault"}
              />
            </div>
          </div>

          <div className="panel">
            <h2>
              Final position<em>what the business actually got</em>
            </h2>
            <div className="diff">
              <Arm title="Control" run={baseline} />
              <Arm title={contained ? "Defended" : "Chaos"} run={active} bad={!contained} />
            </div>
          </div>

          <div className="panel">
            <h2>
              Goal fidelity breakdown<em>{contained ? "defended" : "chaos"} run</em>
            </h2>
            <div className="body bars">
              {active.summary.fidelityBreakdown.map((b) => (
                <div key={b.label}>
                  <div className="bar-row">
                    <span className="nm">{b.label}</span>
                    <span className="bar-track">
                      <span
                        className="bar-fill"
                        style={{
                          width: `${(b.score / b.max) * 100}%`,
                          background:
                            b.score / b.max > 0.75
                              ? "var(--ok)"
                              : b.score / b.max > 0.4
                                ? "var(--warn)"
                                : "var(--bad)",
                        }}
                      />
                    </span>
                    <span className="sc">
                      {b.score}/{b.max}
                    </span>
                  </div>
                  <div className="bar-row">
                    <span />
                    <span className="bar-note">{b.note}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/** Scrolls straight to the injection point — the fault is the story, not step 0. */
function Timeline({ trace }: { trace: TraceEvent[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const originId = trace.find((e) => e.isFaultOrigin)?.id;

  useEffect(() => {
    if (!originId || !ref.current) return;
    const el = ref.current.querySelector(`[data-id="${originId}"]`);
    if (el instanceof HTMLElement)
      ref.current.scrollTo({ top: Math.max(0, el.offsetTop - ref.current.offsetTop - 90) });
  }, [originId]);

  return (
    <div className="tl" ref={ref}>
      {trace.map((e) => (
        <Event key={e.id} e={e} />
      ))}
    </div>
  );
}

const activeDefense = (r: RunResult) =>
  r.faults[0]?.detectedBy?.replace(/_/g, " ") ?? "—";

function Verdict({ data }: { data: Comparison }) {
  const { baseline, chaos, defended, fault, divergence } = data;
  if (!fault) return null;

  if (defended && defended.summary.goalFidelity <= chaos.summary.goalFidelity + 2) {
    // Reporting this honestly matters more than a clean demo. A harness that
    // always shows its defenses working is not measuring anything.
    return (
      <div className="verdict">
        None of the enabled invariants catch this one. {defended.summary.faultDetected
          ? "The check fires, but not on the artifact that mattered"
          : "The corrupted readout is fully matured and internally consistent, so a freshness check has nothing to object to"}
        , and blast radius stays at{" "}
        <span className="num">{defended.summary.propagationDepth}</span> events with{" "}
        <span className="num">{defended.summary.memoryContamination}</span> contaminated{" "}
        {defended.summary.memoryContamination === 1 ? "memory" : "memories"}. Goal fidelity is{" "}
        <span className="num">{defended.summary.goalFidelity}</span> against a control of{" "}
        {baseline.summary.goalFidelity}. Catching this class needs a different invariant — a
        cross-source reconciliation check — which this harness does not ship yet.
      </div>
    );
  }

  if (defended) {
    const contained = defended.summary.memoryContamination === 0;
    const spread = defended.summary.propagationDepth > chaos.summary.propagationDepth;
    return (
      <div className={`verdict${contained ? " clean" : ""}`}>
        With <b>{activeDefense(defended)}</b> enabled, the fault is caught at step{" "}
        <span className="num">{defended.faults[0]?.detectedAtStep ?? "—"}</span> and goal fidelity
        recovers to <span className="num">{defended.summary.goalFidelity}</span> against a control
        of {baseline.summary.goalFidelity}.{" "}
        {contained ? (
          <>
            Blast radius drops from <span className="num">{chaos.summary.propagationDepth}</span>{" "}
            events and <span className="num">{chaos.summary.memoryContamination}</span>{" "}
            contaminated memories to{" "}
            <span className="num">{defended.summary.propagationDepth}</span> and{" "}
            <span className="num">0</span>.
          </>
        ) : (
          <>
            But it blocks the <em>action</em> without repairing the <em>belief</em>:{" "}
            <span className="num">{defended.summary.memoryContamination}</span> memories are still
            contaminated, and because the agent keeps re-deriving from them, propagation{" "}
            {spread ? "rises" : "stays"} at{" "}
            <span className="num">{defended.summary.propagationDepth}</span> events — up from{" "}
            <span className="num">{chaos.summary.propagationDepth}</span>. The business is
            protected; the agent is still wrong.
          </>
        )}
      </div>
    );
  }

  const s = chaos.summary;
  return (
    <div className="verdict">
      One {fault.label.toLowerCase()} in <b>{fault.targetLabel}</b> was never flagged by any
      invariant. It contaminated <span className="num">{s.memoryContamination}</span> durable
      {" "}memories, reached <span className="num">{s.affectedDecisions}</span> decisions and{" "}
      <span className="num">{s.affectedActions}</span> external actions, and moved goal fidelity
      from {baseline.summary.goalFidelity} to <span className="num">{s.goalFidelity}</span>
      {s.recovered ? (
        <>
          . The agent did correct itself at step <span className="num">{s.recoveryStep}</span>, when
          the real numbers finally matured — <span className="num">{divergence.silentFailureWindow}</span>{" "}
          steps and {s.guardrailViolations.length > 0 ? "one full-traffic rollout" : "several decisions"} too
          late. Recovering a belief does not un-ship the change it justified.
        </>
      ) : (
        <>
          , and it was still driving decisions when the run ended,{" "}
          <span className="num">{divergence.silentFailureWindow}</span> steps after injection.
        </>
      )}{" "}
      Every tool call in this run succeeded.
    </div>
  );
}

function Card({
  k,
  v,
  sub,
  tone,
}: {
  k: string;
  v: React.ReactNode;
  sub: string;
  tone: "ok" | "bad" | "warn" | "taint";
}) {
  return (
    <div className="card">
      <div className="k">{k}</div>
      <div className={`v ${tone}`}>{v}</div>
      <div className="sub">{sub}</div>
    </div>
  );
}

function Event({ e }: { e: TraceEvent }) {
  return (
    <div
      className="ev"
      data-taint={e.faultIds.length > 0}
      data-origin={Boolean(e.isFaultOrigin)}
      data-quar={Boolean(e.quarantined)}
      data-kind={e.type}
      data-id={e.id}
    >
      <div className="step">{String(e.step).padStart(2, "0")}</div>
      <div className="body2">
        <div className="ttl">
          <span className="tag">{e.type.replace(/_/g, " ")}</span>
          {e.isFaultOrigin && "⚡ "}
          {e.summary}
        </div>
        {e.detail && <div className="meta">{e.detail}</div>}
      </div>
    </div>
  );
}

function FaultDiff({ run }: { run: RunResult }) {
  const f = run.faults[0];
  if (!f) return null;
  const fmt = (v: unknown) =>
    typeof v === "object" && v !== null
      ? Object.entries(v as Record<string, unknown>)
          .map(([k, val]) =>
            `${k}: ${typeof val === "object" && val !== null ? JSON.stringify(val).replace(/[{}"]/g, "").replace(/,/g, "  ") : String(val)}`
          )
          .join("\n")
      : String(v);
  return (
    <>
      <div className="sbs">
        <div>
          <div className="lbl">Ground truth</div>
          <pre>{fmt(f.originalValue)}</pre>
        </div>
        <div className="corrupt">
          <div className="lbl">What the agent saw</div>
          <pre>{fmt(f.corruptedValue)}</pre>
        </div>
      </div>
      <div className="kv">
        <span className="k">injected</span>
        <span>step {f.injectedAtStep}</span>
        <span className="k">detected</span>
        <span>
          {f.detectedAtStep !== undefined
            ? `step ${f.detectedAtStep} by ${f.detectedBy?.replace(/_/g, " ")}`
            : "never"}
        </span>
        <span className="k">schema valid</span>
        <span>yes — every field populated, every call returned 200</span>
      </div>
    </>
  );
}

function Arm({ title, run, bad }: { title: string; run: RunResult; bad?: boolean }) {
  const s = run.summary;
  const shipped = run.launched.filter((e) => e.shipped);
  return (
    <div>
      <h3>{title}</h3>
      <div className="rec">{s.finalRecommendation}</div>
      <div className="mini">
        <div>
          <b>true revenue</b>
          <span style={{ color: s.trueCumulative.revenue >= 0 ? "var(--ok)" : "var(--bad)" }}>
            {s.trueCumulative.revenue > 0 ? "+" : ""}
            {s.trueCumulative.revenue}%
          </span>
        </div>
        <div>
          <b>true retention</b>
          <span style={{ color: s.trueCumulative.retention >= -3 ? "var(--ok)" : "var(--bad)" }}>
            {s.trueCumulative.retention > 0 ? "+" : ""}
            {s.trueCumulative.retention}%
          </span>
        </div>
        <div>
          <b>shipped</b>
          <span>{shipped.length} changes</span>
        </div>
        <div>
          <b>guardrails</b>
          <span style={{ color: s.guardrailViolations.length ? "var(--bad)" : "var(--ok)" }}>
            {s.guardrailViolations.length ? `${s.guardrailViolations.length} breached` : "held"}
          </span>
        </div>
      </div>
      {bad && s.guardrailViolations.length > 0 && (
        <div className="mini" style={{ color: "var(--bad)", fontFamily: "inherit", fontSize: 11.5 }}>
          {s.guardrailViolations[0]}
        </div>
      )}
    </div>
  );
}

function Tree({ nodes, rootLabel }: { nodes: GraphNode[]; rootLabel: string }) {
  if (nodes.length === 0)
    return (
      <div style={{ color: "var(--ink-faint)", fontSize: 12.5 }}>
        Nothing downstream inherited the fault — it never left the injection point.
      </div>
    );

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const childOf = new Set(nodes.flatMap((n) => n.children));
  const roots = nodes.filter((n) => !childOf.has(n.id));
  const seen = new Set<string>();

  const render = (n: GraphNode, depth: number, last: boolean): React.ReactNode[] => {
    if (seen.has(n.id) || depth > 7) return [];
    seen.add(n.id);
    const pad = depth === 0 ? "" : "│  ".repeat(depth - 1) + (last ? "└─ " : "├─ ");
    const rows: React.ReactNode[] = [
      <div key={n.id} className={`node${n.quarantined ? " q" : ""}`} title={n.label}>
        {pad}
        <span className="t">
          s{String(n.step).padStart(2, "0")} {n.type.replace(/_/g, " ")} ·{" "}
        </span>
        {n.quarantined ? "⛔ " : ""}
        {n.label}
      </div>,
    ];
    const kids = n.children.map((c) => byId.get(c)).filter(Boolean) as GraphNode[];
    kids.forEach((k, i) => rows.push(...render(k, depth + 1, i === kids.length - 1)));
    return rows;
  };

  return (
    <div className="tree">
      <div className="rootline">⚡ {rootLabel}</div>
      {roots.flatMap((r, i) => render(r, 1, i === roots.length - 1))}
    </div>
  );
}
