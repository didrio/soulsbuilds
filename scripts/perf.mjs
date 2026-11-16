#!/usr/bin/env node
// Measures how a page loads and how smoothly it scrolls, with the installed Chrome (T21). Headed by
// default: a visible window composites on the real GPU, which is what a visitor sees (headless overstates
// paint). Desktop is 1440×900 at devicePixelRatio 2 (a Retina Mac).
//
//   npm run perf -- <url or /route> [--load-more N] [--cpu 4] [--mobile] [--runs 3] [--warm]
//                   [--off grain,bg,dropshadow,shadows,all] [--wait 6000] [--headless] [--label name]
//                   [--list]   (also print the largest requests)
//
//   npm run perf -- https://soulsbuilds.com/ --load-more 3          (production, read-only page loads)
//   npm run perf -- /build/SEEDBLEED001 --cpu 4                     (BASE_URL, default the dev server)
//
// Per run: load (LCP, CLS, TBT, settled = last request that isn't a Firestore stream, bytes by type), then
// a fast scroll to the bottom and back (CDP synthesizeScrollGesture, like Chrome's own smoothness
// benchmarks): rAF frame times + a performance trace (rendering steps, long tasks, dropped frames).
// Prints the median of the runs; saves the results and the last run's trace (open it in DevTools →
// Performance → Load profile) under .perf/.
// Functions passed to page.evaluate/addInitScript run in the browser.
/* global window, document, requestAnimationFrame */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { chromium } from 'playwright-core';
import { CHROME } from './lib/chrome.mjs';
import {
  bytesByType,
  frameStats,
  medianRecord,
  settledAt,
  summarizeTrace,
  totalBlockingTime,
} from './lib/perf-stats.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5180';

const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
  mobile: {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
};

// `--off` switches one suspect off with injected CSS, to measure what it costs before changing code.
// Selectors follow src/theme/GlobalStyle.ts and the in-world styles; keep them in sync.
const OFF = {
  grain: 'body::after { display: none !important; }',
  bg: 'body::before { display: none !important; }',
  dropshadow: 'img { filter: none !important; }',
  shadows: '* { box-shadow: none !important; }',
};

const SCROLL_SPEED = 6000; // px/s: a fast flick-scroll
const TRACE_CATEGORIES = [
  'devtools.timeline',
  'disabled-by-default-devtools.timeline',
  'disabled-by-default-devtools.timeline.frame',
  'toplevel',
  'cc',
  'benchmark',
].join(',');

function parseArgs(argv) {
  const opts = {
    url: null,
    loadMore: 0,
    cpu: 1,
    mobile: false,
    runs: 3,
    warm: false,
    off: [],
    wait: 6000,
    headless: false,
    label: null,
    list: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => argv[(i += 1)];
    if (arg === '--load-more') opts.loadMore = Number(next());
    else if (arg === '--cpu') opts.cpu = Number(next());
    else if (arg === '--mobile') opts.mobile = true;
    else if (arg === '--runs') opts.runs = Number(next());
    else if (arg === '--warm') opts.warm = true;
    else if (arg === '--off') opts.off = next().split(',');
    else if (arg === '--wait') opts.wait = Number(next());
    else if (arg === '--headless') opts.headless = true;
    else if (arg === '--label') opts.label = next();
    else if (arg === '--list') opts.list = true;
    else if (arg === '--help' || arg === '-h') opts.help = true;
    else if (!arg.startsWith('--')) opts.url = arg;
    else throw new Error(`Unknown option ${arg}`);
  }
  if (opts.off.includes('all')) opts.off = Object.keys(OFF);
  for (const name of opts.off) if (!OFF[name]) throw new Error(`Unknown --off ${name}`);
  if (!opts.url) opts.help = true;
  else if (opts.url.startsWith('/')) opts.url = `${BASE_URL}${opts.url}`;
  return opts;
}

/** Records every request over CDP (cross-origin sizes included) with times relative to the navigation. */
function trackNetwork(cdp) {
  const requests = new Map();
  let t0 = null;
  cdp.on('Network.requestWillBeSent', ({ requestId, request, type, timestamp }) => {
    if (t0 === null && type === 'Document') t0 = timestamp;
    if (!requests.has(requestId))
      requests.set(requestId, { url: request.url, type: type ?? 'Other', endMs: null, bytes: 0 });
  });
  cdp.on('Network.loadingFinished', ({ requestId, timestamp, encodedDataLength }) => {
    const r = requests.get(requestId);
    if (r && t0 !== null)
      Object.assign(r, { endMs: (timestamp - t0) * 1000, bytes: encodedDataLength });
  });
  cdp.on('Network.loadingFailed', ({ requestId }) => requests.delete(requestId));
  return () => [...requests.values()];
}

// Runs in the page before any script: buffers paint, LCP, layout shifts and long tasks.
function observeVitals() {
  const vitals = { fcp: 0, lcp: 0, cls: 0, longTasks: [] };
  window.__vitals = vitals;
  const observe = (type, fn) => {
    try {
      new PerformanceObserver((list) => list.getEntries().forEach(fn)).observe({
        type,
        buffered: true,
      });
    } catch {
      // Entry type not supported: leave it at 0.
    }
  };
  observe('paint', (e) => e.name === 'first-contentful-paint' && (vitals.fcp = e.startTime));
  observe('largest-contentful-paint', (e) => (vitals.lcp = e.startTime));
  observe('layout-shift', (e) => !e.hadRecentInput && (vitals.cls += e.value));
  observe('longtask', (e) =>
    vitals.longTasks.push({ startTime: e.startTime, duration: e.duration }),
  );
}

async function readTrace(cdp) {
  const done = new Promise((resolve) => cdp.once('Tracing.tracingComplete', resolve));
  await cdp.send('Tracing.end');
  const { stream } = await done;
  let text = '';
  for (;;) {
    const { data, eof, base64Encoded } = await cdp.send('IO.read', { handle: stream });
    text += base64Encoded ? Buffer.from(data, 'base64').toString() : data;
    if (eof) break;
  }
  await cdp.send('IO.close', { handle: stream });
  const parsed = JSON.parse(text);
  return Array.isArray(parsed) ? parsed : parsed.traceEvents;
}

async function loadMore(page, times) {
  const button = page.getByRole('button', { name: /load more/i });
  for (let i = 0; i < times; i += 1) {
    const rows = await page.locator('a[href^="/build/"]').count();
    if (!(await button.isVisible().catch(() => false))) break;
    await button.click();
    await page
      .waitForFunction((n) => document.querySelectorAll('a[href^="/build/"]').length > n, rows, {
        timeout: 15_000,
      })
      .catch(() => {});
  }
}

async function measureOnce(browser, opts) {
  const context = await browser.newContext(opts.mobile ? VIEWPORTS.mobile : VIEWPORTS.desktop);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await page.addInitScript(observeVitals);
  if (opts.warm) {
    // Prime the HTTP cache with a first visit, so this run is a returning visitor's load.
    await page.goto(opts.url, { waitUntil: 'load' });
    await page.waitForTimeout(opts.wait);
  }
  await cdp.send('Network.enable');
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: opts.cpu });
  const requests = trackNetwork(cdp);

  // Not 'networkidle': Firestore keeps a streaming connection open, so the network never idles.
  await page.goto(opts.url, { waitUntil: 'load', timeout: 60_000 });
  await page.waitForTimeout(opts.wait);
  const vitals = await page.evaluate(() => window.__vitals);
  const reqs = requests();
  const settled = settledAt(reqs);
  const bytes = bytesByType(reqs);
  const load = {
    fcpMs: vitals.fcp,
    lcpMs: vitals.lcp,
    cls: vitals.cls,
    tbtMs: totalBlockingTime(vitals.longTasks, vitals.fcp, Math.max(settled, vitals.lcp)),
    settledMs: settled,
    requests: reqs.length,
    kbTotal: bytes.total / 1024,
    kbScript: (bytes.Script ?? 0) / 1024,
    kbImage: (bytes.Image ?? 0) / 1024,
  };

  if (opts.loadMore) await loadMore(page, opts.loadMore);
  for (const name of opts.off) await page.addStyleTag({ content: OFF[name] });
  await page.waitForTimeout(500);

  // Fast scroll to the bottom and back, recording rAF intervals and a trace.
  const distance = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  );
  await page.evaluate(() => {
    const deltas = [];
    let last = performance.now();
    window.__frames = deltas;
    window.__recording = true;
    const tick = (now) => {
      deltas.push(now - last);
      last = now;
      if (window.__recording) requestAnimationFrame(tick);
    };
    requestAnimationFrame((now) => {
      last = now;
      requestAnimationFrame(tick);
    });
  });
  await cdp.send('Tracing.start', {
    categories: TRACE_CATEGORIES,
    transferMode: 'ReturnAsStream',
  });
  const { width, height } = page.viewportSize();
  const gesture = {
    x: Math.round(width / 2),
    y: Math.round(height / 2),
    speed: SCROLL_SPEED,
    gestureSourceType: opts.mobile ? 'touch' : 'mouse',
  };
  if (distance > 0) {
    await cdp.send('Input.synthesizeScrollGesture', { ...gesture, yDistance: -distance });
    await cdp.send('Input.synthesizeScrollGesture', { ...gesture, yDistance: distance });
  }
  await page.waitForTimeout(300);
  const deltas = await page.evaluate(() => {
    window.__recording = false;
    return window.__frames;
  });
  const events = await readTrace(cdp);
  const frames = frameStats(deltas);
  const trace = summarizeTrace(events);
  await context.close();
  return { load, scroll: { distancePx: distance, ...frames, ...trace }, events, requests: reqs };
}

const fmt = (value) =>
  Number.isInteger(value) ? String(value) : value < 1 ? value.toFixed(3) : value.toFixed(1);

function printTable(title, record) {
  console.log(`\n${title}`);
  for (const [key, value] of Object.entries(record))
    console.log(`  ${key.padEnd(16)} ${fmt(value)}`);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(
      'npm run perf -- <url or /route> [--load-more N] [--cpu 4] [--mobile] [--runs 3] [--warm]\n' +
        '                [--off grain,bg,dropshadow,shadows,all] [--wait 6000] [--headless] [--label name] [--list]',
    );
    return;
  }

  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: opts.headless,
    // A window behind other windows still renders every frame.
    args: [
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-background-timer-throttling',
    ],
  });
  const runs = [];
  try {
    for (let i = 0; i < opts.runs; i += 1) {
      runs.push(await measureOnce(browser, opts));
      process.stdout.write(`run ${i + 1}/${opts.runs} done\n`);
    }
  } finally {
    await browser.close();
  }

  const load = medianRecord(runs.map((r) => r.load));
  const scroll = medianRecord(runs.map((r) => r.scroll));
  const setup = [
    opts.mobile ? 'mobile 390×844@3x' : 'desktop 1440×900@2x',
    `cpu ${opts.cpu}×`,
    opts.warm ? 'warm cache' : 'cold cache',
    opts.loadMore ? `load more ×${opts.loadMore}` : null,
    opts.off.length ? `off: ${opts.off.join(',')}` : null,
    opts.headless ? 'headless' : null,
    `median of ${opts.runs}`,
  ]
    .filter(Boolean)
    .join(' · ');
  console.log(`\n${opts.url}\n${setup}`);
  printTable('Load', load);
  printTable('Scroll (down and back up)', scroll);
  if (opts.list) {
    // The last run's requests, largest first: what the page waits on.
    console.log('\nLargest requests (last run): KB, finished at ms, type, URL');
    const top = [...runs.at(-1).requests].sort((a, b) => b.bytes - a.bytes).slice(0, 20);
    for (const r of top)
      console.log(
        `  ${(r.bytes / 1024).toFixed(1).padStart(7)} ${String(Math.round(r.endMs ?? -1)).padStart(6)}  ${r.type.padEnd(10)} ${r.url.slice(0, 110)}`,
      );
  }

  const slug =
    opts.label ??
    `${new URL(opts.url).host}${new URL(opts.url).pathname}`.replace(/[^a-zA-Z0-9]+/g, '-');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = join(root, '.perf');
  await mkdir(dir, { recursive: true });
  const base = join(dir, `${slug}-${stamp}`);
  await writeFile(`${base}.json`, JSON.stringify({ url: opts.url, setup, load, scroll }, null, 2));
  await writeFile(`${base}.trace.json.gz`, gzipSync(JSON.stringify(runs.at(-1).events)));
  console.log(`\nSaved ${base}.json and .trace.json.gz`);
}

main().catch((error) => {
  console.error(`✗ ${error.message}`);
  process.exit(1);
});
