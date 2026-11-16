import { describe, expect, it } from 'vitest';
import {
  bytesByType,
  frameStats,
  median,
  medianRecord,
  percentile,
  settledAt,
  summarizeTrace,
  totalBlockingTime,
  type TraceEvent,
} from './perf-stats.ts';

describe('percentile and median', () => {
  it('uses nearest rank', () => {
    const values = [5, 1, 4, 2, 3, 6, 7, 8, 9, 10];
    expect(percentile(values, 50)).toBe(5);
    expect(percentile(values, 95)).toBe(10);
    expect(percentile([], 95)).toBe(0);
  });

  it('takes the middle, or the mean of the two middles', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(
      medianRecord([
        { a: 1, b: 10 },
        { a: 3, b: 30 },
        { a: 2, b: 20 },
      ]),
    ).toEqual({
      a: 2,
      b: 20,
    });
  });
});

describe('frameStats', () => {
  it('reports fps and the share of slow frames', () => {
    const deltas = [...Array<number>(18).fill(16.7), 40, 60];
    const stats = frameStats(deltas);
    expect(stats.frames).toBe(20);
    expect(stats.fps).toBeCloseTo((1000 * 20) / (18 * 16.7 + 100), 5);
    expect(stats.p50Ms).toBe(16.7);
    expect(stats.over33Pct).toBe(10);
    expect(stats.over50Pct).toBe(5);
  });

  it('is all zeros without frames', () => {
    expect(frameStats([])).toMatchObject({ frames: 0, fps: 0, over33Pct: 0 });
  });
});

describe('totalBlockingTime', () => {
  it('counts the part of each long task over 50 ms inside the window', () => {
    const tasks = [
      { startTime: 0, duration: 200 }, // before FCP except 100..200 → 100 ms in window, 50 blocking
      { startTime: 300, duration: 120 }, // 70 blocking
      { startTime: 500, duration: 40 }, // not a long task
      { startTime: 900, duration: 300 }, // ends after `to` at 1000 → 100 in window, 50 blocking
    ];
    expect(totalBlockingTime(tasks, 100, 1000)).toBe(170);
  });
});

describe('network', () => {
  const requests = [
    { url: 'https://soulsbuilds.com/', type: 'Document', endMs: 120, bytes: 2000 },
    {
      url: 'https://soulsbuilds.com/assets/index-abc.js',
      type: 'Script',
      endMs: 600,
      bytes: 90000,
    },
    {
      url: 'https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel?VER=8',
      type: 'XHR',
      endMs: 9000,
      bytes: 500,
    },
    { url: 'https://soulsbuilds.com/assets/icons/1.webp', type: 'Image', endMs: 1400, bytes: 8000 },
    { url: 'https://soulsbuilds.com/assets/icons/2.webp', type: 'Image', endMs: null, bytes: 0 },
  ];

  it('settles at the last finished request that is not a Firestore stream', () => {
    expect(settledAt(requests)).toBe(1400);
  });

  it('sums bytes by type', () => {
    expect(bytesByType(requests)).toEqual({
      total: 100500,
      Document: 2000,
      Script: 90000,
      XHR: 500,
      Image: 8000,
    });
  });
});

describe('summarizeTrace', () => {
  const MAIN = 7;
  const IFRAME = 9;
  const ev = (e: Partial<TraceEvent> & { name: string }): TraceEvent => ({
    ph: 'X',
    pid: MAIN,
    tid: 1,
    ts: 0,
    ...e,
  });
  const events: TraceEvent[] = [
    ev({
      name: 'TracingStartedInBrowser',
      ph: 'I',
      pid: 1,
      args: { data: { frames: [{ processId: MAIN }, { processId: IFRAME, parent: 'x' }] } },
    }),
    ev({ name: 'thread_name', ph: 'M', args: { name: 'CrRendererMain' } }),
    ev({ name: 'thread_name', ph: 'M', tid: 2, args: { name: 'Compositor' } }),
    ev({ name: 'thread_name', ph: 'M', pid: IFRAME, args: { name: 'CrRendererMain' } }),
    ev({ name: 'Paint', dur: 4000 }),
    ev({ name: 'Paint', dur: 2000 }),
    ev({ name: 'Paint', dur: 9000, pid: IFRAME }), // another renderer: ignored
    ev({ name: 'Paint', dur: 9000, tid: 2 }), // not the main thread: ignored
    ev({ name: 'Layout', dur: 1500 }),
    ev({ name: 'UpdateLayoutTree', dur: 500 }),
    ev({ name: 'RunTask', dur: 80_000 }),
    ev({ name: 'RunTask', dur: 20_000 }),
    ev({ name: 'RasterTask', dur: 3000, tid: 5 }),
    ev({ name: 'RasterTask', dur: 1000, pid: 2 }),
    ev({ name: 'process_name', ph: 'M', pid: 3, args: { name: 'GPU Process' } }),
    ev({ name: 'thread_name', ph: 'M', pid: 3, tid: 4, args: { name: 'CrGpuMain' } }),
    ev({ name: 'RunTask', dur: 12_000, pid: 3, tid: 4 }),
    ev({ name: 'RunTask', dur: 5000, pid: 3, tid: 6 }), // another GPU-process thread: ignored
    ev({
      name: 'PipelineReporter',
      ph: 'b',
      args: { frame_reporter: { state: 'STATE_PRESENTED_ALL' } },
    }),
    ev({
      name: 'PipelineReporter',
      ph: 'b',
      args: { chrome_frame_reporter: { state: 'STATE_PRESENTED_ALL' } },
    }),
    ev({
      name: 'PipelineReporter',
      ph: 'b',
      args: { chrome_frame_reporter: { state: 'STATE_PRESENTED_PARTIAL' } },
    }),
    ev({
      name: 'PipelineReporter',
      ph: 'b',
      args: { chrome_frame_reporter: { state: 'STATE_DROPPED' } },
    }),
    ev({
      name: 'PipelineReporter',
      ph: 'b',
      args: { chrome_frame_reporter: { state: 'STATE_NO_UPDATE_DESIRED' } },
    }),
  ];

  it('totals the main frame renderer’s rendering steps, raster, long tasks and dropped frames', () => {
    expect(summarizeTrace(events)).toEqual({
      styleMs: 0.5,
      layoutMs: 1.5,
      prePaintMs: 0,
      paintMs: 6,
      layerizeMs: 0,
      commitMs: 0,
      rasterMs: 4,
      gpuMs: 12,
      longTasks: 1,
      longTaskMs: 80,
      framesPresented: 3,
      framesDropped: 1,
      droppedPct: 25,
    });
  });
});
