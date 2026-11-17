---
name: run-app
description: Run soulsbuilds locally (Firebase emulators + seed data + Vite), then see and drive it — screenshots with `npm run screenshot`, interaction in a browser, emulator data in the Emulator UI. Use when asked to run, start, look at, screenshot or click through the app, or to check that a UI or data change works.
---

# Run and look at the app

## 1. Can this machine run it?

`npm run doctor`: Node 24, dependencies, Java 21+ (for the emulators; `scripts/firebase.mjs` finds a Homebrew
openjdk on its own), Chrome (for screenshots), and which ports are busy. Fix any ✗ first (or tell the user what
they need to install).

## 2. Start it (one long-lived command, in the background)

```
npm run dev
```

It starts the auth + firestore emulators (project `demo-soulsbuilds`), seeds them (`scripts/seed.mjs`), then
Vite at **http://127.0.0.1:5180**. Wait for the `Local:` line. Data resets on every start; re-seed a running
instance with `npm run seed` (it wipes the emulator's Firestore first). Emulator UI (browse Firestore docs, auth users): http://127.0.0.1:4005.

- Port busy? `npm run doctor` says which. Reuse a running `npm run dev` rather than starting a second.
- Vite only (no Firebase), e.g. for pure layout work: `npm run dev:vite` (data calls will fail).
- Never point local work at production. `npm run preview` serves a production build that talks to the real
  project: don't use it for anything with data.

## 3. Look at it

```
npm run screenshot -- /build/SEEDBLEED001            # desktop 1280×900
npm run screenshot -- /build/SEEDBLEED001 --mobile   # 390×844 phone
npm run screenshot -- /build/SEEDBLEED001/guide --width 1000   # desktop at another width (build tabs: Equipment at /build/x, /guide, /discussion)
npm run screenshot -- /user/seed-ranni --full        # whole page
npm run screenshot -- /build/SEEDBLEED001 --click "Track this build"   # click a button first (a dialog, T41)
BASE_URL=http://127.0.0.1:<hosting> npm run screenshot -- /build/SEEDBLEED001 --no-js   # what crawlers read (T50)
```

`--no-js` only shows something on a page the `site` function serves, so it needs the Hosting + functions
emulators (`docs/firebase.md` "Link previews and crawlers"); the Vite dev server has no function.

`--click` presses the button with that accessible name before the shot (signed out). Signed-in pages (tracking
progress, the signed-in intro) need a session: drive `http://127.0.0.1:5180` in the browser pane and sign up
there (email + password, then "Choose a display name"; "Continue with Google" opens the Auth emulator's fake
account picker), or cover them in an e2e test (`tests/e2e/helpers.ts` `completeSignUp`).

It prints a PNG path under `.artifacts/screenshots/`: open it with your image reader (Read). It also prints
console errors, HTTP errors and failed requests from the page: read those first, they're often the real answer.
Screenshots cost tokens: take them of the pages you changed, desktop + mobile, not after every edit.

Performance (load, scroll smoothness): `npm run perf -- <url or /route>` (opens a visible Chrome; prints a table,
saves a trace under `.perf/`). Details and what's expensive here: `docs/architecture.md` "Performance".

Seeded routes: `/` (landing), `/build/SEEDBLEED001` (full build, comment, like), `/build/SEEDMOON0001`
(spells), `/build/SEEDFAITH001`, `/build/SEEDNAKED001` (all 10s: requirement warnings), `/user/seed-tarnished`,
`/user/seed-ranni`, `/build/new` (needs sign-in).

## 4. Drive it (sign in, click, type)

Use a browser you can control (in the Claude desktop app: the built-in browser pane on
`http://127.0.0.1:5180`). Seed accounts: `tarnished@example.test` and `ranni@example.test`, password in
`scripts/seed.mjs`; or register a new user (it only exists in the emulator). For repeatable flows, write a
scratch Playwright script on `playwright-core` with the installed Chrome (see `scripts/screenshot.mjs`), or
add an e2e test in `tests/e2e/` (`npm run e2e` reuses the running emulators and Vite).

## 5. Report honestly

Say what you looked at (which routes, desktop/mobile, signed in or not) and what you couldn't check. Never claim
a visual check you didn't do.
