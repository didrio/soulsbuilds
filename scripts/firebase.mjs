#!/usr/bin/env node
// Runs the project's firebase-tools CLI with a Java >= 21 on PATH (the emulators need it), so
// `npm run dev` works even when the default `java` is older. Usage: node scripts/firebase.mjs <args>
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MIN_JAVA, javaEnv } from './lib/java.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const { env, java } = javaEnv();

if (!java && args.some((arg) => arg.startsWith('emulators'))) {
  console.error(
    `✗ The Firebase emulators need Java ${MIN_JAVA}+ and none was found.\n` +
      `  Install one (macOS: brew install openjdk@21) or set JAVA_HOME. Run \`npm run doctor\` to check.`,
  );
  process.exit(1);
}

const child = spawn(join(root, 'node_modules', '.bin', 'firebase'), args, {
  cwd: root,
  env,
  stdio: 'inherit',
});
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig));
