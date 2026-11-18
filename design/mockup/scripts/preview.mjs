// Builds a publishable copy of the mockup in .artifacts/loadout-mockup/ (the page, its data files and every icon it
// uses, copied from public/assets/icons) and, optionally, takes screenshots of it with the installed Chrome.
//
//   node design/mockup/scripts/preview.mjs
//   node design/mockup/scripts/preview.mjs "home|1440|900|home" "build|390|844|build|window.__tab('t-guide')|full"
//
// A screenshot spec is name|width|height|view|js|full: view is home, build or new (the page's #hash); js runs before
// the shot (the page exposes window.__tab(id), __layout('grid'|'rows'), __edExample('empty'|'progress'),
// __edPick('right:0'), and the pitch bar's buttons can be clicked); full = full-page. Shots land in
// .artifacts/loadout-mockup/shots/. Widths under 700 emulate a phone (touch).
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = join(HERE, '../..');
const OUT = join(ROOT, '.artifacts/loadout-mockup');
const PAGE = 'souls-builds-loadout.html';
const DATA = readdirSync(HERE).filter((f) => /^data.*\.js$/.test(f));

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'icons'), { recursive: true });
let all = '';
for (const f of [PAGE, ...DATA]) {
  const text = readFileSync(join(HERE, f), 'utf8');
  all += text;
  writeFileSync(join(OUT, f), text);
}
// every icon id the page or its data can show: "i":123, "icon":123, art: 123, icons/123.webp, wchip(123
const ids = new Set();
for (const m of all.matchAll(
  /(?:"i"|"icon"|\bart|\bi):\s*(\d{2,6})\b|icons\/(\d+)\.webp|wchip\((\d+)/g,
))
  ids.add(m[1] || m[2] || m[3]);
let missing = 0;
for (const id of ids) {
  const src = join(ROOT, 'public/assets/icons', `${id}.webp`);
  if (existsSync(src)) copyFileSync(src, join(OUT, 'icons', `${id}.webp`));
  else missing++;
}
console.log(
  `${OUT}: page, ${DATA.length} data files, ${ids.size - missing} icons${missing ? ` (${missing} ids had no icon file)` : ''}`,
);

const specs = process.argv.slice(2);
if (specs.length) {
  const { chromium } = await import(join(ROOT, 'node_modules/playwright-core/index.mjs'));
  const { CHROME } = await import(join(ROOT, 'scripts/lib/chrome.mjs'));
  // the published page is wrapped in a skeleton by the Artifact host; wrap it the same way here
  writeFileSync(
    join(OUT, '_preview.html'),
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>${readFileSync(join(OUT, PAGE), 'utf8')}</body></html>`,
  );
  mkdirSync(join(OUT, 'shots'), { recursive: true });
  const browser = await chromium.launch({ executablePath: CHROME });
  for (const spec of specs) {
    const [name, w, h, view = 'home', js = '', full = ''] = spec.split('|');
    const mobile = +w < 700;
    const ctx = await browser.newContext({
      viewport: { width: +w, height: +h },
      hasTouch: mobile,
      isMobile: mobile,
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`file://${join(OUT, '_preview.html')}#${view}`, { waitUntil: 'load' });
    await page.waitForTimeout(700);
    if (js) await page.evaluate(js);
    await page.waitForTimeout(300);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    const file = join(OUT, 'shots', `${name}.png`);
    await page.screenshot({ path: file, fullPage: full === 'full' });
    console.log(file, overflow ? `overflows by ${overflow}px` : '', errors.join(' | '));
    await ctx.close();
  }
  await browser.close();
}
