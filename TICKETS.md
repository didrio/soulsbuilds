# Tickets

Living, ordered backlog. **One ticket per session**: `/clear` → `/start Tn` → work → `/wrap`. The agent that
wraps a session updates this file and picks the next ticket. Rules: `.claude/skills/wrap/SKILL.md`. Capture
ideas any time with `/ticket`. Ticket numbers are never reused; **next free: T24**.

Each ticket has: **Status**, **Session** (model · effort · plan mode), **Goal**, **Done when**, **Context**
(read-first files, decisions, pitfalls). A fresh session reads the ticket and only what it names.

**Next:** T20, Community feel: top tags, activity, community stats · Opus · high · plan mode on.

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

**Relaunched** 2026-11-15 (T12) on soulsbuilds.com. **Order from here** (owner's calls, 2026-11-15): the redesign
(T16, T17), "How to get this build" (T14, T19, T15), build math (T8), browse (T9) and performance (T21) are
done, and so are T18 (account deletion) and T22 (layout). Then: T20 (community feel), T23 (App Check wait; owner
can move it up).

## In progress

(none)

## Up next

### T20 — Community feel: top tags, activity, community stats

- **Status:** ready
- **Session:** Opus · high effort · plan mode on
- **Goal:** Make the site feel like a living community (people building, liking and talking) with small
  touches, while browsing and posting stay exactly as quick as now. No new sections that push the list down.
- **Done when:**
  - [ ] **Mockup first**: a quick HTML mockup (landing toolbar + rows, build page header/comments, profile) for
        the owner to approve or trim before any code, like T16.
  - [ ] **Top tags** on the landing: "Top tags:" with the ~10 most-used tags (live data) as toggle chips, next
        to the Tags picker; toggling one adds/removes it from the `tag` filters in the URL. Stays reachable on
        phones (today `TagsRow` hides behind "Filters"; maybe a horizontal-scroll row that's always visible).
  - [ ] **Stats doc**: one public `stats/er` doc (`tagCounts`, `buildCount`, `userCount`, `updatedAt`) written
        once a day by a scheduled GitHub Action (cron job in `.github/workflows/`, same Workload Identity auth
        as the deploy job) running a new `scripts/admin.mjs stats [--write]` (Admin SDK tally; dry-run
        prints). Rules: public read, no client writes, with tests. Owner approves the first scheduled run /
        any production write (AGENTS.md rule 2). The app reads it with one TanStack Query (long staleTime) and
        hides the row if the doc is missing (emulator: `npm run seed` writes one).
  - [ ] **Activity on rows**: comment count next to likes, and "by X · 3 days ago" (relative `createdAt`) on
        build rows and in the build page meta. Keep row density; check the columns on tablet/phone.
  - [ ] **Build page**: comment count as a jump link next to Like (to `#comments-title`), a warmer empty state
        ("No comments yet. Tried it? Tell <author> how it went."), and a small "More by <author>" strip at the
        bottom (`useUserBuilds`, excluding this build, hidden if none).
  - [ ] **Community stats**: "N builds by M players" on the landing (from `stats/er`; no hero since T22,
        so e.g. in the status line above the list), and
        "N builds · M likes received" on profiles (summed from the builds the profile already loads; free).
  - [ ] Tests: unit for the relative-time helper, top-tags pick and toggle; component tests for the new
        bits; rules test for `stats/`; admin script test like `tests/admin/`. Screenshots desktop + mobile.
- **Context:** T22 layout: build rows are a fixed height (`BuildsList.tsx` `ROW_HEIGHT*`, tags one line via
  `RowTags`/`fitCount`): new row content must fit them; the build page's title pane is `BuildHeader.tsx` (meta
  line, actions on the right). Owner's calls (2026-11-15): no podium/hall-of-fame (sort depends on filters; no categories);
  no avatars for now; counts from a daily CI job, not live per-tag `count()` (105 tags in
  `src/data/er/tags.json` ≈ 105 reads per visitor vs Spark's 50k/day) or a client-written counter (rules can't
  cheaply verify increments). Files: `src/features/builds/Landing.tsx` (`TagsRow`, `Chips`, `setFilters`),
  `filters.ts`, `BuildsList.tsx` (grid columns, `Numbers`), `src/features/editor/sections/BuildHeader.tsx`,
  `CommentsSection.tsx`, `src/features/profile/Profile.tsx` + `queries.ts`, `src/lib/firebase/` (new
  `stats.ts`), `firestore.rules`, `scripts/admin.mjs`, `scripts/seed.mjs`, `.github/workflows/ci.yml` (auth
  steps to copy), `docs/firebase.md` (document the job). Build/Comment already carry `likeCount`,
  `commentCount`, `createdAt` (`src/lib/models.ts`).

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
- T15 — "How to get this build" — 2026-11-15 — pure route solver (`features/editor/guide/route.ts`: earliest
  reachable source, item prerequisites, implied and any-of gates, topological order, steps by grace, legs by
  region) + lazy `GuideSection` on the build view (numbered, collapsible regions, item icons); unit, component
  and e2e tests. Upgrade materials, rune farming and a starting-class suggestion are in the Backlog.
