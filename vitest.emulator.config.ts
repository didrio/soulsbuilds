// Tests that need the Firestore emulator (rules + migration). Run them with `npm run test:rules`,
// which starts a separate emulator on its own ports (firebase.test.json), so it works while
// `npm run dev` is running.
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.test.ts', 'tests/migration/**/*.test.ts'],
    // One emulator, shared state: run files one after another.
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 30000,
  },
});
