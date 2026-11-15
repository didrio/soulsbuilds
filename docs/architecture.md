# Architecture

Read this before changing routes, the editor, state or Firestore access. It describes the app **as it is now**
(data model v2 from T3, TanStack Query and one `AuthProvider` from T4).

## Pages and routes

`src/app/routes.tsx` defines the routes:

| Route             | Component         | What it does                                                                                              |
| ----------------- | ----------------- | --------------------------------------------------------------------------------------------------------- |
| `/`               | `Landing`         | Builds a page at a time (most liked or newest, "Load more"); tag + level filters; filters live in the URL |
| `/build/:buildId` | `BuildEditorPage` | View, create (`/build/new`), edit, cancel and delete a build, plus likes and comments                     |
| `/user/:userId`   | `Profile`         | Display name (the owner can rename), tabs for the user's builds and the builds they liked                 |
| `*`               | `NotFound`        | 404 page                                                                                                  |

Every page has loading, error (with "Try again"), empty and not-found states (`PageMessage`, `ErrorMessage`).
Login and Register are not routes: a slide-down panel in `src/app/App.tsx`, opened from `Header`.
`GameSelector` is a cosmetic bar ("Coming soon!" for other games). The item picker (`ItemSelector`) is a modal
that opens whenever Redux `app.slotType` is set.

## State and data flow

- **Server data** (builds, profiles, likes, comments) goes through **TanStack Query** hooks in
  `src/features/<feature>/queries.ts` (`useBuild`, `useBuilds`, `useUserBuilds`, `useUserProfile(s)`,
  `useLikedBuilds`, `useHasLiked`/`useToggleLike`, `useComments`/`useAddComment`/`useDeleteComment`,
  `useSaveBuild`, `useDeleteBuild`), which call the functions in `src/lib/firebase/`. Keys are in
  `src/lib/queryKeys.ts`; invalidating `['builds']` refreshes every list and detail. Likes and comment deletes
  are optimistic and roll back on error. Never copy server data into Redux.
- **The signed-in user**: `AuthProvider` (`src/features/auth/`) listens to Firebase Auth once; components call
  `useAuth()` → `{ loading, user, uid }`. The public profile is `useUserProfile(uid)`.
- **Redux** (`src/features/editor/store/`, store in `src/app/store.ts`) holds only the build being edited:
  `app` (which slot the picker edits), `equipment` (weapon1–6, weaponSkill1–6, weaponAffinity1–6, arrow1–4,
  tal1–4, con1–10, helm/chest/gauntlet/leg), `spells` (spell1–10), `stats` (8 stats, integers 1–99, default
  10), `tears` (tear1–2). Slot ids are literal types in `features/editor/slots.ts`.
- **The item picker**: a slot (empty or filled) opens `ItemSelector` via `openPicker`; it chooses, changes or
  removes the item, and for weapons the affinity and skill. `closePicker` drops an affinity/skill left on an
  empty weapon slot.
- **The build page** (`useBuildEditor`): the page renders one `BuildEditor` per build id (`key`), so nothing
  leaks between builds. A layout effect loads the saved build into the Redux slots (`loadBuild`, which clears
  first) whenever it (re)loads and the owner isn't editing; `/build/new` clears them. Name, description and tags
  are a local draft while editing. Ownership is computed at render from `useAuth()` and the build, so there is
  no load race. Save (`selectBuildFields` + draft → `createBuild`/`updateBuild`) only writes the owner-editable
  fields; a failed save shows the error and keeps the editor open. Cancel reloads the saved build.
- **Game data** is static JSON in `src/data/`, bundled, read through typed accessors in `src/data/index.ts`
  (see `docs/data.md`). Builds store item **names** (T7 moves to IDs); names that no longer exist leave the
  slot empty and are dropped on the next save.

## Firestore model (v2)

Types in `src/lib/models.ts`; access in `src/lib/firebase/` (the only code that imports the Firebase SDK;
ESLint enforces it); rules in `firestore.rules`, tested in `tests/rules/`.

```
users/{uid}                       public profile; email stays in Firebase Auth only
  displayName: string             trimmed, 1–40 chars
  createdAt: timestamp            server time

builds/{id}                       id: 12 chars [0-9A-Z] (nanoid), e.g. SEEDBLEED001
  ownerId: uid                    immutable
  game: 'elden-ring'              immutable; other games later (backlog)
  name: string                    trimmed, 1–80 chars
  nameLower: string               name.toLowerCase(), for prefix search
  description: string             markdown (≤ 20,000 chars), rendered through rehype-sanitize
  tags: string[]                  ≤ 20, boss names from src/data/tags.json
  level: int                      sum of stats − 79, min 1 (rules check the formula)
  stats: { vigor, mind, end, str, dex, int, fai, arc }   ints 1–99
  equipment: {                    item names (T7: IDs)
    weapons, weaponAffinities, weaponSkills: (name|null)[6]   positional: 1–3 main hand, 4–6 off hand
    arrows: (name|null)[4]                                    positional
    talismans ≤4, spells ≤10, tears ≤2, consumables ≤10: name[]   compacted
    helm, chest, gauntlet, leg: name|null
  }
  likeCount, commentCount: int    0 on create; only change by ±1 with a like/comment (see below)
  lastCommentId: string           set by the comment counter (rules plumbing, unused by the UI)
  createdAt, updatedAt: timestamp server time; owner edits must bump updatedAt

builds/{id}/likes/{uid}           one like per user (doc id = liker's uid)
  userId: uid, createdAt: timestamp
builds/{id}/comments/{autoId}
  authorId: uid, text: string (trimmed, 1–1000), createdAt: timestamp

reports/{targetId}_{uid}          one report per user per build/comment (T10); create-only from clients
  reporterId: uid, buildId, commentId: string|null (null = the build itself)
  reason: 'spam'|'offensive'|'harassment'|'other', note: string (trimmed, ≤ 500, may be '')
  status: 'open' (client) → 'removed'|'dismissed' + resolvedAt (scripts/admin.mjs), createdAt: timestamp
```

- **Counters without Cloud Functions** (they need the paid Blaze plan): a like is one batched write that creates
  `likes/{uid}` and does `likeCount: increment(1)`; the rules only allow the counter to move by exactly 1 when the
  caller's like doc appears/disappears in the same batch (`exists`/`existsAfter`). Comments work the same way;
  the batch also sets `lastCommentId` so the build rule knows which comment to check.
- **Who can do what**: anyone reads everything. Signed-in users create builds they own, like (once), and
  comment. Owners edit content and delete their builds; comment authors delete their comments. **Admins** are a
  custom claim (`request.auth.token.admin`), never a document field: they can delete any build or comment.
  Deleting a build deletes the build doc first, then its likes/comments (anyone signed in may clean up children
  of a build that no longer exists). Signed-in users report builds and comments; only admins read reports
  (a reporter may read their own). Moderation runs from `scripts/admin.mjs` (`docs/firebase.md`).
- **Queries and indexes** (`firestore.indexes.json`): builds by `game` + `likeCount desc` / `createdAt desc`
  (optionally `tags array-contains`), by `game` + `nameLower` (prefix search: `>= q`, `<= q + '\uf8ff'`), by
  `ownerId` + `createdAt desc`; likes collection group by `userId` + `createdAt desc` ("Liked" tab). The emulator doesn't need indexes; production does (deployed in T12).
- **v1 → v2**: `scripts/migrate-v1-to-v2.mjs` (dry run by default, idempotent, tested in `tests/migration/`).
  The 2022 model (`users.{admin,email,name,builds,likedBuilds}`, builds with `user`, string stats, `likes`,
  `comments[]`) only exists in production, which is dark until T12 runs the migration with the owner.

## Known problems (fixed by the ticket in brackets)

- Landing filters: only the first tag is a Firestore query; further tags and the level range filter the loaded
  pages, so a narrow filter can show few results per page ("Load more" fetches more). Search is a name prefix
  match only, and ignores sort and the server-side tag [T9].
- Game data (~650 KB of JSON) is in the main bundle because the landing cards use it [T7/T11].
- Builds reference items by name; renamed items silently drop [T7].
- App Check is coded but off until the owner creates the reCAPTCHA key (`docs/firebase.md`) [T12].
- No admin UI: reports are reviewed with `scripts/admin.mjs` (backlog).

## Styling

styled-components with no `ThemeProvider`; tokens are plain constants in `src/theme/` (`COLOR_*` dark greens and
golds, `FONT_*`, `BELOW_*` media queries; ESLint rejects hex literals elsewhere); one `createGlobalStyle` in
`src/app/App.tsx`. Fonts: OptimusPrinceps SemiBold (local TTF, headings) and
`garamond-premier-pro` from an Adobe Typekit kit in `index.html`. Responsive layout is ad-hoc `max-width`
media queries (400–1400 px). Spacing: `SPACE_*` tokens (5px steps, plus `SPACE_GUTTER` 16px) in
`src/theme/spacing.ts`, used by the shell and the pages touched since T11; older margins are still literal.
Contrast: gold and light-green text pass WCAG AA on the greens, except on `COLOR_LIGHT_GREEN`, so hover states
that use it switch the text to `COLOR_LIGHTEST_GREEN` (notes in `colors.ts`). Weapon affinity/skill badges in
`Slot` show details on mouse hover, and in view mode are buttons (tap/Enter toggles, Escape/blur closes; pinned to
the bottom of the screen on phones). Dialogs and panels use `components/ui/FocusScope` (focus in, Escape, focus
back; `trap` for the item picker modal). Item icons are decorative (`alt=""`): the name is always shown next to
them.
Code splitting: `/build/*` and `/user/*` are lazy routes; the markdown editor (`sections/Markdown.tsx`, the
largest dependency) loads only when a description is shown or edited.
