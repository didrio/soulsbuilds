# Architecture

Read this before changing routes, the editor, state or Firestore access. It describes the app **as it is now**
(data model v2 from T3, TanStack Query and one `AuthProvider` from T4).

## Pages and routes

`src/app/routes.tsx` defines the routes:

| Route               | Component         | What it does                                                                                                                                                                 |
| ------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                 | `Landing`         | Builds a page at a time (most liked or newest, "Load more"); tag + level filters; filters live in the URL                                                                    |
| `/build/:buildId/*` | `BuildEditorPage` | View, create (`/build/new`), edit, cancel and delete a build, plus likes and comments; tabs `description`, `route`, `comments` (T28)                                         |
| `/weapons/:slug`    | `WeaponPage`      | A weapon's page (T55): facts, where to find it (the Guide's route for that weapon), its builds most liked first; `noindex` under 3 builds; unknown slug → not found          |
| `/tags/:slug`       | `TagPage`         | A tag's page (T55): its builds most liked first ("Builds for Malenia", "Bleed Builds"); `noindex` under 3 builds                                                             |
| `/user/:userId`     | `Profile`         | Public profile: framed hero (name, joined, counts), tabs Builds and Liked; the owner's private Playing and Completed (T36) and a link to `/account` (T31)                    |
| `/account`          | `AccountPage`     | Signed-in only (T31): display name, email (verification, change by link), sign-in methods (change or set a password), Log out, Delete account                                |
| `/auth/action`      | `ActionPage`      | Where the emails' links land (T43): `mode=resetPassword` (new-password form), `verifyEmail` and `verifyAndChangeEmail` (applied once); expired or used links offer a new one |
| `*`                 | `NotFound`        | 404 page                                                                                                                                                                     |

Every page has loading, error (with "Try again"), empty and not-found states (`PageMessage`, `ErrorMessage`).
Log in and Sign up are not routes: a modal `Dialog` in `src/app/App.tsx`, opened from `Header`. Signed in, the
header's display name opens `AccountMenu` (Profile, Account, Log out; on phones they're in the Menu panel).
Account changes (`changeEmail`, `changePassword`, `setPassword` in `lib/firebase/auth.ts`) re-authenticate first,
every time; `useAuth()` copies `email`, `emailVerified` and `providers` off the Auth user and `refreshUser()`
re-reads them, since Auth changes the user object in place. The item picker
(`ItemSelector`) is a modal that opens whenever Redux `app.slotType` is set.

**Weapon and tag pages (T55)** are landing pages for what people search ("moonveil build", "bleed build"),
in `src/features/hubs/`. Slugs, paths, titles and descriptions are pure in `src/lib/hubs.ts` (card data only, so
build pages and the function can link without the full data): a weapon's slug is its name (`slugify`, unique
across all weapons, DLC included); a tag's is its name, except a few short names people search (`TAG_LABELS`:
"Bleed (Hemorrhage)" → `/tags/bleed`). A tag no longer in the list has no page (`tagHref` falls back to the
landing filter). Builds by weapon need **no extra field**: `listBuildsByWeapon` queries
`equipment.weapons array-contains <id>` (any of the six slots; index `equipment.weapons`, `game`, `likeCount`);
tag pages reuse `listBuilds({ tag })`. "Where to find it" is the Guide's solver for that one weapon
(`findStops.ts`: `planRoute`, gates included; `WhereToFind` is its own chunk with the acquisition data). A page
with fewer than `HUB_MIN_BUILDS` (3) builds is `noindex` (app and function) and left out of the sitemap. Links
in: the build title section ("with Rivers of Blood and Uchigatana", tags link to their pages), the crawler HTML
of every build, the weapon type in a weapon page's tagline (`/tags/katana`), and the landing's Popular weapons
(from `stats.weaponCounts`, only weapons with 3+ builds and no staffs or seals: casters carry one whatever the
build, owner's call). Landing rows stay whole-row links (no nested tag links).

**Games.** Souls Builds will cover more FromSoftware games; Elden Ring is the only one today. `src/app/game.ts`
holds the registry (`GAMES`) and `useCurrentGame()`, the one seam that later reads the game from the route.
Function and UX are the same for every game; only the skin (accent colors) changes, from `src/theme/skins.ts`.

## State and data flow

- **Server data** (builds, profiles, likes, comments) goes through **TanStack Query** hooks in
  `src/features/<feature>/queries.ts` (`useBuild`, `useBuilds`, `useUserBuilds`, `useUserProfile(s)`,
  `useLikedBuilds`, `useHasLiked`/`useToggleLike`, `useComments`/`useAddComment`/`useDeleteComment`,
  `useCommentLikes`/`useToggleCommentLike` (T62),
  `useSaveBuild`, `useDeleteBuild`), which call the functions in `src/lib/firebase/`. Keys are in
  `src/lib/queryKeys.ts`; invalidating `['builds']` refreshes every list and detail. Likes and comment deletes
  are optimistic and roll back on error. Never copy server data into Redux. Comment threads (T62) are
  derived at render by `threadComments` in `src/lib/comments.ts` (Top counts every like, the viewer's own
  included; likes made since the sort was chosen are held out of the rank, so liking never moves a comment
  under the cursor, and choosing Top or Newest again re-ranks; T66 follow-up: the old rule left out the
  viewer's likes altogether, so Top often matched Newest).
- **The signed-in user**: `AuthProvider` (`src/features/auth/`) listens to Firebase Auth once; components call
  `useAuth()` → `{ loading, user, uid }`. The public profile is `useUserProfile(uid)`.
- **Redux** (`src/features/editor/store/`, store in `src/app/store.ts`) holds only the build being edited:
  `app` (which slot the picker edits), `equipment` (weapon1–6, weaponSkill1–6 (the Ash of War),
  weaponAffinity1–6, arrow1–4, tal1–4, con1–10, helm/chest/gauntlet/leg, greatRune, spiritAsh), `spells`
  (spell1–12), `stats` (8 stats, integers 1–99, default 10), `startingClass` (the class entry or null; choosing
  one raises the stats to its base and the stat inputs clamp to it), `tears` (tear1–2). Derived numbers (vitals,
  equip load, poise, requirement checks, memory slots) are selectors in `store/derived.ts` over
  `src/lib/buildMath.ts`, never stored. Slots hold the game data
  objects; slot ids are literal types in `features/editor/slots.ts`. The weapon reducers keep each weapon's Ash
  and affinity valid for it (`src/data/rules.ts`), so loading or editing can't produce a combination the game
  doesn't allow.
- **The item picker**: a slot (empty or filled) opens `ItemSelector` via `openPicker`; it chooses, changes or
  removes the item. For a slot holding a weapon, `WeaponOptions` offers the Ashes of War that fit it and the
  affinities it shares with the chosen Ash (or shows a unique weapon's fixed skill); talismans that share a
  group with one already worn are disabled with the reason.
- **The build page** (`useBuildEditor`): the page renders one `BuildEditor` per build id (`key`), so nothing
  leaks between builds. A layout effect loads the saved build into the Redux slots (`loadBuild`, which clears
  first) whenever it (re)loads and the owner isn't editing; `/build/new` clears them. Name, description and tags
  are a local draft while editing. Ownership is computed at render from `useAuth()` and the build, so there is
  no load race. Save (`selectBuildFields` + draft → `createBuild`/`updateBuild`) only writes the owner-editable
  fields; a failed save shows the error and keeps the editor open. Cancel reloads the saved build.
- **Tracking (T34)** (`src/features/tracking/`): tracking needs an account (T41). `useBuildTracking(build)` holds
  the player's progress on the build page in the query cache (`queryKeys.tracking(uid, buildId)`, `staleTime:
Infinity`: the page is the only writer), read from `users/{uid}/tracking/{buildId}`; each change updates the
  cache at once and `saveQueue.ts` writes the whole doc after a 500 ms pause (flushed on `pagehide` and unmount),
  so rapid +/− taps are one write. The math is pure, in `src/lib/tracking.ts`. "Track this build" opens the
  intro (`TrackingIntro`, a `Dialog`) when signed out, or signed in while `tracksAnyBuild(uid)` (one `limit(1)`
  read, `queryKeys.tracksAnyBuild`) says no build is tracked yet; otherwise it starts at once; either way the How
  to get tab opens (T46: tracking lives only there). Signed out, the
  intro opens sign-up or log-in through `useOpenAuthDialog(kind, onSignedIn)` (`src/app/authDialog.ts`): App
  calls `onSignedIn(uid)` after a successful sign-in, and `startAfterSignIn(uid)` starts tracking on that account
  unless it already tracks the build (the uid comes from the auth result, since `useAuth` may lag a render).
  The route follows progress (T35): `guide/progress.ts` maps a route item to its tracking keys (`isCollected`)
  and decides which numbered stops are done (`stopProgress`: a stop with the build's tracked items when all are
  collected; any other stop (key items, a boss, an Ash of War) when the player marks it done, T44). Nothing is
  inferred from later stops: players go out of order (owner's call). A mark is stored as the stop's things
  (`stopMarkKeys`: `gate:<gateId>`, `<file>:<id>` for its items), not its number, so it survives the author
  reshuffling the route; `applyChange`'s `mark` keeps marks to the route's current keys. Marks don't count
  toward the percentage. **Tracking lives in the Guide tab (T46)**: `TrackingBar` at the top (progress, "Your
  stats" opening `TrackedAttributes` in place, Stop tracking; at 100% the Build complete moment), the new-items
  notice, then the route as the checklist: a checkbox on each of the build's tracked items (`itemTrackKeys`
  gives an item's keys, one per slot for a weapon held twice; `applyChange`'s `toggle` takes them all), done
  stops folded, the next marked, "Mark done" on stops without the build's gear. Items with no known source sit
  in the last ("elsewhere") stop, so every item has a checkbox. The rest of the page (title section, the build
  sidebar) is the same whether or not you track; the title section's button becomes a "Tracking" link to the tab.
  **Playing and Completed (T36)**: the build's public `playerCount`/`finishedCount` move in the same batch as
  the tracking doc whenever its status changes (`trackingStatus`, `counterDelta` in `src/lib/tracking.ts`;
  `saveTracking(…, from)` / `deleteTracking(…, counted)`). `saveQueue.ts` keeps each record's status in the
  database (seeded by the read, `noteLoaded`; set when a write is sent; forgotten on a failed write, whose
  refetch re-seeds it), and the hook moves the cached build's counts at once. The owner's profile shows
  Playing (cards with progress and the next stop, `PlayingList`, a lazy chunk with the full data and the route)
  and Completed (trophy tiles), from `useTrackedBuilds` (`listTracking` + `getBuild` each,
  `queryKeys.trackedBuilds`, invalidated by every tracking change). Both private; visitors don't see the tabs.
- **Game data** is static JSON in `src/data/er/` (from the game files, T7), bundled, read through typed
  accessors by ID in `src/data/index.ts`; the equipment rules are pure functions in `src/data/rules.ts`, shared
  with the seed and migration scripts (see `docs/data.md`). Builds store **game IDs**; an ID the data no longer
  has leaves the slot empty and is dropped on the next save.

## Firestore model (v2)

Types in `src/lib/models.ts`; access in `src/lib/firebase/` (the only code that imports the Firebase SDK;
ESLint enforces it); rules in `firestore.rules`, tested in `tests/rules/`.

```
users/{uid}                       public profile; email stays in Firebase Auth only
  displayName: string             trimmed, 1–40 chars
  createdAt: timestamp            server time

users/{uid}/tracking/{buildId}    T34: the player's private progress on a build; only they read or write it
  game: 'elden-ring'
  collected: string[]             item keys (below) marked collected, ≤ 64 (a build has at most 30)
  seen: string[]                  the build's item keys the player has seen; others show as "new items"
  marked?: string[]               T44: route stops marked done, as gate/item keys (`gate:margit`), ≤ 64;
                                  optional (docs from before T44 have none)
  stats: { vigor … arc }          the player's levels, ints 1–99
  startedAt: timestamp            client time (local progress keeps its start); may only move earlier
  updatedAt: timestamp            server time
  completedAt: timestamp|null     set on first reaching 100%; cleared only by the player's own change

builds/{id}                       id: 12 chars [0-9A-Z] (nanoid), e.g. SEEDBLEED001
  ownerId: uid                    immutable
  game: 'elden-ring'              immutable; other games later (backlog)
  name: string                    trimmed, 1–80 chars
  nameLower: string               name.toLowerCase(), for prefix search
  description: string             markdown (≤ 20,000 chars), rendered through rehype-sanitize
  tags: string[]                  ≤ 20, from src/data/er/tags.json (bosses, weapon types, …)
  level: int                      sum of stats − 79, min 1 (rules check the formula)
  stats: { vigor, mind, end, str, dex, int, fai, arc }   ints 1–99
  startingClass: int|null         T8: CharaInitParam ID 3000–3011 (character.json; 3010–3011 since T52), required on create; absent
                                  on older builds (read as null). Class minimums are checked by the app only
  equipment: {                    game IDs (param row IDs; each field implies its file in src/data/er/)
    weapons: (id|null)[6]                       positional: 1–3 main hand, 4–6 off hand
    weaponSkills: (id|null)[6]                  the Ash of War applied; null = the weapon's built-in skill
    weaponAffinities: (key|null)[6]             'cold', 'flame-art', …; null = Standard
    arrows: (id|null)[4]                        positional
    talismans ≤4, spells ≤12 (T8), tears ≤2, consumables ≤10: id[]   compacted
    helm, chest, gauntlet, leg, greatRune, spiritAsh: id|null
  }
  image: { kind, id }|null        T40: the author's pick for the build's picture; kind = weapon, helm, chest,
                                  gauntlet, leg, talisman, spell, tear, greatRune or spiritAsh (no arrows or
                                  consumables); null = the default. Optional on create (an older tab can still
                                  create builds) and absent on older builds. Shown only while the item is on
                                  the build: `buildImage` in lib/equipment.ts falls back to the main weapon at
                                  read time; the editor saves a pick that left the build as null
  likeCount, commentCount: int    0 on create; only change by ±1 with a like/comment (see below)
  playerCount, finishedCount: int T36: everyone tracking it (playing or finished) / those finished; 0 on
                                  create; move by ±1 with the caller's own tracking doc; absent on builds
                                  saved before T36 until `admin.mjs counts --write` (rules count from 0)
  lastCommentId: string           set by the comment counter (rules plumbing, unused by the UI)
  createdAt, updatedAt: timestamp server time; owner edits must bump updatedAt

builds/{id}/likes/{uid}           one like per user (doc id = liker's uid)
  userId: uid, createdAt: timestamp
builds/{id}/comments/{autoId}
  authorId: uid, text: string (trimmed, 1–1000), createdAt: timestamp
  parentId: string|null           T62: the top-level comment a reply answers (one level: never a reply);
                                  absent on comments from before T62 (read as null)
  likeCount: int                  T62: 0 on create; ±1 with a commentLikes doc; absent before T62 (= 0)
builds/{id}/commentLikes/{commentId}_{uid}   T62: one like per user per comment
  userId: uid, commentId: string, createdAt: timestamp

reports/{targetId}_{uid}          one report per user per build/comment (T10); clients create, and delete
                                  their own (account deletion, T18)
  reporterId: uid, buildId, commentId: string|null (null = the build itself)
  reason: 'spam'|'offensive'|'harassment'|'other', note: string (trimmed, ≤ 500, may be '')
  status: 'open' (client) → 'removed'|'dismissed' + resolvedAt (scripts/admin.mjs), createdAt: timestamp

stats/{game}                      community numbers per game (T20; doc id = GameId, e.g. stats/elden-ring);
                                  public read, no client writes; written daily by `admin.mjs stats` in CI
  buildCount, authorCount (distinct build owners), userCount (all accounts): int
  tagCounts: { [tag]: int }       builds per tag (top tags on the landing)
  weaponCounts: { [weaponId]: int }  builds per weapon (T55: the landing's Popular weapons; absent before T55's first daily run)
  updatedAt: timestamp
```

- **Counters without Cloud Functions** (they need the paid Blaze plan): a like is one batched write that creates
  `likes/{uid}` and does `likeCount: increment(1)`; the rules only allow the counter to move by exactly 1 when the
  caller's like doc appears/disappears in the same batch (`exists`/`existsAfter`). Comments work the same way;
  the batch also sets `lastCommentId` so the build rule knows which comment to check (replies count too).
  Comment likes (T62) are the same pattern one level down: `commentLikes/{commentId}_{uid}` and the comment's
  `likeCount` in one batch; the viewer's hearts are one query per build page (`where userId == uid`). A
  deleted comment's replies stay (no cascade), shown under "Comment deleted"; its likes become unreachable
  orphans, which their likers may still delete. Tracking (T36): the
  tracking doc's status (none / playing / finished, from `completedAt`) before and after the batch decides how
  `playerCount` and `finishedCount` move (`countersMoved` in the rules, checked from both docs); a write that
  keeps the status touches no counter, and a tracking doc whose build is gone can be deleted alone.
- **Who can do what**: anyone reads everything. Signed-in users create builds they own, like (once), and
  comment. Owners edit content and delete their builds; comment authors delete their comments. **Admins** are a
  custom claim (`request.auth.token.admin`), never a document field: they can delete any build or comment.
  Deleting a build deletes the build doc first, then its likes/comments (anyone signed in may clean up children
  of a build that no longer exists). Signed-in users report builds and comments; only admins read reports
  (a reporter may read and list their own). Moderation runs from `scripts/admin.mjs` (`docs/firebase.md`).
- **Account deletion (T18)**, client-side (`src/lib/firebase/account.ts`, "Delete account" on `/account`, T31):
  re-authenticate (`reauthenticate` in `auth.ts`: the password, or Google for a Google-only account), then **find everything first** (own builds; likes and comments on other
  builds by collection-group queries; comment likes too, T62; reports by `reporterId`), so a failing query deletes nothing; then delete
  own builds (`deleteBuild`, which takes every like, comment and comment like on them), each like/comment
  elsewhere in its own batch with the counter (plain delete if that build is gone; comment likes before
  comments, with the comment's `likeCount` while it exists), the reports, the tracking docs (T34; each
  with its build's counters, T36, unless that build is gone or their own),
  `users/{uid}`, and last the
  Auth user (`deleteUser`). Every step is idempotent: re-running finishes a half-done deletion (the owner's own
  "User not found" page offers "Finish deleting your account"). Reports _about_ the user's content stay open
  for admins (shown as "already deleted"). `scripts/admin.mjs delete-user` does the same with the Admin SDK.
- **Tracking item keys (T34)**, `src/lib/tracking.ts`: `weapon1:<id>` … `weapon6:<id>` (by slot: two copies of a
  weapon are two items), `helm|chest|gauntlet|leg|greatRune|spiritAsh:<id>`, and `talisman:<id>`, `tear:<id>`,
  `spell:<id>` for the compacted lists (a spell listed twice is one item). Arrows and consumables aren't
  tracked (owner's call). Progress always counts against the build's **current** items, so an author's edit
  adds unchecked items and drops removed ones. The percentage is half gear (collected / items) and half levels
  (Σ min(yours, target) from the baseline: the starting class, or 10 lowered to the target), rounded down so 100%
  means complete. The doc id is the build id, so the build's counters (T36) can check it with `existsAfter`
  like likes. Account deletion and `admin.mjs delete-user` delete the user's tracking docs with the counters;
  `admin.mjs remove` leaves other players' tracking of a removed build as orphans (the profile skips them).
- **Queries and indexes** (`firestore.indexes.json`): builds by `game` + `likeCount desc` / `createdAt desc` /
  `playerCount desc` ("Most played", T36; builds without the field are left out until backfilled)
  (optionally `tags array-contains`), by `game` + `nameLower` (prefix search: `>= q`, `<= q + '\uf8ff'`; optionally
  with a tag), each optionally with a `level` range (`>=`/`<=` next to an `orderBy` on another field, which Firestore's
  multi-field range support allows; the index lists equality fields, the order field, then `level`), by
  `ownerId` + `createdAt desc`; likes collection group by `userId` + `createdAt desc` ("Liked" tab).
  Account deletion's equality-only collection-group queries (likes and commentLikes by `userId`, comments by `authorId`) use
  single-field `fieldOverrides` with a `COLLECTION_GROUP` scope. The emulator doesn't need indexes; production does (deployed in T12).
- **Community stats (T20)** are counted once a day, not live: a `count()` per tag would cost ~100 reads per
  visitor (Spark: 50k/day) and client-written counters can't be cheaply verified by rules. The landing reads
  `stats/{game}` once per visit (`useGameStats`, 1 h `staleTime`) and hides the top tags and "N builds by M
  players" when the doc is missing. `npm run seed` writes it with the same code (`updateStats`).
- **v1 → v2**: `scripts/migrate-v1-to-v2.mjs` (dry run by default, idempotent, tested in `tests/migration/`).
  The 2022 model (`users.{admin,email,name,builds,likedBuilds}`, builds with `user`, string stats, `likes`,
  `comments[]`, item **names**) existed only in production, migrated at T12 (2026-11-15); the script stays for
  the record and its tests. Item names become game IDs on the way (`scripts/lib/names-to-ids.mjs` with
  `scripts/data/name-aliases.json`), dropping, with a note each, names the game data doesn't have and
  Ash/affinity/talisman combinations the game doesn't allow; the tag "Warhammer" becomes "Great Hammer".

## Known problems (fixed by the ticket in brackets)

- Landing filters: the search, the first tag and the level range are Firestore queries; further tags filter the
  loaded pages, so a page can come back short ("Load more" fetches more). Search is a name prefix match only, and
  ignores sort (it is ordered by name).
- The rules check the types of positional equipment lists and single slots, but only the sizes of the
  talisman/spell/tear/consumable lists (Firestore's per-request expression budget; `firestore.rules`). The app
  ignores IDs it doesn't know.
- App Check is on in production builds (reCAPTCHA Enterprise key in `src/lib/firebase/app.ts`); enforcement
  follows once its metrics look right (`docs/firebase.md`).
- No admin UI: reports are reviewed with `scripts/admin.mjs` (backlog).

## Styling

styled-components with no `ThemeProvider`; tokens are plain constants in `src/theme/` (T16 design system, revised
by redesign v2 in T26; `docs/decisions.md` "Redesign", "Redesign v2"). ESLint rejects hex literals elsewhere.
The in-world feel comes from layout, the item art and the build hero, not from decorating every panel.

- **Colors, two layers** (`colors.ts`): a game-agnostic base (warm near-black surfaces, off-white text, lines)
  and the game **skin** (`skins.ts`: accent, accent-strong/deep, on-accent, frame, glow, and `tint`, the build
  hero's glow). Skin tokens are CSS
  custom properties (`COLOR_ACCENT = 'var(--sb-accent)'`) written to `:root` by `GameSkinStyle` for the current
  game, so components import one constant. `colors.test.ts` checks WCAG AA for every text/background pair and
  every game's skin; add a pair there when you put text on a new background.
- **Accent budget** (T26): the accent appears only on the primary button, links and hover, the active tab/sort
  state, the level figure, stat bar fills, the liked state and the focus ring; while tracking (T34), collected
  items (`COLOR_ACCENT_LINE` border, check badge), reached stats, the progress figure and pips, and the
  new-items notice's border (`COLOR_CELEBRATE` is the glow of collecting an item or finishing a build), and the
  route's next stop (T35: accent marker, `COLOR_ACCENT_LINE` border on a `COLOR_TINT` box, the Next stop card's
  border and label). Panel
  borders are `COLOR_LINE`,
  headings are the text color, tags and chips are neutral (inset fill, `COLOR_LINE_STRONG` border), counts and
  icons are muted. Check a new use of `COLOR_ACCENT*` against this list.
- **Type: three tiers** (`fonts.ts`, CSS in `components/ui/typography.ts`). **Names and headings**: `FONT_DISPLAY`
  (EB Garamond 600, `WEIGHT_DISPLAY`), title case, the text color (`displayText`; `SectionHeading` 24px, page
  titles 32px, the build name 40px). **Labels**: Inter 11px/600, uppercase, 0.08em tracking, muted (`labelText`,
  `Label`): the only caps style. **Values and body**: Inter (`FONT_UI`, UI text 14px), numbers with
  `font-variant-numeric: tabular-nums`. Write-ups (`MarkdownView`): EB Garamond 18px/1.6 (`FONT_PROSE`); h1 serif
  28px, h2 serif 22px over a hairline, h3 the label, h4–h6 Inter 15px/600. `FONT_BRAND` (Cinzel 700) is the
  wordmark only. All self-hosted OFL from `@fontsource`, imported in `src/index.css`.
- **Density**: content 1240px wide (`CONTENT_WIDTH`), panel padding 20px (16px on phones; `SPACE_PANEL`), 12px
  inside groups (`SPACE_GROUP`), 24px between regions (`SPACE_REGION`).
- **Spacing, radii, shadows, motion, breakpoints**: `SPACE_*`, `RADIUS_*`, `SHADOW_*`, `DURATION_*`/`EASE`,
  `BELOW_MOBILE` (640) / `BELOW_TABLET` (900).
- **Page-wide styles**: `GlobalStyle.ts` (background light, vignette, film grain, focus ring, reduced motion).
- **Building blocks** (`components/ui/`): `Frame` (a plain panel: surface + neutral hairline; `$hero` adds the
  accent corner marks and the tint glow, for the build hero only), `SectionHeading`, `Label`, `PageHero` (a page's
  serif `<h1>` and tagline; profile and legal pages), `Ornament` (neutral divider, page states), `ItemTile`
  (inventory slot), and in `inWorld.ts` the `panel` / `heroFrame` CSS and `selectionBar` (the game-menu hover/focus
  glow). Use these instead of one-offs.
- **Header** (`app/Header.tsx`): the wordmark, the game name, Builds and Profile (or Log in), Log out, and New
  build (or Sign up) as the primary button; on phones a labelled "+" (New build) or Sign up, and a Menu button
  that drops the rest down under the bar (`FocusScope`: Escape closes, a choice closes).

**Build page** (T17, reshaped in T22, T27, T28, T48, T49 and T66, `features/editor/`): view and edit share one layout.
T66's goal: a fully equipped build's Equipment tab fits a 1440×820 window (and 1280×800) without scrolling,
guarded by `tests/e2e/fold.spec.ts` on the seed build `SEEDFULL0001`; mind the height when adding to the top
section, the stats card or the Equipment panel. No "All builds" link: the header's Builds shows as the current
section on a build page (`$section`). The top section is unframed: the
**title block** (`BuildHeader`, on the page background: the build image (T40: `lib/equipment.ts` `buildImage`, the
author's pick else the main weapon; `getCardItem` in `@/data/core` shows any kind) as an 88px tile (T48, T66; 56px below
900px) with the skin's tint glow, name as `<h1>`, author, level and age, tags, Report and the owner's Edit/Delete top right;
below 900px every action in a row under the tags, `BuildActions` passed in as `actions`); in edit mode `BuildDetailsForm` takes its place, with the name,
tags and "Build image": the current tile and "Change image", which opens `BuildImageDialog`, radio rows of the
default and the build's gear), then (desktop, ≥ 900px) the **tab row** (`sections/BuildTabs`: `NavLink`s on the left, the first label in line
with the page, and `BuildActions` (Track, Like, Share) on the right, over one hairline that ends the top section;
64px tall, the accent line as wide as the current label, sticky at the window's top, see-through until it sticks; Discussion shows the stored comment count),
then, framed, the **build sidebar** beside the tab.
Tabs are URLs (`/build/:buildId/*`, `tabs.ts`; T63): `/build/<id>/<slug>` Equipment, `/<slug>/guide`, `/<slug>/discussion`,
where the slug is the name (`lib/slug.ts`, T56: `/build/x/bleed-samurai`). **The ID alone decides the build**: a missing
or stale slug (or a rename) is replaced in the URL (`<Navigate replace>`), and `splitBuildPath` tells a lone tab
segment (links from before T56, T48 and T63: `/build/x/guide`, `/route` → Guide, `/description` and `/comments` → Discussion) from a slug; `slugify` never
returns a tab's segment ("Guide" → `guide-build`). Links built with `tabPath(id, tab, name)` carry the slug. An
unknown tab, or one the build doesn't show (editing and `/build/new`: Equipment only), redirects to Equipment. Nothing
is generated for a build without a write-up (T47's generated description was removed in T63): Discussion then has
the comments alone. Switching tabs keeps the editor (and an edit in
progress) and the scroll position (`useScrollToTop` compares `pageKey`s; the bar scrolls itself back to the top
when it was stuck).
**Equipment** (T63, the default tab; `sections/EquipmentSection`): the sidebar is the stats alone (`equipment={false}`)
and the main content is the equipment panel, laid out like the game's screen: `gear.ts` `equipmentGroups` (pure:
the editable groups; read-only, the right hand, left hand, armor, talismans and flask with every slot, empty ones as
faint `ItemTile placeholder`s hidden from screen readers, and arrows, spells, items only when filled) in a two-column
grid (one below a 560px container), packed by `gear.ts` `equipmentLayout` (pure, T66): right | left hand (104px
tiles), armor | talismans, then the flask, arrows, spells and items two to a row (68px tiles); a group of more than
five tiles, or a half left alone on its row, spans it. No heading: the tab names it (`aria-label`). Viewing, **both columns are the same height**:
the sidebar (`fill`) and the panel stretch to the row, the panel's rows share the spare height evenly (auto rows,
`align-content: stretch`, each group centered in its band) and, when the equipment is the taller one, `StatsCard
fill` spreads its blocks (`space-between`). Editing: every tile opens the picker, and the write-up's editor
(`DescriptionSection`) sits under the panel; the columns keep their own heights.
The **build sidebar** (T48, `sections/BuildSidebar`): one 340px column on every tab, the same signed in or out and
tracking or not; on Guide and Discussion it sticks under the tab bar only when it fits the window (measured with a
`ResizeObserver`), else it scrolls with the page; desktop only (phones: the sections below). Top:
`sections/StatsCard` (T27): rune level, starting class, the 8 attributes as rows with bars and talisman bonuses (a
4×2 grid with short names below 900px; inputs in the same place when editing, plus the starting-class picker),
HP/FP/stamina, the equip load bar marked at 30% and 70% with the roll, poise. Then, on Guide and Discussion,
**Equipment** at a glance: `gear.ts` `gearGroups(selectGearState)` (pure, shared with T49) groups the slots as
`SlotEntry`s, and each is a 44px tile (`sections/GearTiles`: `GearTile`, `GearRow`, shared with the Equipment panel),
**no names on the page**. Read-only: the filled slots only (Armaments = right hand, left hand, arrows; Armor;
Talismans; Spells with "N of M memory slots"; Tears, rune and ash; Items), empty groups left out, "No items yet."
with none; a tile is a button named like "Uchigatana (Blood affinity, Seppuku skill, Needs 11 Str)"
(`ItemRow.tsx` `itemLabel`) whose `Tooltip` shows the name, the subline (`itemSubline`) and the warning
(`itemWarning`, also a dot on the tile's corner) on mouse hover, keyboard focus or tap (Escape closes). Editable
(the Equipment panel): every slot (each hand and the arrows as their own rows; spells and items, saved without positions, as the filled
ones plus one "Choose"), each tile the button that opens the picker ("Choose talisman", "Change Uchigatana (Blood
affinity, Seppuku skill)", `changeLabel`), named on hover or focus. `ItemRow` (tile + name + detail line +
warning) stays for rows (the Guide's items; the phone sections).
**Phones and tablets** (< 900px, T49): `BuildEditorPage` picks one layout in JS (`app/useMediaQuery`
`useMediaQuery(BELOW_TABLET)`; tests stub `matchMedia` in `src/test/viewport.ts`, desktop by default,
`setViewportWidth(390)` for phones), never both with CSS (fixed ids). `sections/BuildSections` replaces the tab bar
and the sidebar with one list (a panel, hairlines between) of `sections/PhoneSection`s: Stats, Weapons (with
arrows), Armor, Talismans, Spells\*, Tears rune and ash, Items\* (\*viewing: only with some), Guide, Discussion
(editing: Description, the write-up's editor, instead of the last two). A section is a region named by its title; its header (`<h2><button aria-expanded aria-controls>`) shows
the title over a **glance** while closed (`sections/glances.ts`, pure: `statsGlance` rune level + top three
attributes, the gear's icons (`phoneGearSections` over `gearGroups`; an empty always-listed gear section is a plain
heading with "None"), `guideGlance` "14 items to find" / "3 of 14 items" while tracking, `commentsGlance` with the
newest comment: `useLatestComment`, one `limit(1)` read when `commentCount` > 0, or the loaded list's first), the
title alone while open, sticky inside its section. Bodies render only while open (so Comments and the Guide's
route load on open): `StatsCard bare`, `ItemRow`s (64px weapons, editable rows open the picker), and the tab bodies
with `bare` (no Frame or heading). The URL's tab starts open (Equipment, the default, opens Weapons); several can
be open; tapping Guide/Discussion open replaces the URL (no history entry); a URL change from elsewhere (Track →
`/guide`, Back) opens that section and scrolls its header (`#section-<key>`) into view; a load doesn't scroll.
**Description** (`DescriptionSection`): the write-up, with a "Jump to" row (`rehypeJumpTo`, after `rehype-sanitize`: ids
`user-content-<slug>` on the highest heading level used twice); while editing, the markdown editor. **Guide**
(`GuideSection`, "How to get this build"): the route shown at once as numbered stops (T35, `GuideRoute`: area
label, place, what to do with a boss's reason, every item's icon, the build's lit and others dimmed, and why a key
item is needed; tracking adds "N of M stops done", folds the finished stops and boxes the next one). **Discussion**
(T63, `DiscussionSection`): like a post and its replies: the author's write-up (if any) at the top as its own
"Description" panel, then the comments (`CommentsSection`, the thread at a readable 72ch); the tab's count is the
comments only. On phones one body, a "Comments" label between the two.
The **picker** is a tall
`Dialog` (`ItemSelector`): search, weapon type / spell kind / base game–DLC filters (`picker.ts`), the current item
marked (`aria-current`), "Show more" paging; picking a weapon with Ashes of War moves to its Ash of War and
affinity step, where a filled weapon slot also opens. Dialogs and panels use `components/ui/FocusScope` (focus
in, Escape, focus back to the opener). Item icons are decorative (`alt=""`): the name is shown next to them or is
the tile button's accessible name.
Code splitting: `/build/*` and `/user/*` are lazy routes; the markdown editor (`sections/Markdown.tsx`, the
largest dependency) loads only when a description is shown or edited; the guide's route and its ~400 KB
acquisition data (`guide/GuideRoute`) only when the Guide tab opens (fetched early on hover/focus of its tab
link).

## Performance (T21)

Measure with `npm run perf -- <url or /route>` (`scripts/perf.mjs`): a headed Chrome at 1440×900@2x (Retina),
load numbers (LCP, CLS, TBT, when the network settled, bytes by type), then a fast scroll down and back with
frame times and a performance trace (main-thread rendering steps, GPU-process time, dropped frames).
`--off grain,bg,dropshadow,shadows` switches one suspect off with injected CSS, to attribute cost before changing
code; `--cpu 4` throttles, `--mobile`, `--warm` (HTTP cache primed), `--list` (largest requests). It also prints an
**App Check** table (T23): when `enterprise.js` starts, the token exchange (start, end, HTTP status, token TTL;
-1 = no exchange) and when Firestore's first request starts. `--head '<markup>'` inserts markup into the page's
`<head>` (CDP Fetch; the HTTP cache stays on), to measure an `index.html` change against production before
deploying it. Results and the
last trace (DevTools → Performance → Load profile) go to `.perf/`. It's fine against soulsbuilds.com (page loads
only) and `npm run preview`; on the dev server the numbers are a dev build's.

What's expensive here, and why (2026-11 measurements, Mac + Chrome):

- **Scrolling is GPU-bound, not JavaScript-bound.** Repainting large areas at devicePixelRatio 2 is the cost;
  the main thread does little. Watch `gpuMs` and `droppedPct`.
- **Never `background-attachment: fixed`** (or anything that repaints the whole page per scroll frame). On
  `body` it dropped ~40% of frames on the landing. The top light and vignette are a `position: fixed` layer
  behind the content (`body::before`, z-index -1) instead.
- **The film grain** stays on top of everything (`body::after`; panels are opaque) as its own compositor layer
  (`will-change: transform`): rasterized once, then only composited. Measured cost: negligible.
- **Item-icon drop-shadows and the inset frame shadows** cost little once the page isn't repainting
  (< 1% frames); they stay. Re-measure with `--off` if a page gets many more of them.
- **No list virtualization or `content-visibility`** needed: 100+ landing rows scroll at ~118 fps.
- **Layout shift**: `<main>` is at least a screen tall, so the footer starts below the fold and doesn't jump
  away when content arrives (it was ~all of the CLS).
- **Time to content is App Check's token** (T23, from the SDK source): every Firestore request waits for
  `appCheck.getToken()`. A valid token cached in IndexedDB is used at once (a returning visitor: first Firestore
  request at ~0.33 s, no exchange). Without one, the reCAPTCHA chain runs first: `enterprise.js` → `recaptcha__en.js`
  → anchor iframe → ~0.3 s of reCAPTCHA work → exchange (~0.2 s), so the first request starts at ~1.2 s on a
  cold visit. `index.html` preloads `enterprise.js` (~80 ms sooner) and preconnects to the rest; the token TTL
  (1 day, console) decides how often a returning visitor pays the cold path. The rest is reCAPTCHA's own work.
- **Automated Chrome fails App Check**: reCAPTCHA often scores a fresh Playwright Chrome as a bot and the
  exchange returns 403, so no token is cached and `npm run perf -- … --warm` exchanges again (the script says so).
  Cold timings still hold. Measure a returning visitor in a normal browser (DevTools, or the built-in browser
  pane with `performance.getEntriesByType('resource')`). Once App Check is enforced, automated runs against
  production may not get data at all.
- **Caching**: hashed `/assets/*` files are immutable for a year, `/assets/icons/**` a week (names aren't
  hashed), everything else (HTML routes, favicon, manifest) `no-cache`, so a deploy shows up at once and an old
  `index.html` never asks for deleted chunks (`firebase.json` "headers"; `docs/firebase.md`).

## Usage counts (T38)

GoatCounter (`abhpro.goatcounter.com`, free, cookie-free, no personal data) counts page views and four named
events so we can tell whether the route, tracking, sharing and (later) copies get used. `src/lib/usage.ts` loads its
script **only on soulsbuilds.com** (never in dev, tests, emulators or PR previews) and sends counts itself
(`no_onload`): `usePageViews` (one count per route change, path only, never the query or hash: filters and email
codes live there) and `countEvent`: `tracking-started`, `item-collected`, `build-completed` (in
`useBuildTracking`'s `persist`), `route-opened` (`GuideRoute` mounting), and the Share menu's `share-link`, `share-reddit`, `share-image`, `share-native` (T54, `ShareButton`). Add a name to `UsageEvent` for a new
one (`copy-made` when T32 ships). Counts made before the script has loaded are queued. To keep your own visits
out, run `localStorage.skipgc = 't'` in the browser console on the live site. Ad blockers hide some visitors,
so counts run low. No consent banner is needed; the privacy page says what's counted.

## Link previews and crawlers (T37, T50)

A pasted build link shows a card because `functions/` (one HTTPS function `site`, Node 24, `us-central1`) answers two
Hosting rewrites (`firebase.json`): `/build/**` → the app's own `index.html` fetched from Hosting, with the title,
description, `og:*` tags and a canonical link replaced (`injectMeta`, `shareMeta` in `src/lib/share.ts`); and
`/og/build/<id>.png` → a 1200×630 PNG (`functions/src/card.ts`: Satori draws the element tree as SVG, resvg makes
the PNG, sharp turns the item's WebP icon into a PNG first; EB Garamond and Cinzel come from `@fontsource`; the
colors are the game's skin). Routing and fallbacks live in `functions/src/handler.ts` with injected dependencies
(tested in `handler.test.ts`); `index.ts` wires the Admin SDK (reads `builds/{id}` and `users/{uid}`, never writes)
and the host allow-list for fetching static files. `scripts/build-functions.mjs` bundles `functions/src` together
with the shared `src/` code (game data, `buildImage`) into `functions/lib/index.js` (rolldown) and copies the
fonts; `firebase.json` runs it as the predeploy step. Pages are cached 5 minutes at the CDN, images an hour; the
function never fails a page (any error serves the plain `index.html`). The app itself is unchanged: it still
renders in the browser. Production setup, cost and checks: `docs/firebase.md` "Link previews and crawlers".

**Crawlers (T50).** The same function makes the site readable without JavaScript. A found build's page also
carries the build as plain HTML inside `#root` (`functions/src/page.ts`): it loads the build into a fresh editor
store (`makeStore` + `loadBuild`) and reads the same selectors the page uses (`gearGroups`, the attributes and
talisman bonuses; the write-up only when there is one), so it says what the app shows; the write-up goes
through the app's markdown pipeline as HTML (`functions/src/markdown.ts`: GFM, raw HTML dropped, rehype-sanitize,
links `rel="nofollow ugc"`). A `<style>` in that block paints it in the site's colors, since visitors see it until
the bundle runs; `createRoot` replaces it on the first render (not hydration: it's the same content, not
cloaking). A build that doesn't exist is a **404** with `noindex` (`/build/new`, the editor's create page, is
not); read failures stay 200 with the plain page. `/sitemap.xml` lists `/` and every build at its slugged URL with its `updatedAt`
(one field-masked query: `name`, `updatedAt`). The head also carries JSON-LD (T56, `functions/src/jsonld.ts`): a `CreativeWork`
(author, dates, `about` the game, likes and comments as `interactionStatistic`) and a `BreadcrumbList`; the canonical and
`og:url` are the slugged URL whichever tab or slug was asked for. **Hub pages (T55):** `/weapons/<slug>` and
`/tags/<slug>` get the same treatment (title, description, canonical, the site image; `functions/src/hub.ts`,
and `weaponHub.ts` for a weapon's facts and route, its own chunk so only weapon pages load the ~400 KB acquisition
data); an unknown slug is a 404 with `noindex`, under 3 builds `noindex`. The sitemap adds every hub with 3+
builds (counted from the same field-masked read, now `name`, `updatedAt`, `tags`, `equipment.weapons`; `lastmod`
= its newest build). `scripts/build-functions.mjs` now writes `functions/lib/` as a directory: the card
renderer (satori, resvg, sharp) is its own chunk, loaded on the first image request, so pages and the sitemap
start faster; the bundle is minified (~0.9 MB, mostly game data). Pages only ever import framework-free editor
code (the store, selectors, `gear.ts`); keep it that way, or React ends up in the function.
