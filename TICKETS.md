# Tickets

Living, ordered backlog. **One ticket per session**: `/clear` → `/start Tn` → work → `/wrap`. The agent that
wraps a session updates this file and picks the next ticket. Rules: `.claude/skills/wrap/SKILL.md`. Capture
ideas any time with `/ticket`. Ticket numbers are never reused; **next free: T13**.

Each ticket has: **Status**, **Session** (model · effort · plan mode), **Goal**, **Done when**, **Context**
(read-first files, decisions, pitfalls). A fresh session reads the ticket and only what it names.

**Next:** T2 — Strict TypeScript + feature folders · Opus · high · plan mode off

**Road to relaunch** (owner's call, 2026-11-14: relaunch publicly on Firebase): T2 → T3 → T4 make the code
typed and the data safe; T5–T6 finish what 2022 left; T7–T9 make it worth visiting (DLC data, build math,
discovery); T10–T12 make it safe to open (moderation, polish, deploy). Order matters most for T3 before T12.

## In progress

(none)

## Up next

### T2 — Strict TypeScript + feature folders

- **Status:** ready
- **Session:** Opus · high effort · plan mode off
- **Goal:** Convert all of `src/` to strict TypeScript and reorganize into feature folders, so later tickets
  (T3 data model, T4 data layer) change typed code. Behaviour stays identical.
- **Done when:**
  - [ ] Every `src/**/*.{js,jsx}` is `.ts/.tsx`; `allowJs`/`checkJs` removed from `tsconfig.json`; no `any`
        except at JSON boundaries with a comment.
  - [ ] Layout: `src/app/` (App, routes, providers), `src/features/{builds,editor,auth,profile}/`,
        `src/components/ui/` (today's `common/`), `src/lib/` (firebase, buildMath), `src/theme/` (tokens from
        `constants.js` COLOR\_\*, spacing, fonts), `src/data/` (JSON + typed accessors `getWeapon(name)` etc.).
        Use an `@/` path alias (tsconfig + vite). Update AGENTS.md "Project map" and the `add-feature` skill.
  - [ ] `BuildEditor.jsx` (~950 lines) split into page + sections (header/likes, equipment, stats,
        description/tags, comments) with the load/save logic in hooks. No behaviour change.
  - [ ] Types for game data items, the v1 Firestore `Build`/`User` docs, Redux state (`RootState`,
        `AppDispatch`, typed `useAppSelector`/`useAppDispatch`). `prop-types` removed.
  - [ ] styled-components: style-only props → transient `$props`; delete the `StyleSheetManager` shim in
        `src/index.*` and `src/test/render.tsx`, and `@emotion/is-prop-valid`.
  - [ ] ESLint guardrail: no hex color literals outside `src/theme/` (`no-restricted-syntax` on
        `/#[0-9a-f]{3,8}\b/i` in template literals/strings). React Compiler on
        (`babel-plugin-react-compiler` via `@vitejs/plugin-react`) if it builds cleanly; otherwise a ticket.
  - [ ] `npm run check` green; existing tests pass unchanged (move them with their modules); screenshots of
        `/`, `/build/SEEDBLEED001`, `/build/new` (signed in), `/user/seed-ranni` look the same as before.
- **Context:** Read `AGENTS.md` conventions, `docs/architecture.md`, then the files as you convert them. Don't
  fix the bugs listed in T5 here (keep the diff a pure refactor), except where types force it; note those in the
  handoff. Lodash is used for 5 tiny helpers (compact, flatten, isEmpty, noop, sortBy): replace with native
  code and drop the dependency. Keep `react-hooks/set-state-in-effect` as a warning (T4 fixes those effects).

### T3 — Firestore data model v2, real security rules, rules tests

- **Status:** ready (T2 first)
- **Session:** Opus · extra high effort · plan mode on
- **Goal:** A data model that's safe to open to the public, enforced by real rules with tests, plus a migration
  for whatever exists in production.
- **Done when:**
  - [ ] Owner has confirmed what's in production (Firebase console: number of users/builds) and whether to
        migrate or start fresh. Ask this first.
  - [ ] Model v2 agreed with the owner and documented in `docs/architecture.md`. Starting proposal:
        `builds/{id}`: `ownerId`, `game: 'elden-ring'`, `name`, `description`, `tags[]`, `level: number`,
        stats as numbers, equipment (still names until T7, but in one `equipment` map), `likeCount`,
        `commentCount`, `createdAt`, `updatedAt`. `builds/{id}/likes/{uid}` (doc = like; counter updated in
        the same transaction and validated by rules, no Cloud Functions: they need the paid Blaze plan).
        `builds/{id}/comments/{id}`: `authorId`, `text` (length-limited), `createdAt`. `users/{uid}` public
        profile (`displayName`, `createdAt`), `users/{uid}/private/account` (`email`); admin via custom claim,
        never a client-writable field.
  - [ ] `firestore.rules` rewritten: owners create/update/delete their builds (no changing `ownerId`/counts
        directly), anyone reads, likes one per user, comments by signed-in users, field types and sizes
        validated. `firestore.indexes.json` has the indexes T9's queries need (at least `game`+`likeCount`,
        `game`+`createdAt`, `ownerId`+`createdAt`).
  - [ ] Rules tests with `@firebase/rules-unit-testing` in `tests/rules/`, run by `npm run test:rules` via
        `node scripts/firebase.mjs emulators:exec`; a CI job runs them (needs `actions/setup-java` 21).
        Definition of done in AGENTS.md mentions it.
  - [ ] `src/firebase.js` (or `src/lib/firebase/`) writes and reads v2; likes/comments use transactions or
        batched writes; `scripts/seed.mjs` writes v2.
  - [ ] `scripts/migrate-v1-to-v2.mjs`: dry-run by default, reads with ADC (no keys), idempotent; run against
        the emulator with v1 seed data in a test. **Not** run against production (T12 does, with the owner).
- **Context:** `docs/architecture.md` "Firestore model (v1)" and "Known problems"; `firestore.rules` (interim);
  `src/firebase.js`; `BuildEditor` save/load (after T2: `src/features/editor/`). Bugs this fixes by design:
  editing resets likes/comments (v1 `handleSave` writes `likes: 0, comments: []`), racy likes, client-set
  `admin`, public emails. Keep the `demo-` emulator project.

### T4 — Data layer: TanStack Query, one auth provider, loading/error states, e2e

- **Status:** ready (after T3)
- **Session:** Opus · high effort · plan mode on
- **Goal:** Replace hand-rolled fetching with TanStack Query and a single auth context, so every page has real
  loading, empty and error states and no effect races.
- **Done when:**
  - [ ] `@tanstack/react-query` with a `QueryClientProvider`; query/mutation hooks per feature
        (`useBuild(id)`, `useBuilds(filters)`, `useUserProfile(id)`, `useLikeBuild`, `useAddComment`…) with
        optimistic like/comment updates (no `window.location.reload()`).
  - [ ] One `AuthProvider` (`onAuthStateChanged` once) replaces `useAuth`/`useUser`, which today each register
        their own listener and refetch.
  - [ ] BuildEditor load race fixed (ownership re-checked when auth resolves); `/build/new` always starts from
        a cleared editor; failed saves show an error and keep the editor open.
  - [ ] Every page: loading, empty ("no builds yet"), error and not-found states. `ErrorMessage` used.
        Today `/build/<id that doesn't exist>` crashes the page (`getBuild` returns `{ id }`, then
        `description.length` on undefined in BuildEditor): found in T1, needs a test.
  - [ ] `react-hooks/set-state-in-effect` back to `error` in `eslint.config.js`; the `console.log`s in
        `src/firebase.js` gone (errors surface to the UI).
  - [ ] Playwright e2e on the emulators (`tests/e2e/`, `npm run e2e`): sign up → create build → like →
        comment → profile → logout; in CI.
- **Context:** `src/hooks/*`, `src/firebase.js`, `BuildEditor` load/save effects, `Profile.jsx`,
  `Landing.jsx`. Server data never goes into Redux (AGENTS.md conventions).

### T5 — UI bug batch from the 2022 review

- **Status:** ready (after T2; independent of T3/T4)
- **Session:** Sonnet · medium effort · plan mode off
- **Goal:** Fix the small UI bugs found in the 2022 code review. Each gets a failing test first where testable.
- **Done when:**
  - [ ] Landing: the tag filter starts from `builds`, discarding the level filter (`Landing` filter effect);
        builds without `tags` crash the filter and `BuildsList`.
  - [ ] BuildsList: `key={build.name}` → `build.id`; armor slots use armor slot types (they pass
        `SLOT_TYPE_WEAPON`); previews show the right weapon slots.
  - [ ] GameSelector: `clearTimeout(fn)` is passed the function, not the timer id; two CSS rules missing colons.
  - [ ] `TextInput` drops the `placeholder` prop ("Search" never shows).
  - [ ] Affinity can't be cleared (`DropDown`); picking an affinity/skill then closing the picker without a
        weapon leaves them on an empty slot; `clearApp` doesn't reset `editAffinitySlot`;
        `store/app` exports a non-existent `updateAffinitySlot`.
  - [ ] Like button stays locked forever after an error (if T4 hasn't already fixed it).
  - [ ] SignUp `canRegister` checks the password twice and never the name; Login's global `keydown` Enter
        handler on `document` → a real `<form onSubmit>`.
  - [ ] Stats: clamp 1–99, numbers only (today "abc" shows level NaN).
- **Context:** The files named above (after T2, under `src/features/`). Agent review notes are summarized in
  `docs/architecture.md` "Known problems".

### T6 — Missing core features

- **Status:** ready (after T3 + T4)
- **Session:** Sonnet · high effort · plan mode off
- **Goal:** Finish the features 2022 never got to.
- **Done when:**
  - [ ] Delete build (owner only, confirm dialog, removes likes/comments subcollections via batched deletes).
  - [ ] Cancel edit (restores the saved build); change a weapon in place (today clicking a filled slot removes
        it, so you can't change affinity/skill without re-picking the weapon).
  - [ ] Password reset and email verification (Firebase Auth); show auth errors to the user.
  - [ ] Profile: edit display name; tabs for "Builds" and "Liked"; not-found user page.
  - [ ] A 404 route.
  - [ ] Consumables: decide with the owner whether to restore the commented-out UI in `EquipmentEditor` or
        drop consumables from the model.
  - [ ] Seed data and e2e cover the new flows.
- **Context:** T3's model, T4's hooks. `EquipmentEditor` consumables block, `Slot` click handling,
  `Profile`, `Login`/`SignUp`.

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
- **Context:** T7's data (weights, requirements, scaling). `src/lib/buildMath.js`, `StatEditor`,
  `SpellEditor`. Get formulas from a source the owner trusts; cite it in a comment.

### T9 — Browse and discovery

- **Status:** ready (after T3 + T4)
- **Session:** Sonnet · high effort · plan mode off
- **Goal:** Make finding builds pleasant at scale.
- **Done when:**
  - [ ] Sort by top / new; cursor pagination (load more / infinite scroll); level range and one-tag filter as
        Firestore queries (T3 indexes); multi-tag "all of" filtered client-side within a page.
  - [ ] Search by build name (prefix query on a lowercase field, or a decision to add a search service: ask).
  - [ ] Filters live in the URL (shareable); DLC bosses in tags (from T7).
- **Context:** `Landing`, `BuildsList`, `Chips`, T3's indexes, T4's `useBuilds`.

### T10 — Comments and moderation

- **Status:** ready (after T3 + T4)
- **Session:** Opus · high effort · plan mode on
- **Goal:** Safe to open to the public: abuse can be handled.
- **Done when:**
  - [ ] Delete own comment; report a build or comment (a `reports` collection, write-only for users).
  - [ ] Admin (custom claim) can hide/delete builds and comments; a minimal admin view or script.
  - [ ] Firebase App Check (reCAPTCHA Enterprise) enforced for Firestore and Auth; rate-limit friendly rules
        (e.g. comment length, one like per user).
  - [ ] Rules tests cover all of it.
- **Context:** T3 rules and tests; `docs/firebase.md`.

### T11 — Performance and polish

- **Status:** ready (after T2)
- **Session:** Sonnet · medium effort · plan mode off
- **Goal:** Fast first load and a finished look on phones.
- **Done when:**
  - [ ] Bundle: the 2.5 MB main chunk split; game data JSON and the markdown editor lazy-loaded per route/use
        (armor is bundled twice today: `armor.json` and `armorIndexed.json`).
  - [ ] Favicon, app icons, `manifest.json` icons, meta description and Open Graph tags (site-level).
  - [ ] Tooltips usable on touch (they're hover-only); long build titles wrap with padding on mobile.
  - [ ] Phones (390 px): the landing/profile build cards' equipment row (8 slots in a centered flex row,
        `BuildsList` `LowerSection`/`EquipmentContainer`) overflows and is clipped on both sides; the game
        selector's "Dark Souls III" wraps. Same CSS as 2022 (seen in T1's `--mobile` screenshots).
  - [ ] Accessibility pass: clickable `div`s → buttons/links, labels on inputs, focus styles, contrast.
  - [ ] Fonts: replace the Adobe Typekit kit (`garamond-premier-pro`, tied to the owner's Adobe account) with
        a self-hosted open font (e.g. EB Garamond); check the OptimusPrinceps license or replace it.
- **Context:** `index.html`, `src/index.css`, `vite.config.ts`, the components named. Screenshot before/after.

### T12 — Deploy pipeline and relaunch

- **Status:** ready (after T3, T10; ideally T4–T9)
- **Session:** Opus · high effort · plan mode on
- **Goal:** Ship it: repeatable deploys and a safe production cutover.
- **Done when:**
  - [ ] GitHub Actions: Firebase Hosting **preview channel** per PR (comment with the URL), production deploy
        on `main` behind a manual approval (GitHub environment). Auth via Workload Identity Federation (no
        JSON keys in secrets). Owner sets up the GCP side; the ticket writes exact steps.
  - [ ] Owner-approved production steps, each asked for: deploy rules + indexes, run T3/T7 migrations
        (dry-run first), deploy hosting, smoke-test the live site.
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

## Done

- T1 — Foundation — 2026-11-14 — leaked service-account key removed; CRA → Vite 8, React 19, RTK 2,
  styled-components 6, Firebase 12; TS/ESLint 9/Prettier/Vitest; emulators + seed + screenshot + doctor; CI;
  AGENTS.md, CLAUDE.md, skills, docs and this backlog.
