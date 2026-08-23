"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Comparison } from "../examples/growth-agent/compare";
import type { DefenseId, RunResult } from "../examples/growth-agent/domain";
import type { FaultType, TraceEvent } from "../core/types";
import type { GraphNode } from "../core/propagation";

// ===========================================================================
// Presentation layer.
//
// The run is real: clicking BREAK executes the deterministic experiment
// server-side and returns the complete instrumented trace. What this file adds
// is playback — it walks that trace event by event so an audience can watch a
// belief travel. No event is synthesized, and every number on screen is derived
// from trace fields the run actually produced.
// ===========================================================================

type FaultChoice = FaultType | "none";

const FAULTS: { id: FaultChoice; label: string }[] = [
  { id: "none", label: "No fault — control run" },
  { id: "memory_poisoning", label: "Caveat omission" },
  { id: "stale_observation", label: "Stale observation" },
  { id: "goal_mutation", label: "Objective drift" },
  { id: "numeric_perturbation", label: "Metric drift" },
];

/**
 * `guardrail_checker` is offered but flagged. One of its two branches consults
 * the simulator's ground-truth effect for an experiment that has not run, which
 * no deployable check could do. It is honest for objective drift — where only
 * the legitimate missing-guardrail branch fires — and oracle-assisted elsewhere.
 */
const DEFENSES: { id: DefenseId; label: string; oracle?: boolean }[] = [
  { id: "provenance_auditor", label: "Provenance auditor" },
  { id: "freshness_validator", label: "Freshness validator" },
  { id: "guardrail_checker", label: "Objective re-anchor (simulator-only)" },
];

/** The invariant written for each fault — the one the rewind reaches for. */
const NATURAL_DEFENSE: Record<FaultType, DefenseId> = {
  memory_poisoning: "provenance_auditor",
  stale_observation: "freshness_validator",
  numeric_perturbation: "provenance_auditor",
  goal_mutation: "guardrail_checker",
};

/** Hold ticks are steps where the agent did nothing but wait for traffic. */
const isNoise = (e: TraceEvent) => e.type === "evaluation";

/** Per-event dwell time. The fault gets a beat; routine work goes past quickly. */
function dwell(e: TraceEvent): number {
  if (e.isFaultOrigin) return 1500;
  if (e.type === "fault_detection" || e.type === "recovery") return 900;
  if (e.faultIds.length > 0) return e.type === "action" || e.type === "memory_write" ? 480 : 300;
  if (e.type === "action") return 260;
  return 110;
}

function glyph(e: TraceEvent) {
  if (e.isFaultOrigin) return "⚡";
  if (e.type === "fault_detection" || e.type === "recovery") return "🛡";
  if (e.quarantined) return "⊘";
  if (e.faultIds.length > 0) return e.type === "action" ? "✗" : "⚠";
  return "✓";
}

function lineClass(e: TraceEvent) {
  if (e.isFaultOrigin) return "line origin";
  if (e.type === "fault_detection" || e.type === "recovery") return "line defense";
  if (e.quarantined) return "line taint quar";
  if (e.faultIds.length > 0) return e.type === "action" ? "line bad" : "line taint";
  return "line norm";
}

/**
 * Every demo state is linkable, so a mis-click on stage is recoverable. A URL
 * only *selects* the configuration — the page stays idle until the Run button
 * is pressed. `&autorun=1` is the one explicit opt-out of that, kept as a stage
 * fallback and for automated checks; it is never the default path.
 */
function fromUrl(): { fault: FaultChoice; defense: DefenseId | ""; autorun: boolean; compare: boolean } {
  if (typeof window === "undefined") return { fault: "none", defense: "", autorun: false, compare: false };
  const q = new URLSearchParams(window.location.search);
  const f = q.get("fault") as FaultChoice | null;
  const d = q.get("defense") as DefenseId | null;
  return {
    fault: FAULTS.some((x) => x.id === f) ? (f as FaultChoice) : "none",
    defense: DEFENSES.some((x) => x.id === d) ? (d as DefenseId) : "",
    autorun: q.get("autorun") === "1",
    compare: q.get("compare") === "1",
  };
}


// ---------------------------------------------------------------------------
// Step grouping.
//
// Purely presentational: 79 recorded events become 18 legible groups. Nothing is
// added to the trace and no event is dropped — a group is exactly the events
// that already share a `step`, and expanding one shows them verbatim.
//
// Status and badges are computed from the events *played so far*, not from the
// whole group, so a step does not reveal that it contains a fault before the
// fault line actually appears.
// ---------------------------------------------------------------------------

type StepStatus = "fault" | "defense" | "recovery" | "failure" | "tainted" | "healthy";

type StepGroup = {
  step: number;
  events: TraceEvent[];
  status: StepStatus;
  title: string;
  summary?: string;
  taint: number;
  badges: string[];
};

const STATUS_GLYPH: Record<StepStatus, string> = {
  fault: "⚡",
  defense: "🛡",
  recovery: "↺",
  failure: "✗",
  tainted: "⚠",
  healthy: "✓",
};

/** Text before the metric tail, e.g. "Collapse signup to a single field · smb". */
const head = (s: string) => s.split(" — ")[0].trim();

function groupSteps(events: TraceEvent[]): StepGroup[] {
  const byStep = new Map<number, TraceEvent[]>();
  for (const e of events) {
    if (!byStep.has(e.step)) byStep.set(e.step, []);
    byStep.get(e.step)!.push(e);
  }

  return [...byStep.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([step, evs]) => {
      const fault = evs.find((e) => e.isFaultOrigin);
      const defense = evs.find((e) => e.type === "fault_detection");
      const recovery = evs.find((e) => e.type === "recovery");
      const badAction = evs.find((e) => e.type === "action" && e.faultIds.length > 0);
      const taint = evs.filter((e) => e.faultIds.length > 0 && !e.isFaultOrigin).length;

      // Precedence. The injection point outranks its own consequences: it is the
      // one place in the run where something entered, and it is what the
      // audience needs to find.
      const status: StepStatus = fault
        ? "fault"
        : defense
          ? "defense"
          : recovery
            ? "recovery"
            : badAction
              ? "failure"
              : taint > 0
                ? "tainted"
                : "healthy";

      // Title: what the agent was doing this step, by source priority.
      const obs = evs.find((e) => e.type === "observation");
      const dec = evs.find((e) => e.type === "decision");
      const strategy = evs.find(
        (e) => e.type === "memory_write" && /Strategy note/.test(e.summary)
      );
      const title = obs
        ? `Read ${head(obs.summary)}`
        : strategy
          ? "Consolidate strategy"
          : dec
            ? "Select next experiment"
            : evs[0]
              ? evs[0].type.replace(/_/g, " ")
              : "";

      // Summary: the most consequential thing that happened, verbatim from the
      // event that happened. Omitted rather than invented when nothing stands out.
      const act = [...evs].reverse().find((e) => e.type === "action");
      const src = fault ?? defense ?? recovery ?? badAction ?? act ?? strategy;
      const summary = src && src.summary !== title ? src.summary : undefined;

      const badges: string[] = [];
      if (fault) badges.push("⚡ FAULT");
      if (defense) badges.push("🛡 DEFENSE");
      if (recovery) badges.push("↺ RECOVERED");
      if (badAction) badges.push("✗ ACTION");
      if (taint > 0) badges.push(`⚠ ${taint} TAINTED`);

      return { step, events: evs, status, title, summary, taint, badges };
    });
}

/**
 * Longest identical prefix of two traces, compared event by event on the fields
 * the run actually produced. This is measured, never assumed: for caveat
 * omission the prefix runs *past* the injection, so the two futures genuinely
 * share a history including the fault. For stale observation it does not — the
 * freshness validator also fires on a legitimately immature reading earlier in
 * the run, so the arms separate before the fault is even injected. The UI says
 * different things in those two cases.
 */
function sharedPrefix(a: TraceEvent[], b: TraceEvent[]) {
  let i = 0;
  while (i < Math.min(a.length, b.length) && a[i].type === b[i].type && a[i].summary === b[i].summary && a[i].step === b[i].step) i++;
  const faultIdx = a.findIndex((e) => e.isFaultOrigin);
  return {
    count: i,
    lastStep: i > 0 ? a[i - 1].step : -1,
    /** True only when the arms were still identical after the fault landed. */
    includesFault: faultIdx >= 0 && i > faultIdx,
  };
}

/** Steps worth leaving open after they finish. Routine work collapses. */
const isNotable = (g: StepGroup) => g.status !== "healthy";

export default function Page() {
  const initial =
    typeof window === "undefined"
      ? { fault: "none" as FaultChoice, defense: "" as DefenseId | "", autorun: false, compare: false }
      : fromUrl();
  const [fault, setFault] = useState<FaultChoice>(initial.fault);
  const [defense, setDefense] = useState<DefenseId | "">(initial.defense);
  const [data, setData] = useState<Comparison | null>(null);
  const [busy, setBusy] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Manual expand/collapse overrides. Cleared on replay and on a new run. */
  const [manual, setManual] = useState<Record<number, boolean>>({});
  /** "compare" shows the two futures side by side instead of one timeline. */
  const [mode, setMode] = useState<"single" | "compare">("single");

  /** Which arm of the comparison is on screen. */
  const arm: "baseline" | "chaos" | "defended" =
    fault === "none" ? "baseline" : defense ? "defended" : "chaos";

  const run: RunResult | null = data
    ? arm === "baseline"
      ? data.baseline
      : arm === "defended" && data.defended
        ? data.defended
        : data.chaos
    : null;

  const events = useMemo(() => (run ? run.trace.filter((e) => !isNoise(e)) : []), [run]);
  const done = cursor >= events.length - 1 && events.length > 0;
  const status: "ready" | "running" | "playing" | "paused" | "done" = busy
    ? "running"
    : !run
      ? "ready"
      : done
        ? "done"
        : playing
          ? "playing"
          : "paused";

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  useEffect(() => {
    if (!playing || !events.length) return;
    if (cursor >= events.length - 1) {
      setPlaying(false);
      return;
    }
    const next = cursor + 1;
    timer.current = setTimeout(() => setCursor(next), dwell(events[next]) / speed);
    return stop;
  }, [playing, cursor, events, speed]);

  const execute = useCallback(async () => {
    stop();
    setBusy(true);
    setCursor(-1);
    setManual({});
    setPlaying(false);
    setMode("single");
    const res = await fetch("/api/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      // The control arm is produced by every comparison, so any fault type
      // works as the carrier when the user selected "no fault".
      body: JSON.stringify({
        faultType: fault === "none" ? "memory_poisoning" : fault,
        defenses: fault === "none" || !defense ? [] : [defense],
      }),
    });
    setData(await res.json());
    setBusy(false);
    setPlaying(!initial.compare);
    if (initial.compare) setMode("compare");
    const q = new URLSearchParams();
    if (fault !== "none") q.set("fault", fault);
    if (defense) q.set("defense", defense);
    // autorun is deliberately not written back — a copied URL stays idle.
    window.history.replaceState(null, "", q.toString() ? `?${q}` : "/");
  }, [fault, defense]);

  // Opt-in only: `?...&autorun=1`. The bare URL never executes anything.
  const booted = useRef(false);
  useEffect(() => {
    if (booted.current || !initial.autorun) return;
    booted.current = true;
    void execute();
  }, [execute, initial.autorun]);

  /**
   * Rewind: run the identical fault again with one defense added, then show
   * where the two futures separate. The original run is not altered — the API
   * returns both arms, so nothing is recomputed differently.
   */
  const rewind = useCallback(async () => {
    stop();
    const d = NATURAL_DEFENSE[fault as FaultType];
    setBusy(true);
    const res = await fetch("/api/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ faultType: fault, defenses: [d] }),
    });
    setData(await res.json());
    setDefense(d);
    setBusy(false);
    setPlaying(false);
    setCursor(-1);
    setMode("compare");
  }, [fault]);

  const replay = () => {
    stop();
    setCursor(-1);
    setManual({});
    setPlaying(true);
  };

  // Seen-so-far slice. Every progressive metric below counts only this.
  const seen = cursor >= 0 ? events.slice(0, cursor + 1) : [];
  const tainted = seen.filter((e) => e.faultIds.length > 0 && !e.isFaultOrigin);
  const live = {
    contaminated: tainted.filter((e) => e.type === "memory_write" && !e.quarantined).length,
    decisions: tainted.filter((e) => e.type === "decision").length,
    actions: tainted.filter((e) => e.type === "action").length,
    artifacts: tainted.length,
    detected: seen.some((e) => e.type === "fault_detection"),
    injected: seen.some((e) => e.isFaultOrigin),
  };

  const groups = useMemo(() => groupSteps(seen), [seen]);
  const currentStep = seen.at(-1)?.step ?? -1;

  const bodyRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Keep the step being played in view rather than snapping to the bottom —
    // a fault step deliberately left open above must not scroll away. Paused
    // means the presenter is driving, so stop moving the viewport at all.
    if (!playing) return;
    currentRef.current?.scrollIntoView({ block: "nearest" });
  }, [cursor, playing]);

  return (
    <div className="wrap">
      <header className="top">
        <div className="brand">
          <div className="kicker">Semantic chaos for long-horizon agents</div>
          <h1>
            Horizon<span>Monkey</span>
          </h1>
          <p>
            Chaos Monkey breaks infrastructure. Long-horizon agents can fail while every call
            succeeds — one plausible fact enters the belief set and compounds. Pick how you want to
            break the agent.
          </p>
        </div>
      </header>

      <div className="deck">
        <div className="field">
          <label>Fault</label>
          <select
            value={fault}
            onChange={(e) => {
              setFault(e.target.value as FaultChoice);
              setCursor(-1);
              setPlaying(false);
              setData(null);
            }}
          >
            {FAULTS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Defense</label>
          <select
            value={defense}
            disabled={fault === "none"}
            onChange={(e) => {
              setDefense(e.target.value as DefenseId | "");
              setCursor(-1);
              setPlaying(false);
              setData(null);
            }}
          >
            <option value="">None</option>
            {DEFENSES.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <button className="break-btn" onClick={execute} disabled={busy}>
          {busy ? "running…" : fault === "none" ? "▶  RUN BASELINE" : "⚡  BREAK THE AGENT"}
        </button>

        {events.length > 0 && (
          <>
            <button className="mini-btn" onClick={() => setPlaying((p) => !p)} disabled={done}>
              {playing ? "❙❙ pause" : "▶ resume"}
            </button>
            <button className="mini-btn" onClick={replay}>
              ↻ replay
            </button>
            {done && fault !== "none" && !defense && (
              <button className="rewind-btn" onClick={rewind} disabled={busy}>
                ↺ REWIND &amp; ADD DEFENSE
              </button>
            )}
            {mode === "compare" && (
              <button className="mini-btn" onClick={() => setMode("single")}>
                ← back to timeline
              </button>
            )}
            {[0.5, 1, 2].map((s) => (
              <button key={s} className="mini-btn" data-on={speed === s} onClick={() => setSpeed(s)}>
                {s}×
              </button>
            ))}
          </>
        )}

        <span className={`status-chip s-${status}`}>
          <span className="sd" />
          {status === "ready"
            ? run === null && (fault !== "none" || defense)
              ? "READY — configuration selected"
              : "READY"
            : status === "running"
              ? "EXECUTING RUN"
              : status === "playing"
                ? "REPLAYING TRACE"
                : status === "paused"
                  ? "PAUSED"
                  : "RUN COMPLETE"}
        </span>

        {defense === "guardrail_checker" && (
          <span className="oracle-note">
            ⚠ oracle-assisted — reads simulator ground truth, not deployable
          </span>
        )}
      </div>

      {!run ? (
        <div className="idle">
          <div className="idle-term">
            <div className="term-bar">
              <span className="dot" />
              live agent trace
              <span className="right">idle</span>
            </div>
            <div className="idle-body">
              <div className="idle-line">Waiting for run…</div>
              <div className="idle-sub">
                Choose a fault and a defense, then press{" "}
                <b>{fault === "none" ? "RUN BASELINE" : "BREAK THE AGENT"}</b>.
              </div>
              <div className="idle-sub dim">
                Nothing has been executed. No results are shown until a run completes.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {mode === "compare" && data!.defended ? (
            <Counterfactual data={data!} />
          ) : (
          <div className="stage">
            <div className="term">
              <div className="term-bar">
                <span className={`dot${playing ? " live" : ""}`} />
                live agent trace · {arm}
                {(() => {
                  // A sticky header stops holding once its group scrolls past, so
                  // the injection point also gets a permanent marker here. Clicking
                  // it jumps back to the step.
                  const fg = groups.find((g) => g.status === "fault");
                  return fg ? (
                    <button
                      className="fault-jump"
                      onClick={() => {
                        setManual((m) => ({ ...m, [fg.step]: true }));
                        document
                          .querySelector(`[data-step="${fg.step}"]`)
                          ?.scrollIntoView({ block: "center", behavior: "smooth" });
                      }}
                    >
                      ⚡ fault at step {String(fg.step).padStart(2, "0")}
                    </button>
                  ) : null;
                })()}
                <span className="right">
                  {groups.length} steps · {Math.max(0, cursor + 1)}/{events.length} events ·{" "}
                  {run.trace.filter(isNoise).length} wait-for-traffic ticks hidden
                </span>
              </div>
              <div className="term-body" ref={bodyRef}>
                {groups.map((g) => {
                  const current = g.step === currentStep;
                  const open = manual[g.step] ?? (current || isNotable(g));
                  return (
                    <div
                      key={g.step}
                      className={`grp st-${g.status}${current ? " cur" : ""}`}
                      data-step={g.step}
                      ref={current ? currentRef : undefined}
                    >
                      <button
                        className="grp-hd"
                        onClick={() => setManual((m) => ({ ...m, [g.step]: !open }))}
                      >
                        <span className="chev">{open ? "▾" : "▸"}</span>
                        <span className="gs">{STATUS_GLYPH[g.status]}</span>
                        <span className="gt">
                          <b>Step {String(g.step).padStart(2, "0")}</b> — {g.title}
                          {g.summary && <span className="gsum">{g.summary}</span>}
                        </span>
                        <span className="gmeta">
                          {g.badges.map((b) => (
                            <span key={b} className="badge">
                              {b}
                            </span>
                          ))}
                          <span className="cnt">{g.events.length} events</span>
                        </span>
                      </button>
                      {open && (
                        <div className="grp-body">
                          {g.events.map((e, i) => (
                            <div
                              key={e.id}
                              className={`${lineClass(e)}${
                                current && i === g.events.length - 1 ? " line-in" : ""
                              }`}
                            >
                              <span className="n">{String(e.step).padStart(2, "0")}</span>
                              <span className="g">{glyph(e)}</span>
                              <span className="t">
                                <b>{e.type.replace(/_/g, " ")}</b> — {e.summary}
                                {e.isFaultOrigin && e.detail ? ` · ${e.detail}` : ""}
                              </span>
                            </div>
                          ))}
                          {current && playing && <div className="cursor-row" />}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="health green">
                <h3>
                  What monitoring sees <span>every row computed from this run</span>
                </h3>
                <HRow k="Observations delivered" v={`${seen.filter((e) => e.type === "observation").length}/${run.trace.filter((e) => e.type === "observation").length}`} />
                <HRow k="Malformed payloads" v="0" />
                <HRow k="Agent exceptions" v="0" />
                <HRow k="Run completed" v={`${done ? run.config.maxSteps : Math.max(0, (seen.at(-1)?.step ?? 0) + 1)}/${run.config.maxSteps} steps`} />
                <HRow k="Agent's own guardrail check" v="passed" />
              </div>

              <div className="health red">
                <h3>
                  What it misses <span>same run, semantic layer</span>
                </h3>
                <HRow k="Contaminated memories" v={String(live.contaminated)} bad={live.contaminated > 0} />
                <HRow k="Tainted decisions" v={String(live.decisions)} bad={live.decisions > 0} />
                <HRow k="Tainted external actions" v={String(live.actions)} bad={live.actions > 0} />
                <HRow
                  k="Fault detected"
                  v={!live.injected ? "—" : live.detected ? "YES" : "NO"}
                  bad={live.injected && !live.detected}
                  ok={live.detected}
                />
                <div className="hrow">
                  <span className="k">Goal fidelity</span>
                  <span className="fid">
                    {done ? (
                      <>
                        <span className="was">{data!.baseline.summary.goalFidelity}</span>
                        <span style={{ color: "var(--ink-faint)" }}> → </span>
                        <span
                          style={{
                            color:
                              run.summary.goalFidelity >= data!.baseline.summary.goalFidelity - 4
                                ? "var(--ok)"
                                : "var(--bad)",
                          }}
                        >
                          {run.summary.goalFidelity}
                        </span>
                      </>
                    ) : (
                      <span style={{ color: "var(--ink-faint)" }}>— scored at run end</span>
                    )}
                  </span>
                  <span className="s" />
                </div>
              </div>

              <div className="panel">
                <h2>
                  Semantic blast radius
                  <em>{arm === "baseline" ? "control arm — nothing to trace" : "lineage from the injection point"}</em>
                </h2>
                <div className="body">
                  <Tree
                    nodes={arm === "defended" ? data!.defendedGraph : arm === "chaos" ? data!.graph : []}
                    revealed={new Set(seen.map((e) => e.id))}
                    rootLabel={
                      arm !== "baseline" && data!.fault
                        ? `${data!.fault.label} → ${data!.fault.targetLabel}`
                        : "no fault injected"
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          )}

          {mode !== "compare" && arm === "defended" && data!.defended && (
            <div className="panel" style={{ marginTop: 16 }}>
              <h2>
                Same fault, one invariant<em>{DEFENSES.find((d) => d.id === defense)?.label}</em>
              </h2>
              <div className="cmp">
                <div className="hd" />
                <div className="hd">without defense</div>
                <div className="hd">with defense</div>
                <Cmp
                  label="Goal fidelity"
                  a={data!.chaos.summary.goalFidelity}
                  b={data!.defended.summary.goalFidelity}
                />
                <Cmp
                  label="Contaminated memories"
                  a={data!.chaos.summary.memoryContamination}
                  b={data!.defended.summary.memoryContamination}
                />
                <Cmp
                  label="Tainted decisions / actions"
                  a={`${data!.chaos.summary.affectedDecisions} / ${data!.chaos.summary.affectedActions}`}
                  b={`${data!.defended.summary.affectedDecisions} / ${data!.defended.summary.affectedActions}`}
                />
                <Cmp
                  label="Fault detected"
                  a={data!.chaos.summary.faultDetected ? "YES" : "NO"}
                  b={data!.defended.summary.faultDetected ? "YES" : "NO"}
                />
                <Cmp
                  label="Guardrails breached"
                  a={data!.chaos.summary.guardrailViolations.length}
                  b={data!.defended.summary.guardrailViolations.length}
                />
              </div>
            </div>
          )}

          <div className="stage" style={{ marginTop: 16 }}>
            <div className="panel">
              <h2>
                The fault<em>{arm === "baseline" ? "control run — nothing injected" : data!.fault?.label}</em>
              </h2>
              <div className="body">
                {arm !== "baseline" && data!.fault ? (
                  <>
                    <div className="fault-detail">
                      <div className="why">{data!.fault.plausibility}</div>
                    </div>
                    <FaultDiff run={data!.chaos} />
                  </>
                ) : (
                  <div style={{ color: "var(--ink-dim)", fontSize: 12.5 }}>
                    The control arm runs the same agent against the same world with nothing
                    perturbed. It is the only reason the faulted numbers mean anything.
                  </div>
                )}
              </div>
            </div>

            <div className="panel">
              <h2>
                Real-model probes<em>opus 5 · gpt-5.6 sol / luna</em>
              </h2>
              <div className="probe">
                <span className="phd">Easy — single-turn caveat omission</span>
                <span className="pn">4 models × N=10</span>
                <span className="k">Contaminated durable memory</span>
                <span className="v ok">0 / 40</span>
                <span className="fine">Too easy to expose the failure, so we went looking for where it gets hard.</span>

                <span className="phd">Hard — inherited memory drift</span>
                <span className="pn">drifted arm · 3 models × 2 scenarios · N=18</span>
                <span className="k">Initially preferred the corrupted lever</span>
                <span className="v bad">12 / 18</span>
                <span className="k">Retrieved the source record</span>
                <span className="v ok">18 / 18</span>
                <span className="k">Reversed after retrieving it</span>
                <span className="v ok">12 / 18</span>
                <span className="k">Harmful final decision</span>
                <span className="v ok">0 / 18</span>

                <div className="verdict">
                  The corrupted memory changed what the models wanted to do. Provenance changed what they did.
                </div>
                <div className="fine">
                  One population, N=18. The twelve that reached for the corrupted lever are
                  exactly the twelve that reversed: Sol 6/6 and Luna 6/6 preferred it first and
                  all changed after retrieving the source; Opus 5 never preferred it (0/6).
                  Source retrieval ran 18/18 here against 4/12 when the caveat was intact —
                  the models initiated it themselves, so this shows provenance <em>access</em>
                  enabling recovery, not that our invariant caused it. Neither scenario was
                  tuned after results were seen. Full audit in runs/llm-hard-demo/AUDIT.md.
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Two futures from one fault. Everything shown is trace-derived: the shared
 * prefix is measured, and each branch lists only the events that actually
 * differ, so this is a comparison rather than two logs printed next to each other.
 */
function Counterfactual({ data }: { data: Comparison }) {
  const A = data.chaos.trace.filter((e) => !isNoise(e));
  const B = data.defended!.trace.filter((e) => !isNoise(e));
  const pre = sharedPrefix(A, B);
  const branch = (t: TraceEvent[]) =>
    t.slice(pre.count).filter((e) => e.faultIds.length > 0 || e.type === "fault_detection" || e.type === "recovery" || e.type === "action").slice(0, 6);

  const cs = data.chaos.summary;
  const ds = data.defended!.summary;
  const metric = (label: string, a: number | string, b: number | string, better: "low" | "high") => {
    const good = better === "low" ? Number(b) <= Number(a) : Number(b) >= Number(a);
    return (
      <div className="cf-metric" key={label}>
        <div className="cf-label">{label}</div>
        <div className="cf-nums">
          <span className="bad">{a}</span>
          <span className="arrow">→</span>
          <span className={good ? "ok" : "bad"}>{b}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="cf">
      <div className="cf-prefix">
        {pre.includesFault ? (
          <>
            <b>SHARED HISTORY</b> — the first {pre.count} events are identical through step{" "}
            {String(pre.lastStep).padStart(2, "0")}, <em>including the injection itself</em>. Same
            agent, same fault, same history. Only the defense differs after this point.
          </>
        ) : (
          <>
            <b>MATCHED REPLAY</b> — same fault, alternate defense. These two runs are{" "}
            <em>not</em> identical up to the injection: the invariant fires earlier in the run, so
            the arms separate at event {pre.count} before the fault lands. Not a clean
            counterfactual — read it as two runs of the same scenario.
          </>
        )}
      </div>

      <div className="cf-split">
        <div className="cf-branch bad">
          <h4>No defense</h4>
          {branch(A).map((e) => (
            <div key={e.id} className={`cf-ev ${e.faultIds.length ? (e.type === "action" ? "harm" : "taint") : ""}`}>
              <span className="cf-g">{glyph(e)}</span>
              <span className="cf-s">s{String(e.step).padStart(2, "0")}</span>
              <span>{e.summary}</span>
            </div>
          ))}
        </div>
        <div className="cf-mid">
          <div className="cf-node">⚡</div>
          <div className="cf-line" />
          <div className="cf-caption">divergence</div>
        </div>
        <div className="cf-branch ok">
          <h4>{DEFENSES.find((d) => d.id === data.defended!.config.defenses[0])?.label}</h4>
          {branch(B).map((e) => (
            <div key={e.id} className={`cf-ev ${e.type === "fault_detection" || e.type === "recovery" ? "save" : ""}`}>
              <span className="cf-g">{glyph(e)}</span>
              <span className="cf-s">s{String(e.step).padStart(2, "0")}</span>
              <span>{e.summary}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="cf-metrics">
        {metric("Goal fidelity", cs.goalFidelity, ds.goalFidelity, "high")}
        {metric("Contaminated memories", cs.memoryContamination, ds.memoryContamination, "low")}
        {metric("Tainted decisions", cs.affectedDecisions, ds.affectedDecisions, "low")}
        {metric("Guardrails breached", cs.guardrailViolations.length, ds.guardrailViolations.length, "low")}
        {metric("Fault detected", cs.faultDetected ? "yes" : "no", ds.faultDetected ? "yes" : "no", "high")}
      </div>
      <div className="cf-foot">
        Control run with no fault scores {data.baseline.summary.goalFidelity}. Both arms above ran
        the same deterministic agent against the same world.
      </div>
    </div>
  );
}

function HRow({ k, v, bad, ok }: { k: string; v: string; bad?: boolean; ok?: boolean }) {
  return (
    <div className="hrow">
      <span className="k">{k}</span>
      <span className="v" style={ok ? { color: "var(--ok)" } : undefined}>
        {v}
      </span>
      <span className="s" style={ok ? { color: "var(--ok)" } : undefined}>
        {bad ? "✗" : ok ? "✓" : v === "—" ? "" : "✓"}
      </span>
    </div>
  );
}

function Cmp({ label, a, b }: { label: string; a: string | number; b: string | number }) {
  return (
    <>
      <div className="lbl">{label}</div>
      <div className="a">{a}</div>
      <div className="b">{b}</div>
    </>
  );
}

function FaultDiff({ run }: { run: RunResult }) {
  const f = run.faults[0];
  if (!f) return null;
  const fmt = (v: unknown) =>
    typeof v === "object" && v !== null
      ? Object.entries(v as Record<string, unknown>)
          .map(
            ([k, val]) =>
              `${k}: ${typeof val === "object" && val !== null ? JSON.stringify(val).replace(/[{}"[\]]/g, "").replace(/,/g, "  ") : String(val)}`
          )
          .join("\n")
      : String(v);
  return (
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
  );
}

/** Lineage tree. Nodes light up only once playback has reached them. */
function Tree({
  nodes,
  revealed,
  rootLabel,
}: {
  nodes: GraphNode[];
  revealed: Set<string>;
  rootLabel: string;
}) {
  if (nodes.length === 0)
    return (
      <div style={{ color: "var(--ink-faint)", fontSize: 12.5 }}>
        Nothing inherited a fault in this run.
      </div>
    );

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const childOf = new Set(nodes.flatMap((n) => n.children));
  const roots = nodes.filter((n) => !childOf.has(n.id));
  const seen = new Set<string>();

  const render = (n: GraphNode, depth: number, last: boolean): React.ReactNode[] => {
    if (seen.has(n.id) || depth > 7) return [];
    seen.add(n.id);
    const on = revealed.has(n.id);
    const pad = depth === 0 ? "" : "│  ".repeat(depth - 1) + (last ? "└─ " : "├─ ");
    const rows: React.ReactNode[] = [
      <div
        key={n.id}
        className={`node${n.quarantined ? " q" : ""}`}
        style={on ? undefined : { color: "#2b3242" }}
        title={n.label}
      >
        {pad}
        <span className="t" style={on ? undefined : { color: "#2b3242" }}>
          s{String(n.step).padStart(2, "0")} {n.type.replace(/_/g, " ")} ·{" "}
        </span>
        {n.quarantined ? "⊘ " : ""}
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
