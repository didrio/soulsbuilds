# Tickets

Living, ordered backlog. **One ticket per session**: `/clear` → `/start Tn` → work → `/wrap`. The agent that
wraps a session updates this file and picks the next ticket. Rules: `.claude/skills/wrap/SKILL.md`. Capture
ideas any time with `/ticket`. Ticket numbers are never reused; **next free: T19**.

Each ticket has: **Status**, **Session** (model · effort · plan mode), **Goal**, **Done when**, **Context**
(read-first files, decisions, pitfalls). A fresh session reads the ticket and only what it names.

**Next:** T14, acquisition data (first half of "How to get this build") · Opus · high · plan mode on.

**Owner to-dos** (from T12; checklist in `docs/firebase.md` "Relaunch checklist"):

- Approve the first CI production run (Actions → the run → Review deployments); it proves Workload Identity end to
  end. Open a throwaway PR once to see the preview comment.
- In a day or two: App Check → APIs, check that nearly all requests are verified, then **Enforce** for Firestore
  and Auth (`docs/firebase.md` "App Check" step 4).
- Console: delete the disposable test account "claude" (Authentication → Users); unlink Google Analytics if it's
  linked (Project settings → Integrations); set the email templates' sender name to "Souls Builds".
- Decide on the display name "Anne Frankly" (migrated from 2022; public on profiles). T18 adds an admin rename.
- Keep a copy of `.admin-backups/export_soulsbuilds_2026-11-15T22-59-34-751Z.json` (the v1 data) outside the repo.

**Relaunched** 2026-11-15 (T12) on soulsbuilds.com. **Order from here** (owner's calls, 2026-11-15): the redesign
(T16 design system and shell, T17 the remaining pages: done), then the headline feature, "How to get this build" (T14
acquisition data, T15 route + UI), then T8 and T9. The redesign comes first so that T15's and T8's new UI is built
once, in the new design. T14 is data only and could run before or alongside the redesign. T18 (account deletion)
can slot in anywhere; the privacy policy promises deletion by GitHub issue until then.

## In progress

(none)

## Up next

### T14 — Acquisition data (where every item comes from)

- **Status:** ready (data only; any time after T12, before T15)
- **Session:** Opus · high effort · plan mode on
- **Goal:** Know how to get every pickable item from a fresh save, as data `npm run data` produces. First half
  of the headline feature "How to get this build" (owner's idea, 2026-11-15): from a fresh save, a short guide
  to every item in the build, in an efficient order.
- **Done when:**
  - [ ] `npm run data` also writes `src/data/er/acquisition.json`: for each item ID (weapons, armor, talismans,
        spells, Ashes of War, spirit ashes, tears, great runes, consumables, arrows) a list of **sources**
        `{ kind: pickup | boss | enemy | shop | remembrance | quest | start | alteration, location, detail, cost? }`;
        **locations** `{ id, name, region, grace?, requires: gateId[], order }`; and **gates**
        `{ id, label, requires }` (e.g. `stormveil`, `two-great-runes`, `academy-key`, `haligtree-medallion`,
        `dlc` = Mohg + Radahn, `spirit-bell`, the affinity whetblades).
  - [ ] Derived from the params: map lots → map tile → region + nearest grace (BonfireWarpParam positions and
        text); row-name brackets as the place/boss hint; shops → merchant (a small hand-written merchant →
        location table); remembrance trades → their boss; enemy drops → enemy (+ a hand-written farm spot for
        the ones a build might need).
  - [ ] Hand-written inputs in `scripts/data/` (e.g. `progression.ts`: locations, gates and their canonical
        route order; `quest-items.json`: quest and event rewards). `src/data/er/` stays machine-written.
  - [ ] Validation: every pickable item has a source (the pipeline fails on a gap unless it's on an explicit
        allow-list); location and gate references resolve; the gate graph is acyclic. Pipeline tests on
        `test-fixtures.ts`; `src/data/data.test.ts` pins coverage and checks ~20 known items (e.g. Moonveil →
        Gael Tunnel, Magma Wyrm; Ash of War: Loretta's Slash → Loretta's remembrance).
  - [ ] The owner spot-checks ~30 random items with their sources (the session prints them).
- **Context:** **Deterministic, no AI** (owner's call, 2026-11-15; `docs/decisions.md`): data per item + a
  small gate graph, and T15's pure function composes the route for any build. Read `docs/data.md`,
  `scripts/data/{export,extract,build}.ts`, `src/data/schema.ts`. Checked 2026-11-15 in the export:
  `ItemLotParam_map` (5,592 rows, 2,342 with `[Place - Detail]` names, e.g.
  `[Gael Tunnel - Magma Wyrm] Moonveil`), `ItemLotParam_enemy` (5,135, named by enemy), `ShopLineupParam`
  (1,297, `[Merchant] Item`), `BonfireWarpParam` (area, grid, position, text ID), `WorldMapPlaceNameParam`.
  Map lot IDs seem to encode the tile (`1041550010` → m60_41_55; `20…` → DLC m61): verify against named rows
  first. Coverage: weapons 477/487 have a lot or shop source, armor 722/728, and talismans, spells, Ashes of
  War, spirit ashes and tears all of them; the gaps are quest rewards (Nagakiba, Rogier's Rapier, Dryleaf
  Arts, Ragged set…). Row names are Smithbox/Paramdex community labels, allowed as **hints** (owner's call).
  Size: acquisition data loads with the build page's full data only, never in `@/data/core`.

### T15 — "How to get this build" on the build page

- **Status:** ready (after T14)
- **Session:** Opus · high effort · plan mode on
- **Goal:** A short, numbered route from a fresh save to the whole build, in an efficient order. Plain,
  scannable steps: where to go, in what order, not a walkthrough.
- **Done when:**
  - [ ] Pure solver (`src/lib/route.ts`, or under `src/features/editor/guide/`): build equipment → for each
        item the source that's reachable earliest; add the gates it implies (the affinity's whetblade, the
        Spirit Calling Bell for an ash, the Divine Tower for a great rune, DLC entry…); topological sort with
        the canonical route order as the tie-breaker; merge items at the same location; group by region.
        "Efficient" = a sensible earliest-first order through the usual progression, not a proven shortest
        path (say so in a comment).
  - [ ] Table-driven tests: gates respected, earliest source chosen, shared locations merged, DLC items after
        Mohg + Radahn, starting-class gear shown as "start as X".
  - [ ] "How to get this build" section on the build view: numbered one-line steps (region, grace, what to do:
        beat X, buy from Y for N runes, pick up) with item icons; collapsible by region on mobile; real
        heading and list markup.
  - [ ] Component test + an e2e check on a seeded build; desktop and `--mobile` screenshots.
  - [ ] Backlog entries for what's out of scope: upgrade materials (builds don't store upgrade levels), rune
        farming to the build's level, a suggested starting class (needs T8's class data).
- **Context:** T14's `acquisition.json` + accessors in `src/data/index.ts`; `BuildEditorPage` (a comment marks
  where the section goes, between Equipment and About this build) and `sections/` in T17's design (`Frame` +
  `SectionHeading` panels, `ItemTile` for icons); `add-feature` skill.

### T8 — Build math

- **Status:** ready
- **Session:** Opus · high effort · plan mode on
- **Goal:** Make builds informative: the numbers players actually check.
- **Done when:**
  - [ ] Stat requirements per weapon/spell with a warning when unmet (two-handing gives 1.5× STR).
  - [ ] Equip load and roll type (light/medium/heavy/overloaded) from armor + weapon weights and endurance;
        poise from armor; HP/FP/stamina from vigor/mind/endurance (soft caps); starting class picker that sets
        the minimum stats.
  - [ ] Spell slots from memory stones / Moon of Nokstella (+2); spells beyond the slots are flagged.
  - [ ] All in `src/lib/buildMath.*` as pure functions with table-driven tests against known in-game values.
- **Context:** T7's data (weights, requirements, scaling). `src/lib/buildMath.ts`, `StatEditor`,
  `SpellEditor`. Get formulas from a source the owner trusts; cite it in a comment.

### T9 — Browse and discovery (remainder)

- **Status:** ready
- **Session:** Sonnet · medium effort · plan mode off
- **Goal:** Make finding builds pleasant at scale.
- **Done when:**
  - [x] Sort by top/new; cursor pagination ("Load more"); one tag as a Firestore query, further tags
        client-side; name search (prefix on `nameLower`, the free option); filters and search in the URL.
  - [ ] Level range as a Firestore query instead of client-side (it filters loaded pages today, so narrow
        ranges show sparse pages). Firestore needs `orderBy('level')` first, or the newer multi-field range
        support: check the current docs, add the index, and a data-layer test in `tests/rules/data-layer.test.ts`.
  - [ ] Search combined with the tag filter server-side (index `tags` CONTAINS + `game` + `nameLower`), or keep
        it client-side and say so in the UI.
  - [x] DLC bosses in tags (T7's `src/data/er/tags.json`, read by the tag picker since T13).
- **Context:** `src/features/builds/` (`Landing`, `filters.ts`, `queries.ts`), `src/lib/firebase/builds.ts`
  (`listBuilds`, `searchBuilds`), `firestore.indexes.json`. If the owner wants real full-text search, that's a
  new service (Algolia/Typesense): ask.

### T18 — Account deletion (in-app) and admin rename

- **Status:** ready
- **Session:** Opus · high effort · plan mode on
- **Goal:** Let users delete their account themselves, and let admins fix a display name, so the privacy policy's
  "open a GitHub issue" path becomes a fallback.
- **Done when:**
  - [ ] Profile (owner only): "Delete account", with a confirm step that says what goes (account, builds with
        their likes and comments, your comments and likes elsewhere, your reports). Re-authentication if Auth asks
        for it (`auth/requires-recent-login`).
  - [ ] Data removal without Cloud Functions (Spark): client-side batches under rules that allow an owner to delete
        their own docs, and the counters (`likeCount`, `commentCount`) on other people's builds kept right in the
        same batches; then `deleteUser`. Decide and document what happens if it fails halfway (re-runnable).
  - [ ] `scripts/admin.mjs rename <uid> <name> [--write]` (display name moderation) and `delete-user <uid>`
        (the same removal via the Admin SDK, with a JSON backup like `remove`).
  - [ ] Rules tests for every new delete path; e2e: sign up, create, comment, delete account, the build is gone.
  - [ ] Privacy page updated (delete it yourself from your profile; GitHub issue as a fallback).
- **Context:** `firestore.rules` (expression budget: keep it cheap), `tests/rules/`, `src/lib/firebase/`
  (`builds.ts`, `likes.ts`, `comments.ts`, `users.ts`, `auth.ts`), `src/features/profile/Profile.tsx`,
  `scripts/admin.mjs` (`removeContent` is the pattern), `src/features/legal/Privacy.tsx`. Counters change in
  the same batch as the doc they count (AGENTS.md).

## Backlog

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

- T17 — Redesign: build page, editor and item picker — 2026-11-15 — view and edit in one mockup layout (title
  block, framed panels, `ItemRow` tiles, stat bars, prose write-up), picker on a tall `Dialog` with filters and a
  weapon step for Ash of War/affinity, comments/report/like restyled; `legacy.ts`, `Slot` and 2022 icons deleted.
- T16 — Redesign: design system, shell, browse pages — 2026-11-15 — ~50/50 modern and in-world (approved HTML
  mockup v2): base tokens + per-game skin (CSS vars, `skins.ts`, AA contrast test), Inter/Cinzel/Garamond, in-world
  components (Frame, Ornament, PageHero, ItemTile, selection bar), Dialog auth, game tabs removed, landing as dense
  rows with authors, profile/legal/404 restyled; 2022 tokens kept in `legacy.ts` for T17.
- T10 — Moderation — 2026-11-15 — reports on builds and comments (`reports/{targetId}_{uid}`, rules + tests,
  "Report" buttons), `scripts/admin.mjs` (reports, remove with JSON backup, dismiss, grant/revoke admin; tested
  on the emulators), App Check code (off until the owner's key: moved to T12). Delete, not hide
  (`docs/decisions.md`); no admin UI (backlog).
- T7 — Game data v2 + Shadow of the Erdtree — 2026-11-15 — owner's Smithbox export of the game files →
  `npm run data` (TypeScript pipeline, zod schemas, fixture + data tests, deterministic) → `src/data/er/` (base +
  DLC, game param IDs, real affinities and Ash of War rules) and 2,151 WebP icons; 2022 name → ID table; the
  app switch split into T13.
- T13 — Builds reference items by ID — 2026-11-15 — app on `src/data/er/` (accessors by ID, `rules.ts` for Ash
  of War/affinity/talisman rules), builds store game IDs + great rune and spirit ash slots, picker follows the
  game's rules, rules type-check within Firestore's expression budget, names→IDs folded into the v1→v2
  migration, "Great Hammer" tag, footer; 2022 data and icons deleted.
- T11 — Performance and polish — 2026-11-15 — lazy routes and editor chunk, a11y/contrast/focus pass, meta and OG tags,
  self-hosted EB Garamond + Cinzel, generated icons and og:image, `core.ts` + `cards.json` data split (full data lazy),
  paged picker, light markdown view, spacing scale.
- T12 — Deploy pipeline and relaunch — 2026-11-15 — production relaunched on soulsbuilds.com: backup, v2 rules +
  indexes, 52 builds / 102 users migrated, smoke test passed; CI preview channels + approved production deploys via
  Workload Identity; Analytics dropped, privacy and terms pages, default domains redirect, `admin.mjs export`,
  Auth domains + enumeration protection, owner is admin. App Check enforcement left to the owner.
