# Tickets archive

The oldest **Done** lines from `TICKETS.md`, moved here to keep it lean. Newest last.

- T1 — Foundation — 2026-11-14 — leaked service-account key removed; CRA → Vite 8, React 19, RTK 2,
  styled-components 6, Firebase 12; TS/ESLint 9/Prettier/Vitest; emulators + seed + screenshot + doctor; CI;
  AGENTS.md, CLAUDE.md, skills, docs and this backlog.
- T2 — Strict TypeScript + feature folders — 2026-11-14 — all of `src/` strict TS in `app/`, `features/`,
  `components/ui/`, `lib/`, `theme/`, typed `data/` accessors, `@/` alias; BuildEditor split into page,
  sections and hooks (`loadBuild`/`selectBuildFields`); transient `$props`; lodash/prop-types gone; hex-color
  lint rule; React Compiler on. Spacing tokens moved to T11; screenshots pixel-identical before/after.
- T3 — Firestore model v2, rules, rules tests — 2026-11-14 — v2 model (likes/comments subcollections, batched
  counters checked by the rules, admin claim, no emails in Firestore), tested rules + indexes, data-layer and
  migration tests on their own emulator (`npm run test:rules`, CI), `scripts/migrate-v1-to-v2.mjs`, v2 seed.
  Production question (migrate or start fresh) moved to T12.
- T4 — TanStack Query, one AuthProvider, page states, e2e — 2026-11-14 — query hooks per feature with
  optimistic likes/comment deletes, `AuthProvider`/`useAuth`, loading/error/empty/not-found everywhere, no load
  race or page reloads, SDK imports lint-restricted to `src/lib/firebase/`, Playwright e2e (`npm run e2e`, CI).
- T5 — 2022 UI bug batch — 2026-11-14 — filters combine, cards keyed by id with armor slot types, timers, CSS,
  placeholders, clearable affinity, picker cleanup, like unlock, signup validation, real forms, stats 1–99.
- T6 — Missing core features — 2026-11-15 — delete/cancel/change item in place, password reset, profile rename
  and tabs, 404s, send-only email verification (notice + resend), consumables restored; e2e covers them.
- T12 — Deploy pipeline and relaunch — 2026-11-15 — production relaunched on soulsbuilds.com: backup, v2 rules +
  indexes, 52 builds / 102 users migrated, smoke test passed; CI preview channels + approved production deploys via
  Workload Identity; Analytics dropped, privacy and terms pages, default domains redirect, `admin.mjs export`,
  Auth domains + enumeration protection, owner is admin. App Check enforcement left to the owner.
- T11 — Performance and polish — 2026-11-15 — lazy routes and editor chunk, a11y/contrast/focus pass, meta and OG tags,
  self-hosted EB Garamond + Cinzel, generated icons and og:image, `core.ts` + `cards.json` data split (full data lazy),
  paged picker, light markdown view, spacing scale.
- T13 — Builds reference items by ID — 2026-11-15 — app on `src/data/er/` (accessors by ID, `rules.ts` for Ash
  of War/affinity/talisman rules), builds store game IDs + great rune and spirit ash slots, picker follows the
  game's rules, rules type-check within Firestore's expression budget, names→IDs folded into the v1→v2
  migration, "Great Hammer" tag, footer; 2022 data and icons deleted.
- T7 — Game data v2 + Shadow of the Erdtree — 2026-11-15 — owner's Smithbox export of the game files →
  `npm run data` (TypeScript pipeline, zod schemas, fixture + data tests, deterministic) → `src/data/er/` (base +
  DLC, game param IDs, real affinities and Ash of War rules) and 2,151 WebP icons; 2022 name → ID table; the
  app switch split into T13.
- T10 — Moderation — 2026-11-15 — reports on builds and comments (`reports/{targetId}_{uid}`, rules + tests,
  "Report" buttons), `scripts/admin.mjs` (reports, remove with JSON backup, dismiss, grant/revoke admin; tested
  on the emulators), App Check code (off until the owner's key: moved to T12). Delete, not hide
  (`docs/decisions.md`); no admin UI (backlog).
- T16 — Redesign: design system, shell, browse pages — 2026-11-15 — ~50/50 modern and in-world (approved HTML
  mockup v2): base tokens + per-game skin (CSS vars, `skins.ts`, AA contrast test), Inter/Cinzel/Garamond, in-world
  components (Frame, Ornament, PageHero, ItemTile, selection bar), Dialog auth, game tabs removed, landing as dense
  rows with authors, profile/legal/404 restyled; 2022 tokens kept in `legacy.ts` for T17.
- T17 — Redesign: build page, editor and item picker — 2026-11-15 — view and edit in one mockup layout (title
  block, framed panels, `ItemRow` tiles, stat bars, prose write-up), picker on a tall `Dialog` with filters and a
  weapon step for Ash of War/affinity, comments/report/like restyled; `legacy.ts`, `Slot` and 2022 icons deleted.
- T19 — Acquisition facts — 2026-11-15 — every pickable item placed (Ragged set → `NO_SOURCE`): ~100 enemy farm
  spots, base-game NPC/quest/painting rewards, DLC bosses and quests, Husks/Moore/Enia shop ranges, reversions;
  pipeline reads weapons that come with an Ash of War and enemy lots by ID. Owner shown a 30-item sample.
- T14 — Acquisition data — 2026-11-15 — `npm run data` writes `acquisition.json`: sources per item (lots placed by ID →
  nearest grace, event hints, shops by range, recipes by cookbook flag, classes), 54 regions in route order, 419
  graces, 27 gates, key items, validation with explicit allow-lists; ~670 items' facts pending (T19).
- T15 — "How to get this build" — 2026-11-15 — pure route solver (`features/editor/guide/route.ts`: earliest
  reachable source, item prerequisites, implied and any-of gates, topological order, steps by grace, legs by
  region) + lazy `GuideSection` on the build view (numbered, collapsible regions, item icons); unit, component
  and e2e tests. Upgrade materials, rune farming and a starting-class suggestion are in the Backlog.
- T8 — Build math — 2026-11-15 — `character.json` (classes + CalcCorrectGraph curves) and talisman `modifiers`
  from the export; pure `buildMath` (vitals, equip load/roll, poise, requirements incl. two-handing, memory
  slots) tested against Fextralife; `startingClass` saved (rules + tests), spells ≤ 12; Character panel,
  class picker with minimums, requirement and memory-slot warnings.
- T9 — Browse and discovery — 2026-11-15 — level range and search + tag now Firestore queries (multi-field range
  next to the sort `orderBy`; 7 new composite indexes ending in `level`, plus `tags`+`game`+`nameLower`); data-layer
  test. Indexes are untested against production (the emulator ignores them): check the first level/search
  queries after the next deploy.
- T21 — Performance — 2026-11-15 — `npm run perf` (headed Chrome + CDP: load vitals, scroll frames, GPU time,
  `--off` attribution); `background-attachment: fixed` → fixed layer behind content (landing 72 → 118 fps, 40% →
  2% dropped), grain on its own layer, `<main>` ≥ 1 screen (CLS 0.17 → 0), hosting cache headers, preconnects.
  Prod "after" numbers not yet measured (needs the deploy); App Check wait → T23.
- T18 — Account deletion and admin rename — 2026-11-15 — profile "Delete account" (password re-auth; finds
  everything, then deletes builds, likes/comments elsewhere with counters, reports, profile, Auth user;
  re-runnable), rules for own profile/report delete + comments collection-group read, `admin.mjs rename` and
  `delete-user` (backup first), privacy page updated; e2e `account.spec.ts`.
- T22 — Layout: lean landing, compact build page — 2026-11-16 — HTML mockup, owner picked "title first";
  landing: no hero, small `<h1>` in the Find builds frame, fixed-height rows with tags on one line + "+N"
  (`tags.ts` `fitCount`); build page: title pane, equipment across the page (weapons as rows, other slots as
  `ItemSlot` icon tiles with a `Tooltip` name on hover/focus/tap), write-up beside the numbers, guide collapsed
  with `GuideRoute` + acquisition data loaded on expand, comments across the page at 72ch.
- T20 — Community feel — 2026-11-16 — HTML mockup, owner picked layout A with counts; public `stats/elden-ring`
  (builds, distinct authors, accounts, builds per tag) from `admin.mjs stats`, daily in `stats.yml` as its own
  `github-stats` SA; top tags as the Tags row's first chips (scrolling row on phones),
  "N builds by M players", rows with comments + age, build page comment link, warmer empty state, "More by",
  profile build/like counts; scroll to top on navigation. SA set up and first run done by the owner (same day).
- T23 — Content sooner: the App Check wait — 2026-11-16 — cause confirmed in the SDK (Firestore awaits the App
  Check token; a cached IndexedDB token skips reCAPTCHA; T21's "warm" wait was perf's 403'd bot exchange);
  `enterprise.js` preloaded (cold first Firestore request ~1.29 → ~1.21 s, via `--head` before deploy; warm real
  visit ~0.33 s); perf App Check table + `--head`; owner sets a 1-day TTL. Blocked reCAPTCHA = blank page → T24.
- T24 — No blank page when reCAPTCHA is blocked — 2026-11-16 — owner: error only, one notice in the shell;
  `appCheckStatus.ts` (blocked = no token 2 s after a reCAPTCHA load error, or 10 s) + `AppCheckNotice`;
  checked on a local build served at soulsbuilds.com: notice at ~2.4 s, normal first Firestore request ~1.2 s.
- T25 — Firebase JS SDK 13 — 2026-11-16 — `firebase` 13.3.0 + `@firebase/rules-unit-testing` 6.0.0, no code changes
  (13.0's breaks are AI-only); check, rules (103) and e2e pass; preload URL still matches, blocked notice at ~2.4 s.
- T26 — Redesign v2 foundations — 2026-11-16 — EB Garamond 600 names/headings, `Label`/`labelText` the only caps,
  Inter values (14px, tabular); accent budget (neutral panels, tags, icons); `Frame` plain + `$hero` (corner marks,
  skin `tint`) on the build title pane; 1240px, `SPACE_PANEL/GROUP/REGION`; header with phone "+" and menu;
  write-up headings. Not seen on screen: write-up h1–h4 (no seeded write-up has headings).
- T27 — Loadout panel and stats card — 2026-11-16 — `sections/Loadout` (every slot always shown, items by name:
  left | right hand 64px, armor/talismans/flask + great rune and spirit ash 44px, spells one cell per memory slot;
  arrows/consumables only when used, owner) and `sections/StatsCard` (attributes, vitals, load bar with 30/70% marks;
  phones 4×2); stats first below 900px; hands stacked on phones; `ItemSlot` gone (`Tooltip` now unused).
- T28 — Build page tabs — 2026-11-16 — hero (main weapon, `lib/equipment.ts`) + tabs at `/build/:id/:tab?`
  (`tabs.ts`, sticky `BuildTabs`); owner, mid-session: stats in a left column on every desktop tab (one panel with
  the gear on Loadout, `BuildSummary` elsewhere), no Description tab without a write-up; Jump to (`rehypeJumpTo`);
  route as numbered areas; editor pinned dark (`index.html`); `BELOW_WIDE`, `screenshot --width`.
- T29 — Landing: slim toolbar, rows with a portrait — 2026-11-16 — no framed card: h1 + "N builds by M players" on
  a line, then search | sort | level, then a sideways-scrolling top-tags row ("More tags" after it, outside the
  scroller so its popover isn't clipped); 88px rows by named grid areas (portrait = `mainWeaponId`, strip
  left hand first, empty cells faint, "Level" label); tablet 140px, phones auto height (60px portrait, name on two
  lines). The phone Filters button is gone (sort and level always show).
- T34 — Track a build — 2026-11-16 — owner: local storage signed out (merged into the account on sign-in, not
  anonymous auth), gear + spells counted (not arrows/consumables), no class = 10 per stat, Share = the link;
  `users/{uid}/tracking/{buildId}` (owner-only rules), pure `lib/tracking.ts` (item keys, progress, changes,
  merge), `features/tracking/` (debounced saves, local storage, hero progress / Build complete, Keep my progress,
  new-items notice, stats with − +); Loadout toggles with "3/4"; account deletion + `admin.mjs delete-user`;
  `screenshot --storage`. Kept the full data out of the shell (`LOCAL_OWNER` in `localTracking.ts`).
- T39 — Loadout without empty rows — 2026-11-16 — read-only: a weapon row with both hands empty is hidden (one-handed
  rows keep the other hand's placeholder), Spells hidden without spells and never shows free-slot placeholders; edit
  mode unchanged. Not seen on screen: mobile Loadout, the Spells section; with no weapons the Armor row's top rule sits
  right under the heading.
- T35 — The route during a run — 2026-11-16 — owner: flat numbered stops (mockup), reasons hand-written on gates
  (`progression.ts` `reason`, pipeline fails without) and worded from the route's links for prerequisite key
  items (`route.ts` `usedFor`/`gate`, `phrases.ts` `itemReason`), region-only stops named by who/what; key items
  with icons (+80 webp); `guide/progress.ts` (done/next), "N of M stops done" + folding, `NextStop` card on Loadout.
  Mid-session: tracking becomes account-only → T41.
- T41 — Tracking needs an account — 2026-11-16 — owner: drop existing local progress (no merge), text + icons
  modal; `TrackingIntro` (signed out: Create account / Log in, continues into tracking via
  `useOpenAuthDialog(kind, onSignedIn)` + `startAfterSignIn(uid)`; signed in with no tracked build, from
  `tracksAnyBuild` (`limit(1)`): Start tracking / Not now); local storage, sync, Keep my progress and
  `mergeTracking` gone; `screenshot --storage` → `--click`; e2e `helpers.ts` `completeSignUp`.
- T36 — Playing and Completed — 2026-11-16 — owner: both profile tabs private, "Most played" sort, stopping a
  finished build removes it from Completed; build counters `playerCount`/`finishedCount` (±1 in the tracking
  doc's batch, rules check both sides; `saveQueue` tracks the stored status), hero "N playing · M finished",
  profile Playing cards (progress + next stop, lazy) and Completed trophies, `admin.mjs counts` backfill, e2e
  `playing.spec.ts`
- T40 — Choose the build's main image — 2026-11-16 — owner: picker in edit mode's title block ("Change image" →
  `BuildImageDialog`, radio rows), gear only (no arrows/consumables); `image: { kind, id } | null` (rules check the
  shape, optional on create), `buildImage` / `imageChoices` in `lib/equipment.ts` (read-time fallback to the main
  weapon; the editor saves a gone pick as null), `getCardItem` + 5 new card kinds (cards.json +7 KB gzipped);
  hero, landing rows, profile panels; e2e `build-image.spec.ts`. Rules budget nearly exhausted → T42.
- T30 — Sign up and log in — 2026-11-16 — owner: Google + email, display name in its own step, 8 characters,
  action page later (T43), no canvas mock. `features/auth/AuthDialog` (views Login, SignUp, ForgotPassword,
  ChooseName; any signed-in account without `users/{uid}` gets the name step, closing it logs out), GoogleButton
  (popup; emulator fakes it), `PasswordInput`, FormField + `useFieldErrors` (errors by field, focus the first);
  `signUp` no longer writes the profile; reset answers the same for unknown emails (was a leak); Google-only
  deletion re-auths with a popup; production `authDomain` → soulsbuilds.com. Console steps: docs/firebase.md
  "Sign-in setup" (owner, before the deploy). Dialog focus starts on "Continue with Google".
- T31 — Profile and account settings — 2026-11-16 — owner: no canvas mock, name menu in the header, Google-only
  accounts set a password (no email change), framed profile hero. `/account` (`features/account/`: display name,
  email + verify notice + change by link, sign-in methods + change/set password, Log out, DeleteAccount moved
  here); `reauthenticate` in `lib/firebase/auth.ts` before every change (set password = `updatePassword`:
  `linkWithCredential` fails for the account's own email); `useAuth()` snapshots email/verified/providers +
  `refreshUser()`; `app/AccountMenu`; e2e `settings.spec.ts` + `helpers.ts` `accountMenu`/`headerLogIn`.
- T44 — Check off route stops that aren't gear — 2026-11-16 — owner: one "Mark done" per stop (How to get and
  the Next stop card), not in the percentage, and no inference (a later stop done says nothing about earlier
  ones, gear or marks). `guide/progress.ts` `stopMarkKeys` (a stop's gate and item keys, not its number) +
  `stopProgress(…, marked)`; `RouteAction.gate`; `applyChange` `mark` (pruned to the route); optional
  `marked` on the tracking doc (`validTracking`: list ≤ 64); e2e `guide.spec.ts`; decision "Route stops done".
- T42 — Free up rules budget on builds — 2026-11-16 — headroom 0 → 93 paddings (create), 17 → 99 (edit); a
  level-1 build with every slot filled couldn't be saved before. Builds rules rewritten for fewer evaluated
  expressions (stats in one regex, one level sum, key sets by size, args over `incoming()`/`let`, no redundant
  `is` checks); owner: Ash of War and arrow slots by length only (decision "Items in builds"). Guard
  `tests/rules/budget.test.ts` (`HEADROOM` 90; `RULES_BUDGET=measure`); cost model in docs/firebase.md "Rules
  budget".
- T46 — Tracking lives in the Guide — 2026-11-16 — tracking only on How to get: `TrackingBar` (progress,
  Your stats, Stop; Build complete), the new-items notice, a checkbox on each build item in the route
  (`itemTrackKeys`; `toggle` takes an item's keys); hero's Track → the tab, "Tracking" link while tracking;
  profile cards → `/route`. Gone: `TrackingHero`, `NextStop`, Loadout/StatsCard/ItemRow tracking, ItemTile's
  `collected` badge, the route's second bar.
- T47 — Auto-generated description — 2026-11-16 — Description tab always shown: the write-up, or `describe.ts`
  `describeBuild(selectDescriptionFacts)` made at view time (weapons, top attributes, load, poise, talismans,
  spells, "Worth knowing"), with an "automatically generated" note; `visibleTabs` lost `hasDescription`.
- T48 — Build page v3, desktop — 2026-11-16 — split (owner): desktop + shared now, phones → T49. Tabs
  Description (`/build/:id`) · Guide · Comments, old `/description` `/route` redirect (`isCanonical`); one
  `BuildSidebar` (StatsCard + gear tiles named on hover/focus/tap, warning dots; editable while editing,
  Description the only tab) from `gear.ts` `gearGroups(selectGearState)`; 72px title tile. Gone: Loadout tab,
  `LoadoutPanel`, `Loadout`, `TabLinkCard`, `MoreByAuthor`, `BuildSummary`, `BELOW_WIDE`, `SHORT_SCREEN`.
- T49 — Build page v3, phones — 2026-11-16 — below 900 px collapsible sections (`BuildSections`,
  `PhoneSection`) instead of the tab bar and sidebar, one layout per width in JS (`useMediaQuery`, jsdom stub
  `src/test/viewport.ts`); closed headers show glances (`glances.ts`: level + top attributes, gear icons, "None"
  for empty gear, Guide items, newest comment via `fetchLatestComment` `limit(1)`); URL's section open, taps
  replace the URL, outside navigation opens and scrolls; editing as rows; e2e `build-phone.spec.ts`.
- T45 — Item cards on hover — 2026-11-16 — `ItemCard` (in `Tooltip`, 264 px) on read-only sidebar tiles (hover,
  focus, tap; facts as `aria-describedby`; editing keeps the short tooltip) and the route's own items (mouse
  hover only, `gearByRef`); phone rows show `factsLines`. Pure `itemFacts.ts` per kind. Pipeline: weapon
  `scaling` per affinity (tuples, +0), spirit ash `fp`/`hp`; `scalingGrade` from MenuValueTableParam 100–105.
- T43 — Branded email action page — 2026-11-16 — `/auth/action` (`features/auth/action/`: ActionPage →
  ResetPassword, VerifyEmail): reset-password form, verify and email-change links applied once (query hooks, no
  refetch), expired or used links offer a new one; `auth.ts` `checkPasswordResetCode`, `confirmNewPassword`,
  `applyEmailLink`, `isDeadLink`; e2e from the emulator's oobCodes. Owner sets the action URL after the deploy.
- T38 — Cookie-free usage counts — 2026-11-17 — GoatCounter (`lib/usage.ts`, live site only): page views by path (`usePageViews`) and events `tracking-started`, `item-collected`, `build-completed`, `route-opened`; privacy page, decision "Analytics" and docs updated. `copy-made` waits for T32.
- T37 — Link previews — 2026-11-17 — a Cloud Function (`functions/`, Blaze) behind Hosting rewrites for `/build/**` and `/og/build/**`: per-build title, description and `og:*` tags, and a Satori/resvg card (picture item, name, level, author, weapons) in the game's skin; cached, falls back to the plain page. **Not live until the owner's first deploy** (`docs/firebase.md` "Link previews").
- T50 — Crawlable build pages — 2026-11-17 — the `site` function serves `/sitemap.xml` (home + every build,
  `updatedAt`), each build as plain HTML in `#root` (`functions/src/page.ts` via the editor store; write-up as
  sanitized markdown, `markdown.ts`), 404 + `noindex` for missing builds; `robots.txt`; lazy card chunk, minified
  bundle (~0.9 MB); `screenshot --no-js`. Sitemap left uncached at the CDN (header glob risk); `minInstances` waits
  for a post-deploy cold-start measure (owner to-dos).
- T51 — Head tags per page — 2026-11-17 — `PageHead` (`components/ui/`) edits the head's own title, description, canonical and `noindex` (effects, not hoisted tags, so the function's tags aren't doubled); home, build (`shareMeta`), profile (noindex with no builds), legal pages, 404, account, `/auth/action`. Formats in `lib/share.ts` (`buildTitle`, `homeMeta`, `pageTitle`) shared with the function; `index.html` has the keyword title and no static canonical.
- T56 — Build URLs with names, and structured data — 2026-11-17 — `/build/<id>/<name slug>[/<tab>]` (`lib/slug.ts`, `tabs.ts` `splitBuildPath`, `tabPath(id, tab, name)`): the ID alone decides, a missing or stale slug is replaced, old tab links still work; the function's `PAGE` takes any slug, canonical, `og:url` and sitemap are slugged (the sitemap reads `name`), JSON-LD `CreativeWork` + `BreadcrumbList` (`functions/src/jsonld.ts`). **Owner:** after the deploy, run a build page through Google's Rich Results Test.
- T63 — Equipment and Discussion tabs — 2026-11-17 — owner's request, no prior ticket. The build page's tabs are
  Equipment (default, `/build/<id>/<slug>`), Guide, Discussion (`/discussion`; old `/description` and `/comments`
  links redirect there). Equipment: `EquipmentSection` (game layout, each hand on its own, 104/80 px tiles, empty
  fixed slots faint, `gear.ts` `equipmentGroups`) beside a stats-only sidebar, both columns the same height
  (`StatsCard fill`); editing happens there, write-up editor under the panel. Guide and Discussion keep the
  sidebar's equipment tiles (`GearTiles.tsx`, shared). Discussion (`DiscussionSection`): the write-up on top, then
  the comments; the count is comments only. T47's generated description removed (app, phones, crawler page);
  `STAT_NAMES` moved to `lib/buildMath.ts`. Phones: Weapons open by default, sections end Guide, Discussion.
- T54 — Share menu — 2026-11-17 — `ShareButton` in the build's title section: Copy link (canonical), Copy for Reddit (`lib/shareText.ts` `redditText`, ends with the link), Download image (the T37 card), Share… where `navigator.share` exists; GoatCounter events `share-link|reddit|image|native`. Arrows and consumables aren't in the Reddit text (no card names). Download image and Share… weren't tried in a real browser (the card function isn't in the emulators).
- T52 + T53 — Seeded builds — 2026-11-17 — `scripts/seed-builds.mjs` (+ `lib/seed-content.mjs` checks,
  `lib/build-from-names.mjs` out of `seed.mjs`) writes `content/builds/er/<slug>.json` + `.md` as the Souls Builds
  account: credit line added, gaps named, idempotent, dry run by default. 22 builds from search research
  (`docs/product.md` "Seeding"). The Tarnished Pack's Idus Knight (3010) and Heavy Knight (3011) added to the data
  and rules. Production write is the owner's (owner to-dos); the editor's class picker wasn't screenshotted.
- T55 — Weapon and tag pages — 2026-11-17 — `/weapons/<slug>` (facts, where to find it via the Guide's solver,
  builds most liked first) and `/tags/<slug>` (`src/features/hubs/`, slugs and copy in `lib/hubs.ts`); builds by
  weapon through `equipment.weapons array-contains` (one index, no new field, no rules change); under 3 builds
  `noindex`; the function serves both as plain HTML (`hub.ts`, lazy `weaponHub.ts`) and the sitemap lists hubs with
  3+ builds. Links in: the build title section ("with Rivers of Blood…", tags → tag pages), the crawler HTML, the
  weapon type → its tag page, the landing's Popular weapons (`stats.weaponCounts`, no staffs or seals; card
  weapons now carry `type`). Owner's calls: weapons only, root URLs, no canvas mock. Deploy check: owner to-dos.
- T64 — Landing title for "build planner" searches — 2026-11-17 — landing title "Elden Ring Build Planner and Builds | Souls Builds" and a description naming stats, equip load and poise (`homeMeta`, `index.html`); judge the effect in Search Console after T50's deploy.
- T62 — Comments worth reading — 2026-11-17 — comments fill the column; a heart per comment (`commentLikes/{commentId}_{uid}` + the comment's `likeCount`, ±1 in one batch); Top/Newest (Top ranks without the viewer's own like); one reply level (`parentId` = a top-level comment, "@Name " on a reply to a reply; first 2 + "Show N more" past 3); a deleted comment's replies stay under "Comment deleted"; no migration (old comments read as null/0); "Author" badge; account deletion, `deleteBuild` and `admin.mjs remove`/`delete-user` handle comment likes (`lib/comments.ts`, `CommentItem`, `CommentForm`).
- T66 — Build page above the fold — 2026-11-17 — owner's request: no "All builds" (the header's Builds lit on build pages, `$section`); unframed top section: title block (88 px image; Report and Edit/Delete top right) then one sticky 64 px row, tabs left (accent as wide as the label) + `BuildActions` (Track, Like, Share) right; denser Equipment panel (no heading, 68 px tiles, `gear.ts` `equipmentLayout` pairs flask/arrows/spells/items up to 5 tiles) and stats card; a full build (`SEEDFULL0001`) fits 1440×820 and 1280×800 (`tests/e2e/fold.spec.ts`; `screenshot --height`). Also: a saved sign-in that can't renew is signed out and every query reloads (`onAuthChange`, `isDeadSession`; locally after `npm run dev` restarts the Auth emulator empty); comments' Top counts the viewer's own likes, held out of the rank until a sort is chosen (`threadComments` `held`). Remaining tickets moved to Backlog > Priority backlog.
- T67 — Readability pass — 2026-11-17 — owner's request (the site felt too wide, the serif hard to read): type scale one step up and in rem (`fonts.ts`: UI 15px, secondary 14, small 13, labels 12, `TEXT_BODY` 16, `TEXT_NAME` 22); write-ups in Inter 16px/1.7 (`MarkdownView`), EB Garamond only for names and headings ≥ 22px (400/italic/700 no longer loaded; Inter italic added); running text capped at `MEASURE` 35em ≈ 72 characters (write-ups, comments, taglines, legal); `CONTENT_WIDTH` 1240 → 1200 and the stats column 340 → 312 (the owner chose 1160, but the Equipment tab's five-spell row needs 372px columns for the T66 fold); attribute rows 24px and vitals gaps 10px so 1280×800 still fits (~10px to spare); form fields 16px (iOS focus zoom); buttons 14px with 12px sides on phones so Track/Like/Share share a row at 390px (375px wraps, as before).
- T68 — Plan a build without an account — 2026-11-17 — owner's request (newcomers can't tell what the site is for;
  first of T68–T70): `/build/new` opens for anyone (`useBuildEditor`: a new build is editable signed out); Save
  signed out opens the sign-up dialog and saves as the new account through `onSignedIn` (`useSaveBuild` takes the
  owner per save, since `useAuth` lags); a note beside Save says an account is needed; a `beforeunload` warning
  while an unsaved new build has a name, write-up, tags or gear; header **Plan a build** signed out (desktop nav,
  phone "+" and menu); GoatCounter events `planner-opened-signed-out`, `signed-in-to-save`. No rules change.
  Tests: `BuildEditorPage.test.tsx` (plan, Save, sign in, saved as the new uid), `Header.test.tsx`, e2e
  `build-flow.spec.ts` "plan a build signed out, then sign up to save it" (the old "Log in to create a build"
  e2e test removed). Docs: decision row "Plan before an account", `docs/product.md` "Low friction".
