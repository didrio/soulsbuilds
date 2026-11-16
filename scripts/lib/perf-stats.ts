// Pure number crunching for `npm run perf` (scripts/perf.mjs): frame times, Total Blocking Time, when the
// network settled, and a Chrome trace summary. Runs directly under Node 24 (type stripping) and in Vitest.

/** The `p`-th percentile (0–100) of `values`, nearest-rank. 0 for an empty list. */
export function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(sorted.length - 1, Math.max(0, rank - 1))] ?? 0;
}

export function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? (sorted[mid] ?? 0) : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

/** Key-by-key median of several runs' flat number records (keys from the first run). */
export function medianRecord<T extends Record<string, number>>(runs: T[]): T {
  const first = runs[0];
  if (!first) return {} as T;
  const out: Record<string, number> = {};
  for (const key of Object.keys(first)) out[key] = median(runs.map((run) => run[key] ?? 0));
  return out as T;
}

export interface FrameStats {
  frames: number;
  fps: number;
  p50Ms: number;
  p95Ms: number;
  /** Share of frames (%) slower than 33 ms (a visible hitch at any refresh rate) and 50 ms. */
  over33Pct: number;
  over50Pct: number;
}

/** Stats for the intervals between consecutive requestAnimationFrame callbacks during a scroll. */
export function frameStats(deltasMs: number[]): FrameStats {
  const total = deltasMs.reduce((sum, d) => sum + d, 0);
  const share = (limit: number) =>
    deltasMs.length ? (100 * deltasMs.filter((d) => d > limit).length) / deltasMs.length : 0;
  return {
    frames: deltasMs.length,
    fps: total ? (1000 * deltasMs.length) / total : 0,
    p50Ms: percentile(deltasMs, 50),
    p95Ms: percentile(deltasMs, 95),
    over33Pct: share(33.4),
    over50Pct: share(50),
  };
}

/**
 * Total Blocking Time: for each long task (> 50 ms) between `from` (FCP) and `to`, the part over 50 ms.
 * Tasks straddling a bound only count their part inside the window.
 */
export function totalBlockingTime(
  tasks: { startTime: number; duration: number }[],
  from: number,
  to: number,
): number {
  let tbt = 0;
  for (const { startTime, duration } of tasks) {
    const start = Math.max(startTime, from);
    const end = Math.min(startTime + duration, to);
    if (duration > 50 && end > start) tbt += Math.max(0, end - start - 50);
  }
  return tbt;
}

/** Firestore's streaming channels (Listen/Write long-polls) never "finish loading" for good. */
export function isStreamingChannel(url: string): boolean {
  return /\/google\.firestore\.v1\.Firestore\/(Listen|Write)\/channel/.test(url);
}

export interface RequestRecord {
  url: string;
  type: string;
  /** ms after navigation start; null if it never finished. */
  endMs: number | null;
  bytes: number;
}

/** When the last request that isn't a Firestore stream finished (ms after navigation start). */
export function settledAt(requests: RequestRecord[]): number {
  let last = 0;
  for (const r of requests) {
    if (r.endMs !== null && !isStreamingChannel(r.url)) last = Math.max(last, r.endMs);
  }
  return last;
}

/** Transfer size (bytes over the wire) by resource type, plus a `total`. */
export function bytesByType(requests: RequestRecord[]): Record<string, number> {
  const out: Record<string, number> = { total: 0 };
  for (const { type, bytes } of requests) {
    out[type] = (out[type] ?? 0) + bytes;
    out.total = (out.total ?? 0) + bytes;
  }
  return out;
}

/** A Chrome trace event (the subset this summary reads). */
export interface TraceEvent {
  name: string;
  ph: string;
  pid: number;
  tid: number;
  ts: number;
  dur?: number;
  args?: {
    name?: string;
    data?: { frames?: { processId?: number; parent?: string }[] };
    /** Chrome's frame reporter (the key was `chrome_frame_reporter` in older versions). */
    frame_reporter?: { state?: string };
    chrome_frame_reporter?: { state?: string };
  };
}

export interface TraceSummary {
  /** Main-thread time (ms) in each rendering step of the page's renderer. */
  styleMs: number;
  layoutMs: number;
  prePaintMs: number;
  paintMs: number;
  layerizeMs: number;
  commitMs: number;
  /** Tile rasterization, any thread or process. */
  rasterMs: number;
  /** Busy time of the GPU process's main thread (raster and compositing on the GPU). */
  gpuMs: number;
  /** Main-thread tasks over 50 ms: count and summed duration. */
  longTasks: number;
  longTaskMs: number;
  /** Frames the compositor produced vs dropped (Chrome's frame reporter), and the dropped share (%). */
  framesPresented: number;
  framesDropped: number;
  droppedPct: number;
}

const STEP_EVENTS: Record<string, keyof TraceSummary> = {
  UpdateLayoutTree: 'styleMs',
  Layout: 'layoutMs',
  PrePaint: 'prePaintMs',
  Paint: 'paintMs',
  Layerize: 'layerizeMs',
  Commit: 'commitMs',
};

/** The renderer process of the page's main frame (not iframes such as reCAPTCHA). */
function mainRendererPid(events: TraceEvent[]): number | undefined {
  for (const e of events) {
    if (e.name !== 'TracingStartedInBrowser') continue;
    const main = e.args?.data?.frames?.find((f) => !f.parent);
    if (main?.processId) return main.processId;
  }
  // Fallback: the process that painted the most.
  const paints = new Map<number, number>();
  for (const e of events) if (e.name === 'Paint') paints.set(e.pid, (paints.get(e.pid) ?? 0) + 1);
  return [...paints.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

/** Summarize a Chrome performance trace (devtools.timeline categories) of a scroll. */
export function summarizeTrace(events: TraceEvent[]): TraceSummary {
  const summary: TraceSummary = {
    styleMs: 0,
    layoutMs: 0,
    prePaintMs: 0,
    paintMs: 0,
    layerizeMs: 0,
    commitMs: 0,
    rasterMs: 0,
    gpuMs: 0,
    longTasks: 0,
    longTaskMs: 0,
    framesPresented: 0,
    framesDropped: 0,
    droppedPct: 0,
  };
  const pid = mainRendererPid(events);
  const mainTid = events.find(
    (e) => e.pid === pid && e.name === 'thread_name' && e.args?.name === 'CrRendererMain',
  )?.tid;
  const gpuPid = events.find(
    (e) => e.name === 'process_name' && e.args?.name === 'GPU Process',
  )?.pid;
  const gpuTid = events.find(
    (e) => e.pid === gpuPid && e.name === 'thread_name' && e.args?.name === 'CrGpuMain',
  )?.tid;

  for (const e of events) {
    const ms = (e.dur ?? 0) / 1000;
    if (e.name === 'RasterTask' && e.ph === 'X') summary.rasterMs += ms;
    if (e.name === 'RunTask' && e.ph === 'X' && e.pid === gpuPid && e.tid === gpuTid)
      summary.gpuMs += ms;
    if (e.name === 'PipelineReporter' && e.ph === 'b' && e.pid === pid) {
      const state = (e.args?.frame_reporter ?? e.args?.chrome_frame_reporter)?.state;
      if (state === 'STATE_DROPPED') summary.framesDropped += 1;
      else if (state === 'STATE_PRESENTED_ALL' || state === 'STATE_PRESENTED_PARTIAL')
        summary.framesPresented += 1;
    }
    if (e.pid !== pid || e.tid !== mainTid || e.ph !== 'X') continue;
    const key = STEP_EVENTS[e.name];
    if (key) summary[key] += ms;
    if (e.name === 'RunTask' && ms > 50) {
      summary.longTasks += 1;
      summary.longTaskMs += ms;
    }
  }
  const frames = summary.framesPresented + summary.framesDropped;
  summary.droppedPct = frames ? (100 * summary.framesDropped) / frames : 0;
  return summary;
}
