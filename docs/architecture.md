# Architecture

Read this before changing routes, the editor, state or Firestore access. It describes the app **as it is now**
(T2: the 2022 behaviour, now strict TypeScript in feature folders). T3 (data model v2) and T4 (TanStack Query,
one AuthProvider) change it substantially; update this file with them.

## Pages and routes

`src/app/routes.tsx` defines three routes, with no 404 yet (T6):

| Route             | Component         | What it does                                                                              |
| ----------------- | ----------------- | ----------------------------------------------------------------------------------------- |
| `/`               | `Landing`         | Fetches **every** build, filters by tags and level range client-side, sorts by likes      |
| `/build/:buildId` | `BuildEditorPage` | View, create (`/build/new`) and edit in one component, plus likes and comments            |
| `/user/:userId`   | `Profile`         | Display name, the user's builds (one `getBuild` per id), "Create New Build" for the owner |

Login and Register are not routes: a slide-down panel in `src/app/App.tsx`, opened from `Header`. `GameSelector` is a
cosmetic bar ("Coming soon!" for other games). The item picker (`ItemSelector`) is a modal that opens whenever
Redux `app.slotType` is set.

## State and data flow

- **Redux** (`src/features/editor/store/`, store in `src/app/store.ts`) holds only the build being edited: `app` (which slot the picker edits), `equipment`
  (weapon1–6, weaponSkill1–6, weaponAffinity1–6, arrow1–4, tal1–4, con1–10, helm/chest/gauntlet/leg),
  `spells` (spell1–10), `stats` (8 stats, default 10), `tears` (tear1–2). Slot ids are literal types in
  `features/editor/slots.ts`. `selectors.ts` maps that state to the arrays that get saved.
- **Everything else** (builds list, users, comments, likes) is component `useState`, loaded through functions
  in `src/lib/firebase.ts`, typed by `src/lib/models.ts`. Auth is per component: `useAuth` (an `onAuthStateChanged` listener) and `useUser`
  (fetches the signed-in user's doc), each registered separately wherever used. T4 replaces this with TanStack
  Query and one `AuthProvider`.
- **Game data** is static JSON in `src/data/`, bundled, read through typed accessors in `src/data/index.ts`
  (see `docs/data.md`).
- **Load a build** (`useBuildEditor` effect): `getBuild(id)` → the `loadBuild` thunk
  (`features/editor/store/build.ts`) looks each saved item **name** up and fills the Redux slots → `getUser(build.user)` for "Created by". Names that no longer exist leave the slot
  empty and are dropped on the next save.
- **Save** (`useBuildEditor.handleSave`): `selectBuildFields` + name/description/tags → a `BuildDoc` → `saveBuild` (`setDoc` for new with a 12-char nanoid,
  then append the id to `users/{uid}.builds`; `updateDoc` for edits) → navigate to `/build/{id}`.

## Firestore model (v1, 2022)

```
users/{uid}
  admin: boolean          // set by the client at signup (!) — T3 moves admin to a custom claim
  email: string           // public (!) — T3 moves it to a private doc
  name: string
  builds: string[]        // build ids, appended on create
  likedBuilds: string[]   // build ids

builds/{id}               // id: 12 chars [0-9A-Z]
  user: string            // owner uid
  name, description       // description is markdown, rendered through rehype-sanitize
  tags: string[]          // boss names from src/data/tags.json
  level: string           // "131" (string!)
  likes: number
  comments: [{ user: uid, comment: string, date: epoch ms }]
  vigor, mind, end, str, dex, int, fai, arc: number | string
  weapons: (name|null)[6], weaponAffinities: (name|null)[6], weaponSkills: (name|null)[6]   // positional
  arrows: (name|null)[4]                                                                      // positional
  tals: name[], spells: name[], tears: name[], cons: name[]                                   // compacted
  helm, chest, gauntlet, leg: name | null
```

Weapon slots 1–3 are the main hand, 4–6 the off hand (the UI shows 2 more placeholder slots per hand for
arrows/bolts). All reads and writes are in `src/lib/firebase.ts` (`useUser` adds one direct `getDoc`). There are
no queries (`where`/`orderBy`/`limit`), transactions or batches, so no indexes yet.

## Known problems (fixed by the ticket in brackets)

- Editing a build resets its likes and comments: `handleSave` always writes `likes: 0, comments: []` and edits
  use `updateDoc` with that object [T3].
- Likes: two separate read-modify-writes (user doc, build doc), no transaction; on error the button stays
  locked [T3, T4, T5].
- Comments: read-modify-write of an array, then `window.location.reload()`; one `getUser` per comment [T3, T4].
- `getBuilds` reads the entire collection; no pagination [T9].
- The BuildEditor load effect races auth (ownership/Edit button can go missing); `/build/new` keeps the
  previous build in Redux [T4].
- Edit gate is client-side only; rules don't check ownership in production (expired rules deny all) [T3].
- Small UI bugs: see T5 in `TICKETS.md`.

## Styling

styled-components with no `ThemeProvider`; tokens are plain constants in `src/theme/` (`COLOR_*` dark greens and
golds, `FONT_*`, `BELOW_*` media queries; ESLint rejects hex literals elsewhere); one `createGlobalStyle` in
`src/app/App.tsx`. Fonts: OptimusPrinceps SemiBold (local TTF, headings) and
`garamond-premier-pro` from an Adobe Typekit kit in `index.html`. Responsive layout is ad-hoc `max-width`
media queries (400–1400 px). Tooltips are hover-only. No spacing scale yet (2022 margins are ad hoc); T11 polishes mobile and fonts.
