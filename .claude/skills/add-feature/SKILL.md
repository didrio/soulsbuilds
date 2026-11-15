---
name: add-feature
description: Add a page, component, editor section or data feature to soulsbuilds following the project's conventions — where routes, components, Redux state, Firestore access, game data and tests go. Use when building any new user-facing feature or extending an existing page.
---

# Add a feature

**Assumes** the T2 layout (strict TypeScript, feature folders, `@/` alias). T4 (TanStack Query, one
`AuthProvider`) changes where server data goes: when it lands, rewrite this skill to match, in the same change.

## Where things go

| You need…                         | Put it in                                                                                                        |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| A new page / URL                  | A `<Route>` in `src/app/routes.tsx` + a page component in `src/features/<feature>/`                              |
| A section of the build page       | `src/features/editor/sections/` (rendered by `BuildEditorPage`); page logic in a `use*` hook next to the page    |
| Shared UI (button, input, tag…)   | `src/components/ui/` — reuse what's there first (`Button`, `TextInput`, `FlexGroup`, `Tag`, `Chips`, `DropDown`) |
| State for the build being edited  | A slice/action in `src/features/editor/store/` + a selector in `selectors.ts`; slot ids in `slots.ts`            |
| Saving/loading a new build field  | `BuildDoc` in `src/lib/models.ts`, then `loadBuild`/`selectBuildFields` in `features/editor/store/build.ts`      |
| Data from Firestore               | A function in `src/lib/firebase.ts` (the only file that talks to Firestore/Auth), typed with `src/lib/models.ts` |
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
6. Firestore writes: think about the security rules. Until T3, `firestore.rules` is interim and local-only: if a
   new write needs a rule, update it and note it for T3. Never deploy rules.
7. Tests: logic gets a unit test (`*.test.ts` next to it); a component gets a test with
   `renderWithProviders` from `src/test/render.tsx` (see `features/builds/BuildsList.test.tsx`).
8. Seed data: if the feature needs data to be visible, extend `scripts/seed.mjs` (it validates item names).
9. Verify: `npm run check`, then the `run-app` skill: screenshots of the changed pages, desktop and `--mobile`.
