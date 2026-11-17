# AGENTS.md

Operating manual for coding agents (and humans) in this repo. It's loaded into every session, so it stays
**short**: rules, where things are, pointers. Details live in `docs/`. **Keep both current**: when a command,
convention or the layout changes, update the matching doc in the same change.

## What we're building

**Souls Builds**: a site to create, share and discover **Elden Ring** character builds. Users make a build
(stats, weapons with affinities and skills, armor, talismans, spells, flask tears, tags, a markdown write-up),
browse everyone's builds, like them, and comment. Other FromSoftware games may follow (selector is a stub).
Hand-coded in April–May 2022 and ~90% done; now being modernized and finished for a **public relaunch** on
Firebase Hosting (soulsbuilds.web.app). Where it fits and who it's for (share, get and improve builds; tracking,
copies, the rewards rule): `docs/product.md`.

## Where things stand (current state only, ≤ 8 lines; history lives in git)

As of 2026-11-16 (T1–T31, T34–T36, T39–T42, T44, T46–T48 done): **live on soulsbuilds.com** since T12. Vite 8, React 19 (Compiler), RTK 2,
TanStack Query 5, styled-components 6, Firebase 13 (Spark), strict TS. Firestore model v2 + tested rules; search,
likes, comments, reports + `scripts/admin.mjs`; privacy/terms; account deletion; Playwright e2e. Game data v2
(base + DLC, game IDs) in `src/data/er/`. CI: checks, PR previews, approved prod deploys on `main`, daily
`stats/{game}`. Build page (T48): title section, tabs (Description, Guide, Comments) beside one build sidebar (stats + gear tiles; phones: sections next, T49), build math (T8), the
route (T14/19/15). Tracking (T34): check off gear and level stats, private `users/{uid}/tracking`, account
only (T41: an intro modal signed out); since T46 it lives only in the Guide (the route is the checklist; stops without gear marked done, T44); profile Playing/Completed + build counters (T36). Build image picked by the author (T40). Sign-in (T30): Google or email + password, then a display-name step. Account page (T31) apart from the public profile. Rules budget guarded (T42). App Check left: enforcing. Redesign v2 (T26–T29) done. **Next:** `TICKETS.md`.

## Golden rules

1. **Your training data is out of date for this stack.** React 19, react-router 7, Redux Toolkit 2,
   styled-components 6, Firebase JS SDK 13, Vite 8, Vitest 5, ESLint 9 flat config all changed APIs. Before
   using an API you're not sure of, check the installed types (`node_modules/<pkg>/dist/*.d.ts`) or the
   package's current docs. Known traps are under **Gotchas**.
2. **Local work never touches production.** `npm run dev` uses the emulators under `demo-soulsbuilds` (a
   `demo-` project can't reach a real backend). Anything with `--project soulsbuilds`, any deploy, any script
   against real data: **ask the owner first**, every time.
3. **No secrets in the repo, ever.** No service-account keys (one leaked in 2022 and had to be revoked). Admin
   scripts against production use Application Default Credentials (`gcloud auth application-default login`).
   The Firebase _web_ config in `src/lib/firebase.ts` is public by design; that's fine.
4. **Never Read `src/data/**/*.json` whole** (30–220 KB each). Grep, or `node -e` against them, or read the code
   that uses them. Don't read `package-lock.json`, `dist/` or `public/assets/` wholesale either.
5. **No new data or image sources without the owner's OK** (licensing). Game data and icons come from the
   owner's own export of the game files (`docs/game-data-extraction.md`); the 2022 ones came from rankedboost.com.
6. **Follow the conventions below**; don't add a parallel pattern (another styling library, state manager,
   fetch layer, folder scheme) without the owner asking. `docs/decisions.md` says why things are as they are.
7. **Definition of done** (every change, even small):
   1. `npm run check` passes (typecheck, lint, format, tests, build).
   2. Logic changes get a unit test next to the module; a bug gets a failing test first, then the fix.
   3. Firestore rules or data-access changes: `npm run test:rules` passes, with tests for the new rule or
      function. User-visible flows: `npm run e2e` passes (add to `tests/e2e/` for a new journey).
   4. Anything visible: screenshot the changed pages, desktop and `--mobile`, and look at them.
   5. Docs (this file, `docs/`, skills, `TICKETS.md`) updated in the same change.
   6. Report plainly what you verified and what you couldn't.

## Commands

| Task                                        | Command                                                                          |
| ------------------------------------------- | -------------------------------------------------------------------------------- |
| All checks (run before finishing)           | `npm run check`                                                                  |
| Typecheck / lint / autofix / format         | `npm run typecheck` · `npm run lint` · `npm run lint:fix` · `npm run format`     |
| Tests                                       | `npm test` · `npm test -- src/lib` · `npm run test:watch`                        |
| Rules, migration, admin tests (own emul.)   | `npm run test:rules` (works while `npm run dev` runs)                            |
| Rules budget per worst-case build (T42)     | `RULES_BUDGET=measure npm run test:rules` (docs/firebase.md "Rules budget")      |
| End-to-end (Playwright, installed Chrome)   | `npm run e2e` (reuses `npm run dev` if it's up)                                  |
| What can this machine run?                  | `npm run doctor`                                                                 |
| Run the app (emulators + seed + Vite :5180) | `npm run dev` (long-lived: run it in the background)                             |
| Re-seed (wipes data) / emulators only       | `npm run seed` · `npm run emulators`                                             |
| Game data from the owner's export (T7)      | `npm run data` (reads `~/Documents/soulsbuilds-gamedata`; docs/data.md)          |
| v1→v2 migration (done in prod at T12)       | `node scripts/migrate-v1-to-v2.mjs [--project <id>] [--write]`                   |
| Moderation: reports, remove, admins (dry)   | `node scripts/admin.mjs reports` · `remove <buildId> [commentId] [--write]`      |
| Accounts: rename, delete (dry; T18)         | `node scripts/admin.mjs rename <uid> <name>` · `delete-user <uid\|email>`        |
| Tracking counters: recount/backfill (T36)   | `node scripts/admin.mjs counts [--write]` (after T36's deploy; docs/firebase.md) |
| Community stats → `stats/<game>` (dry; T20) | `node scripts/admin.mjs stats [--write]` (daily in CI: `stats.yml`)              |
| Backup every document as JSON (read-only)   | `node scripts/admin.mjs export [--project soulsbuilds]` → `.admin-backups/`      |
| Screenshot a page of the running app        | `npm run screenshot -- /build/SEEDBLEED001 [--mobile] [--width 1000] [--full]`   |
| … after clicking a button (a dialog, T41)   | `npm run screenshot -- /build/SEEDBLEED001 --click "Track this build"`           |
| Measure load, App Check wait, scroll (T21)  | `npm run perf -- <url or /route> [--cpu 4] [--head …]` (docs/architecture.md)    |
| Production build / serve it                 | `npm run build` · `npm run preview` (⚠ talks to production Firebase)             |
| Any Firebase CLI command                    | `node scripts/firebase.mjs <args>` (puts Java 21+ on PATH)                       |
| Deploy (CI on main after approval; by hand) | `npm run deploy` (hosting only, asks); CI: docs/firebase.md "Deploys"            |

## How work flows: tickets and sessions

Work is planned in **`TICKETS.md`**, an ordered, living backlog (T2, T3, …), done **one ticket per session**:
`/start T5` → work → `/ticket …` to capture scope creep → `/wrap` (checks, docs, TICKETS.md handoff, commit,
the next ticket with its session settings) → the owner runs `/clear`. Whoever wraps has the most context, so
they write the handoff; a fresh session trusts it and reads only what the ticket names. Skills in
`.claude/skills/` are plain Markdown any agent can follow: `start`, `wrap`, `ticket`, `run-app`, `add-feature`.

## Working with the owner

- Fullstack React developer who wrote this app by hand in 2022 and now builds agent-first. Explain choices
  briefly in web-dev terms; skip basics.
- Pushback welcome: give an honest opinion, propose the simpler option when there is one, say where you deviated.
- Done properly, but time and tokens matter: read narrowly, one ticket per session, docs ready for a fresh session.
- **`/wrap` commits and pushes** the current branch (owner's call, 2026-11-14); otherwise commit or push only
  when asked. Work happens on `main`. Never force-push.
- End every reply that finishes a step with a short **Next for you** line: the exact command to type, a question
  to answer, or "nothing, I'm continuing".

## Project map

```
index.html                 Vite entry (meta, theme-color, icons) → src/main.tsx
src/
  main.tsx                 createRoot + <AppProviders><App/>
  app/                     App (shell: global styles + game skin, header (phone menu, T26), auth dialog state (pages open
                           it with authDialog.ts useOpenAuthDialog(kind, onSignedIn); no profile → the name step), item-picker modal, footer; useScrollToTop; AppCheckNotice =
                           "reCAPTCHA blocked", T24), game.ts (game registry + useCurrentGame),
                           routes.tsx (/, /build/:buildId/:tab?, /user/:userId, /account, /privacy, /terms, 404), AppProviders
                           (Query, Auth, Redux, router), queryClient, store.ts, hooks.ts (useAppSelector/Dispatch),
                           Header + AccountMenu (T31: the display name opens Profile, Account, Log out)
  features/auth/           AuthProvider + useAuth ({ loading, user, uid }); AuthDialog (T30: views Login, SignUp,
                           ForgotPassword, ChooseName = the display-name step for any account without a profile;
                           GoogleButton, FormField + useFieldErrors: errors by field, focus the first)
  features/builds/         Landing (title + community line, one-line toolbar: search, sort, level; scrolling top-tags row;
                           filters in the URL; load more), BuildsList (88px rows: main-weapon portrait, name, author,
                           age, tags, left-hand-first slot strip with faint empty cells, level, likes + comments;
                           tags.ts fits tags on one line + "+N"), filters.ts (+ topTags, toggleTag), queries.ts (useBuilds,
                           useUserBuilds, useGameStats)
  features/profile/        Profile = the public page (T31: framed hero; Builds/Liked tabs; the owner's Playing/Completed,
                           T36), queries.ts (useUserProfile(s), useLikedBuilds, useUpdateDisplayName)
  features/account/        AccountPage (`/account`, T31): DisplayNameSection, EmailSection (verify notice, change
                           by link), SignInSection (change / set a password), DeleteAccount (T18); errors.ts
                           (changeErrors), queries.ts (useDeleteAccount)
  features/tracking/       Tracking a build (T34; account only, T41; only in the Guide, T46): useBuildTracking (query
                           cache + saveQueue.ts debounced Firestore saves; startAfterSignIn), TrackingIntro (the
                           modal before the first track: sign up / log in, or Start tracking), TrackButton (hero:
                           Track this build → the Guide; "Tracking" link), TrackingBar (the Guide's top: progress,
                           Your stats, Stop; Build complete), TrackingCards (new items), TrackedAttributes (yours /
                           target with − +);
                           T36: queries.ts (useTrackedBuilds), TrackedBuilds (profile panels: Playing, Completed
                           trophies) → PlayingList (lazy: progress + next stop), ProgressBar
  features/legal/          Privacy, Terms (static pages; keep Privacy true to what the app stores)
  features/reports/        ReportButton (inline report form on builds and comments), queries.ts (useReport)
  features/editor/         BuildEditorPage (view/create/edit/delete; title section + tabs + sidebar, T48) +
                           useBuildEditor; tabs.ts (Description, Guide, Comments: URLs, old-link redirects, which
                           show, pageKey); queries.ts (useBuild, useSaveBuild, likes, comments); gear.ts (T48: the
                           gear as groups of SlotEntry, view and edit; pure); sections/ (BuildHeader = title
                           section: build image (T40), like/report/tags, OwnerActions, BuildTabs (sticky tab bar),
                           BuildDetailsForm (edit title block + BuildImageDialog), BuildSidebar (T48: StatsCard +
                           gear tiles named on hover/focus/tap, the same on every tab; editable while editing),
                           StatsCard (attributes + HP, load, poise, T27), DescriptionSection, MarkdownView +
                           rehypeJumpTo ("Jump to"), CommentsSection); ItemRow (any slot as tile + name; button in
                           edit mode; itemLabel/changeLabel) + itemDetails.ts; ItemSelector (picker Dialog: filters
                           in picker.ts, weapon step with WeaponOptions), slots.ts; guide/ ("How to get this
                           build": route.ts solver, phrases.ts (+ reasons, stop titles), progress.ts (T35: numbered
                           stops, done/next from tracking; itemTrackKeys), GuideSection (the Guide tab) →
                           GuideRoute (lazy: numbered stops; while tracking, the checklist, T46)); store/ = Redux
                           slices for the build being edited + selectors + derived.ts (build math selectors,
                           selectGearState) + build.ts (loadBuild / selectBuildFields: build ⇄ editor state)
  components/ui/           Shared UI: Button (+ButtonLink, variants), TextButton/TextLink, TextInput/TextAreaInput,
                           PasswordInput (Show/Hide), DropDown, SegmentedControl, Chips (tag picker), Tag, Dialog, Tooltip, PageMessage,
                           ErrorMessage, FocusScope, icons, Label + typography.ts (type tiers); Frame (panel,
                           `$hero`), SectionHeading, Ornament, PageHero, ItemTile, inWorld.ts (panel, hero frame,
                           selection-bar CSS)…
  lib/                     firebase/ (ALL Auth/Firestore access: app (+ App Check; appCheckStatus watches
                           for a token that never comes, T24), auth, builds, likes,
                           comments, users, reports, account (deletion, T18), stats (T20), tracking (T34; tracksAnyBuild, T41)),
                           models.ts (v2 types + LIMITS), queryKeys.ts, equipment.ts (mainWeaponId, buildImage, imageChoices), markdown.ts
                           (firstParagraph), tracking.ts (T34: item keys, progress, changes, merge; pure),
                           buildMath.ts (level, stat clamping, T8
                           vitals/equip load/poise/requirements/memory slots; pure, game tables as arguments),
                           relativeTime.ts ("3 days ago"), array.ts
  theme/                   Tokens: colors.ts (base) + skins.ts (per-game accent, as CSS vars), fonts (FONT_*,
                           TEXT_*), spacing, radius, elevation, motion, media (BELOW_MOBILE/TABLET), GlobalStyle,
                           GameSkinStyle
  data/                    er/*.json game data (T7: base + DLC, game IDs; written by `npm run data`), schema.ts
                           (zod; types only in the app), index.ts accessors by ID (getWeapon(id),
                           armorList(slot), iconUrl…), rules.ts (Ash of War/affinity/talisman rules, shared
                           with scripts), startingClasses/statCurves (character.json, T8), acquisition.ts (where
                           items come from; lazy, T14). docs/data.md
  test/                    Vitest setup, renderWithProviders (store, QueryClient, router, uid), fixtures
                           (+ game IDs), editor.tsx (EditorWithPicker, searchItems)
tests/                     rules/ (security rules + data layer vs rules), migration/ (v1→v2), admin/
                           (scripts/admin.mjs), e2e/ (Playwright)
public/assets/             icons/<icon>.webp (T7 data)
scripts/                   seed, migrate-v1-to-v2, admin (moderation), e2e, screenshot, perf, doctor, firebase (Java
                           wrapper), lib/ (model-v2, names-to-ids); data/ = game data pipeline (TypeScript;
                           acquisition.ts + hand-written progression/places/events.ts) + name-aliases.json (2022
                           names → IDs, for T12); legacy-data/ = 2022 scrapers (reference)
firebase.json              Hosting (dist/), emulator ports; firebase.test.json = rules-test emulator ports
firestore.rules            v2 security rules (deployed by CI with hosting); firestore.indexes.json
docs/                      architecture, firebase, data, decisions, product (positioning), game-data-extraction,
                           tickets-archive
TICKETS.md                 Ordered backlog; one ticket per session
```

## Conventions

- **Language**: strict TypeScript, no JavaScript in `src/`. No `any`: at a JSON/Firestore boundary, cast to a
  named type with a comment (see `src/data/index.ts`, `src/lib/firebase.ts`). Import across folders with `@/`.
- **Layout**: a feature's pages, sections, hooks and state live in `src/features/<feature>/`; generic UI in
  `src/components/ui/`; framework-free code in `src/lib/`. See the `add-feature` skill.
- **Styling**: styled-components, defined at the bottom of the file. Colors, fonts, breakpoints and spacing
  (`SPACE_*`) only from `@/theme` (ESLint rejects hex literals outside `src/theme/`). Game-specific color = the skin tokens (`COLOR_ACCENT`…); everything else is shared by all games. The
  accent is on a **budget** and type comes in **three tiers** (serif names/headings, the caps `Label`, Inter
  values): docs/architecture.md "Styling". Panels are `Frame` (corner marks only with `$hero`, the build hero);
  headings `SectionHeading`/`displayText`; caps only via `Label`/`labelText`. No one-offs.
  Style-only props are transient (`$active`). docs/architecture.md "Styling".
- **State**: the build being edited → Redux slices + selectors (`useAppSelector`/`useAppDispatch`). Server
  data (builds, users, likes, comments) → TanStack Query hooks in `src/features/<feature>/queries.ts`, keys in
  `src/lib/queryKeys.ts`. The signed-in user → `useAuth()`. Never copy server data into Redux.
- **Game data**: import from `@/data` (typed accessors), never the JSON files directly (tests excepted).
- **Firestore**: only `src/lib/firebase/` imports the Firebase SDK (ESLint enforces it; type imports are
  fine). Every write has a rule in `firestore.rules` and a test in `tests/rules/`. Counters change in the same
  batch as the doc they count. Builds reference items by **game ID** (`Equipment` in `src/lib/models.ts`).
- **Markdown** from users renders through `rehype-sanitize`. Never `dangerouslySetInnerHTML`.
- **Tests** are colocated `*.test.ts(x)`, Vitest + Testing Library. Components render with
  `renderWithProviders`; query by role/text. Game data integrity: `src/data/data.test.ts`.
- **Accessibility**: new interactive elements are real `<button>`/`<a>` with visible text or a label. Dialogs
  and pop-up panels go through `FocusScope` (modals: `Dialog`). Controls are ≥ 44 px tall. New text/background
  pairs get a line in `src/theme/colors.test.ts` (WCAG AA). Item icons are
  `alt=""`: the item name is shown next to them or is the tile button's accessible name (`ItemSlot`).

## Gotchas

- **React 19 ignores `defaultProps` on function components**: use default parameters.
- **styled-components 6 forwards every prop to the DOM** (no filter installed): style-only props must be
  `$transient`, typed on the styled call (`styled.div<{ $open: boolean }>`).
- **Prettier splits `${fn}minmax(…)` into `minmax (…)`** inside styled-components CSS, which is invalid, so the
  whole declaration is dropped silently. Return whole values from interpolations (`$a ? '112px minmax(0, 1fr)' :
'minmax(0, 1fr)'`).
- **React Compiler is on** (`@rolldown/plugin-babel` + `reactCompilerPreset()` in `vite.config.ts`; plugin-react
  v6 has no `babel` option). It memoizes components, so new code doesn't need `useMemo`/`useCallback` for
  performance, but must follow the Rules of React (no mutating props/state, no reading refs during render).
- **Firestore keeps a streaming connection open**, so Playwright's `networkidle` never fires. Wait for `load`
  plus a delay (the screenshot script does).
- **Vite binds `127.0.0.1:5180`** (strict). Use that, not `localhost` (which may resolve to IPv6 `::1`).
- **The emulators need Java 21+.** The Mac's default `java` may be older; `scripts/firebase.mjs` picks a newer
  JDK (e.g. Homebrew's keg-only `openjdk`). Run Firebase via npm scripts or that wrapper, not bare `npx firebase`.
- **Version pins**: TypeScript `~6.0` (typescript-eslint doesn't support TS 7 yet); ESLint 9 (the react and
  jsx-a11y plugins don't support ESLint 10 yet). Revisit when they do.
- **npm `allowScripts`**: install scripts are off unless listed. `@firebase/util`, `protobufjs`, `re2` and
  `fsevents` are deliberately denied (not needed here).
- **Production deploys go through CI** (approved runs on `main`: hosting, rules and indexes together). A rules
  change that needs data rewritten needs a migration script, a backup (`admin.mjs export`) and the owner first.
- **`serverTimestamp()` reads back as an estimate** until the server confirms (`toBuild` and friends pass
  `serverTimestamps: 'estimate'`), so a just-written doc never has a null `createdAt`.
- **`npm run seed` wipes the emulator's Firestore** before seeding, and so does importing `scripts/seed.mjs`
  (it runs on import): read constants from it with a regex instead.
- **Firestore rules have an expression budget** (1,000 per request; every operator, literal, field access and
  call counts; an argument costs 1 per use, while `incoming()` and `let` re-evaluate). Past it, writes fail with a
  bare `PERMISSION_DENIED`. Builds are near it: `tests/rules/budget.test.ts` keeps `HEADROOM` (90 paddings after
  T42); a new check measures its cost (`RULES_BUDGET=measure npm run test:rules`) and lowers it.
  docs/firebase.md "Rules budget".
- **Code that runs on every page imports `@/data/core`, not `@/data`** (the full data is ~1 MB and loads with
  the picker/editor only; docs/data.md). **Game rules live in `src/data/rules.ts`** (which Ash fits, which affinity, talisman groups). Scripts import
  it directly (`../src/data/rules.ts`, Node strips the types), so it keeps type-only imports.
- **`scripts/data/*.ts` run directly under Node 24** (type stripping): relative imports keep `.ts`, and only
  erasable syntax works (no enums). `src/data/er/` and `scripts/data/name-aliases.json` are machine-written
  (Prettier-ignored): change the pipeline and re-run it, never hand-edit.
