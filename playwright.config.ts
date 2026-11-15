// End-to-end tests (tests/e2e/) in the installed Chrome against Vite + the emulators. Run them with
// `npm run e2e` (scripts/e2e.mjs starts what isn't running yet).
import { defineConfig } from '@playwright/test';
import { CHROME } from './scripts/lib/chrome.mjs';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  outputDir: '.artifacts/e2e',
  use: {
    baseURL: 'http://127.0.0.1:5180',
    launchOptions: { executablePath: CHROME },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npx vite',
    url: 'http://127.0.0.1:5180',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
