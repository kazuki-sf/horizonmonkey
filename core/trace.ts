import type { Detection, TraceEvent, TraceEventType } from "./types";

// ============================================================================
// Trace recording.
//
// The only thing a scenario has to get right to be measurable by this harness:
// when it records an artifact, it names the artifacts that artifact was derived
// from. Everything downstream — taint, blast radius, contamination counts —
// falls out of those edges.
//
// Ids are deliberately caller-visible. A memory written as `mem_9` is recorded
// as the trace event `mem_9`, so provenance can be expressed in the scenario's
// own vocabulary instead of a parallel id space.
// ============================================================================

export class TraceRecorder {
  readonly events: TraceEvent[] = [];
  readonly detections: Detection[] = [];
  private seq = 0;

  /** Mint a fresh artifact id with a caller-chosen prefix, e.g. `mem_9`. */
  id(prefix: string) {
    return `${prefix}_${++this.seq}`;
  }

  record(e: Omit<TraceEvent, "faultIds"> & { faultIds?: string[] }): string {
    this.events.push({ ...e, faultIds: e.faultIds ?? [] });
    return e.id;
  }

  /**
   * Log a defense activation. `faultIds` empty means the check fired on a clean
   * artifact — a false positive, which is tracked rather than quietly dropped,
   * because an invariant that fires on everything would otherwise score
   * perfectly on every fault.
   */
  detect(d: Detection) {
    this.detections.push(d);
  }

  byType(type: TraceEventType) {
    return this.events.filter((e) => e.type === type);
  }
}
