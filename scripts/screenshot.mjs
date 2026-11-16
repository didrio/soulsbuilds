#!/usr/bin/env node
// Screenshots a page of the RUNNING dev server (`npm run dev`) with the installed Chrome and prints
// the PNG path, so an agent can open it with its image reader. Also prints the page's console
// errors and failed requests, which are often the real answer.
//
//   npm run screenshot -- [route] [--mobile] [--width <px>] [--full] [--wait <ms>] [--name <file>]
//                         [--storage <file.json>]
//   npm run screenshot -- /build/SEEDBLEED001 --mobile
//   npm run screenshot -- /build/SEEDBLEED001 --width 1000   (desktop at another width)
//   npm run screenshot -- /build/SEEDBLEED001 --storage tracking.json
//     (local storage to start with, as { key: value }, values as strings or JSON: e.g. signed-out
//     tracking, T34: { "soulsbuilds.tracking.v1": { "SEEDBLEED001": { ... } } })
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { CHROME } from './lib/chrome.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5180';

const VIEWPORTS = {
  desktop: { width: 1280, height: 900 },
  mobile: { width: 390, height: 844 },
};

function parseArgs(argv) {
  const opts = {
    route: '/',
    mobile: false,
    width: null,
    full: false,
    wait: 1500,
    name: null,
    storage: null,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--mobile') opts.mobile = true;
    else if (arg === '--full') opts.full = true;
    else if (arg === '--width') opts.width = Number(argv[(i += 1)]);
    else if (arg === '--wait') opts.wait = Number(argv[(i += 1)]);
    else if (arg === '--name') opts.name = argv[(i += 1)];
    else if (arg === '--storage') opts.storage = argv[(i += 1)];
    else if (arg === '--help' || arg === '-h') opts.help = true;
    else if (!arg.startsWith('--')) opts.route = arg.startsWith('/') ? arg : `/${arg}`;
    else throw new Error(`Unknown option ${arg}`);
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(
      'npm run screenshot -- [route] [--mobile] [--width <px>] [--full] [--wait <ms>] [--name <file>] [--storage <file.json>]',
    );
    return;
  }

  try {
    await fetch(BASE_URL, { signal: AbortSignal.timeout(3000) });
  } catch {
    console.error(
      `✗ Nothing is serving ${BASE_URL}. Start the app first: \`npm run dev\` (in the background).`,
    );
    process.exit(1);
  }

  const base = opts.mobile ? VIEWPORTS.mobile : VIEWPORTS.desktop;
  const viewport = opts.width ? { ...base, width: opts.width } : base;
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage({ viewport, isMobile: opts.mobile, hasTouch: opts.mobile });
  if (opts.storage) {
    const entries = Object.entries(JSON.parse(await readFile(opts.storage, 'utf8'))).map(
      ([key, value]) => [key, typeof value === 'string' ? value : JSON.stringify(value)],
    );
    await page.addInitScript((pairs) => {
      for (const [key, value] of pairs) localStorage.setItem(key, value);
    }, entries);
  }
  const problems = [];
  page.on('console', (msg) => msg.type() === 'error' && problems.push(`console: ${msg.text()}`));
  page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));
  page.on(
    'response',
    (res) => res.status() >= 400 && problems.push(`HTTP ${res.status()}: ${res.url()}`),
  );
  page.on('requestfailed', (req) =>
    problems.push(`request failed: ${req.url()} (${req.failure()?.errorText})`),
  );

  // Not 'networkidle': Firestore keeps a streaming connection open, so the network never idles.
  await page.goto(`${BASE_URL}${opts.route}`, { waitUntil: 'load', timeout: 30_000 });
  await page.waitForTimeout(opts.wait);

  const slug =
    opts.name ??
    `${opts.route.replace(/^\//, '').replace(/[^a-zA-Z0-9]+/g, '-') || 'home'}-${opts.mobile ? 'mobile' : 'desktop'}${opts.width ? `-${opts.width}` : ''}`;
  const dir = join(root, '.artifacts', 'screenshots');
  await mkdir(dir, { recursive: true });
  const file = join(dir, `${slug}.png`);
  await page.screenshot({ path: file, fullPage: opts.full });
  await browser.close();

  console.log(file);
  if (problems.length) {
    console.log(`\n${problems.length} problem(s) on the page:`);
    for (const p of problems.slice(0, 20)) console.log(`  - ${p}`);
  }
}

main().catch((error) => {
  console.error(`✗ ${error.message}`);
  process.exit(1);
});
