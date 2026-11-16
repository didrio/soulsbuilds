# Tickets

Living, ordered backlog. **One ticket per session**: `/clear` → `/start Tn` → work → `/wrap`. The agent that
wraps a session updates this file and picks the next ticket. Rules: `.claude/skills/wrap/SKILL.md`. Capture
ideas any time with `/ticket`. Ticket numbers are never reused; **next free: T25**.

Each ticket has: **Status**, **Session** (model · effort · plan mode), **Goal**, **Done when**, **Context**
(read-first files, decisions, pitfalls). A fresh session reads the ticket and only what it names.

**Next:** T24, No blank page when reCAPTCHA is blocked · Opus · high · plan mode on.

**Owner to-dos** (from T12; checklist in `docs/firebase.md` "Relaunch checklist"):

- Approve the first CI production run (Actions → the run → Review deployments); it proves Workload Identity end to
  end. Open a throwaway PR once to see the preview comment.
- In a day or two: App Check → APIs, check that nearly all requests are verified, then **Enforce** for Firestore
  and Auth (`docs/firebase.md` "App Check" step 4). Automated browsers (perf runs, bots) count as unverified.
- App Check token TTL → **1 day** (T23; App Check → Apps → the web app → reCAPTCHA Enterprise → Token time to
  live). Then `npm run perf -- https://soulsbuilds.com/ --runs 1` should print `token ttl 86400s`.
- Console: delete the disposable test account "claude" (Authentication → Users); unlink Google Analytics if it's
  linked (Project settings → Integrations); set the email templates' sender name to "Souls Builds".
- Decide on the display name "Anne Frankly" (migrated from 2022; public on profiles). If it goes:
  `node scripts/admin.mjs rename <uid> "<new name>" --project soulsbuilds` (dry run), then `--write`.
- Keep a copy of `.admin-backups/export_soulsbuilds_2026-11-15T22-59-34-751Z.json` (the v1 data) outside the repo.

**Relaunched** 2026-11-15 (T12) on soulsbuilds.com. **Order from here** (owner's calls, 2026-11-15): the redesign
(T16, T17), "How to get this build" (T14, T19, T15), build math (T8), browse (T9) and performance (T21) are
done, and so are T18 (account deletion), T22 (layout), T20 (community feel) and T23 (App Check wait). Then: T24.

## In progress

(none)

## Up next

### T24 — No blank page when reCAPTCHA is blocked

- **Status:** ready
- **Session:** Opus · high effort · plan mode on
- **Goal:** If `https://www.google.com/recaptcha/enterprise.js` can't load (a blocker, a network that blocks
  Google), every page that reads Firestore stays empty forever, with no error. Show a clear message instead
  (and, while App Check isn't enforced, maybe still load the data), without weakening App Check.
- **Done when:**
  - [ ] With `enterprise.js` blocked, a build page and the landing show an error with a hint ("couldn't verify
        your browser: an ad or tracker blocker may be blocking Google reCAPTCHA") within a few seconds, not a
        blank page. Normal loads are unchanged (no added wait).
  - [ ] Owner decides whether to degrade gracefully before enforcement (let Firestore go without a token) or
        always show the error; after enforcement only the error makes sense.
  - [ ] A test covers the detection logic; a Playwright check (blocked route) or a documented manual check.
- **Context:** Cause (T23, SDK source on GitHub): `@firebase/app-check` `loadReCAPTCHAEnterpriseScript` sets only
  `script.onload` (no `onerror`, no timeout), so `reCAPTCHAState.initialized` never resolves, `getToken` never
  returns, and Firestore's `Datastore` waits on `Promise.all([auth.getToken(), appCheck.getToken()])` before
  every RPC, so no request is ever sent and TanStack queries stay pending (never `isError`). Reproduced on
  prod: Playwright `page.route('**/recaptcha/enterprise.js*', r => r.abort())` on `/build/HWRU9439SODE` →
  0 Firestore requests after 15 s, empty `<main>`. Ideas: watch the `<link rel="preload">` for
  `enterprise.js` in `index.html` (it fires `error`), or the SDK's injected script tag, and set a flag in
  `src/lib/firebase/app.ts`; or a timeout on reads in `src/lib/firebase/`; surface it through the existing
  `ErrorMessage` path (`BuildEditorPage` `buildQuery.isError`, `Landing`). Dev uses the emulators with no App
  Check, so test against a production build (`npm run preview` uses a debug token, but still loads
  `enterprise.js`) or prod with a blocked route. docs/firebase.md "App Check" → "Things to know".

## Backlog

- Route (T15 follow-ups): upgrade materials (Smithing/Somber stones, needs upgrade levels on builds), rune
  farming to the build's level (where and how long), and the starting class: builds now save one (T8,
  `startingClass`; classes in `character.json`), so the route can say "your Samurai starts with it" instead of
  "or start as X", and suggest a class for builds without one.
- Delete the unused 2022 doc `app/tags` in production (no rule matches it; it's in the T12 backup).
- Other games (owner, 2026-11-15: Dark Souls 1–3, maybe Demon's Souls and Bloodborne; Sekiro and Nightreign
  need their own build models) on top of T3's `game` field: data per game, per-game routes (`/ds3/...`) read by
  `useCurrentGame()` (`src/app/game.ts`), a game switcher in the header, a skin per game in
  `src/theme/skins.ts`, per-game tags. Same function and UX for every game; only the look changes.
- Per-build share previews (Open Graph image/title per build): needs SSR or a Cloud Function (Blaze plan).
- Build comparison view; "copy this build" to start from someone else's.
- Firebase MCP server for agents (local emulator use only) once its emulator support is clear.
- Firebase JS SDK 13 (and `@firebase/rules-unit-testing` 6, which requires it): check the changelog, upgrade,
  run all three test suites.
- Build history / "updated" badge using `updatedAt`; edit comments (rules allow no comment updates today).
- Admin page in the app (list reports, remove/dismiss) if `scripts/admin.mjs` gets tedious; the rules already
  let admins list reports and delete content.

## Done

Older entries: `docs/tickets-archive.md`.

- T23 — Content sooner: the App Check wait — 2026-11-16 — cause confirmed in the SDK (Firestore awaits the App
  Check token; a cached IndexedDB token skips reCAPTCHA; T21's "warm" wait was perf's 403'd bot exchange);
  `enterprise.js` preloaded (cold first Firestore request ~1.29 → ~1.21 s, via `--head` before deploy; warm real
  visit ~0.33 s); perf App Check table + `--head`; owner sets a 1-day TTL. Blocked reCAPTCHA = blank page → T24.
- T20 — Community feel — 2026-11-16 — HTML mockup, owner picked layout A with counts; public `stats/elden-ring`
  (builds, distinct authors, accounts, builds per tag) from `admin.mjs stats`, daily in `stats.yml` as its own
  `github-stats` SA; top tags as the Tags row's first chips (scrolling row on phones),
  "N builds by M players", rows with comments + age, build page comment link, warmer empty state, "More by",
  profile build/like counts; scroll to top on navigation. SA set up and first run done by the owner (same day).
- T22 — Layout: lean landing, compact build page — 2026-11-16 — HTML mockup, owner picked "title first";
  landing: no hero, small `<h1>` in the Find builds frame, fixed-height rows with tags on one line + "+N"
  (`tags.ts` `fitCount`); build page: title pane, equipment across the page (weapons as rows, other slots as
  `ItemSlot` icon tiles with a `Tooltip` name on hover/focus/tap), write-up beside the numbers, guide collapsed
  with `GuideRoute` + acquisition data loaded on expand, comments across the page at 72ch.
- T18 — Account deletion and admin rename — 2026-11-15 — profile "Delete account" (password re-auth; finds
  everything, then deletes builds, likes/comments elsewhere with counters, reports, profile, Auth user;
  re-runnable), rules for own profile/report delete + comments collection-group read, `admin.mjs rename` and
  `delete-user` (backup first), privacy page updated; e2e `account.spec.ts`.
- T21 — Performance — 2026-11-15 — `npm run perf` (headed Chrome + CDP: load vitals, scroll frames, GPU time,
  `--off` attribution); `background-attachment: fixed` → fixed layer behind content (landing 72 → 118 fps, 40% →
  2% dropped), grain on its own layer, `<main>` ≥ 1 screen (CLS 0.17 → 0), hosting cache headers, preconnects.
  Prod "after" numbers not yet measured (needs the deploy); App Check wait → T23.
- T9 — Browse and discovery — 2026-11-15 — level range and search + tag now Firestore queries (multi-field range
  next to the sort `orderBy`; 7 new composite indexes ending in `level`, plus `tags`+`game`+`nameLower`); data-layer
  test. Indexes are untested against production (the emulator ignores them): check the first level/search
  queries after the next deploy.
