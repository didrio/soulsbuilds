# Tickets

Living, ordered backlog. **One ticket per session**: `/clear` → `/start Tn` → work → `/wrap`. The agent that
wraps a session updates this file and picks the next ticket. Rules: `.claude/skills/wrap/SKILL.md`. Capture
ideas any time with `/ticket`. Ticket numbers are never reused; **next free: T13**.

Each ticket has: **Status**, **Session** (model · effort · plan mode), **Goal**, **Done when**, **Context**
(read-first files, decisions, pitfalls). A fresh session reads the ticket and only what it names.

**Next:** T10 — Moderation: reports, admin tools, App Check · Opus · high · plan mode on (needs the owner for
App Check setup). Or, if the owner has picked a data source: T7.

**Road to relaunch** (owner's call, 2026-11-14: relaunch publicly on Firebase): T2–T5 done (typed code, safe
data model, data layer, 2022 bugs). Left: T6 remainder (two owner calls), T7–T9 make it worth visiting (DLC
data, build math, discovery remainder); T10–T12 make it safe to open (moderation, polish, deploy). The critical
path to relaunch is **T10 → T12**; whether T7–T9 come before or after the relaunch is the owner's call.

## In progress

(none)

## Up next

### T10 — Moderation: reports, admin tools, App Check

- **Status:** ready; App Check needs the owner in the Firebase/Google Cloud console
- **Session:** Opus · high effort · plan mode on
- **Goal:** Safe to open to the public: abuse can be reported and handled.
- **Done when:**
  - [x] (T3/T4) Delete own comment; admins (custom claim `admin`) may delete any build or comment (rules +
        tests); comment length and one-like-per-user enforced by the rules.
  - [ ] Report a build or comment: a `reports` collection, create-only for signed-in users (reporter = auth uid,
        target path, reason from a fixed list, optional note ≤ 500, server `createdAt`), readable by admins only;
        one report per user per target (doc id `${targetId}_${uid}`). "Report" buttons on the build page and on
        comments.
  - [ ] Admin: `scripts/admin.mjs` (ADC, dry-run by default like the migration): set/unset the admin claim,
        list open reports, delete a build/comment (with its counter batch) and resolve the report. Decide with
        the owner whether "hide" (a `hidden` flag the rules and queries respect) is needed or delete is enough.
        Optionally a minimal admin page if the owner wants one.
  - [ ] Firebase App Check with reCAPTCHA Enterprise, enforced for Firestore and Auth. The owner creates the
        site key and turns on enforcement; the code adds `initializeAppCheck` in `src/lib/firebase/app.ts` (not
        in emulator mode; debug token for local). Write the exact console steps in `docs/firebase.md`.
  - [ ] Rules tests for reports and admin paths in `tests/rules/`.
- **Context:** `firestore.rules` (`isAdmin()`), `tests/rules/`, `docs/firebase.md`, `src/lib/firebase/`,
  `scripts/migrate-v1-to-v2.mjs` (pattern for an ADC admin script).

### T6 — Missing core features (remainder)

- **Status:** ready; two owner decisions first
- **Session:** Sonnet · medium effort · plan mode off
- **Goal:** Finish the features 2022 never got to.
- **Done when:**
  - [x] Delete build (owner, confirm step; likes/comments cleaned up). Cancel edit. Change an item in place
        (a filled slot opens the picker: change the item, affinity or skill, or "Remove"). Password reset
        ("Forgot password?") and readable auth errors. Profile rename, Builds/Liked tabs, not-found user. 404.
  - [ ] **Owner:** email verification — send-only (a notice + resend on the profile), or also required to post
        (rules check `request.auth.token.email_verified`, which needs a rules test)? Then build it.
  - [ ] **Owner:** consumables — restore the commented-out UI in `EquipmentEditor` (the model already has
        `equipment.consumables`, ≤ 10) or drop them from the model, the editor store and the rules.
  - [ ] e2e covers rename and password reset (the auth emulator accepts reset requests).
- **Context:** `src/features/profile/Profile.tsx` (`ProfileHeader`), `src/features/auth/Login.tsx`,
  `src/lib/firebase/auth.ts`, `EquipmentEditor` consumables block, `tests/e2e/build-flow.spec.ts`.

### T11 — Performance and polish (remainder)

- **Status:** ready (fonts need the owner's OK)
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
  - [ ] Favicon, app icons, `manifest.json`, meta description and Open Graph tags (site-level). Ask the owner
        for an icon or approve a simple generated one.
  - [ ] Tooltips usable on touch (weapon affinity/skill badges in `Slot` are hover-only).
  - [ ] Accessibility: contrast check of the gold/green palette (WCAG AA), alt text strategy for item icons,
        keyboard focus trap and Escape for the item picker modal and the login panel.
  - [ ] Fonts: replace the Adobe Typekit kit (`garamond-premier-pro`, tied to the owner's Adobe account) with a
        self-hosted open font (e.g. EB Garamond); check the OptimusPrinceps license or replace it. **Owner OK
        first** (new asset source).
  - [ ] A spacing scale in `src/theme/` used by the layout.
- **Context:** `index.html`, `src/index.css`, `vite.config.ts`, `src/features/editor/Slot.tsx`, `ItemSelector`,
  `App.tsx` (modal, panel). Screenshot before/after, desktop and `--mobile`.

### T7 — Game data v2 + Shadow of the Erdtree

- **Status:** blocked — owner picks the data/image source (licensing) at the start of the session
- **Session:** Opus · extra high effort · plan mode on
- **Goal:** A re-runnable, typed, validated game-data pipeline with stable item IDs, covering the base game and
  the Shadow of the Erdtree DLC.
- **Done when:**
  - [ ] Source chosen with the owner: e.g. data extracted from the game's params by community tools, a
        maintained open dataset, or a wiki with a compatible license. Same for icons. Record it in
        `docs/decisions.md`. The 2022 rankedboost scrape is not reused.
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

- **Status:** ready (after T10; ideally T6–T9)
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
  - [ ] Analytics: consent banner or drop Analytics. Privacy policy and terms pages.
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
