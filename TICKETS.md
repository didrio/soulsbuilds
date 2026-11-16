# Tickets

Living, ordered backlog. **One ticket per session**: `/clear` → `/start Tn` → work → `/wrap`. The agent that
wraps a session updates this file and picks the next ticket. Rules: `.claude/skills/wrap/SKILL.md`. Capture
ideas any time with `/ticket`. Ticket numbers are never reused; **next free: T43**.

Each ticket has: **Status**, **Session** (model · effort · plan mode), **Goal**, **Done when**, **Context**
(read-first files, decisions, pitfalls). A fresh session reads the ticket and only what it names.

**Next:** T30 — Sign up and log in · Opus · high · plan mode on. Up next follows `docs/product.md`
"Priorities": usage counts (T38, blocked on the owner), link previews (T37, blocked on the Blaze decision),
sign-in and account (T30, T31), then rules budget (T42) before copies and variations (T32 → T33).
T30–T33 start with owner questions (★ in each ticket).
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
- After T36's production deploy: back up, then backfill the build counters so "Most played" includes every build:
  `node scripts/admin.mjs counts --project soulsbuilds` (dry run), then `--write` (`docs/firebase.md`
  "Tracking counters backfill").

**Relaunched** 2026-11-15 (T12) on soulsbuilds.com. **Order from here** (owner's calls, 2026-11-15): the redesign
(T16, T17), "How to get this build" (T14, T19, T15), build math (T8), browse (T9) and performance (T21) are
done, and so are T18 (account deletion), T22 (layout), T20 (community feel), T23 (App Check wait), T24 (blocked reCAPTCHA), T25 (Firebase SDK 13), T26 (redesign v2 foundations), T27 (loadout and stats card), T28 (build page tabs), T29 (landing), T39 (loadout without empty rows) and
T34 (tracking), T35 (the route during a run), T41 (tracking needs an account), T36 (Playing and Completed)
and T40 (the build image).

## In progress

(none)

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
    counts), Builds / Liked tabs as today, with T29's row style, plus the owner's private Playing / Completed
    tabs (T36: `features/tracking/TrackedBuilds`, tab counts, "N builds finished" in the tagline) kept as they
    are. No email or settings on it.
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

### T42 — Free up rules budget on builds before the next field

- **Status:** ready (must land before T32, whose `basedOn` adds a field and a `get`)
- **Session:** Opus · extra high effort · plan mode on
- **Goal:** Room in `builds/{id}`'s rules for new fields. After T40 (the build image) the full-equipment test
  (`tests/rules/firestore.rules.test.ts`, "accepts a build with every slot filled…") fails if `validContent`
  gains about five more comparisons: Firestore's ~1,000-expression limit, denied with a bare `PERMISSION_DENIED`.
- **Done when:**
  - The worst-case create and owner edit (every slot filled, an image set) have measured headroom, recorded in
    the `firestore.rules` budget comment and `docs/firebase.md`: e.g. at least 100 padding comparisons still
    pass.
  - The same writes are accepted and rejected as before: every existing rules test passes unchanged, plus tests
    for anything newly checked or no longer checked.
  - `npm run test:rules`, `npm run check`, `npm run e2e` pass; a decision row if what's validated changes.
- **Context:** budget comment above `isItemIdOrNull` in `firestore.rules`. What T40 learned: each use of a
  function argument re-walks `request.resource.data…`. `let` bindings are **not** memoized (binding the
  equipment lists in `validEquipment` made it worse). `d.get('image', null)` with no `hasAll` was cheaper than
  `'image' in d` + `hasExactly`. Literal key lists instead of `contentKeys().concat(…)` on create gained
  nothing. Ideas to measure: drop the per-entry type checks of `weaponSkills` (size only, like talismans: the
  app ignores unknown IDs); check `slots6` entries with fewer re-walks; skip `validContent` parts whose fields
  aren't in `changedKeys()` on update. How to measure: temporarily prepend `(1 == 1 && … ×N) &&` to a check in
  `validContent` and run `npm run test:rules`; T40 found N = 5 already fails.

### T32 — Make a copy: a build based on another

- **Status:** ready after T42 (rules budget for `basedOn`; the button goes in T28's build hero); owner decisions first
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

- T40 — Choose the build's main image — 2026-11-16 — owner: picker in edit mode's title block ("Change image" →
  `BuildImageDialog`, radio rows), gear only (no arrows/consumables); `image: { kind, id } | null` (rules check the
  shape, optional on create), `buildImage` / `imageChoices` in `lib/equipment.ts` (read-time fallback to the main
  weapon; the editor saves a gone pick as null), `getCardItem` + 5 new card kinds (cards.json +7 KB gzipped);
  hero, landing rows, profile panels; e2e `build-image.spec.ts`. Rules budget nearly exhausted → T42.
- T36 — Playing and Completed — 2026-11-16 — owner: both profile tabs private, "Most played" sort, stopping a
  finished build removes it from Completed; build counters `playerCount`/`finishedCount` (±1 in the tracking
  doc's batch, rules check both sides; `saveQueue` tracks the stored status), hero "N playing · M finished",
  profile Playing cards (progress + next stop, lazy) and Completed trophies, `admin.mjs counts` backfill, e2e
  `playing.spec.ts`
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
