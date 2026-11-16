# Tickets

Living, ordered backlog. **One ticket per session**: `/clear` → `/start Tn` → work → `/wrap`. The agent that
wraps a session updates this file and picks the next ticket. Rules: `.claude/skills/wrap/SKILL.md`. Capture
ideas any time with `/ticket`. Ticket numbers are never reused; **next free: T24**.

Each ticket has: **Status**, **Session** (model · effort · plan mode), **Goal**, **Done when**, **Context**
(read-first files, decisions, pitfalls). A fresh session reads the ticket and only what it names.

**Next:** T23, Content sooner: the App Check wait before Firestore · Opus · high · plan mode on.

**Owner to-dos** (from T12; checklist in `docs/firebase.md` "Relaunch checklist"):

- Approve the first CI production run (Actions → the run → Review deployments); it proves Workload Identity end to
  end. Open a throwaway PR once to see the preview comment.
- In a day or two: App Check → APIs, check that nearly all requests are verified, then **Enforce** for Firestore
  and Auth (`docs/firebase.md` "App Check" step 4).
- Console: delete the disposable test account "claude" (Authentication → Users); unlink Google Analytics if it's
  linked (Project settings → Integrations); set the email templates' sender name to "Souls Builds".
- Decide on the display name "Anne Frankly" (migrated from 2022; public on profiles). If it goes:
  `node scripts/admin.mjs rename <uid> "<new name>" --project soulsbuilds` (dry run), then `--write`.
- Keep a copy of `.admin-backups/export_soulsbuilds_2026-11-15T22-59-34-751Z.json` (the v1 data) outside the repo.
- T20 stats job: create the `github-stats` service account (three gcloud commands in `docs/firebase.md` "Daily
  stats job"), then Actions → Community stats → Run workflow once and check its log; the landing's top tags and
  "N builds by M players" appear after it.
- After the next deploy (T20): check the landing and a build page on soulsbuilds.com (rows, "More by").

**Relaunched** 2026-11-15 (T12) on soulsbuilds.com. **Order from here** (owner's calls, 2026-11-15): the redesign
(T16, T17), "How to get this build" (T14, T19, T15), build math (T8), browse (T9) and performance (T21) are
done, and so are T18 (account deletion), T22 (layout) and T20 (community feel). Then: T23 (App Check wait).

## In progress

(none)

## Up next

### T23 — Content sooner: the App Check wait before Firestore

- **Status:** ready
- **Session:** Opus · high effort · plan mode on
- **Goal:** On soulsbuilds.com the app has its code by ~0.25 s but the first Firestore request starts at ~1.3 s
  (cold) / ~0.6 s (warm), right when the App Check token arrives: reCAPTCHA Enterprise loads two scripts, an
  iframe and a worker, then exchanges a token (T21 waterfall). Show builds sooner without weakening App Check
  (enforcement is still an owner to-do).
- **Done when:**
  - [ ] Confirm the cause in the SDK (`@firebase/firestore`'s App Check token provider and
        `@firebase/app-check` `getToken`: does Firestore block on the first token? Why does a warm visit
        exchange a new token when one is cached in IndexedDB?). Grepping `node_modules/@firebase/*/dist` was
        blocked by a permission rule in T21: read the files, or ask the owner to allow it.
  - [ ] Owner picks from the options, each measured with `npm run perf -- https://soulsbuilds.com/build/<id>
--list` (and `--warm`): a longer App Check token TTL (console, owner); Firestore `persistentLocalCache`
        so returning visitors see cached builds at once; starting App Check earlier (preload the exact
        `enterprise.js` URL); reCAPTCHA v3 instead of Enterprise; or accept it.
  - [ ] Time to the first Firestore request before vs after, cold and warm, in the Done line.
- **Context:** `src/lib/firebase/app.ts` (`initializeAppCheck`, `isTokenAutoRefreshEnabled`), `index.html`
  (T21 preconnects), `docs/firebase.md` "App Check", `docs/architecture.md` "Performance". Production page
  loads are fine; any console change is the owner's. `npm run preview` uses a debug token, so it can't show
  this wait: measure on prod or a PR preview.

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

- T20 — Community feel — 2026-11-16 — HTML mockup, owner picked layout A with counts; public `stats/elden-ring`
  (builds, distinct authors, accounts, builds per tag) from `admin.mjs stats`, daily in `stats.yml` as its own
  `github-stats` SA (setup pending, owner to-do); top tags as the Tags row's first chips (scrolling row on phones),
  "N builds by M players", rows with comments + age, build page comment link, warmer empty state, "More by",
  profile build/like counts; scroll to top on navigation.
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
- T8 — Build math — 2026-11-15 — `character.json` (classes + CalcCorrectGraph curves) and talisman `modifiers`
  from the export; pure `buildMath` (vitals, equip load/roll, poise, requirements incl. two-handing, memory
  slots) tested against Fextralife; `startingClass` saved (rules + tests), spells ≤ 12; Character panel,
  class picker with minimums, requirement and memory-slot warnings.
