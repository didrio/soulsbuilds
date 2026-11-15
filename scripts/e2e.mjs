#!/usr/bin/env node
// `npm run e2e [-- <playwright args>]`: runs the Playwright tests in tests/e2e/. If the emulators are
// already up (`npm run dev`), it uses them (and Playwright reuses or starts Vite); otherwise it starts
// the emulators, seeds them, and stops them afterwards. Tests create their own users, so they don't
// depend on a fresh database.
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { connect } from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { emulators } = JSON.parse(readFileSync(join(root, 'firebase.json'), 'utf8'));
const args = process.argv.slice(2);

const isListening = (host, port) =>
  new Promise((resolve) => {
    const socket = connect({ host, port });
    socket.once('connect', () => socket.end(() => resolve(true)));
    socket.once('error', () => resolve(false));
  });

const run = (command, commandArgs) =>
  new Promise((resolve) => {
    const child = spawn(command, commandArgs, { cwd: root, stdio: 'inherit' });
    child.on('exit', (code) => resolve(code ?? 1));
  });

const up = await Promise.all([
  isListening(emulators.auth.host, emulators.auth.port),
  isListening(emulators.firestore.host, emulators.firestore.port),
]);

const playwright = ['playwright', 'test', ...args].join(' ');
const code = up.every(Boolean)
  ? await run('npx', ['playwright', 'test', ...args])
  : await run('node', [
      'scripts/firebase.mjs',
      'emulators:exec',
      '--project',
      'demo-soulsbuilds',
      '--only',
      'auth,firestore',
      `node scripts/seed.mjs && npx ${playwright}`,
    ]);
process.exit(code);
