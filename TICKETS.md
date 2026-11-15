# Tickets

Living, ordered backlog. **One ticket per session**: `/clear` → `/start Tn` → work → `/wrap`. The agent that
wraps a session updates this file and picks the next ticket. Rules: `.claude/skills/wrap/SKILL.md`. Capture
ideas any time with `/ticket`. Ticket numbers are never reused; **next free: T13**.

Each ticket has: **Status**, **Session** (model · effort · plan mode), **Goal**, **Done when**, **Context**
(read-first files, decisions, pitfalls). A fresh session reads the ticket and only what it names.

**Next:** T11's remainder (fonts and icons: approved) · Sonnet · medium · plan mode off. Then T7 (data source
decided; confirm PC ownership at the start), then T12, the relaunch.

**Owner to-dos tracked in tickets:** T7 (confirm you own ER + SotE on PC), T12 (GitHub secret scanning, App
Check key and enforcement, your admin claim, keep or drop the 2022 data, the production cutover). All other
owner decisions were made on 2026-11-15 and are in `docs/decisions.md`.

**Road to relaunch** (owner's call, 2026-11-14: relaunch publicly on Firebase): T2–T6 and T10 done (typed code,
safe data model, data layer, 2022 bugs, moderation). Left: T7–T9 make it worth
visiting (DLC data, build math, discovery remainder); T11 polish remainder and T12 deploy make it ready to open.
The critical path to relaunch is **T12**. Owner's call (2026-11-15): relaunch **after T7**; T8 and T9 may
follow the launch.

## In progress

(none)

## Up next

### T11 — Performance and polish (remainder)

- **Status:** ready (icons and fonts approved 2026-11-15); the bundle split waits for T7
- **Session:** Sonnet · medium effort · plan mode off
- **Goal:** Fast first load and a finished look on phones.
- **Done when:**
  - [x] Lazy routes for `/build/*` and `/user/*`; the markdown editor in its own chunk (main bundle 738 → 347 KB
        gzipped). Long build titles wrap; build cards and the game tabs fit a 390 px phone; slot names hidden
        on phone-sized slots; the item picker's dropdowns wrap. Buttons/links instead of clickable divs in the
        header, cards, game tabs, slots and picker; labels on inputs; focus styles on inputs and buttons.
  - [ ] Game data (~650 KB JSON in the main bundle, the landing cards need it): after T7, load it per route or
        ship a slim index for the cards. Consider a lighter markdown renderer for view mode (the full editor
        package is 365 KB gzipped just to render).
  - [x] (2026-11-15) Meta description, Open Graph/Twitter tags (site-level), manifest and theme colors.
        Weapon affinity/skill badges usable on touch and keyboard in view mode (pinned to the screen bottom
        on phones); slot names include affinity/skill for screen readers. WCAG AA contrast pass (hover text,
        error red, liked button, slot names); item icons decorative by design. `FocusScope`: the item picker
        is a focus-trapped dialog with Escape; the login panel and report form take focus, close on Escape
        and hand focus back. Spacing scale `SPACE_*` in `src/theme/`, used by the shell and main pages.
  - [ ] Favicon, app icons (`manifest.json` has none yet) and an `og:image`: a simple generated icon, a gold
        mark on the dark green (owner, 2026-11-15; replaceable later). SVG favicon + PNG sizes for the manifest.
  - [ ] Main `Button` text is AA only around its middle (dark text on the gold→dark-gold gradient drops to
        2.9:1 at the dark end); fine as is, revisit if the button style changes.
  - [ ] Move the remaining literal margins/paddings (editor sections, picker, cards) to `SPACE_*` as files
        are touched.
  - [ ] Fonts (owner, 2026-11-15): replace the Adobe Typekit kit (`garamond-premier-pro`, `index.html`) with
        self-hosted **EB Garamond** and OptimusPrinceps (`src/index.css`, `FONT_DISPLAY`) with **Cinzel**, both
        OFL (e.g. `@fontsource/*` packages); delete the `.ttf`. Screenshot before/after.
  - [ ] A spacing scale in `src/theme/` used by the layout.
- **Context:** `index.html`, `src/index.css`, `vite.config.ts`, `src/features/editor/Slot.tsx`, `ItemSelector`,
  `App.tsx` (modal, panel). Screenshot before/after, desktop and `--mobile`.

### T7 — Game data v2 + Shadow of the Erdtree

- **Status:** ready; source decided 2026-11-15 (`docs/decisions.md`): first ask the owner whether they own
  ER + SotE on PC
- **Session:** Opus · extra high effort · plan mode on
- **Goal:** A re-runnable, typed, validated game-data pipeline with stable item IDs, covering the base game and
  the Shadow of the Erdtree DLC.
- **Done when:**
  - [ ] Source (owner, 2026-11-15): data extracted from the game's own files with community tools if the owner
        owns ER + SotE on PC, else the Elden Ring Fandom wiki (CC BY-SA: attribution, share-alike). Icons from
        the game files, plus a "not affiliated with FromSoftware" footer. Re-check the tools' and sources'
        licenses before writing code; update the `docs/decisions.md` row. The 2022 scrape is not reused.
  - [ ] `scripts/data/` pipeline (Node, re-runnable) → `src/data/` JSON with **stable IDs**, zod schemas, and
        validation tests (every reference resolves; counts; images exist). `src/data/data.test.ts`'s
        `it.fails` cases become passing `it`s.
  - [ ] Correct affinities (Cold, Flame Art; per-weapon infusability), each weapon's built-in skill and which
        Ashes of War it accepts, great runes, spirit ashes, DLC weapon types (e.g. Backhand Blade, Great
        Katana, Light Greatsword, Beast Claw, Thrusting Shield, Throwing Blade, Perfume Bottle, Hand-to-Hand)
        and DLC bosses as tags.
  - [ ] Builds reference items by ID; a names→IDs migration (in the T3 migration framework) with a report of
        anything that didn't map. The editor and seed use IDs.
  - [ ] Images: URL-safe filenames (no spaces/apostrophes), WebP, lazy-loaded.
- **Context:** `docs/data.md` (current files, shapes, known gaps), `scripts/legacy-data/` (how 2022 did it),
  `src/data/data.test.ts`. Big files: query them with `node -e`, never Read whole.

### T8 — Build math

- **Status:** ready (after T7)
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

- **Status:** ready (after T7 for the DLC tags)
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
  - [ ] DLC bosses in tags (from T7).
- **Context:** `src/features/builds/` (`Landing`, `filters.ts`, `queries.ts`), `src/lib/firebase/builds.ts`
  (`listBuilds`, `searchBuilds`), `firestore.indexes.json`. If the owner wants real full-text search, that's a
  new service (Algolia/Typesense): ask.

### T12 — Deploy pipeline and relaunch

- **Status:** ready after T7 (owner's call, 2026-11-15; T8/T9 may follow the launch)
- **Session:** Opus · high effort · plan mode on
- **Goal:** Ship it: repeatable deploys and a safe production cutover.
- **Done when:**
  - [ ] GitHub Actions: Firebase Hosting **preview channel** per PR (comment with the URL), production deploy
        on `main` behind a manual approval (GitHub environment). Auth via Workload Identity Federation (no
        JSON keys in secrets). Owner sets up the GCP side; the ticket writes exact steps.
  - [ ] Owner-approved production steps, each asked for, in this order: dry-run
        `scripts/migrate-v1-to-v2.mjs --project soulsbuilds` and review the report with the owner (does the
        owner want the 2022 data at all, or start fresh?); deploy rules + indexes (`--only
firestore:rules,firestore:indexes`) and wait for the indexes to build; run the migration with
        `--write`; deploy hosting; smoke-test the live site (sign up, create, like, comment). Rules and the
        migration must go together: the v2 rules reject v1 docs.
  - [ ] **Drop Analytics** (owner, 2026-11-15): remove `getAnalytics` from `src/lib/firebase/app.ts` and the
        `measurementId` if unused. Privacy policy (Auth stores emails) and terms pages.
  - [ ] **Owner, from T1:** turn on GitHub secret scanning + push protection for didrio/soulsbuilds (the repo
        is public, and this ticket adds CI credentials).
  - [ ] **Owner, from T10:** App Check. Create the reCAPTCHA Enterprise key, register the web app, put the
        site key in `APP_CHECK_SITE_KEY` (`src/lib/firebase/app.ts`), deploy, watch the metrics, then enforce
        for Firestore and Auth. Exact steps: `docs/firebase.md` "App Check".
  - [ ] **Owner, from T10:** make yourself admin in production:
        `node scripts/admin.mjs grant <your email> --project soulsbuilds --write`, then check
        `node scripts/admin.mjs reports --project soulsbuilds` works with ADC.
  - [ ] Relaunch checklist in `docs/firebase.md` (backups/PITR, budget alerts, App Check enforced, auth
        providers, authorized domains).
- **Context:** `docs/firebase.md`, `firebase.json`, `.github/workflows/ci.yml`, `npm run deploy`.

## Backlog

- Other games (Dark Souls 1–3, Sekiro, Elden Ring Nightreign) on top of T3's `game` field: data per game, game
  selector routes (`/ds3/...`), per-game tags.
- Per-build share previews (Open Graph image/title per build): needs SSR or a Cloud Function (Blaze plan).
- Build comparison view; "copy this build" to start from someone else's.
- Firebase MCP server for agents (local emulator use only) once its emulator support is clear.
- Firebase JS SDK 13 (and `@firebase/rules-unit-testing` 6, which requires it): check the changelog, upgrade,
  run all three test suites.
- Build history / "updated" badge using `updatedAt`; edit comments (rules allow no comment updates today).
- Admin page in the app (list reports, remove/dismiss) if `scripts/admin.mjs` gets tedious; the rules already
  let admins list reports and delete content.

## Done

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
- T10 — Moderation — 2026-11-15 — reports on builds and comments (`reports/{targetId}_{uid}`, rules + tests,
  "Report" buttons), `scripts/admin.mjs` (reports, remove with JSON backup, dismiss, grant/revoke admin; tested
  on the emulators), App Check code (off until the owner's key: moved to T12). Delete, not hide
  (`docs/decisions.md`); no admin UI (backlog).
- T6 — Missing core features — 2026-11-15 — delete/cancel/change item in place, password reset, profile rename
  and tabs, 404s, send-only email verification (notice + resend), consumables restored; e2e covers them.
