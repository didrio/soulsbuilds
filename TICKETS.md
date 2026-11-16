# Tickets

Living, ordered backlog. **One ticket per session**: `/clear` → `/start Tn` → work → `/wrap`. The agent that
wraps a session updates this file and picks the next ticket. Rules: `.claude/skills/wrap/SKILL.md`. Capture
ideas any time with `/ticket`. Ticket numbers are never reused; **next free: T42**.

Each ticket has: **Status**, **Session** (model · effort · plan mode), **Goal**, **Done when**, **Context**
(read-first files, decisions, pitfalls). A fresh session reads the ticket and only what it names.

**Next:** T36 — Playing and Completed · Opus · high · plan mode on. Up next is in the order of
`docs/product.md` "Priorities": usage counts (T38, blocked on the owner), tracking (T36), link previews (T37,
blocked on the Blaze decision), sign-in and account (T30, T31), copies and variations (T32 → T33).
T30–T40 start with owner questions (★ in each ticket).
The redesign (owner's call, 2026-11-16) comes from a canvas mockup, the private "Souls Builds redesign"
artifact (https://claude.ai/artifact/6Wuekku4Q9cGVkmN7iS9ym): read an artboard with the Artifact tool's `read`
action and `path` (e.g. `project/BuildTabs.dc.html`); each one's `<helmet>` style holds the exact colors, sizes
and spacing, and the canvas notes say why.

**Owner to-dos** (from T12; checklist in `docs/firebase.md` "Relaunch checklist"):

- Approve the first CI production run (Actions → the run → Review deployments); it proves Workload Identity end to
  end. Open a throwaway PR once to see the preview comment.
- In a day or two: App Check → APIs, check that nearly all requests are verified, then **Enforce** for Firestore
  and Auth (`docs/firebase.md` "App Check" step 4). Automated browsers (perf runs, bots) count as unverified.
- App Check token TTL → **1 day** (T23; App Check → Apps → the web app → reCAPTCHA Enterprise → Token time to
  live). Then `npm run perf -- https://soulsbuilds.com/ --runs 1` should print `token ttl 86400s`.
- Console: delete the disposable test account "claude" (Authentication → Users); unlink Google Analytics if it's
  linked (Project settings → Integrations); set the email templates' sender name to "Souls Builds".
- Decide on the display name "Anne Frankly" (migrated from 2022; public on profiles). If it goes:
  `node scripts/admin.mjs rename <uid> "<new name>" --project soulsbuilds` (dry run), then `--write`.
- Keep a copy of `.admin-backups/export_soulsbuilds_2026-11-15T22-59-34-751Z.json` (the v1 data) outside the repo.

**Relaunched** 2026-11-15 (T12) on soulsbuilds.com. **Order from here** (owner's calls, 2026-11-15): the redesign
(T16, T17), "How to get this build" (T14, T19, T15), build math (T8), browse (T9) and performance (T21) are
done, and so are T18 (account deletion), T22 (layout), T20 (community feel), T23 (App Check wait), T24 (blocked reCAPTCHA), T25 (Firebase SDK 13), T26 (redesign v2 foundations), T27 (loadout and stats card), T28 (build page tabs), T29 (landing), T39 (loadout without empty rows) and
T34 (tracking), T35 (the route during a run) and T41 (tracking needs an account).

## In progress

(none)

## Up next

### T38 — Cookie-free usage counts

- **Status:** blocked: the owner decides whether to revisit decision "Analytics" (dropped, so there's no consent
  banner) and which service to use
- **Session:** Sonnet · medium effort · plan mode off
- **Goal:** Know whether people use the route, tracking and copies, without cookies or a consent banner
  (`docs/product.md` "Priorities": measure before tracking ships).
- **Done when:**
  - A cookie-free counter (e.g. Plausible or GoatCounter; the owner picks, it may cost money) counts page views and
    a few named events: tracking started, item collected, build completed, route opened, copy made (the last ones
    as their tickets land).
  - The privacy page says what's counted, and that it's anonymous and cookie-free.
  - `npm run perf` shows no regression; App Check is unaffected; `npm run check` passes.
- **Context:** decision "Analytics" (to update), `features/legal/Privacy.tsx`, `index.html`, `docs/architecture.md`
  (performance notes).

### T36 — Playing and Completed: the profile, and counts on the build

- **Status:** ready (T41 removed signed-out tracking, so there are no sign-in doc creates to count); T31 reworks the profile too, so do them in either order and keep the other in mind
- **Session:** Opus · high effort · plan mode on
- **Goal:** Your tracked builds in one place, finished builds as a small trophy shelf, and the author sees how many
  people play and finish their build.
- **Done when:**
  - Profile tabs "Playing" (in-progress builds with their percentage, gear, level and next stop) and "Completed"
    (finished builds with dates, tiles with a soft glow). ★ Both private, or Completed public (owner's call).
  - The build hero shows "37 playing · 12 finished". A `count()` over private tracking docs would need them
    readable by everyone, so: counters on the build (`playingCount`, `finishedCount`) moved by exactly 1 in the
    same batch as the tracking doc's create, completion and delete, with rules like `likeCount`. Mind the rules'
    expression budget.
  - ★ A "Most played" sort on the landing, from the counter.
  - Account deletion and `admin.mjs remove` keep the counters right.
  - Tests: rules tests for the counters, unit and e2e tests; `npm run check`, `npm run test:rules` and
    `npm run e2e` pass; screenshots.
- **Context:** artboard `ProfileMobile.dc.html`, `features/profile/`, `firestore.rules` (counters at the top) with
  `tests/rules/`, `lib/firebase/account.ts`, `scripts/admin.mjs`. T34's writes to change: tracking is one
  `setDoc` per change, debounced in `features/tracking/saveQueue.ts` (start = delay 0), `deleteTracking` on
  stop, and `startAfterSignIn` (T41: starts through the same `persist`); each create, first completion (`completedAt` null →
  set) and delete must become a batch with the counter. Listing a user's tracking: `listTrackingRefs` in
  `lib/firebase/tracking.ts` (the profile needs the docs, not refs). The doc id is the build id.

### T37 — Link previews: server-rendered build pages

- **Status:** blocked: the owner decides whether to move from Spark to the Blaze plan (pay-as-you-go with a free
  allowance) for Cloud Functions or Cloud Run
- **Session:** Opus · extra high effort · plan mode on
- **Goal:** A build link pasted into Reddit, Discord or a chat shows a card with the build's name, author and gear,
  and search engines see the page's content. Today the page renders in the browser, so both get an empty shell.
- **Done when:**
  - Per-build Open Graph and Twitter tags (title, description, image) and a generated preview image (the main
    weapon, the name and level, in the game's skin), served through Hosting rewrites; the landing gets its own.
  - Cached, with a cost estimate in `docs/firebase.md`.
  - The options are compared in plan mode: meta tags and image only, or the whole page rendered on the server.
- **Context:** `firebase.json` (Hosting), `docs/firebase.md` (deploys), decision "Plan and backups" (Spark). This
  replaces the backlog's "Per-build share previews".

### T40 — Choose the build's main image

- **Status:** ready; owner decisions first
- **Session:** Opus · high effort · plan mode on
- **Goal:** The author picks the image that represents their build: any item saved on it (a weapon, armor piece,
  talisman, spell, spirit ash…), shown as the hero portrait on the build page and in the landing rows (owner,
  2026-11-16).
- **Done when:** (ask the owner the ★ in one question first)
  - Model: an optional field on the build holding the chosen item (slot and game ID), validated in
    `firestore.rules` (cheap: mind the expression budget, Gotchas) and `src/lib/models.ts`; rules tests for a
    valid pick, a bad one, and none.
  - The editor lets the author choose: ★ e.g. a "Use as build image" action on any filled slot's item, or a
    picker in the title block. Saved with the build.
  - If the chosen item is no longer on the build (removed or swapped), the image falls back to the default, which
    is `mainWeaponId` (first right-hand weapon); nothing is stored for that, it's decided at read time. A pure,
    tested function in `src/lib/equipment.ts` (`buildImageId(build)`) replaces direct `mainWeaponId` calls in
    T28's hero and T29's rows. Icons for spells and spirit ashes come from the full data (the landing uses
    `@/data/core`, so check that card accessors cover every slot type).
  - Existing builds have no field: no migration. Tests: unit (fallback logic), rules, an e2e (pick a talisman, see
    it in the hero, remove it, back to the weapon). `npm run check`, `npm run test:rules`, `npm run e2e` pass.
  - Docs: the model in `docs/architecture.md`, a decision row.
- **Context:** `src/lib/{models,equipment}.ts`, `features/editor/{useBuildEditor.ts,store/build.ts}`,
  `sections/BuildHeader.tsx`, `features/builds/BuildsList.tsx`, `firestore.rules` with `tests/rules/`,
  `src/data/core` accessors (`getCardWeapon`, `getCardArmor`).

### T30 — Sign up and log in: low friction, done properly

- **Status:** ready; owner decisions first
- **Session:** Opus · high effort · plan mode on
- **Goal:** Sign-up and log-in that feel like a professional site, with as little friction as possible and no
  added risk (owner, 2026-11-16: the 2022 flows were thrown together and never checked properly).
- **Done when:** (a proposal: ask the owner about the ★ items in one question at the start, then mock the dialog
  states as new artboards on the redesign canvas and get an OK before building)
  - ★ "Continue with Google" as the first option (one click, no password to leak, an already-verified email),
    plus email and password. The owner enables the Google provider and the OAuth consent screen (app name, logo)
    in the console; the Auth emulator supports it for tests.
  - ★ The display name is chosen after the account exists, in a one-field "Choose a display name" step, never
    taken from the Google account's real name by default. Sign-up itself is then email + password, or one
    click. Every signed-in user without a `users/{uid}` doc lands on that step, which also repairs today's gap:
    `signUp` creates the Auth user before the profile, so a failed `createUserProfile` leaves an account with
    no profile.
  - Email and password form: a show-password toggle; ★ at least 8 characters, set as the Firebase Auth password
    policy so it's enforced server-side (today: Firebase's default of 6), with a matching hint; `autocomplete`
    right for password managers; errors next to the field they're about; focus moves to the first error.
  - "Forgot password?" opens its own small view in the dialog (email prefilled from the log-in form) instead of
    "enter your email above, then choose Forgot password again"; the same neutral "if there's an account…"
    message.
  - Under the sign-up button: "By creating an account you agree to the Terms and Privacy policy", with links
    (no checkbox).
  - After signing up or logging in, the user stays where they were; "Log in to create a build" continues to
    `/build/new`.
  - Risk: ★ email enumeration protection on in the console (the messages already say "Wrong email or
    password"); bots are App Check's job (enforcement is an owner to-do); verification stays send-only (decision
    "Email verification").
  - ★ Optional: a branded `/auth/action` page for reset and verification links (`confirmPasswordReset`,
    `applyActionCode`) on the site's domain, instead of Firebase's default page; the action URL is set in the
    console.
  - Google users can delete their account: T18's deletion asks for a password, so it re-authenticates with
    Google instead (`reauthenticateWithPopup`).
  - Tests: form unit tests; rules tests if profile creation changes; `tests/e2e/account.spec.ts` covers sign up →
    choose a name → log out → log in → reset request; `npm run check`, `npm run test:rules` and `npm run e2e`
    pass; screenshots of each dialog state, desktop and `--mobile`.
  - Docs: decisions (sign-in methods, password policy, display-name step), the privacy page if Google sign-in
    stores anything new, console steps in `docs/firebase.md`.
- **Context:** `features/auth/{Login,SignUp,AuthProvider,styles}`, the auth dialog in `app/App.tsx`,
  `lib/firebase/{auth,users,account}.ts` (`errorMessage` maps the Auth error codes),
  `features/profile/DeleteAccount.tsx`, `firestore.rules` (users) with `tests/rules/`,
  `features/legal/Privacy.tsx`. Decisions "Emails" (not stored in Firestore) and "Email verification". The owner
  to-dos already include the email templates' sender name.

### T31 — Profile and account settings

- **Status:** ready (after T30 if T30 adds Google sign-in)
- **Session:** Opus · high effort · plan mode on
- **Goal:** A public profile in the redesign v2 look, and the account settings people expect from a real site,
  kept apart from it. Today the profile page mixes both (rename at the top, the verify notice, Delete account at
  the bottom), and there's no way to change your email or password.
- **Done when:** (a proposal: confirm the ★ items with the owner, mock on the canvas first)
  - Public profile `/user/:userId`: a header like the build hero (display name, joined date, build and like
    counts), Builds / Liked tabs as today, with T29's row style. No email or settings on it.
  - ★ An Account page (`/account`, signed-in only): display name (rename), email (change via
    `verifyBeforeUpdateEmail`), password (change it with the current one; for Google users, their sign-in
    methods and "Set a password"), the verify-email notice, Log out, and Delete account (moved from the profile,
    behavior unchanged).
  - Re-authentication handled in one place, with a clear message on `auth/requires-recent-login`.
  - ★ Header: when signed in, the display name opens a small menu (Profile, Account, Log out) instead of
    separate links; on phones it lives in the menu.
  - Tests: unit tests for the settings forms; e2e covers rename, password change, log out, and account deletion
    still passes; `npm run check` and `npm run e2e` pass; screenshots desktop and `--mobile`.
  - Docs: a decision row (public profile vs account page), the privacy page true to what's stored, routes in
    AGENTS.md's project map.
- **Context:** `features/profile/{Profile,DeleteAccount,queries}`, `lib/firebase/{auth,users,account}.ts`,
  `app/Header.tsx`, `app/routes.tsx`; decisions "Account deletion", "Emails", "Email verification".

### T32 — Make a copy: a build based on another

- **Status:** ready (the button goes in T28's build hero); owner decisions first
- **Session:** Opus · extra high effort · plan mode on
- **Goal:** Any signed-in user can start a new build from any build they see, change as little or as much as they
  like, and save it as their own. The copy always credits the original, so its author doesn't feel copied
  without appreciation (owner's idea, 2026-11-16).
- **Done when:** (ask the owner about the ★ items in one question at the start; mock the button, banner and
  credit line on the redesign canvas first)
  - Model: an optional `basedOn: { buildId, ownerId }` on a build, set only when it's created and never changed or
    removed, so credit can't be stripped later. Rules: on create, `basedOn.ownerId` must equal the parent's
    `ownerId` (one `get`); on update, `basedOn` is unchanged. Existing builds don't have it: no migration. Mind
    the rules' expression budget (Gotchas). Rules tests: a valid copy, a wrong `ownerId`, a missing parent,
    changing or removing `basedOn`.
  - ★ "Make a copy" in the build hero for any signed-in visitor, the build's own author included (a PVE version
    of their own PVP build); signed out, it opens the log-in dialog and then continues. It opens
    `/build/new?from=<id>` with the editor prefilled: equipment with affinities and skills, stats, starting
    class, spells and tags. ★ The name starts as the original's. ★ The description starts empty: it's the
    original author's writing, and the credit line links to it. An edit-mode banner says "You're making your
    own version of <name> by <author>. Change anything, then save."
  - On the copy, a line under the hero's byline: "Based on <original name> by <author>", linking to the
    original, with its live name (one read). If the original was deleted: "Based on a build that's since been
    deleted".
  - No counter on the original (T33 counts copies with a query), so account deletion (`lib/firebase/account.ts`)
    and `admin.mjs remove` have nothing new to clean up; copies of a deleted build keep `basedOn`.
  - Tests: unit tests for the prefill (`store/build.ts`: `loadBuild` / `selectBuildFields`), rules tests, an e2e
    test: copy someone's build, change a talisman, save, see "Based on" linking back. `npm run check`,
    `npm run test:rules` and `npm run e2e` pass.
  - Docs: a decision row ("Copies"), the model in `docs/architecture.md`.
- **Context:** `src/lib/models.ts` (`Build`, `BuildContent`, `LIMITS`), `firestore.rules` (builds create and
  update, around line 160; counters at the top) with `tests/rules/`, `lib/firebase/builds.ts`,
  `features/editor/{useBuildEditor.ts,store/build.ts,BuildEditorPage.tsx}`, T28's hero, `scripts/admin.mjs`. This
  replaces the backlog's "copy this build".

### T33 — Variations: every copy of a build, on its page

- **Status:** ready (after T32)
- **Session:** Opus · high effort · plan mode off
- **Goal:** A build that's been copied shows everyone's versions of it and how each one differs, so a visitor sees
  the original next to the PVE take, the cheaper version, or the one that claims to be better.
- **Done when:**
  - ★ A "Variations" tab on the build page with its count, shown only when there's at least one (like the empty
    Description tab, T28). The count is one `count()` aggregation (`where('basedOn.buildId', '==', id)`, about 1
    read), not a stored counter: no counter rules, and nothing drifts when copies are deleted.
  - The tab lists the copies, most liked first (composite index in `firestore.indexes.json`), in T29's row
    style. Each row says what changed against this build, e.g. "3 items changed · Faith 80 → 60 · +1 spell ·
    Level 201 → 150", or "No changes yet" (identical copies sort last). The summary is a pure function in
    `src/lib/` (e.g. `buildDiff.ts`) with unit tests; item names come from `@/data`.
  - ★ On a copy, the credit line adds "and N other variations", linking to the original's Variations tab.
  - Landing rows unchanged for now (a count per row would cost a query per row).
  - Tests: unit tests for the diff and the tab; T32's e2e test extended (the original shows "Variations 1" and
    the copy's summary); `npm run check` and `npm run e2e` pass; screenshots desktop and `--mobile`.
  - Docs: a decision row (counting with a query instead of a counter), AGENTS.md's project map.
- **Context:** T32's `basedOn`; T28's tabs; `features/builds/BuildsList.tsx` rows;
  `features/editor/queries.ts` and `lib/queryKeys.ts`. A side-by-side compare view (Backlog) is the natural next
  step: each variation row could link to "Compare with the original".

## Backlog

- Route (T15 follow-ups): upgrade materials (Smithing/Somber stones, needs upgrade levels on builds), rune
  farming to the build's level (where and how long), and the starting class: builds now save one (T8,
  `startingClass`; classes in `character.json`), so the route can say "your Samurai starts with it" instead of
  "or start as X", and suggest a class for builds without one.
- Markdown editor in the site's palette: since T28 it's pinned to the editor's own dark theme (`data-color-mode`
  in `index.html`), GitHub's bluish dark rather than `COLOR_INSET`/`COLOR_TEXT`; override its CSS variables in
  `sections/Markdown.tsx` (`--color-canvas-default` and friends, see `@uiw/react-md-editor`'s README).
- Delete the unused 2022 doc `app/tags` in production (no rule matches it; it's in the T12 backup).
- Other games (owner, 2026-11-15: Dark Souls 1–3, maybe Demon's Souls and Bloodborne; Sekiro and Nightreign
  need their own build models) on top of T3's `game` field: data per game, per-game routes (`/ds3/...`) read by
  `useCurrentGame()` (`src/app/game.ts`), a game switcher in the header, a skin per game in
  `src/theme/skins.ts`, per-game tags. Same function and UX for every game; only the look changes.
- Build comparison view: two builds side by side (after T33, from a variation's "Compare with the original").
- Firebase MCP server for agents (local emulator use only) once its emulator support is clear.
- Build history / "updated" badge using `updatedAt`, with a patch label ("updated for 1.x") and a short changelog;
  edit comments (rules allow no comment updates today).
- "Suggest a change to the author": a variation the author can pull into the original (after T33, once there's
  activity; `docs/product.md`).
- Create a build page from an uploaded save file (research first: parsing the save format in the browser). A big
  friction win for people who post builds.
- A few play-based milestones ("Finished 5 builds"), only if users ask (rewards rule in `docs/product.md`).
- Admin page in the app (list reports, remove/dismiss) if `scripts/admin.mjs` gets tedious; the rules already
  let admins list reports and delete content.

## Done

Older entries: `docs/tickets-archive.md`.

- T41 — Tracking needs an account — 2026-11-16 — owner: drop existing local progress (no merge), text + icons
  modal; `TrackingIntro` (signed out: Create account / Log in, continues into tracking via
  `useOpenAuthDialog(kind, onSignedIn)` + `startAfterSignIn(uid)`; signed in with no tracked build, from
  `tracksAnyBuild` (`limit(1)`): Start tracking / Not now); local storage, sync, Keep my progress and
  `mergeTracking` gone; `screenshot --storage` → `--click`; e2e `helpers.ts` `completeSignUp`.

- T35 — The route during a run — 2026-11-16 — owner: flat numbered stops (mockup), reasons hand-written on gates
  (`progression.ts` `reason`, pipeline fails without) and worded from the route's links for prerequisite key
  items (`route.ts` `usedFor`/`gate`, `phrases.ts` `itemReason`), region-only stops named by who/what; key items
  with icons (+80 webp); `guide/progress.ts` (done/next), "N of M stops done" + folding, `NextStop` card on Loadout.
  Mid-session: tracking becomes account-only → T41.

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

- T29 — Landing: slim toolbar, rows with a portrait — 2026-11-16 — no framed card: h1 + "N builds by M players" on
  a line, then search | sort | level, then a sideways-scrolling top-tags row ("More tags" after it, outside the
  scroller so its popover isn't clipped); 88px rows by named grid areas (portrait = `mainWeaponId`, strip
  left hand first, empty cells faint, "Level" label); tablet 140px, phones auto height (60px portrait, name on two
  lines). The phone Filters button is gone (sort and level always show).
