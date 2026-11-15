# AGENTS.md

Operating manual for coding agents (and humans) in this repo. It's loaded into every session, so it stays
**short**: rules, where things are, pointers. Details live in `docs/`. **Keep both current**: when a command,
convention or the layout changes, update the matching doc in the same change.

## What we're building

**Souls Builds**: a site to create, share and discover **Elden Ring** character builds. Users make a build
(stats, weapons with affinities and skills, armor, talismans, spells, flask tears, tags, a markdown write-up),
browse everyone's builds, like them, and comment. Other FromSoftware games may follow (selector is a stub).
Hand-coded in April–May 2022 and ~90% done; now being modernized and finished for a **public relaunch** on
Firebase Hosting (soulsbuilds.web.app).

## Where things stand (current state only, ≤ 8 lines; history lives in git)

As of 2026-11-14 (T3–T5): Vite 8 + React 19 (React Compiler) + RTK 2 + TanStack Query 5 + styled-components 6 +
Firebase 12, strict TypeScript in feature folders. Firestore data model v2 with real security rules, rules tests
and a v1→v2 migration; one `AuthProvider`; every page has loading/error/empty/not-found states; Playwright e2e
on the emulators. `npm run check`, `npm run test:rules` and `npm run e2e` are green and run in CI.
**Production is dark**: it still holds v1 data under the expired 2022 rules (deny all); T12 deploys the v2
rules + indexes and runs the migration, with the owner. Game data is base game only until T7.
**Next:** see `TICKETS.md`.

## Golden rules

1. **Your training data is out of date for this stack.** React 19, react-router 7, Redux Toolkit 2,
   styled-components 6, Firebase JS SDK 12, Vite 8, Vitest 5, ESLint 9 flat config all changed APIs. Before
   using an API you're not sure of, check the installed types (`node_modules/<pkg>/dist/*.d.ts`) or the
   package's current docs. Known traps are under **Gotchas**.
2. **Local work never touches production.** `npm run dev` uses the emulators under `demo-soulsbuilds` (a
   `demo-` project can't reach a real backend). Anything with `--project soulsbuilds`, any deploy, any script
   against real data: **ask the owner first**, every time.
3. **No secrets in the repo, ever.** No service-account keys (one leaked in 2022 and had to be revoked). Admin
   scripts against production use Application Default Credentials (`gcloud auth application-default login`).
   The Firebase _web_ config in `src/lib/firebase.ts` is public by design; that's fine.
4. **Never Read `src/data/*.json` whole** (30–220 KB each). Grep, or `node -e` against them, or read the code
   that uses them. Don't read `package-lock.json`, `dist/` or `public/assets/` wholesale either.
5. **No new data or image sources without the owner's OK** (licensing). The 2022 data and icons came from
   rankedboost.com; T7 decides the future source.
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

| Task                                        | Command                                                                      |
| ------------------------------------------- | ---------------------------------------------------------------------------- |
| All checks (run before finishing)           | `npm run check`                                                              |
| Typecheck / lint / autofix / format         | `npm run typecheck` · `npm run lint` · `npm run lint:fix` · `npm run format` |
| Tests                                       | `npm test` · `npm test -- src/lib` · `npm run test:watch`                    |
| Rules + migration tests (own emulator)      | `npm run test:rules` (works while `npm run dev` runs)                        |
| End-to-end (Playwright, installed Chrome)   | `npm run e2e` (reuses `npm run dev` if it's up)                              |
| What can this machine run?                  | `npm run doctor`                                                             |
| Run the app (emulators + seed + Vite :5180) | `npm run dev` (long-lived: run it in the background)                         |
| Re-seed (wipes data) / emulators only       | `npm run seed` · `npm run emulators`                                         |
| v1→v2 migration (dry run; prod = T12 only)  | `node scripts/migrate-v1-to-v2.mjs [--project <id>] [--write]`               |
| Screenshot a page of the running app        | `npm run screenshot -- /build/SEEDBLEED001 [--mobile] [--full]` → PNG path   |
| Production build / serve it                 | `npm run build` · `npm run preview` (⚠ talks to production Firebase)         |
| Any Firebase CLI command                    | `node scripts/firebase.mjs <args>` (puts Java 21+ on PATH)                   |
| Deploy hosting (owner only, asks)           | `npm run deploy`                                                             |

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
index.html                 Vite entry (Adobe Typekit font kit + favicon placeholder) → src/main.tsx
src/
  main.tsx                 createRoot + <AppProviders><App/>
  app/                     App (shell: header, login/register slide-down panel, item-picker modal),
                           routes.tsx (/, /build/:buildId, /user/:userId, 404), AppProviders (Query, Auth,
                           Redux, router), queryClient, store.ts, hooks.ts (useAppSelector/Dispatch), Header
  features/auth/           AuthProvider + useAuth ({ loading, user, uid }), Login, SignUp
  features/builds/         Landing (sort, tag/level filters in the URL, load more), BuildsList (build cards),
                           filters.ts, queries.ts (useBuilds, useUserBuilds)
  features/profile/        Profile (rename, Builds/Liked tabs), queries.ts (useUserProfile(s), useLikedBuilds…)
  features/editor/         BuildEditorPage (view/create/edit/delete) + useBuildEditor; queries.ts (useBuild,
                           useSaveBuild, likes, comments); sections/ (BuildTitle with like button, BuildDetailsForm,
                           Equipment/Stat/Tear/SpellEditor, DescriptionSection, BuildTags, CommentsSection);
                           Slot, ItemSelector (picker), slots.ts; store/ = Redux slices for the build being
                           edited + selectors + build.ts (loadBuild / selectBuildFields: build ⇄ editor state)
  components/ui/           Shared UI: FlexGroup, Button, TextInput/TextAreaInput, DropDown, Chips, Tag,
                           PageMessage (loading/empty/not-found), ErrorMessage (with retry), LoadingAnimation…
  lib/                     firebase/ (ALL Auth/Firestore access: app, auth, builds, likes, comments, users),
                           models.ts (v2 types + LIMITS), queryKeys.ts, buildMath.ts (level, stat clamping),
                           array.ts
  theme/                   Tokens: COLOR_* (colors.ts), FONT_* (fonts.ts), BELOW_* media queries (media.ts)
  data/                    *.json static Elden Ring data (base game, 2022; never Read whole) + index.ts
                           typed accessors (getWeapon(name), armorList(kind)…) + types.ts. docs/data.md
  test/                    Vitest setup, renderWithProviders (store, QueryClient, router, uid), fixtures
tests/                     rules/ (security rules + data layer vs rules), migration/ (v1→v2), e2e/ (Playwright)
public/assets/             ~1,400 item icons by category (armor, weapons, spells, items, talismans, menu)
scripts/                   seed, migrate-v1-to-v2, e2e, screenshot, doctor, firebase (Java wrapper), lib/
                           (model-v2 helpers); legacy-data/ = 2022 scrapers (reference only)
firebase.json              Hosting (dist/), emulator ports; firebase.test.json = rules-test emulator ports
firestore.rules            v2 security rules (not deployed until T12); firestore.indexes.json
docs/                      architecture, firebase, data, decisions
TICKETS.md                 Ordered backlog; one ticket per session
```

## Conventions

- **Language**: strict TypeScript, no JavaScript in `src/`. No `any`: at a JSON/Firestore boundary, cast to a
  named type with a comment (see `src/data/index.ts`, `src/lib/firebase.ts`). Import across folders with `@/`.
- **Layout**: a feature's pages, sections, hooks and state live in `src/features/<feature>/`; generic UI in
  `src/components/ui/`; framework-free code in `src/lib/`. See the `add-feature` skill.
- **Styling**: styled-components, defined at the bottom of the file. Colors, fonts and breakpoints only from
  `@/theme` (ESLint rejects hex literals outside `src/theme/`). Style-only props are transient (`$active`).
- **State**: the build being edited → Redux slices + selectors (`useAppSelector`/`useAppDispatch`). Server
  data (builds, users, likes, comments) → TanStack Query hooks in `src/features/<feature>/queries.ts`, keys in
  `src/lib/queryKeys.ts`. The signed-in user → `useAuth()`. Never copy server data into Redux.
- **Game data**: import from `@/data` (typed accessors), never the JSON files directly (tests excepted).
- **Firestore**: only `src/lib/firebase/` imports the Firebase SDK (ESLint enforces it; type imports are
  fine). Every write has a rule in `firestore.rules` and a test in `tests/rules/`. Counters change in the same
  batch as the doc they count. Builds reference items **by name** today (renames drop items: T7 moves to IDs).
- **Markdown** from users renders through `rehype-sanitize`. Never `dangerouslySetInnerHTML`.
- **Tests** are colocated `*.test.ts(x)`, Vitest + Testing Library. Components render with
  `renderWithProviders`; query by role/text. Known data gaps are `it.fails` in `src/data/data.test.ts`.
- **Accessibility**: new interactive elements are real `<button>`/`<a>` with visible text or a label.

## Gotchas

- **React 19 ignores `defaultProps` on function components**: use default parameters.
- **styled-components 6 forwards every prop to the DOM** (no filter installed): style-only props must be
  `$transient`, typed on the styled call (`styled.div<{ $open: boolean }>`).
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
- **Never deploy rules or indexes on their own**: production still holds v1 data, which the v2 rules reject.
  Rules, indexes and the migration go out together in T12, with the owner.
- **`serverTimestamp()` reads back as an estimate** until the server confirms (`toBuild` and friends pass
  `serverTimestamps: 'estimate'`), so a just-written doc never has a null `createdAt`.
- **`npm run seed` wipes the emulator's Firestore** before seeding.
- **Item names in the data have scrape quirks** (`"Flame Grant me Strength"`, `"Glinstone Pebble"`): copy names
  from the JSON. `scripts/seed.mjs` validates every name it uses.
