// Finds a Java runtime >= 21 (the Firebase emulators require it) without changing the system:
// JAVA_HOME, then `java` on PATH, then macOS java_home, then Homebrew's keg-only openjdk.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export const MIN_JAVA = 21;

function parse(text) {
  const match = text.match(/version "(\d+)(?:\.(\d+))?/);
  if (!match) return null;
  const major = Number(match[1]);
  return major === 1 ? Number(match[2]) : major; // "1.8.0" => 8
}

function versionOfBin(javaBin) {
  try {
    // `java -version` writes to stderr, so merge it into stdout.
    const out = execFileSync('/bin/sh', ['-c', `"${javaBin}" -version 2>&1`], { encoding: 'utf8' });
    return parse(out);
  } catch {
    return null;
  }
}

function candidates() {
  const list = [];
  if (process.env.JAVA_HOME) list.push(join(process.env.JAVA_HOME, 'bin'));
  list.push(null); // whatever `java` is on PATH
  if (process.platform === 'darwin') {
    try {
      const home = execFileSync('/usr/libexec/java_home', ['-v', `${MIN_JAVA}+`], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      if (home) list.push(join(home, 'bin'));
    } catch {
      // none registered
    }
  }
  for (const prefix of ['/opt/homebrew/opt', '/usr/local/opt']) {
    for (const keg of ['openjdk', 'openjdk@21', 'openjdk@25', 'openjdk@27']) {
      list.push(join(prefix, keg, 'bin'));
    }
  }
  return list;
}

/** @returns {{ binDir: string | null, version: number } | null} binDir null = the PATH java */
export function findJava() {
  for (const binDir of candidates()) {
    const javaBin = binDir ? join(binDir, 'java') : 'java';
    if (binDir && !existsSync(javaBin)) continue;
    const version = versionOfBin(javaBin);
    if (version && version >= MIN_JAVA) return { binDir, version };
  }
  return null;
}

/** Environment for child processes that need Java >= 21 (PATH + JAVA_HOME adjusted when needed). */
export function javaEnv(base = process.env) {
  const java = findJava();
  if (!java || !java.binDir) return { env: base, java };
  return {
    env: { ...base, PATH: `${java.binDir}:${base.PATH ?? ''}`, JAVA_HOME: join(java.binDir, '..') },
    java,
  };
}
