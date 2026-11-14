---
name: add-feature
description: Add a page, component, editor section or data feature to soulsbuilds following the project's conventions — where routes, components, Redux state, Firestore access, game data and tests go. Use when building any new user-facing feature or extending an existing page.
---

# Add a feature

**Assumes** the T1 layout (JavaScript components in `src/components/`, Firestore access in `src/firebase.js`).
T2 (TypeScript + feature folders) and T4 (TanStack Query) change where things go: when they land, rewrite this
skill to match, in the same change.

## Where things go

| You need…                         | Put it in                                                                                                             |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| A new page / URL                  | A `<Route>` in `src/components/App.jsx` + a component in `src/components/`                                            |
| Shared UI (button, input, slot…)  | `src/components/common/` — reuse what's there first (`Button`, `TextInput`, `FlexGroup`, `Slot`, `Chips`, `DropDown`) |
| State for the build being edited  | A Redux slice/action in `src/store/` + a selector in `selectors.js`                                                   |
| Data from Firestore               | A function in `src/firebase.js` (the only file that talks to Firestore/Auth); call it from the component              |
| Game data (items, spells, tags…)  | `src/data/*.json` (read-only; T7 owns changes). Look items up by name like the existing code does                     |
| Pure calculations (stats, weight) | `src/lib/buildMath.js` (or a new `src/lib/*.js`), with a colocated test                                               |
| Colors, sizes                     | `COLOR_*` constants in `src/constants.js`. No new hex literals in components                                          |

## Steps

1. Read the closest existing example (e.g. `TearEditor.jsx` for a small editor section, `Profile.jsx` for a
   page) and follow its shape. Don't introduce a parallel pattern (another styling lib, state manager, fetch
   layer) without the owner asking.
2. Styling: styled-components at the bottom of the file. Props used only for styling go as transient
   `$props` (`<Box $active>` / `${({ $active }) => …}`) so they don't reach the DOM.
3. Interactive elements are real `<button>`/`<a>` (or have a role and label): tests query by role/text.
4. Markdown from users renders with `rehype-sanitize`. Never `dangerouslySetInnerHTML`.
5. Firestore writes: think about the security rules. Until T3, `firestore.rules` is interim and local-only: if a
   new write needs a rule, update it and note it for T3. Never deploy rules.
6. Tests: logic gets a unit test (`*.test.ts` next to it); a component gets a test with
   `renderWithProviders` from `src/test/render.tsx` (see `BuildsList.test.tsx`).
7. Seed data: if the feature needs data to be visible, extend `scripts/seed.mjs` (it validates item names).
8. Verify: `npm run check`, then the `run-app` skill: screenshots of the changed pages, desktop and `--mobile`.
