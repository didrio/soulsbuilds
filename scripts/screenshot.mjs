#!/usr/bin/env node
// Screenshots a page of the RUNNING dev server (`npm run dev`) with the installed Chrome and prints
// the PNG path, so an agent can open it with its image reader. Also prints the page's console
// errors and failed requests, which are often the real answer.
//
//   npm run screenshot -- [route] [--mobile] [--width <px>] [--height <px>] [--full] [--wait <ms>]
//                         [--name <file>] [--click <button name>] [--no-js]
//   npm run screenshot -- /build/SEEDBLEED001 --mobile
//   npm run screenshot -- /build/SEEDBLEED001 --width 1000   (desktop at another width)
//   npm run screenshot -- /build/SEEDFULL0001 --width 1440 --height 820   (the fold target, T66)
//   npm run screenshot -- /build/SEEDBLEED001 --click "Track this build"
//     (clicks the button with that accessible name first, e.g. to open a dialog; signed out only:
//     for signed-in pages drive the browser or write an e2e test)
//   BASE_URL=http://127.0.0.1:5190 npm run screenshot -- /build/SEEDBLEED001 --no-js
//     (JavaScript off: what crawlers read, T50; only the function behind Hosting fills the page, so point
//     BASE_URL at a Hosting emulator: docs/firebase.md "Link previews and crawlers")
import { mkdir } from 'node:fs/promises';
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
    height: null,
    full: false,
    wait: 1500,
    name: null,
    click: null,
    js: true,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--mobile') opts.mobile = true;
    else if (arg === '--full') opts.full = true;
    else if (arg === '--width') opts.width = Number(argv[(i += 1)]);
    else if (arg === '--height') opts.height = Number(argv[(i += 1)]);
    else if (arg === '--wait') opts.wait = Number(argv[(i += 1)]);
    else if (arg === '--name') opts.name = argv[(i += 1)];
    else if (arg === '--click') opts.click = argv[(i += 1)];
    else if (arg === '--no-js') opts.js = false;
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
      'npm run screenshot -- [route] [--mobile] [--width <px>] [--height <px>] [--full] [--wait <ms>] [--name <file>] [--click <button name>] [--no-js]',
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
  const viewport = {
    width: opts.width ?? base.width,
    height: opts.height ?? base.height,
  };
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage({
    viewport,
    isMobile: opts.mobile,
    hasTouch: opts.mobile,
    javaScriptEnabled: opts.js,
  });
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
  if (opts.click) {
    await page.getByRole('button', { name: opts.click, exact: true }).first().click();
    await page.waitForTimeout(500);
  }

  const slug =
    opts.name ??
    `${opts.route.replace(/^\//, '').replace(/[^a-zA-Z0-9]+/g, '-') || 'home'}-${opts.mobile ? 'mobile' : 'desktop'}${opts.width ? `-${opts.width}` : ''}${opts.height ? `x${opts.height}` : ''}${opts.js ? '' : '-nojs'}`;
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
