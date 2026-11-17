# Tickets archive

The oldest **Done** lines from `TICKETS.md`, moved here to keep it lean. Newest last.

- T1 — Foundation — 2026-11-14 — leaked service-account key removed; CRA → Vite 8, React 19, RTK 2,
  styled-components 6, Firebase 12; TS/ESLint 9/Prettier/Vitest; emulators + seed + screenshot + doctor; CI;
  AGENTS.md, CLAUDE.md, skills, docs and this backlog.
- T2 — Strict TypeScript + feature folders — 2026-11-14 — all of `src/` strict TS in `app/`, `features/`,
  `components/ui/`, `lib/`, `theme/`, typed `data/` accessors, `@/` alias; BuildEditor split into page,
  sections and hooks (`loadBuild`/`selectBuildFields`); transient `$props`; lodash/prop-types gone; hex-color
  lint rule; React Compiler on. Spacing tokens moved to T11; screenshots pixel-identical before/after.
- T3 — Firestore model v2, rules, rules tests — 2026-11-14 — v2 model (likes/comments subcollections, batched
  counters checked by the rules, admin claim, no emails in Firestore), tested rules + indexes, data-layer and
  migration tests on their own emulator (`npm run test:rules`, CI), `scripts/migrate-v1-to-v2.mjs`, v2 seed.
  Production question (migrate or start fresh) moved to T12.
- T4 — TanStack Query, one AuthProvider, page states, e2e — 2026-11-14 — query hooks per feature with
  optimistic likes/comment deletes, `AuthProvider`/`useAuth`, loading/error/empty/not-found everywhere, no load
  race or page reloads, SDK imports lint-restricted to `src/lib/firebase/`, Playwright e2e (`npm run e2e`, CI).
- T5 — 2022 UI bug batch — 2026-11-14 — filters combine, cards keyed by id with armor slot types, timers, CSS,
  placeholders, clearable affinity, picker cleanup, like unlock, signup validation, real forms, stats 1–99.
- T6 — Missing core features — 2026-11-15 — delete/cancel/change item in place, password reset, profile rename
  and tabs, 404s, send-only email verification (notice + resend), consumables restored; e2e covers them.
- T12 — Deploy pipeline and relaunch — 2026-11-15 — production relaunched on soulsbuilds.com: backup, v2 rules +
  indexes, 52 builds / 102 users migrated, smoke test passed; CI preview channels + approved production deploys via
  Workload Identity; Analytics dropped, privacy and terms pages, default domains redirect, `admin.mjs export`,
  Auth domains + enumeration protection, owner is admin. App Check enforcement left to the owner.
- T11 — Performance and polish — 2026-11-15 — lazy routes and editor chunk, a11y/contrast/focus pass, meta and OG tags,
  self-hosted EB Garamond + Cinzel, generated icons and og:image, `core.ts` + `cards.json` data split (full data lazy),
  paged picker, light markdown view, spacing scale.
- T13 — Builds reference items by ID — 2026-11-15 — app on `src/data/er/` (accessors by ID, `rules.ts` for Ash
  of War/affinity/talisman rules), builds store game IDs + great rune and spirit ash slots, picker follows the
  game's rules, rules type-check within Firestore's expression budget, names→IDs folded into the v1→v2
  migration, "Great Hammer" tag, footer; 2022 data and icons deleted.
- T7 — Game data v2 + Shadow of the Erdtree — 2026-11-15 — owner's Smithbox export of the game files →
  `npm run data` (TypeScript pipeline, zod schemas, fixture + data tests, deterministic) → `src/data/er/` (base +
  DLC, game param IDs, real affinities and Ash of War rules) and 2,151 WebP icons; 2022 name → ID table; the
  app switch split into T13.
- T10 — Moderation — 2026-11-15 — reports on builds and comments (`reports/{targetId}_{uid}`, rules + tests,
  "Report" buttons), `scripts/admin.mjs` (reports, remove with JSON backup, dismiss, grant/revoke admin; tested
  on the emulators), App Check code (off until the owner's key: moved to T12). Delete, not hide
  (`docs/decisions.md`); no admin UI (backlog).
- T16 — Redesign: design system, shell, browse pages — 2026-11-15 — ~50/50 modern and in-world (approved HTML
  mockup v2): base tokens + per-game skin (CSS vars, `skins.ts`, AA contrast test), Inter/Cinzel/Garamond, in-world
  components (Frame, Ornament, PageHero, ItemTile, selection bar), Dialog auth, game tabs removed, landing as dense
  rows with authors, profile/legal/404 restyled; 2022 tokens kept in `legacy.ts` for T17.
- T17 — Redesign: build page, editor and item picker — 2026-11-15 — view and edit in one mockup layout (title
  block, framed panels, `ItemRow` tiles, stat bars, prose write-up), picker on a tall `Dialog` with filters and a
  weapon step for Ash of War/affinity, comments/report/like restyled; `legacy.ts`, `Slot` and 2022 icons deleted.
- T19 — Acquisition facts — 2026-11-15 — every pickable item placed (Ragged set → `NO_SOURCE`): ~100 enemy farm
  spots, base-game NPC/quest/painting rewards, DLC bosses and quests, Husks/Moore/Enia shop ranges, reversions;
  pipeline reads weapons that come with an Ash of War and enemy lots by ID. Owner shown a 30-item sample.
- T14 — Acquisition data — 2026-11-15 — `npm run data` writes `acquisition.json`: sources per item (lots placed by ID →
  nearest grace, event hints, shops by range, recipes by cookbook flag, classes), 54 regions in route order, 419
  graces, 27 gates, key items, validation with explicit allow-lists; ~670 items' facts pending (T19).
- T15 — "How to get this build" — 2026-11-15 — pure route solver (`features/editor/guide/route.ts`: earliest
  reachable source, item prerequisites, implied and any-of gates, topological order, steps by grace, legs by
  region) + lazy `GuideSection` on the build view (numbered, collapsible regions, item icons); unit, component
  and e2e tests. Upgrade materials, rune farming and a starting-class suggestion are in the Backlog.
- T8 — Build math — 2026-11-15 — `character.json` (classes + CalcCorrectGraph curves) and talisman `modifiers`
  from the export; pure `buildMath` (vitals, equip load/roll, poise, requirements incl. two-handing, memory
  slots) tested against Fextralife; `startingClass` saved (rules + tests), spells ≤ 12; Character panel,
  class picker with minimums, requirement and memory-slot warnings.
- T9 — Browse and discovery — 2026-11-15 — level range and search + tag now Firestore queries (multi-field range
  next to the sort `orderBy`; 7 new composite indexes ending in `level`, plus `tags`+`game`+`nameLower`); data-layer
  test. Indexes are untested against production (the emulator ignores them): check the first level/search
  queries after the next deploy.
- T21 — Performance — 2026-11-15 — `npm run perf` (headed Chrome + CDP: load vitals, scroll frames, GPU time,
  `--off` attribution); `background-attachment: fixed` → fixed layer behind content (landing 72 → 118 fps, 40% →
  2% dropped), grain on its own layer, `<main>` ≥ 1 screen (CLS 0.17 → 0), hosting cache headers, preconnects.
  Prod "after" numbers not yet measured (needs the deploy); App Check wait → T23.
- T18 — Account deletion and admin rename — 2026-11-15 — profile "Delete account" (password re-auth; finds
  everything, then deletes builds, likes/comments elsewhere with counters, reports, profile, Auth user;
  re-runnable), rules for own profile/report delete + comments collection-group read, `admin.mjs rename` and
  `delete-user` (backup first), privacy page updated; e2e `account.spec.ts`.
- T22 — Layout: lean landing, compact build page — 2026-11-16 — HTML mockup, owner picked "title first";
  landing: no hero, small `<h1>` in the Find builds frame, fixed-height rows with tags on one line + "+N"
  (`tags.ts` `fitCount`); build page: title pane, equipment across the page (weapons as rows, other slots as
  `ItemSlot` icon tiles with a `Tooltip` name on hover/focus/tap), write-up beside the numbers, guide collapsed
  with `GuideRoute` + acquisition data loaded on expand, comments across the page at 72ch.
- T20 — Community feel — 2026-11-16 — HTML mockup, owner picked layout A with counts; public `stats/elden-ring`
  (builds, distinct authors, accounts, builds per tag) from `admin.mjs stats`, daily in `stats.yml` as its own
  `github-stats` SA; top tags as the Tags row's first chips (scrolling row on phones),
  "N builds by M players", rows with comments + age, build page comment link, warmer empty state, "More by",
  profile build/like counts; scroll to top on navigation. SA set up and first run done by the owner (same day).
- T23 — Content sooner: the App Check wait — 2026-11-16 — cause confirmed in the SDK (Firestore awaits the App
  Check token; a cached IndexedDB token skips reCAPTCHA; T21's "warm" wait was perf's 403'd bot exchange);
  `enterprise.js` preloaded (cold first Firestore request ~1.29 → ~1.21 s, via `--head` before deploy; warm real
  visit ~0.33 s); perf App Check table + `--head`; owner sets a 1-day TTL. Blocked reCAPTCHA = blank page → T24.
- T24 — No blank page when reCAPTCHA is blocked — 2026-11-16 — owner: error only, one notice in the shell;
  `appCheckStatus.ts` (blocked = no token 2 s after a reCAPTCHA load error, or 10 s) + `AppCheckNotice`;
  checked on a local build served at soulsbuilds.com: notice at ~2.4 s, normal first Firestore request ~1.2 s.
- T25 — Firebase JS SDK 13 — 2026-11-16 — `firebase` 13.3.0 + `@firebase/rules-unit-testing` 6.0.0, no code changes
  (13.0's breaks are AI-only); check, rules (103) and e2e pass; preload URL still matches, blocked notice at ~2.4 s.
- T26 — Redesign v2 foundations — 2026-11-16 — EB Garamond 600 names/headings, `Label`/`labelText` the only caps,
  Inter values (14px, tabular); accent budget (neutral panels, tags, icons); `Frame` plain + `$hero` (corner marks,
  skin `tint`) on the build title pane; 1240px, `SPACE_PANEL/GROUP/REGION`; header with phone "+" and menu;
  write-up headings. Not seen on screen: write-up h1–h4 (no seeded write-up has headings).
- T27 — Loadout panel and stats card — 2026-11-16 — `sections/Loadout` (every slot always shown, items by name:
  left | right hand 64px, armor/talismans/flask + great rune and spirit ash 44px, spells one cell per memory slot;
  arrows/consumables only when used, owner) and `sections/StatsCard` (attributes, vitals, load bar with 30/70% marks;
  phones 4×2); stats first below 900px; hands stacked on phones; `ItemSlot` gone (`Tooltip` now unused).
- T28 — Build page tabs — 2026-11-16 — hero (main weapon, `lib/equipment.ts`) + tabs at `/build/:id/:tab?`
  (`tabs.ts`, sticky `BuildTabs`); owner, mid-session: stats in a left column on every desktop tab (one panel with
  the gear on Loadout, `BuildSummary` elsewhere), no Description tab without a write-up; Jump to (`rehypeJumpTo`);
  route as numbered areas; editor pinned dark (`index.html`); `BELOW_WIDE`, `screenshot --width`.
- T29 — Landing: slim toolbar, rows with a portrait — 2026-11-16 — no framed card: h1 + "N builds by M players" on
  a line, then search | sort | level, then a sideways-scrolling top-tags row ("More tags" after it, outside the
  scroller so its popover isn't clipped); 88px rows by named grid areas (portrait = `mainWeaponId`, strip
  left hand first, empty cells faint, "Level" label); tablet 140px, phones auto height (60px portrait, name on two
  lines). The phone Filters button is gone (sort and level always show).
- T34 — Track a build — 2026-11-16 — owner: local storage signed out (merged into the account on sign-in, not
  anonymous auth), gear + spells counted (not arrows/consumables), no class = 10 per stat, Share = the link;
  `users/{uid}/tracking/{buildId}` (owner-only rules), pure `lib/tracking.ts` (item keys, progress, changes,
  merge), `features/tracking/` (debounced saves, local storage, hero progress / Build complete, Keep my progress,
  new-items notice, stats with − +); Loadout toggles with "3/4"; account deletion + `admin.mjs delete-user`;
  `screenshot --storage`. Kept the full data out of the shell (`LOCAL_OWNER` in `localTracking.ts`).
- T39 — Loadout without empty rows — 2026-11-16 — read-only: a weapon row with both hands empty is hidden (one-handed
  rows keep the other hand's placeholder), Spells hidden without spells and never shows free-slot placeholders; edit
  mode unchanged. Not seen on screen: mobile Loadout, the Spells section; with no weapons the Armor row's top rule sits
  right under the heading.
- T35 — The route during a run — 2026-11-16 — owner: flat numbered stops (mockup), reasons hand-written on gates
  (`progression.ts` `reason`, pipeline fails without) and worded from the route's links for prerequisite key
  items (`route.ts` `usedFor`/`gate`, `phrases.ts` `itemReason`), region-only stops named by who/what; key items
  with icons (+80 webp); `guide/progress.ts` (done/next), "N of M stops done" + folding, `NextStop` card on Loadout.
  Mid-session: tracking becomes account-only → T41.
- T41 — Tracking needs an account — 2026-11-16 — owner: drop existing local progress (no merge), text + icons
  modal; `TrackingIntro` (signed out: Create account / Log in, continues into tracking via
  `useOpenAuthDialog(kind, onSignedIn)` + `startAfterSignIn(uid)`; signed in with no tracked build, from
  `tracksAnyBuild` (`limit(1)`): Start tracking / Not now); local storage, sync, Keep my progress and
  `mergeTracking` gone; `screenshot --storage` → `--click`; e2e `helpers.ts` `completeSignUp`.
- T36 — Playing and Completed — 2026-11-16 — owner: both profile tabs private, "Most played" sort, stopping a
  finished build removes it from Completed; build counters `playerCount`/`finishedCount` (±1 in the tracking
  doc's batch, rules check both sides; `saveQueue` tracks the stored status), hero "N playing · M finished",
  profile Playing cards (progress + next stop, lazy) and Completed trophies, `admin.mjs counts` backfill, e2e
  `playing.spec.ts`
- T40 — Choose the build's main image — 2026-11-16 — owner: picker in edit mode's title block ("Change image" →
  `BuildImageDialog`, radio rows), gear only (no arrows/consumables); `image: { kind, id } | null` (rules check the
  shape, optional on create), `buildImage` / `imageChoices` in `lib/equipment.ts` (read-time fallback to the main
  weapon; the editor saves a gone pick as null), `getCardItem` + 5 new card kinds (cards.json +7 KB gzipped);
  hero, landing rows, profile panels; e2e `build-image.spec.ts`. Rules budget nearly exhausted → T42.
