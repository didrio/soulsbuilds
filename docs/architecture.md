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
```

- **Counters without Cloud Functions** (they need the paid Blaze plan): a like is one batched write that creates
  `likes/{uid}` and does `likeCount: increment(1)`; the rules only allow the counter to move by exactly 1 when the
  caller's like doc appears/disappears in the same batch (`exists`/`existsAfter`). Comments work the same way;
  the batch also sets `lastCommentId` so the build rule knows which comment to check.
- **Who can do what**: anyone reads everything. Signed-in users create builds they own, like (once), and
  comment. Owners edit content and delete their builds; comment authors delete their comments. **Admins** are a
  custom claim (`request.auth.token.admin`), never a document field: they can delete any build or comment.
  Deleting a build deletes the build doc first, then its likes/comments (anyone signed in may clean up children
  of a build that no longer exists).
- **Queries and indexes** (`firestore.indexes.json`): builds by `game` + `likeCount desc` / `createdAt desc`
  (optionally `tags array-contains`), by `ownerId` + `createdAt desc`; likes collection group by `userId` +
  `createdAt desc` ("Liked" tab). The emulator doesn't need indexes; production does (deployed in T12).
- **v1 → v2**: `scripts/migrate-v1-to-v2.mjs` (dry run by default, idempotent, tested in `tests/migration/`).
  The 2022 model (`users.{admin,email,name,builds,likedBuilds}`, builds with `user`, string stats, `likes`,
  `comments[]`) only exists in production, which is dark until T12 runs the migration with the owner.

## Known problems (fixed by the ticket in brackets)

- Landing filters: only the first tag is a Firestore query; further tags and the level range filter the loaded
  pages, so a narrow filter can show few results per page ("Load more" fetches more) [T9: search, level query].
- Builds reference items by name; renamed items silently drop [T7].
- No moderation tools beyond admin deletes; no App Check yet [T10].

## Styling

styled-components with no `ThemeProvider`; tokens are plain constants in `src/theme/` (`COLOR_*` dark greens and
golds, `FONT_*`, `BELOW_*` media queries; ESLint rejects hex literals elsewhere); one `createGlobalStyle` in
`src/app/App.tsx`. Fonts: OptimusPrinceps SemiBold (local TTF, headings) and
`garamond-premier-pro` from an Adobe Typekit kit in `index.html`. Responsive layout is ad-hoc `max-width`
media queries (400–1400 px). Tooltips are hover-only. No spacing scale yet (2022 margins are ad hoc); T11 polishes mobile and fonts.
