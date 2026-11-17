# Tickets

Living, ordered backlog. **One ticket per session**: `/clear` → `/start Tn` → work → `/wrap`. The agent that
wraps a session updates this file and picks the next ticket. Rules: `.claude/skills/wrap/SKILL.md`. Capture
ideas any time with `/ticket`. Ticket numbers are never reused; **next free: T49**.

Each ticket has: **Status**, **Session** (model · effort · plan mode), **Goal**, **Done when**, **Context**
(read-first files, decisions, pitfalls). A fresh session reads the ticket and only what it names.

**Next:** T47 — Auto-generated description · Sonnet · medium · plan mode off, then T48 (build page v3: the
build in a sidebar, Description · Guide · Comments), the owner's design of 2026-11-16. Then T32 — Make a copy
(then T33, variations); T42 freed the rules budget it needs. Also from `docs/product.md` "Priorities": usage
counts (T38, blocked on the owner), link previews (T37, blocked on the Blaze decision), the branded email
action page (T43), and item hover cards (T45, no rush).
T32, T33 and T45 start with owner questions (★ in each ticket).
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
T34 (tracking), T35 (the route during a run), T41 (tracking needs an account), T36 (Playing and Completed),
T40 (the build image), T30 (sign up and log in), T31 (profile and account settings), T44 (route stops done),
T42 (rules budget) and T46 (tracking in How to get).

## In progress

(none)

## Up next

### T47 — Auto-generated description

- **Status:** ready (owner, 2026-11-16; build page v3, T46–T48)
- **Session:** Sonnet · medium effort · plan mode off
- **Goal:** Every build has something on its Description tab, which becomes the page a build opens to in T48:
  the author's write-up, or a short one generated from the build, "just the basics and anything to note"
  (owner).
- **Done when:**
  - A pure `describeBuild(facts)` (e.g. `features/editor/describe.ts`) turns a facts object into short
    markdown; a selector (e.g. `selectDescriptionFacts` in `store/derived.ts`) gathers the facts from the
    editor state the page already loads. Names from `@/data/core` (light data; check what the view can import
    without the full data, docs/data.md).
  - The content, in plain sentences, a few lines at most, e.g. "A level 131 Samurai build around Rivers of
    Blood (Corpse Piler) and an Uchigatana (Blood, Seppuku). Its highest attributes are Vigor 50, Arcane 45
    and Dexterity 40. Medium load (39.8 of 72.0), 42 poise. Talismans: Lord of Blood's Exultation, Rotten
    Winged Sword Insignia, Millicent's Prosthesis and Shard of Alexander. Spirit Ash: Mimic Tear Ashes."
    - The main weapon first (`mainWeaponId`, `lib/equipment.ts`), then the other hand's; affinity and skill
      from `weaponDetails`.
    - The three highest effective attributes (with talisman bonuses).
    - Spells when there are any: count by kind and memory slots used ("3 incantations, 5 of 10 memory slots").
    - Then a short "Worth knowing" list, only for what applies: unmet requirements and two-handed-only weapons
      (from `itemWarning`), spells over the memory slots, DLC items ("Needs Shadow of the Erdtree: …").
    - Nothing empty is mentioned; a build with no gear gets one line ("A level 9 build with no gear chosen
      yet.").
  - Rendered at view time through `MarkdownView` (never stored, so it follows edits), ending with a muted "This
    description was automatically generated."
  - The Description tab shows for every build (`tabs.ts` `visibleTabs`: drop the `hasDescription` rule).
    Editing is unchanged: Loadout and Description, the editor starting empty (not prefilled).
  - Tests: `describe.test.ts` (each sentence and note, an empty build, ties in the top attributes),
    `tabs.test.ts`, a `BuildEditorPage` test for the generated text and its note; e2e `build-tabs`
    (SEEDNAKED001 now has a Description tab). `npm run check` passes; screenshots of a build without a
    write-up, desktop and `--mobile`.
  - Docs: decision "Build page layout" (Description always shown), docs/architecture.md if it lists the tabs.
- **Context:** `store/derived.ts` (`selectEffectiveStats`, `selectVitals`, `selectEquipWeight`,
  `selectRollType`, `selectPoise`, `selectMemorySlots`, `selectMemoryUsed`, `selectSpellsOverSlots`,
  `selectRequirementChecks`), `store/selectors.ts`, `itemDetails.ts` (`weaponDetails`, `itemSubline`,
  `itemWarning`), `src/data/schema.ts` (the `dlc` flag on items), `data/startingClasses` (class names),
  `sections/{DescriptionSection,MarkdownView}.tsx`.

### T48 — Build page v3: the build in a sidebar, Description · Guide · Comments

- **Status:** ready after T46 and T47 (owner's design, 2026-11-16)
- **Session:** Opus · extra high effort · plan mode on
- **Goal:** The build's stats and gear live in one sidebar that's the same on every tab and for every visitor,
  and the page's tabs are Description (the default), Guide and Comments. The build reads at a glance, the page
  doesn't reshape itself, and the cards that pointed at other tabs are gone. On phones: collapsible sections
  whose closed headers already say something.
- **Done when:**
  - **Title section** (`BuildHeader`), shorter: a ~72 px tile (from 112), name, meta and tags packed tighter,
    the actions on the right (Track / Tracking from T46, Like, Report, the owner's Edit and Delete).
  - **Tab bar** across the full width, labels centered: Description · Guide · Comments (count). URLs:
    `/build/:id` = Description, `/build/:id/guide`, `/build/:id/comments`; `/route` → `/guide` and
    `/description` → `/build/:id` redirect (`replace`). `tabs.ts` (`BuildTab`, `BUILD_TABS`, `parseTab`,
    `tabPath`, `pageKey`) and T46's links (Track, profile lists) follow.
  - **Sidebar** (desktop ≥ 900 px, `STATS_COLUMN_WIDTH` 340), one component from `BuildSummary` + `StatsCard`:
    - Stats: rune level, starting class, the eight attributes as rows with bars and talisman bonuses (StatsCard's
      desktop look; shrink as needed, owner: "your call"), HP / FP / stamina, equip load bar with the roll,
      poise.
    - Gear as icon tiles by group: armaments (+ arrows), armor, talismans, spells (memory slots), tears, Great
      Rune, spirit ash, items. **No names on the page** (owner): hover, keyboard focus or tap shows the name, a
      subline (`itemSubline`: affinity · skill for weapons) and the requirement warning (`itemWarning`, also a
      small mark on the tile). `BuildSummary`'s `GearTile` + `Tooltip` are the start; T45 makes them full cards.
    - Sticky under the tab bar when it fits the window, else it scrolls with the page.
    - Identical on all three tabs, signed in or out, tracking or not.
  - **Description**: the write-up or T47's generated one. **Guide**: T46's How to get tab, renamed.
    **Comments**: as today.
  - **Removed:** the Loadout tab and `LoadoutPanel`; `Loadout`'s view mode (its edit rows may live on in the
    phone sections); `TabLinkCard`; `MoreByAuthor` with its test and e2e step; the condensed summary as a
    separate thing (it becomes the sidebar).
  - **Editing** keeps "edit mode is the view layout": the sidebar becomes editable (StatsCard's class picker
    and inputs; tiles are buttons that open the picker, empty slots as placeholder tiles named on hover,
    warnings on the tiles). While editing, the only tab is Description (the markdown editor), with the sticky
    Save bar as today. New builds the same.
  - **Phones and tablets** (< 900 px, `BELOW_TABLET`): no tab bar; collapsible sections under the title
    section, in this order: Stats · Weapons (with arrows) · Armor · Talismans · Spells\* · Tears, rune and ash ·
    Items\* · Description · Guide · Comments (\*only when the build has some).
    - A closed header is a glance: Stats → the rune level and the three highest attributes; gear sections →
      their icons; Guide → "21 stops", or "3 of 14 items" while tracking; Comments → the count and the start of
      the latest.
    - Opening a gear section lists its items as rows with icon, name and subline (like `ItemRow`), so phones
      get names without hover. Stats opens to the compact sheet (4×2 attributes, vitals, equip load, poise).
    - On load, the section the URL names is open (Description by default; `/guide`, `/comments`), the rest
      closed. Several can be open at once. Opening a content section replaces the URL (no history entry per
      tap). An open section's header sticks to the top while you scroll through it, so it closes from anywhere.
    - Headers are `<button aria-expanded aria-controls>` ≥ 44 px; each section is a region named by its header.
    - Editing on phones: the build sections open as edit rows (picker buttons, stat inputs), Description as
      the editor.
  - Tests: `tabs.test.ts`, `BuildTabs.test.tsx`, `BuildEditorPage.test.tsx`, `BuildHeader.test.tsx`, the
    sidebar (from `BuildSummary.test.tsx`/`StatsCard.test.tsx`), the phone sections (open and close, the URL's
    section open, the glances), what remains of `Loadout.test.tsx`, `test/editor.tsx` if the editor's entry
    points move; e2e `build-tabs`, `community` (no More by), `build-flow` (editing in the sidebar),
    `build-image`, `guide`, `tracking`, `playing`. `npm run check` and `npm run e2e` pass.
  - Screenshots: each tab desktop and `--mobile` (sections closed and opened), tracking and not, edit mode, and
    a build with no gear (SEEDNAKED001).
  - Docs: decisions "Build page layout", "Redesign v2" and "Build page and editor" revised (owner's design,
    2026-11-16); AGENTS.md map (`features/editor/sections`) and "Where things stand"; docs/architecture.md;
    the `run-app` skill if it names the Loadout tab; docs/product.md "Priorities".
- **Context:** the design came from a review on 2026-11-16 (inline mockups, not saved): the owner chose a
  fixed build sidebar over an Overview/Guide split and over one long page, so the build reads the same
  everywhere and only the Guide changes while tracking. Files: `BuildEditorPage.tsx` (layout: `WithSummary`,
  `Summary`, `Cards`), `sections/{BuildHeader,BuildTabs,BuildSummary,StatsCard,Loadout,LoadoutPanel,
TabLinkCard,MoreByAuthor}.tsx`, `ItemRow.tsx`, `itemDetails.ts`, `slots.ts`, `tabs.ts`, `app/routes.tsx`,
  `components/ui/{Tooltip,ItemTile,Frame}.tsx`, `theme/media.ts`. The Gotcha on `@/data/core` vs `@/data`: the
  sidebar renders on every build view, so its tooltips use light data. Big: the plan may split it (e.g. desktop,
  then phones) as long as each part ships with the whole build still visible on phones.

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

### T32 — Make a copy: a build based on another

- **Status:** ready (T42 made room for `basedOn`; the button goes in the build's title section, shorter since
  T48); owner decisions first
- **Session:** Opus · extra high effort · plan mode on
- **Goal:** Any signed-in user can start a new build from any build they see, change as little or as much as they
  like, and save it as their own. The copy always credits the original, so its author doesn't feel copied
  without appreciation (owner's idea, 2026-11-16).
- **Done when:** (ask the owner about the ★ items in one question at the start; mock the button, banner and
  credit line on the redesign canvas first)
  - Model: an optional `basedOn: { buildId, ownerId }` on a build, set only when it's created and never changed or
    removed, so credit can't be stripped later. Rules: on create, `basedOn.ownerId` must equal the parent's
    `ownerId` (one `get`); on update, `basedOn` is unchanged. Existing builds don't have it: no migration. Rules
    budget (T42): creates have 93 paddings of headroom and `tests/rules/budget.test.ts` guards 90. Put the check
    in `validNewBuild` (create only; on update it's free: `basedOn` isn't in `ownerEdit`'s key list, so it can't
    change), take a `basedOn` argument rather than re-reading `d.basedOn` (docs/firebase.md "Rules budget"),
    add `basedOn` to the create case in the budget test, measure with `RULES_BUDGET=measure npm run test:rules`
    and lower `HEADROOM` by what it spends. Rules tests: a valid copy, a wrong `ownerId`, a missing parent,
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
  - ★ A "Variations" tab on the build page with its count, shown only when there's at least one. Since T48 the
    tabs are Description · Guide · Comments beside the build sidebar, with collapsible sections on phones:
    decide then whether Variations is a fourth tab (and section) or part of Description. The count is one `count()` aggregation (`where('basedOn.buildId', '==', id)`, about 1
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

### T43 — Branded email action page (reset password, verify email)

- **Status:** ready (owner, 2026-11-16: later than T30)
- **Session:** Sonnet · high effort · plan mode off
- **Goal:** The links in password-reset and verification emails open a page on soulsbuilds.com in the site's
  look, instead of Firebase's default page on soulsbuilds.firebaseapp.com.
- **Done when:**
  - A route `/auth/action` reads `mode` and `oobCode`: `resetPassword` → `verifyPasswordResetCode` (shows the
    email), a new-password form (`PasswordInput`, `LIMITS.password`) → `confirmPasswordReset`, then "Log in";
    `verifyEmail` → `applyActionCode`, then a confirmation; expired or used links get a clear message and a way
    to ask again (the reset view, or Resend on the profile).
  - The owner sets the action URL in the console (Authentication → Templates → Customize action URL →
    `https://soulsbuilds.com/auth/action`); steps in `docs/firebase.md` "Sign-in setup".
  - Unit tests for the page's states (Auth calls mocked); e2e with the Auth emulator's out-of-band codes
    (`/emulator/v1/projects/demo-soulsbuilds/oobCodes`); `npm run check`, `npm run e2e`; screenshots desktop and
    `--mobile`.
- **Context:** `lib/firebase/auth.ts` (add the calls there), `features/auth/` (FormField, useFieldErrors,
  styles), `app/routes.tsx`, decision "Email verification" (send-only). The emulator's links point at its own
  handler, so e2e builds the `/auth/action?mode=…&oobCode=…` URL from the oobCodes endpoint.

### T45 — Item cards on hover across the build page

- **Status:** ready after T48 (owner, 2026-11-16: no rush)
- **Session:** Opus · high effort · plan mode on
- **Goal:** Hovering over (or focusing) any item image on the build page (above all T48's sidebar, where items
  are named only on hover; also the Guide's route icons and the title section's tile) shows a small card with
  the item's name and the few facts a player wants at a glance. The landing page's rows stay as they are.
  T48 ships the first version (name, affinity · skill, requirement warning); this ticket fills in the facts.
- **Done when:** (★ owner questions first: which facts per kind; how it works on phones)
  - One shared hover card for every item tile on the build page. The facts are per kind, kept short. A
    proposal to confirm:
    - Weapons: type, affinity and skill, scaling grades, requirements (met or unmet for this build's stats,
      like `itemWarning`), weight.
    - Armor: weight and poise.
    - Talismans, tears, Great Runes: their effect.
    - Spells: FP cost, slots and requirements.
    - Spirit Ashes: FP/HP cost.
  - ★ Only what `src/data/` already has (check `schema.ts`); a missing fact means a pipeline change in
    `scripts/data/` from the owner's export, never a new source (golden rule 5).
  - Opens on hover and keyboard focus, closes on Escape and when the pointer leaves. Phones have no hover:
    ★ tap shows it, or the card stays desktop-only (T48's phone sections already name the items when opened). It never covers the edit-mode tile buttons or blocks a
    click. Visual only for screen readers unless the facts also go in the accessible name or description.
  - The card's facts come from a pure helper (e.g. extending `features/editor/itemDetails.ts`) with unit
    tests; component tests for show and hide; `npm run check`; screenshots desktop and `--mobile`; `npm run
perf` shows no regression (the full data loads with the editor only, docs/data.md).
- **Context:** `components/ui/{Tooltip,ItemTile}.tsx` (Tooltip already places a bubble on screen and is
  `aria-hidden`), `features/editor/{ItemRow.tsx,itemDetails.ts}`, `sections/{Loadout,BuildSummary,
BuildHeader}.tsx`, `guide/GuideRoute.tsx` (route icons), `src/data/{index.ts,schema.ts}`, the Gotcha on
  `@/data/core` vs `@/data`.

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

- T46 — Tracking lives in the Guide — 2026-11-16 — tracking only on How to get: `TrackingBar` (progress,
  Your stats, Stop; Build complete), the new-items notice, a checkbox on each build item in the route
  (`itemTrackKeys`; `toggle` takes an item's keys); hero's Track → the tab, "Tracking" link while tracking;
  profile cards → `/route`. Gone: `TrackingHero`, `NextStop`, Loadout/StatsCard/ItemRow tracking, ItemTile's
  `collected` badge, the route's second bar.
- T42 — Free up rules budget on builds — 2026-11-16 — headroom 0 → 93 paddings (create), 17 → 99 (edit); a
  level-1 build with every slot filled couldn't be saved before. Builds rules rewritten for fewer evaluated
  expressions (stats in one regex, one level sum, key sets by size, args over `incoming()`/`let`, no redundant
  `is` checks); owner: Ash of War and arrow slots by length only (decision "Items in builds"). Guard
  `tests/rules/budget.test.ts` (`HEADROOM` 90; `RULES_BUDGET=measure`); cost model in docs/firebase.md "Rules
  budget".
- T44 — Check off route stops that aren't gear — 2026-11-16 — owner: one "Mark done" per stop (How to get and
  the Next stop card), not in the percentage, and no inference (a later stop done says nothing about earlier
  ones, gear or marks). `guide/progress.ts` `stopMarkKeys` (a stop's gate and item keys, not its number) +
  `stopProgress(…, marked)`; `RouteAction.gate`; `applyChange` `mark` (pruned to the route); optional
  `marked` on the tracking doc (`validTracking`: list ≤ 64); e2e `guide.spec.ts`; decision "Route stops done".
- T31 — Profile and account settings — 2026-11-16 — owner: no canvas mock, name menu in the header, Google-only
  accounts set a password (no email change), framed profile hero. `/account` (`features/account/`: display name,
  email + verify notice + change by link, sign-in methods + change/set password, Log out, DeleteAccount moved
  here); `reauthenticate` in `lib/firebase/auth.ts` before every change (set password = `updatePassword`:
  `linkWithCredential` fails for the account's own email); `useAuth()` snapshots email/verified/providers +
  `refreshUser()`; `app/AccountMenu`; e2e `settings.spec.ts` + `helpers.ts` `accountMenu`/`headerLogIn`.
