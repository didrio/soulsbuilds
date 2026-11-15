---
name: add-feature
description: Add a page, component, editor section or data feature to soulsbuilds following the project's conventions — where routes, components, Redux state, Firestore access, game data and tests go. Use when building any new user-facing feature or extending an existing page.
---

# Add a feature

Layout: strict TypeScript, feature folders, `@/` alias; Firestore data model v2 (T3); server data through
TanStack Query hooks and one `AuthProvider` (T4).

## Where things go

| You need…                         | Put it in                                                                                                        |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| A new page / URL                  | A `<Route>` in `src/app/routes.tsx` + a page component in `src/features/<feature>/`                              |
| A section of the build page       | `src/features/editor/sections/` (rendered by `BuildEditorPage`); page logic in a `use*` hook next to the page    |
| Shared UI (button, input, tag…)   | `src/components/ui/` — reuse what's there first (`Button`, `TextInput`, `FlexGroup`, `Tag`, `Chips`, `DropDown`) |
| State for the build being edited  | A slice/action in `src/features/editor/store/` + a selector in `selectors.ts`; slot ids in `slots.ts`            |
| Saving/loading a new build field  | `src/lib/models.ts`, `firestore.rules` (+ rules test), then `loadBuild`/`selectBuildFields` in `store/build.ts`  |
| A Firestore/Auth call             | A function in `src/lib/firebase/<area>.ts` (only that folder imports the SDK; lint enforces it)                  |
| Server data in a component        | A TanStack Query hook in `src/features/<feature>/queries.ts`, keyed by `src/lib/queryKeys.ts`. Never Redux       |
| The signed-in user                | `useAuth()` from `@/features/auth/useAuth` (`{ loading, user, uid }`); profile via `useUserProfile(uid)`         |
| Game data (items, spells, tags…)  | Read through `@/data` accessors (`getWeapon(name)`, `armorList(kind)`…). JSON is read-only; T7 owns changes      |
| Pure calculations (stats, weight) | `src/lib/buildMath.ts` (or a new `src/lib/*.ts`), with a colocated test                                          |
| Colors, fonts, breakpoints        | `@/theme` (`COLOR_*`, `FONT_*`, `BELOW_*`). ESLint rejects hex literals outside `src/theme/`                     |

## Steps

1. Read the closest existing example (e.g. `sections/TearEditor.tsx` for a small editor section,
   `features/profile/Profile.tsx` for a page) and follow its shape. Don't introduce a parallel pattern (another styling lib, state manager, fetch
   layer) without the owner asking.
2. Types: props as an interface or inline type, no `any`, no `prop-types`. Redux via `useAppSelector` /
   `useAppDispatch` from `@/app/hooks`. React Compiler memoizes, so skip `useMemo`/`useCallback` for speed.
3. Styling: styled-components at the bottom of the file. Props used only for styling go as transient
   `$props`, typed on the styled call (`styled.div<{ $active: boolean }>` / `${({ $active }) => …}`), so they
   don't reach the DOM.
4. Interactive elements are real `<button>`/`<a>` (or have a role and label): tests query by role/text.
5. Markdown from users renders with `rehype-sanitize`. Never `dangerouslySetInnerHTML`.
6. Firestore writes: every new write needs a rule in `firestore.rules` and tests in `tests/rules/` (both a
   rules test and, for a data-layer function, a case in `data-layer.test.ts`); run `npm run test:rules`.
   Counters change in the same batch as the doc they count (see likes/comments). Never deploy rules (T12).
7. Pages handle loading, error (`ErrorMessage` with `onRetry`), empty and not-found (`PageMessage`).
8. Tests: logic gets a unit test (`*.test.ts` next to it); a component gets a test with
   `renderWithProviders` from `src/test/render.tsx` (options: `route`, `path`, `uid`) and fixtures from
   `src/test/fixtures.ts`; mock `@/lib/firebase` with `vi.mock` (see `editor/BuildEditorPage.test.tsx`).
   A user journey gets a Playwright test in `tests/e2e/` (`npm run e2e`).
9. Seed data: if the feature needs data to be visible, extend `scripts/seed.mjs` (v2 docs; it validates item
   names).
10. Verify: `npm run check`, then the `run-app` skill: screenshots of the changed pages, desktop and `--mobile`.
