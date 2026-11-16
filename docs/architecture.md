# Architecture

Read this before changing routes, the editor, state or Firestore access. It describes the app **as it is now**
(data model v2 from T3, TanStack Query and one `AuthProvider` from T4).

## Pages and routes

`src/app/routes.tsx` defines the routes:

| Route                   | Component         | What it does                                                                                                                         |
| ----------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `/`                     | `Landing`         | Builds a page at a time (most liked or newest, "Load more"); tag + level filters; filters live in the URL                            |
| `/build/:buildId/:tab?` | `BuildEditorPage` | View, create (`/build/new`), edit, cancel and delete a build, plus likes and comments; tabs `description`, `route`, `comments` (T28) |
| `/user/:userId`         | `Profile`         | Display name (the owner can rename), tabs for the user's builds and the builds they liked                                            |
| `*`                     | `NotFound`        | 404 page                                                                                                                             |

Every page has loading, error (with "Try again"), empty and not-found states (`PageMessage`, `ErrorMessage`).
Log in and Sign up are not routes: a modal `Dialog` in `src/app/App.tsx`, opened from `Header`. The item picker
(`ItemSelector`) is a modal that opens whenever Redux `app.slotType` is set.

**Games.** Souls Builds will cover more FromSoftware games; Elden Ring is the only one today. `src/app/game.ts`
holds the registry (`GAMES`) and `useCurrentGame()`, the one seam that later reads the game from the route.
Function and UX are the same for every game; only the skin (accent colors) changes, from `src/theme/skins.ts`.

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
  read, `queryKeys.tracksAnyBuild`) says no build is tracked yet; otherwise it starts at once. Signed out, the
  intro opens sign-up or log-in through `useOpenAuthDialog(kind, onSignedIn)` (`src/app/authDialog.ts`): App
  calls `onSignedIn(uid)` after a successful sign-in, and `startAfterSignIn(uid)` starts tracking on that account
  unless it already tracks the build (the uid comes from the auth result, since `useAuth` may lag a render).
  The route follows progress (T35): `guide/progress.ts` maps a route item to its tracking keys (`isCollected`)
  and decides which numbered stops are done (`stopProgress`: a stop with the build's tracked items when all are collected, any
  other stop once a later tracked one is); How to get folds done stops and marks the next, and the Loadout tab
  shows a Next stop card (`guide/NextStop`).
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
  startingClass: int|null         T8: CharaInitParam ID 3000–3009 (character.json), required on create; absent
                                  on older builds (read as null). Class minimums are checked by the app only
  equipment: {                    game IDs (param row IDs; each field implies its file in src/data/er/)
    weapons: (id|null)[6]                       positional: 1–3 main hand, 4–6 off hand
    weaponSkills: (id|null)[6]                  the Ash of War applied; null = the weapon's built-in skill
    weaponAffinities: (key|null)[6]             'cold', 'flame-art', …; null = Standard
    arrows: (id|null)[4]                        positional
    talismans ≤4, spells ≤12 (T8), tears ≤2, consumables ≤10: id[]   compacted
    helm, chest, gauntlet, leg, greatRune, spiritAsh: id|null
  }
  likeCount, commentCount: int    0 on create; only change by ±1 with a like/comment (see below)
  lastCommentId: string           set by the comment counter (rules plumbing, unused by the UI)
  createdAt, updatedAt: timestamp server time; owner edits must bump updatedAt

builds/{id}/likes/{uid}           one like per user (doc id = liker's uid)
  userId: uid, createdAt: timestamp
builds/{id}/comments/{autoId}
  authorId: uid, text: string (trimmed, 1–1000), createdAt: timestamp

reports/{targetId}_{uid}          one report per user per build/comment (T10); clients create, and delete
                                  their own (account deletion, T18)
  reporterId: uid, buildId, commentId: string|null (null = the build itself)
  reason: 'spam'|'offensive'|'harassment'|'other', note: string (trimmed, ≤ 500, may be '')
  status: 'open' (client) → 'removed'|'dismissed' + resolvedAt (scripts/admin.mjs), createdAt: timestamp

stats/{game}                      community numbers per game (T20; doc id = GameId, e.g. stats/elden-ring);
                                  public read, no client writes; written daily by `admin.mjs stats` in CI
  buildCount, authorCount (distinct build owners), userCount (all accounts): int
  tagCounts: { [tag]: int }       builds per tag (top tags on the landing)
  updatedAt: timestamp
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
  (a reporter may read and list their own). Moderation runs from `scripts/admin.mjs` (`docs/firebase.md`).
- **Account deletion (T18)**, client-side (`src/lib/firebase/account.ts`, the profile's "Delete account"):
  re-authenticate with the password, then **find everything first** (own builds; likes and comments on other
  builds by collection-group queries; reports by `reporterId`), so a failing query deletes nothing; then delete
  own builds (`deleteBuild`, which takes every like and comment on them), each like/comment elsewhere in its
  own batch with the counter (plain delete if that build is gone), the reports, the tracking docs (T34),
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
  means complete. The doc id is the build id, so T36's `playingCount`/`finishedCount` can check it with
  `existsAfter` like likes. Account deletion and `admin.mjs delete-user` delete the user's tracking docs.
- **Queries and indexes** (`firestore.indexes.json`): builds by `game` + `likeCount desc` / `createdAt desc`
  (optionally `tags array-contains`), by `game` + `nameLower` (prefix search: `>= q`, `<= q + '\uf8ff'`; optionally
  with a tag), each optionally with a `level` range (`>=`/`<=` next to an `orderBy` on another field, which Firestore's
  multi-field range support allows; the index lists equality fields, the order field, then `level`), by
  `ownerId` + `createdAt desc`; likes collection group by `userId` + `createdAt desc` ("Liked" tab).
  Account deletion's equality-only collection-group queries (likes by `userId`, comments by `authorId`) use
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

**Build page** (T17, reshaped in T22, T27 and T28, `features/editor/`): view and edit share one layout. The
**hero** (`BuildHeader`, the hero frame: the main weapon (`lib/equipment.ts` `mainWeaponId`) as a 112px tile with
the skin's tint glow, name as `<h1>`, author, level and age, tags, then Like/Report/owner actions on the right; on
tablets and phones a 76px tile and the actions in a row under the tags; in edit mode `BuildDetailsForm` takes its
place), then a **tab bar** (`sections/BuildTabs`: `NavLink`s, sticky at the window's top, sideways-scrolling on
phones; Comments shows the stored count), then the tab. Tabs are URLs (`/build/:buildId/:tab?`, `tabs.ts`):
`/build/x` Loadout, `/description`, `/route`, `/comments`; an unknown tab, or one the build doesn't show (no
write-up: no Description tab, for the owner too; editing and `/build/new`: Loadout and Description only), redirects
to Loadout. Switching tabs keeps the editor (and an edit in progress) and the scroll position
(`useScrollToTop` compares `pageKey`s; the bar scrolls itself back to the top when it was stuck). Desktop: the
stats sit in a fixed 340px left column on every tab: on **Loadout** one panel with the gear (`LoadoutPanel` =
`StatsCard` | `Loadout`), then "Read the description" and "See the route" cards (`TabLinkCard`; the first
paragraph via `lib/markdown.ts`) and "More by"; on the other tabs `BuildSummary`, a sticky condensed column (level,
attributes, HP/FP/stamina, the gear as icon buttons that name themselves on hover, focus or tap; not sticky on
short windows). Tablets and phones: one column, the stats card then the loadout on the Loadout tab only.
**Description**: the write-up, with a "Jump to" row (`rehypeJumpTo`, after `rehype-sanitize`: ids
`user-content-<slug>` on the highest heading level used twice). **How to get** (`GuideSection`): the route shown
at once as numbered stops (T35, `GuideRoute`: area label, place, what to do with a boss's reason, every item's
icon, the build's lit and others dimmed, and why a key item is needed; tracking adds "N of M stops done", folds
the finished stops and boxes the next one). **Comments**: the thread at a readable 72ch. `sections/Loadout` (T27) is a fixed layout: every slot always shows, so it takes the same space on
every build: left hand | right hand (3 weapons each, 64px tiles; stacked on phones, left hand first), then armor,
talismans, and the flask's tears with the great rune and spirit ash in three columns (44px), arrows and bolts and
consumables only when the build has some (always while editing), then spells as one cell per memory slot (a
2-slot spell spans two; free slots are placeholders). Every slot is an `ItemRow`: `ItemTile` + name + a muted
detail line (affinity and skill, memory slots) + any warning (T8); an empty read-only slot is a faint placeholder
tile (`ItemTile placeholder`, "No helm" for screen readers). In edit mode each row is a button that opens the
picker ("Choose talisman", "Change Uchigatana (Blood affinity, Seppuku skill)"), and spells and consumables
(saved without positions) show the filled slots plus one "Choose". `sections/StatsCard` (T27): rune level,
starting class, the 8 attributes as rows (a 4×2 grid with short names on tablets and phones; inputs in the same
place when editing), HP/FP/stamina, the equip load bar marked at 30% and 70% with the roll, poise.
The **picker** is a tall
`Dialog` (`ItemSelector`): search, weapon type / spell kind / base game–DLC filters (`picker.ts`), the current item
marked (`aria-current`), "Show more" paging; picking a weapon with Ashes of War moves to its Ash of War and
affinity step, where a filled weapon slot also opens. Dialogs and panels use `components/ui/FocusScope` (focus
in, Escape, focus back to the opener). Item icons are decorative (`alt=""`): the name is shown next to them or is
the tile button's accessible name.
Code splitting: `/build/*` and `/user/*` are lazy routes; the markdown editor (`sections/Markdown.tsx`, the
largest dependency) loads only when a description is shown or edited; the guide's route and its ~400 KB
acquisition data (`guide/GuideRoute`) only when the How to get tab opens (fetched early on hover/focus of the
Loadout tab's "See the route" card), or on the Loadout tab while tracking, for the Next stop card
(`guide/NextStop`, a 1 KB chunk that pulls in the route chunk: ~52 KB gzipped).

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
