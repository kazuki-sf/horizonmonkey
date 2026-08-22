import type { TraceEvent } from "./types";

// ============================================================================
// Taint propagation and blast radius.
//
// This is dependency lineage, not causal attribution. An event is "tainted" when
// it was derived, transitively, from a corrupted artifact. That is a strictly
// weaker claim than "the fault caused this decision" — but unlike post-hoc
// attribution, it is exact and cheap, because the injector knows the ground truth.
// ============================================================================

/** Forward-propagate fault ids across the trace's provenance edges. */
export function propagate(trace: TraceEvent[]): TraceEvent[] {
  const taint = new Map<string, Set<string>>();
  for (const ev of trace) {
    const own = new Set(ev.faultIds);
    if (!ev.quarantined) {
      for (const src of ev.inputIds) for (const f of taint.get(src) ?? []) own.add(f);
    }
    taint.set(ev.id, own);
    ev.faultIds = [...own].sort();
  }
  return trace;
}

export type GraphNode = {
  id: string;
  label: string;
  type: TraceEvent["type"];
  step: number;
  tainted: boolean;
  quarantined: boolean;
  children: string[];
};

/** Build the fault-rooted subgraph: only nodes carrying taint. */
/** Idle ticks inherit taint but are not artifacts; they only add noise here. */
const NOISE: TraceEvent["type"][] = ["evaluation"];

export function blastGraph(trace: TraceEvent[]): GraphNode[] {
  const tainted = trace.filter((e) => e.faultIds.length > 0 && !NOISE.includes(e.type));
  const ids = new Set(tainted.map((e) => e.id));
  return tainted.map((e) => ({
    id: e.id,
    label: e.summary,
    type: e.type,
    step: e.step,
    tainted: true,
    quarantined: Boolean(e.quarantined),
    children: trace
      .filter((c) => c.inputIds.includes(e.id) && ids.has(c.id))
      .map((c) => c.id),
  }));
}

/** Extract the per-step action signature used for baseline comparison. */
export function decisionSignature(trace: TraceEvent[]): (string | null)[] {
  const out: (string | null)[] = [];
  for (const ev of trace) {
    if (ev.type !== "action") continue;
    out[ev.step] = String(ev.metadata?.key ?? ev.summary);
  }
  return out;
}

/** First step at which two runs choose materially different actions. */
export function firstDivergence(baseline: TraceEvent[], chaos: TraceEvent[]): number | null {
  const a = decisionSignature(baseline);
  const b = decisionSignature(chaos);
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    if (a[i] === undefined && b[i] === undefined) continue;
    if (a[i] !== b[i]) return i;
  }
  return null;
}
