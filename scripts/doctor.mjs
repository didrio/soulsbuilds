#!/usr/bin/env node
// What can this machine run? Prints ✓ / ✗ / ○ (optional) per capability and how to fix each.
//   npm run doctor          (add --json for machine-readable output)
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createConnection } from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MIN_JAVA, findJava } from './lib/java.mjs';
import { CHROME } from './lib/chrome.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const wantNode = Number(readFileSync(join(root, '.nvmrc'), 'utf8').trim());
const firebaseJson = JSON.parse(readFileSync(join(root, 'firebase.json'), 'utf8'));

const portInUse = (port) =>
  new Promise((resolve) => {
    const socket = createConnection({ host: '127.0.0.1', port });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
  });

const checks = [];
const add = (status, name, detail, fix) => checks.push({ status, name, detail, fix });

const nodeMajor = Number(process.versions.node.split('.')[0]);
add(
  nodeMajor >= wantNode ? 'ok' : 'fail',
  'Node',
  `v${process.versions.node} (need ${wantNode}+)`,
  `nvm install ${wantNode} && nvm use`,
);

add(
  existsSync(join(root, 'node_modules', '.bin', 'vite')) ? 'ok' : 'fail',
  'Dependencies',
  'node_modules installed',
  'npm ci',
);

const java = findJava();
add(
  java ? 'ok' : 'fail',
  `Java ${MIN_JAVA}+ (Firebase emulators)`,
  java
    ? `Java ${java.version}${java.binDir ? ` at ${java.binDir} (picked automatically)` : ' on PATH'}`
    : 'not found',
  'brew install openjdk@21 (or set JAVA_HOME)',
);

add(
  existsSync(CHROME) ? 'ok' : 'fail',
  'Chrome (screenshots)',
  CHROME,
  'Install Google Chrome, or set CHROME_PATH',
);

const ports = [
  ['Vite dev server', 5180],
  ['Auth emulator', firebaseJson.emulators.auth.port],
  ['Firestore emulator', firebaseJson.emulators.firestore.port],
  ['Emulator UI', firebaseJson.emulators.ui.port],
];
const busy = [];
for (const [label, port] of ports) if (await portInUse(port)) busy.push(`${label} :${port}`);
add(
  busy.length ? 'info' : 'ok',
  'Ports',
  busy.length
    ? `in use: ${busy.join(', ')} (fine if \`npm run dev\` is already running)`
    : 'all free',
  'Stop the other process, or reuse the running `npm run dev`',
);

let loggedIn = false;
try {
  const out = execFileSync(join(root, 'node_modules', '.bin', 'firebase'), ['login:list'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    timeout: 20_000,
  });
  loggedIn = /Logged in as/i.test(out);
} catch {
  // not logged in / offline
}
add(
  loggedIn ? 'ok' : 'optional',
  'Firebase login (deploys only)',
  loggedIn ? 'logged in' : 'not logged in; local dev does not need it',
  'npx firebase login (the owner does this; deploys always ask first)',
);

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(checks, null, 2));
} else {
  const icon = { ok: '✓', fail: '✗', optional: '○', info: '•' };
  for (const c of checks) {
    console.log(`${icon[c.status]} ${c.name}: ${c.detail}`);
    if (c.status === 'fail') console.log(`    fix: ${c.fix}`);
  }
}
process.exit(checks.some((c) => c.status === 'fail') ? 1 : 0);
