# Tickets

Living, ordered backlog. **One ticket per session**: `/clear` → `/start Tn` → work → `/wrap`. The agent that
wraps a session updates this file and picks the next ticket. Rules: `.claude/skills/wrap/SKILL.md`. Capture
ideas any time with `/ticket`. Ticket numbers are never reused; **next free: T14**.

Each ticket has: **Status**, **Session** (model · effort · plan mode), **Goal**, **Done when**, **Context**
(read-first files, decisions, pitfalls). A fresh session reads the ticket and only what it names.

**Next:** T11 (performance and polish remainder: game data split, fonts, icons) · Sonnet · medium · plan mode
off. Then T12, the relaunch.

**Owner to-dos tracked in tickets:** T12
(GCP setup for CI deploys, App Check enforcement, your admin claim, approving each production step). Done
2026-11-15: secret scanning + push protection on, App Check key created and registered, gcloud ADC set up, keep
the 2022 builds, the game data export (redo it after a game patch: `docs/game-data-extraction.md`). Owner decisions are in
`docs/decisions.md`.

**Road to relaunch** (owner's call, 2026-11-14: relaunch publicly on Firebase): T2–T7, T10 and T13 done (typed
code, safe data model, data layer, 2022 bugs, moderation, game data v2 with the DLC, builds by game ID). Left:
T11 polish remainder and T12 deploy make it ready to open; T8 (build math) and T9 (discovery remainder) make it
richer and may follow the launch (owner's call, 2026-11-15).

## In progress

(none)

## Up next

### T11 — Performance and polish (remainder)

- **Status:** ready (icons and fonts approved 2026-11-15; T13 done, so the data split can go ahead)
- **Session:** Sonnet · medium effort · plan mode off
- **Goal:** Fast first load and a finished look on phones.
- **Done when:**
  - [x] Lazy routes for `/build/*` and `/user/*`; the markdown editor in its own chunk (main bundle 738 → 347 KB
        gzipped). Long build titles wrap; build cards and the game tabs fit a 390 px phone; slot names hidden
        on phone-sized slots; the item picker's dropdowns wrap. Buttons/links instead of clickable divs in the
        header, cards, game tabs, slots and picker; labels on inputs; focus styles on inputs and buttons.
  - [ ] Game data (~1.2 MB JSON, 294 KB gzipped, in the `Slot` chunk since T13; the landing cards need it):
        load it per route or ship a slim index (id, name, icon) for the cards. The weapon picker renders all 487
        rows (slow in jsdom tests, fine in Chrome): consider windowing. Consider a lighter markdown renderer for
        view mode (the full editor package is 365 KB gzipped just to render).
  - [ ] Picker top bar on phones: the "Remove <item>" button wraps to three lines next to the search box.
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

### T12 — Deploy pipeline and relaunch

- **Status:** ready (T13 done; owner's call, 2026-11-15: T8/T9 may follow the launch)
- **Session:** Opus · high effort · plan mode on
- **Goal:** Ship it: repeatable deploys and a safe production cutover.
- **Done when:**
  - [ ] GitHub Actions: Firebase Hosting **preview channel** per PR (comment with the URL), production deploy
        on `main` behind a manual approval (GitHub environment). Auth via Workload Identity Federation (no
        JSON keys in secrets). Owner sets up the GCP side; the ticket writes exact steps.
  - [ ] Owner-approved production steps, each asked for, in this order: dry-run
        `scripts/migrate-v1-to-v2.mjs --project soulsbuilds` and review the report with the owner (owner's call, 2026-11-15: **keep the 2022 builds** unless the report
        shows a problem; it also turns item names into game IDs since T13; read the "Names not in the game data" summary at the end); deploy rules + indexes (`--only
firestore:rules,firestore:indexes`) and wait for the indexes to build; run the migration with
        `--write`; deploy hosting; smoke-test the live site (sign up, create, like, comment). Rules and the
        migration must go together: the v2 rules reject v1 docs.
  - [ ] **Drop Analytics** (owner, 2026-11-15): remove `getAnalytics` from `src/lib/firebase/app.ts` and the
        `measurementId` if unused. Privacy policy (Auth stores emails) and terms pages.
  - [x] **Owner, from T1:** GitHub secret scanning + push protection for didrio/soulsbuilds (on 2026-11-15,
        checked via the API). Expect an alert for the revoked 2022 key in history: close it as "Revoked".
  - [ ] **Owner, from T10:** App Check. Done 2026-11-15: reCAPTCHA Enterprise key created (3 domains), in
        `APP_CHECK_SITE_KEY` and registered in Firebase App Check. Left: deploy, watch the metrics, then
        enforce for Firestore and Auth. Exact steps: `docs/firebase.md` "App Check".
  - [ ] **Owner, from T10:** (gcloud ADC set up 2026-11-15) make yourself admin in production:
        `node scripts/admin.mjs grant <your email> --project soulsbuilds --write`, then check
        `node scripts/admin.mjs reports --project soulsbuilds` works with ADC.
  - [ ] Custom domain: `soulsbuilds.com` resolves to Firebase Hosting (199.36.158.100, checked 2026-11-15);
        it's the owner's custom domain (confirmed 2026-11-15; already on the reCAPTCHA key with both default
        domains). Add it to Auth's authorized domains and use it in `index.html`'s `og:url` (now
        `soulsbuilds.web.app`). Ask whether the default domains should redirect to it.
  - [ ] Relaunch checklist in `docs/firebase.md` (backups/PITR, budget alerts, App Check enforced, auth
        providers, authorized domains).
- **Context:** `docs/firebase.md`, `firebase.json`, `.github/workflows/ci.yml`, `npm run deploy`.

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
- T7 — Game data v2 + Shadow of the Erdtree — 2026-11-15 — owner's Smithbox export of the game files →
  `npm run data` (TypeScript pipeline, zod schemas, fixture + data tests, deterministic) → `src/data/er/` (base +
  DLC, game param IDs, real affinities and Ash of War rules) and 2,151 WebP icons; 2022 name → ID table; the
  app switch split into T13.
- T13 — Builds reference items by ID — 2026-11-15 — app on `src/data/er/` (accessors by ID, `rules.ts` for Ash
  of War/affinity/talisman rules), builds store game IDs + great rune and spirit ash slots, picker follows the
  game's rules, rules type-check within Firestore's expression budget, names→IDs folded into the v1→v2
  migration, "Great Hammer" tag, footer; 2022 data and icons deleted.
