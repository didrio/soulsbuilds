# Tickets

Living, ordered backlog. **One ticket per session**: `/clear` → `/start Tn` → work → `/wrap`. The agent that
wraps a session updates this file and picks the next ticket. Rules: `.claude/skills/wrap/SKILL.md`. Capture
ideas any time with `/ticket`. Ticket numbers are never reused; **next free: T39**.

Each ticket has: **Status**, **Session** (model · effort · plan mode), **Goal**, **Done when**, **Context**
(read-first files, decisions, pitfalls). A fresh session reads the ticket and only what it names.

**Next:** T27 — Loadout panel and stats card · Opus · high · plan mode off. Up next is in the order of
`docs/product.md` "Priorities": the redesign (T27 → T28; T29 any time now), usage counts (T38,
blocked on the owner), tracking (T34 → T35 → T36), link previews (T37, blocked on the Blaze decision), sign-in and
account (T30, T31), copies and variations (T32 → T33). T30–T38 start with owner questions (★ in each ticket).
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
done, and so are T18 (account deletion), T22 (layout), T20 (community feel), T23 (App Check wait), T24 (blocked reCAPTCHA), T25 (Firebase SDK 13) and T26 (redesign v2 foundations).

## In progress

(none)

## Up next

### T27 — Loadout panel and stats card

- **Status:** ready
- **Session:** Opus · high effort · plan mode off
- **Goal:** Every item visible by name, spells inside the loadout, and attributes plus character stats in one
  card, in both view and edit mode. Today armor, talismans and tears are icon-only with names on hover or tap.
- **Done when:**
  - One Loadout panel (`EquipmentEditor` and `SpellEditor` merged). **Left hand on the left, Right hand on the
    right** (owner, 2026-11-16: the game lists the right hand first; the mockups still show it that way), as 64px
    tiles with the name and "affinity · skill". Armor, Talismans and Flask of Wondrous Physick in three columns,
    plus great rune and spirit ash: 44px tiles with the name beside them. Then Spells: "8 of 10 memory slots".
    Requirement warnings stay.
  - **Every slot always shows** (owner, 2026-11-16; decision "Empty slots", revised): a fixed layout, so the
    equipment and spells take the same space on every build. Empty slots are a very subtle placeholder (fainter
    than today's empty `ItemTile`, the slot name muted or nothing) at the same size as a filled one: 3 weapon
    slots per hand, 4 armor, 4 talismans, great rune, spirit ash, 2 tears. Spells: one cell per memory slot
    (`memorySlots` in `buildMath.ts`, usually 10), a 2-slot spell spanning two cells, the free ones as
    placeholders; this replaces the separate slot pips. ★ Arrows and bolts (4) and consumables (up to 10): the
    same rule, or shown only when the build uses them (ask the owner; most builds have none).
  - Phones: Left hand and Right hand side by side too, names wrapping to two lines; if that's too cramped in
    screenshots, stack them with Left hand first.
  - Edit mode keeps the same layout: every slot is a button that opens the picker (accessible name = slot and
    item); empty slots keep the empty tile and "Choose helm" (decision "Empty slots").
  - One stats card (`StatEditor` and `CharacterStats` merged): the rune level figure in the accent; 8 attribute
    rows about 30px tall (name, thin bar, value, +N talisman bonus kept); HP, FP and Stamina side by side; Equip
    load as a bar marked at 30% and 70% (`rollType` in `buildMath.ts`) with the roll name; Poise. Edit mode: the
    attribute inputs sit in the same rows.
  - Phones: the stats card first (attributes in a 4×2 grid as Vig, Mnd, End, Str, Dex, Int, Fai, Arc; HP, FP,
    Stamina and Poise in a row; the load bar), then the loadout (hands side by side, the other groups in one
    column).
  - Tests updated (EquipmentEditor, SpellEditor, StatEditor, CharacterStats, ItemSlot); `npm run check` and
    `npm run e2e` pass; screenshots of a build in view mode and `/build/new`, desktop and `--mobile`.
- **Context:** Artboards `Main.dc.html` (loadout and stats card) and `BuildMobile.dc.html`. Files:
  `features/editor/sections/{EquipmentEditor,SpellEditor,StatEditor,CharacterStats}.tsx`, `ItemRow.tsx`,
  `ItemSlot.tsx` (today: icon tile + `Tooltip` name), `itemDetails.ts`, `slots.ts`, `store/derived.ts`. The page
  keeps the T22 layout until T28 (the stats card takes the aside's place). View and edit stay one layout
  (decision "Build page and editor").

### T28 — Build page tabs: hero, Loadout / Description / How to get / Comments

- **Status:** ready (after T27)
- **Session:** Opus · high effort · plan mode on
- **Goal:** Split the build page into tabs under a hero, so each section gets the whole page and visitors see at
  once that a route and comments exist (owner's idea, 2026-11-16; the long one-page layout tried to fit too
  much).
- **Done when:**
  - Routes: `/build/:buildId` is Loadout; `/build/:buildId/description`, `/route` and `/comments` are the other
    tabs (one `BuildEditorPage`, via a `:tab?` param or nested routes); an unknown tab shows Loadout.
    `useScrollToTop` doesn't jump to the top on a tab switch within the same build (keep the position, or bring
    the tab bar into view if it's off-screen). Links to a build's comments (T20) go to `/comments`.
  - Hero (replaces the title pane): the main weapon (first filled right-hand slot, else the first weapon) as a
    112px portrait tile with the skin's `tint` glow; the build name as `<h1>`; "by author · Level · age"; tags;
    Like and Report; the owner's Edit and Delete. The comment count moves to the Comments tab.
  - Tab bar under the hero: links (`NavLink`, `aria-current="page"`), 48px tall, active = text color + accent
    underline, Comments shows its count; it sticks under the header while scrolling; on phones it scrolls
    sideways.
  - Always opens on Loadout; a shared link to a tab opens that tab. The Description tab is hidden when the build
    has none (its owner sees it, with "Add a description" entering edit mode).
  - Loadout tab: the T27 loadout panel, then two link cards: "Read the description" (first paragraph as plain
    text, 3 lines) and "See the route". Don't load the acquisition data just for that card. "More by <author>"
    at the bottom of this tab.
  - Description tab: the full write-up, plus a "Jump to" row of its h2 headings. That needs heading ids:
    check what `rehype-sanitize` does to `id`s (its `clobberPrefix`); a small local rehype step is fine, but ask
    the owner before adding a dependency.
  - How to get tab: the route shown directly (no "Show the route" button; its data still loads on first open),
    restyled as a numbered path of areas. Each step shows place, how and items: the build's own items as icon
    tiles, others as dashed tiles, bosses marked.
  - Comments tab: `CommentsSection`.
  - Desktop: the stats card is a sticky 340px right rail on every tab. Phones: stats only in the Loadout tab.
  - Edit mode and `/build/new`: only the Loadout and Description tabs, with the sticky Save bar as today.
  - Tests: component tests for the tab bar and the tab param; e2e updated (`guide.spec.ts` opens the tab,
    `community.spec.ts` comment heading and link) plus a tab check (deep link, Back button); `npm run check`
    and `npm run e2e` pass; screenshots of every tab and of a build without a description, desktop and
    `--mobile`.
  - Docs: replace the decision row "Build page layout"; routes and sections in AGENTS.md's project map and
    `docs/architecture.md`.
- **Context:** Artboards `BuildTabs.dc.html` and `BuildTabsMobile.dc.html` (clickable in Play; notes c1–c5 beside
  them explain each choice). Files: `app/routes.tsx`, `app/useScrollToTop.ts`,
  `features/editor/BuildEditorPage.tsx`, `useBuildEditor.ts`, `sections/{BuildHeader,OwnerActions,
DescriptionSection,CommentsSection,MoreByAuthor,BuildDetailsForm,MarkdownView}.tsx`,
  `guide/{GuideSection,GuideRoute,route,phrases}`. Routes are expensive to change later, hence plan mode. The
  main-weapon helper is shared with T29 (whichever lands first adds it).

### T29 — Landing: slim toolbar, rows with a portrait

- **Status:** ready (independent of T27 and T28)
- **Session:** Sonnet · medium effort · plan mode off
- **Goal:** The first build higher up the page, and rows you can read at a glance. Today a ~200px framed filter
  card comes first, and each row shows 8 small dark tiles (empty ones included) with the level as its loudest
  element.
- **Done when:**
  - No framed card. The `<h1>` "Elden Ring builds" (serif) and "N builds by M players" share a line, then a
    one-line toolbar: search (fills the width), Sort (Most liked / Newest), Level min–max. The Tags row below
    scrolls sideways (top tags with counts first, then "More tags").
  - Rows of about 88px: the main weapon (same rule as T28's hero) as a 72px portrait; the name in the serif on
    one line with an ellipsis; "by author · age" and tags (fit + "+N" as today); the slot strip with today's fixed
    cells (weapon slots 1–2 of each hand, a divider, the 4 armor slots; 38px tiles), **left hand first**, and empty
    cells as a very subtle placeholder instead of the diamond, so every row lines up (owner, 2026-11-16; this
    replaces the mockup's "filled slots only"); a small "Level" label and the number (not in the accent); likes
    and comments with icons. The selection-bar hover stays.
  - Phones: 60px portrait, the name on up to 2 lines, "by author · age", then "Level · likes · comments"; tags;
    the strip below.
  - Rows, not cards (the canvas recommendation; the cards alternative stays on the canvas if wanted later).
  - `BuildsList`, `Landing` and `tags` tests updated; `npm run check` and `npm run e2e` pass; screenshots desktop
    and `--mobile`.
- **Context:** Artboards `Landing.dc.html` (Tweaks › Layout = Rows) and `LandingMobile.dc.html`. Files:
  `features/builds/{Landing,BuildsList,tags,filters}`, `components/ui/{SegmentedControl,Chips,ItemTile}`.

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

### T34 — Track a build: the Loadout as a checklist

- **Status:** ready (after T28; T38 first if the owner approves it)
- **Session:** Opus · extra high effort · plan mode on
- **Goal:** Players following a build mark the gear they've collected and how far their stats are, and watch their
  progress fill to 100%. The site's main value for people who never post a build (`docs/product.md`).
- **Done when:** (artboards `TrackMobile.dc.html` and `TrackDesktop.dc.html`, clickable in Play; notes k1–k5)
  - "Track this build" is the build page's primary button; it turns the Loadout tab into tracking mode. Items
    not yet collected are greyscale with a dashed border; a tap marks one collected: full color, accent border, a
    check badge and a short glow (none with reduced motion). Item buttons use `aria-pressed`; each group shows its
    count ("3/4"); T27's empty placeholders aren't buttons and don't count. "Stop tracking" asks first.
  - Attributes in tracking mode: your level against the target with − and + (from the build's starting class
    stats, when it has one, up to 99), ticked when reached.
  - Progress in the hero: one percentage, half gear (items collected out of the build's items, spells included)
    and half levels (the sum of min(yours, target), from the starting stats to the target's). Under it: "Gear 11 of
    20" as pips and "Level 119 of 201" as a bar. The math is a pure, tested function in `src/lib/`.
  - At 100%: a "Build complete" moment in the hero (large serif with a glow, days since starting, Share and "Find
    your next build"); `completedAt` is saved.
  - Storage, signed in: `users/{uid}/tracking/{buildId}` (collected item IDs by slot, stats, `startedAt`,
    `updatedAt`, `completedAt`), readable and writable only by its owner (rules and rules tests). Signed out:
    local storage, with a "Your progress is saved on this device · Keep my progress" card after the first item,
    copied to Firestore on sign-up or log-in. ★ Alternative to weigh in plan mode: Firebase anonymous sign-in,
    upgraded in place (needs the provider enabled; on Spark, anonymous accounts never expire).
  - Progress is keyed by slot and item ID: when the author edits the build, new items appear unchecked with
    "2 new items since you started", and removed ones drop out.
  - Account deletion (`lib/firebase/account.ts`) deletes the user's tracking docs too.
  - Phone first: 44px targets, usable one-handed next to a console.
  - Tests: unit tests (progress math, tracking state), rules tests, an e2e test (track signed out, collect two
    items, sign up, progress kept). `npm run check`, `npm run test:rules` and `npm run e2e` pass; screenshots at
    0%, mid-run and complete, desktop and `--mobile`.
  - Docs: a decision row (tracking storage), the model in `docs/architecture.md`, the privacy page (what tracking
    stores, that it's private), AGENTS.md's project map.
- **Context:** T27's loadout panel and its tile states, `features/editor/` (`store/`, `slots.ts`),
  `src/data/startingClasses`, a new `lib/firebase/tracking.ts`, `firestore.rules` (users) with `tests/rules/`,
  `lib/firebase/account.ts`. Principles: `docs/product.md` (likes stay the favorites; rewards celebrate play).

### T35 — The route during a run: progress, next stop, reasons

- **Status:** ready (after T34)
- **Session:** Opus · high effort · plan mode on
- **Goal:** The route becomes the guide you keep open during a run, and stops being confusing: it knows what
  you've collected, says what's next, and explains every stop. The owner found today's route hard to follow.
- **Done when:**
  - With tracking on, How to get shows "17 of 27 stops done" with a bar, folds finished stops behind "Show the 17
    finished stops", and highlights the next stop. A stop with only key items or a boss counts as done once a
    later stop is done. Without tracking it's the plain guide.
  - A "Next stop" card at the top of the Loadout tab in tracking mode (place, area, what to do, the items, "See
    the whole route").
  - Every key item and boss says why it's on the route: the Whetstone Knife "Lets you put Ashes of War on
    weapons", the Haligtree Secret Medallion halves "Half of the key to the Haligtree", the prayerbooks "Give it to
    Brother Corhyn…", bosses "Main-path boss". The reasons live with the hand-written progression data in
    `scripts/data/` (re-run `npm run data`), not in components.
  - Where the data allows, a better phrase than "Somewhere in <area>".
  - Tests: done/next logic and reasons in `route.ts` / `phrases.ts` tests, a data test that every key item has a
    reason, `guide.spec.ts` with tracking; screenshots desktop and `--mobile`.
- **Context:** artboards `TrackMobile.dc.html` and `TrackDesktop.dc.html` (How to get tab), T28's route tab,
  `features/editor/guide/{route,phrases,GuideRoute}`, `scripts/data/{acquisition,progression,places,events}.ts`,
  `src/data/acquisition.ts`, `docs/data.md`.

### T36 — Playing and Completed: the profile, and counts on the build

- **Status:** ready (after T34; T31 reworks the profile too, so do them in either order and keep the other in
  mind)
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
  `tests/rules/`, `lib/firebase/account.ts`, `scripts/admin.mjs`.

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

- **Status:** ready (after T28: the button lives in the build hero); owner decisions first
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

- T26 — Redesign v2 foundations — 2026-11-16 — EB Garamond 600 names/headings, `Label`/`labelText` the only caps,
  Inter values (14px, tabular); accent budget (neutral panels, tags, icons); `Frame` plain + `$hero` (corner marks,
  skin `tint`) on the build title pane; 1240px, `SPACE_PANEL/GROUP/REGION`; header with phone "+" and menu;
  write-up headings. Not seen on screen: write-up h1–h4 (no seeded write-up has headings).
- T25 — Firebase JS SDK 13 — 2026-11-16 — `firebase` 13.3.0 + `@firebase/rules-unit-testing` 6.0.0, no code changes
  (13.0's breaks are AI-only); check, rules (103) and e2e pass; preload URL still matches, blocked notice at ~2.4 s.

- T24 — No blank page when reCAPTCHA is blocked — 2026-11-16 — owner: error only, one notice in the shell;
  `appCheckStatus.ts` (blocked = no token 2 s after a reCAPTCHA load error, or 10 s) + `AppCheckNotice`;
  checked on a local build served at soulsbuilds.com: notice at ~2.4 s, normal first Firestore request ~1.2 s.
- T23 — Content sooner: the App Check wait — 2026-11-16 — cause confirmed in the SDK (Firestore awaits the App
  Check token; a cached IndexedDB token skips reCAPTCHA; T21's "warm" wait was perf's 403'd bot exchange);
  `enterprise.js` preloaded (cold first Firestore request ~1.29 → ~1.21 s, via `--head` before deploy; warm real
  visit ~0.33 s); perf App Check table + `--head`; owner sets a 1-day TTL. Blocked reCAPTCHA = blank page → T24.
- T20 — Community feel — 2026-11-16 — HTML mockup, owner picked layout A with counts; public `stats/elden-ring`
  (builds, distinct authors, accounts, builds per tag) from `admin.mjs stats`, daily in `stats.yml` as its own
  `github-stats` SA; top tags as the Tags row's first chips (scrolling row on phones),
  "N builds by M players", rows with comments + age, build page comment link, warmer empty state, "More by",
  profile build/like counts; scroll to top on navigation. SA set up and first run done by the owner (same day).
- T22 — Layout: lean landing, compact build page — 2026-11-16 — HTML mockup, owner picked "title first";
  landing: no hero, small `<h1>` in the Find builds frame, fixed-height rows with tags on one line + "+N"
  (`tags.ts` `fitCount`); build page: title pane, equipment across the page (weapons as rows, other slots as
  `ItemSlot` icon tiles with a `Tooltip` name on hover/focus/tap), write-up beside the numbers, guide collapsed
  with `GuideRoute` + acquisition data loaded on expand, comments across the page at 72ch.
- T18 — Account deletion and admin rename — 2026-11-15 — profile "Delete account" (password re-auth; finds
  everything, then deletes builds, likes/comments elsewhere with counters, reports, profile, Auth user;
  re-runnable), rules for own profile/report delete + comments collection-group read, `admin.mjs rename` and
  `delete-user` (backup first), privacy page updated; e2e `account.spec.ts`.
- T21 — Performance — 2026-11-15 — `npm run perf` (headed Chrome + CDP: load vitals, scroll frames, GPU time,
  `--off` attribution); `background-attachment: fixed` → fixed layer behind content (landing 72 → 118 fps, 40% →
  2% dropped), grain on its own layer, `<main>` ≥ 1 screen (CLS 0.17 → 0), hosting cache headers, preconnects.
  Prod "after" numbers not yet measured (needs the deploy); App Check wait → T23.
