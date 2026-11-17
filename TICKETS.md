# Tickets

Living, ordered backlog. **One ticket per session**: `/clear` → `/start Tn` → work → `/wrap`. The agent that
wraps a session updates this file and picks the next ticket. Rules: `.claude/skills/wrap/SKILL.md`. Capture
ideas any time with `/ticket`. Ticket numbers are never reused; **next free: T78**.

Each ticket has: **Status**, **Session** (model · effort · plan mode), **Goal**, **Done when**, **Context**
(read-first files, decisions, pitfalls). A fresh session reads the ticket and only what it names.

**Next:** T74 (home list: rows and the filter bar), then T72, T73, T76, T75, T77: the UI/UX pass's tickets in
Up next. The remaining tickets (T65, T57–T61)
wait in **Backlog > Priority backlog** until the owner says to take them out; copies (T32, T33) stay parked.
T50 is code-complete; deploying it and the Search Console steps are owner to-dos below.
The redesign (owner's call, 2026-11-16) comes from a canvas mockup, the private "Souls Builds redesign"
artifact (https://claude.ai/artifact/6Wuekku4Q9cGVkmN7iS9ym): read an artboard with the Artifact tool's `read`
action and `path` (e.g. `project/BuildTabs.dc.html`); each one's `<helmet>` style holds the exact colors, sizes
and spacing, and the canvas notes say why.

**Owner to-dos** (from T12; checklist in `docs/firebase.md` "Relaunch checklist"):

- After T50 deploys (CI on `main` or `npm run deploy`; functions and hosting together): check
  `curl -sI https://soulsbuilds.com/build/NOSUCHBUILD` (404), `curl -s https://soulsbuilds.com/sitemap.xml | head`
  and `curl -sI https://soulsbuilds.com/robots.txt`. Then **Google Search Console**: add a _domain_ property for
  soulsbuilds.com (a DNS TXT record at the registrar), submit `https://soulsbuilds.com/sitemap.xml`; **Bing
  Webmaster Tools**: import the site from Search Console, submit the sitemap there too. Cold start: leave the site
  idle 30+ minutes, then `curl -s -o /dev/null -w '%{time_starttransfer}\n' "https://soulsbuilds.com/build/<id>?x=$RANDOM"`;
  if it's still over ~1 s, decide on `minInstances: 1` in `functions/src/index.ts` (roughly $5–10 a month; the
  Billing page is the truth) and note it in `docs/decisions.md` "Crawlers".
- Copy the Dark Souls III, Dark Souls Remastered and Dark Souls II Smithbox exports to the Mac (T58, T60, T61 are
  blocked on them; T57 settles the folder layout, `~/Documents/soulsbuilds-gamedata/<game>/` planned). Note
  which Smithbox version and game patch each came from, like the Elden Ring export's `VERSION.txt`.
- Seeded builds (T52, T53) are in production (2026-11-17). Left: change the Souls Builds account's password if not
  done yet (it was pasted into a session), resubmit the sitemap, and message the credited creators (KeenGamer,
  Console Pulse, eip.gg's Kelson H. and Joseph Ferguson) with their pages.
- After T55 deploys (CI on `main`: functions, hosting, rules and indexes together): wait for the new
  `equipment.weapons` index to show **Enabled** (Firestore → Indexes; weapon pages serve the plain page until then),
  then `curl -sI https://soulsbuilds.com/weapons/moonveil` (expect `s-maxage=300`),
  `curl -s https://soulsbuilds.com/sitemap.xml | grep -c -e weapons/ -e tags/`, open a weapon page and a tag page.
  The landing's Popular weapons appears after the next daily stats run (or Actions → Community stats → Run
  workflow). Resubmit the sitemap in Search Console.
- After T62 deploys (CI on `main`: hosting, rules and indexes together): wait for the new `commentLikes.userId`
  collection-group index to show **Enabled** (Firestore → Indexes; account deletion fails until then), then on
  a build's Discussion tab like a comment, reply to one, and switch Top/Newest.
- After T69 deploys: `curl -s https://soulsbuilds.com/ | grep -c 'Plan, share and follow'` (expect 1) and
  `curl -s https://soulsbuilds.com/build/IAumzY2DNj2NHObXD0QB | grep -c 'sb-home'` (expect 0: the function strips it).
- After T56 deploys: paste a build URL into https://search.google.com/test/rich-results (breadcrumbs should pass; `CreativeWork` has no rich result, only a schema check), and resubmit the sitemap in Search Console (its URLs now carry the slugs).
- T43's action URL (Authentication → Templates → Customize action URL → `https://soulsbuilds.com/auth/action`)
  is **blocked**: the console and the API refuse it (`EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED`, 2026-11-17). Try
  again later, set up the custom email domain, or ask Firebase support; details in `docs/firebase.md` "Sign-in
  setup" step 6. Until then the emails use Firebase's default page.
- Approve the first CI production run (Actions → the run → Review deployments); it proves Workload Identity end to
  end and is the first CI deploy of the link-preview function (T37; its roles were granted 2026-11-17: if it names
  a missing permission, add that role and note it in `docs/firebase.md` "Link previews and crawlers"). Open a throwaway PR once to see the preview comment.
- T37/T38 are live (deployed by hand 2026-11-17). Still to check: paste a never-shared build link into Discord and
  see the card; open soulsbuilds.com and see a hit at abhpro.goatcounter.com (if none, add the domain to its
  allowed domains); `localStorage.skipgc = 't'` on the site keeps your own visits out; look at the first month's
  Blaze bill (the $5 budget alert is set per `docs/firebase.md`).
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
T42 (rules budget), T45 (item cards), T46 (tracking in How to get), T47 (generated descriptions), T37 (link previews), T38 (usage counts), T48 (build page v3 on
desktop), T49 (phones), T43 (email action page), T50 (crawlable build pages), T51 (head tags), T56 (named URLs, JSON-LD), T63 (Equipment and Discussion tabs), T54 (Share menu), T55 (weapon and tag pages), T62 (comments) and T66 (build page above the fold).

## In progress

(none)

## Up next

The owner's current run of requests (2026-11-17), one at a time, before anything in the Priority backlog.

**Newcomers (owner, 2026-11-17):** a first-time visitor can't tell what the site is or what to do. Checked on
the live site: the home page is only the list (no pitch; `index.html`'s `#root` is empty, so crawlers on `/`
read only the meta tags); the home title promises a "Build Planner" (the top search modifier, `docs/product.md`
"Seeding") but signed out, `/build/new` is a log-in wall and the header has no way to plan; build pages (where
most people arrive) never say that the Guide is a step-by-step route to every item you can track. Not mainly
SEO (T50–T56 did that): it's what people see once they arrive. Owner's calls: plan before signing up; an intro
band above the home list; a slim dismissible strip on build pages. T68, T69 and T70 are done.

**UI/UX pass (owner, 2026-11-17):** a second eye on the whole UI, with **award-level design** as the bar: a
newcomer sees what's going on and where to start, and it stays powerful for people who stay. Walked on the
emulator at 1440×900 and 375×812, signed out and signed in, plus the live home page's numbers. Left alone on
purpose (clear as they are): the home intro, the new-here strip, the tracking intro, the auth dialogs, the
Guide while tracking, item cards, the Equipment layout, weapon and tag pages, the account page, the 404. T71
(the write-up named in its tab) is done; the rest in this order.

#### T74 — Home list: build rows and the filter bar

- **Status:** ready (mock first; owner's ideas, 2026-11-17)
- **Session:** Opus · high effort · plan mode on
- **Goal:** The home list reads like a ranked feed: a build's popularity shows at a glance and compares with
  the rows around it (owner: "more like Reddit"), and search, sort and filters are one compact, expressive bar
  instead of four rows of controls.
- **Done when:** (ask the ★ items in one question at the start; mock the row and the bar on the redesign
  canvas, desktop and phone, and get the owner's OK before building)
  - **Row:** a left rail with the like count large; comments and "N playing" in the meta line; level smaller
    on the right with the slot strip. **Zero is quiet**: an outline heart with no number, counts only when
    there are some. Live data on 2026-11-17: the top build has 3 likes, nine builds have any, all 22 seeded
    builds have 0, so a big number column would be a column of zeros.
  - ★ **Default sort.** "Most liked" over mostly-zero likes puts 4-year-old builds with one like above
    everything new. Recommended: likes, then newest among ties (a composite index, no model change). A decayed
    "hot" score needs a stored field and rules (budget, T42): later, if at all.
  - ★ **Liking from the list.** Recommended no: a like is a heart, not a vote, the row is one link, and a like
    without opening the build says little.
  - **Bar:** one search field, then one row of chips with popovers: Sort, Level (presets Any · to 50 · 51–100
    · 125–150 · 200+ · Custom: the levels people build at, `docs/product.md`), Tags, Weapon; active filters as
    removable chips with Clear and the result count; the "Most liked first" caption goes. Phones: search plus
    one **Filters** button that opens a sheet (today the controls fill the first phone screen before any
    build). Filters stay in the URL (`filters.ts`).
  - ★ **Search finds what people type.** Today it matches only the start of a build's name (`searchBuilds`: a
    prefix query on `nameLower`) and replaces the sort: "dark moon" doesn't find "Level 100 Dark Moon
    Greatsword Build". Recommended: search in the browser over a compact index (id, name, tags, main weapon,
    likes; under 100 builds today) written by the daily stats job next to `stats/<game>`, words anywhere in
    the name, weapon and tag matches offered as links to their pages (`lib/hubs.ts`), the sort kept; the
    prefix query stays as the fallback for builds newer than the index. No rules or model change. Split this
    into its own ticket if the session runs long.
  - Tests for the new filter logic and the row; e2e for a filtered, searched list; screenshots desktop and
    `--mobile`; `docs/decisions.md` ("Landing", the sort, the search index).
- **Context:** `features/builds/{Landing.tsx,BuildsList.tsx,filters.ts,tags.ts,queries.ts}`,
  `lib/firebase/builds.ts` (`searchBuilds`, sorts), `firestore.indexes.json`, `scripts/admin.mjs stats` and
  `lib/firebase/stats.ts` (the daily job), `lib/hubs.ts`, the hub pages' `HubBuilds` (same rows). The redesign
  canvas: see the top of this file.

#### T72 — Back to your run

- **Status:** ready
- **Session:** Opus · high effort · plan mode on
- **Goal:** A player tracking a build gets back to it in one tap. Today the signed-in home page shows nothing
  about their run; the way back is name menu → Profile → Playing.
- **Done when:** (owner's pick, 2026-11-17: home row + menu link)
  - Home, signed in with a build in progress: a **Continue your run** row above the list: the build's image
    and name, the progress bar, the next stop, opening the Guide. Several in progress: the most recently
    tracked first, the rest behind "All N" to the profile's Playing tab. Nothing for accounts that track
    nothing (no extra read for them beyond `tracksAnyBuild`, T41), nothing signed out.
  - Account menu: **Playing** above Profile, to the profile's Playing tab.
  - Phones, on a build you're tracking: the Guide section first and open, its glance "Next: <stop>".
  - Tests (unit + e2e: track, go home, continue); screenshots desktop and `--mobile`; docs.
- **Context:** `features/tracking/{queries.ts (useTrackedBuilds, splitTracked),TrackedBuilds.tsx,PlayingList.tsx,
ProgressBar.tsx}`, `features/builds/Landing.tsx`, `app/AccountMenu.tsx`,
  `features/editor/sections/{BuildSections.tsx,glances.ts}`, `features/editor/guide/progress.ts` (the next
  stop). The rewards rule (`docs/product.md`): the row reports the run, it doesn't nag.

#### T73 — The planner's first minute

- **Status:** ready
- **Session:** Opus · high effort · plan mode on
- **Goal:** Someone who pressed "Start planning" knows what to do without reading: the equipment is in view
  and the empty slots invite a tap. Today `/build/new` opens on a form (name, tags, build image), the
  equipment starts halfway down, and empty slots are faint squares with a dot.
- **Done when:** (owner's pick, 2026-11-17: slots + compact title)
  - Empty slots in edit mode show a **+** and what goes there (helm, chest, gauntlets, legs, crystal tear,
    great rune, spirit ash: the labels exist as the buttons' accessible names).
  - One line above the panel on an empty build: pick a starting class, then tap a slot. It goes once the
    build has gear.
  - The title block in edit mode fits one row on desktop (name, tags, image), so the equipment is in view at
    1440×820.
  - Save without a name: the message shows only in the bottom bar while the name field is off screen: focus
    and scroll to the field, the error under it.
  - One name for the action. Today "Plan a build" (signed out), "New build" (header, signed in), "Create a
    build" (profile).
  - Tests; e2e (`build-flow`, the signed-out planner); screenshots desktop and `--mobile`; docs.
- **Context:** `features/editor/sections/{BuildDetailsForm.tsx,EquipmentSection.tsx,GearTiles.tsx}`,
  `features/editor/useBuildEditor.ts` (the name check, line ~126), `features/auth/FormField` +
  `useFieldErrors` (errors by field, focus the first), `app/Header.tsx`, `features/profile/Profile.tsx`,
  `features/builds/intro.ts`.

#### T76 — Small fixes from the UI/UX pass

- **Status:** ready
- **Session:** Sonnet · low effort · plan mode off
- **Goal:** The rough edges the pass found, in one short session.
- **Done when:**
  - Phone build title: the tags' second row no longer touches the Track/Like/Share row, and "Report" doesn't
    hang alone under them.
  - The Guide's legend ("in this build / other items", "collected / still to get") stops looking like two
    unchecked filter checkboxes: non-interactive swatches.
  - Signed out, the comment box is a live-looking textarea ("Log in to comment") with a Post button: one "Log
    in to comment" button that opens the dialog (check what it does today first).
  - The stat rows' "+5" names its source on hover or focus (talisman, great rune), if it doesn't already.
  - Screenshots of each, desktop and `--mobile`; `npm run check`, `npm run e2e`.
- **Context:** `features/editor/sections/{BuildHeader.tsx,BuildActions,StatsCard.tsx,CommentForm}`,
  `features/editor/guide/GuideSection.tsx`.

#### T75 — Picker rows with facts

- **Status:** ready
- **Session:** Sonnet · medium effort · plan mode off
- **Goal:** Planners choose by numbers. Today the picker lists 214 helms and 487 weapons by name only: no
  weight, poise or requirements, and nothing on hover.
- **Done when:**
  - Each row has one muted fact line from `itemFacts.ts`: armor weight · poise; weapons type · requirements
    (marked when the build's stats don't meet them); spells FP · slots · requirement; talismans their effect
    if the data has a short one.
  - Armor sorts by name, weight or poise.
  - Removing a weapon is one step: Remove on the Ash of War and affinity step (today: tile → Change weapon →
    Remove).
  - The list stays fast on a phone (487 rows; measure before and after). Tests; screenshots desktop and
    `--mobile`.
- **Context:** `features/editor/{ItemSelector.tsx,picker.ts,itemFacts.ts,itemDetails.ts}`, the weapon step
  (`WeaponOptions`). Picker code loads `@/data` (the full data), which is fine there.

#### T77 — Craft pass at full resolution

- **Status:** after T74, T72, T73 (the structure settles first)
- **Session:** Opus · high effort · plan mode on
- **Goal:** The details an award jury (and every user, without naming them) notices, which the UI/UX pass
  couldn't judge through a downscaled browser pane.
- **Done when:** findings fixed as the session goes; anything large becomes a ticket.
  - **Full-resolution review** with `npm run screenshot` at 1440, 1000 and `--mobile` of every page and
    dialog: alignment, spacing rhythm, type, truncation, the accent budget.
  - **States:** loading (no blank panels or layout jumps while builds, the route or the picker's data load;
    the picker's first open loads ~1 MB), empty, error and offline for each page.
  - **Motion**, small and purposeful, honouring `prefers-reduced-motion`: tab changes, dialogs and popovers,
    an item checking off, the progress bar moving, and the **Build complete** moment: the one place the site
    should feel like the game (`docs/product.md`, the rewards rule).
  - **Keyboard and screen reader:** every flow start to finish without a mouse (plan a build, pick items,
    track, comment); focus order and visible focus; the page behind an open dialog out of reach.
  - **Touch:** the phone editor end to end; targets ≥ 44 px; nothing that needs hover.
- **Context:** `src/theme/` (motion, spacing, fonts), `components/ui/` (Dialog, FocusScope, Tooltip),
  `docs/architecture.md` "Styling", the run-app skill for screenshots.

## Backlog

### Priority backlog

Set aside by the owner on 2026-11-17 while they bring a run of other requests (Up next). These come **next after
those**, in this order, but stay here until the owner says to take them out of the priority backlog: never move
one to Up next, pick it as the next ticket, or name it in the **Next:** line before then.

#### T65 — Second batch of seeded builds, from real search data

- **Status:** blocked — wait for 4–6 weeks of Search Console data after T50's deploy and the owner's T52
  production seeding (owner to-dos)
- **Session:** Sonnet · medium effort · plan mode off
- **Goal:** Add about 10 builds for what people actually search when they land on Souls Builds, and drop or
  rework seeds nobody opens.
- **Done when:** the owner exports Search Console's queries and pages (Performance → Export) and GoatCounter's
  page views into the session; the agent proposes ~10 builds matching the queries with impressions but no good
  page, gets the owner's OK on the list, then follows `content/builds/README.md` (sources read, never invented;
  gaps named; our write-up), dry run reviewed, `--write` on the emulator, screenshots; production with the
  owner's go-ahead (docs/firebase.md "Seeded builds"). Tag pages (T55) with fewer than 3 builds are a good gap
  to fill.
- **Context:** `content/builds/README.md`, `scripts/seed-builds.mjs`, `docs/product.md` "Seeding" (sources that
  work for the agent: KeenGamer and eip.gg through the browser, Game8, Fextralife; Reddit and YouTube transcripts
  don't). Fextralife at most half the batch.

#### T57 — More games: the foundation (still only Elden Ring)

- **Status:** ready (do before T58–T61)
- **Session:** Opus · extra high effort · plan mode on
- **Goal:** Everything game-specific goes through the game, so Dark Souls III, Dark Souls Remastered and Dark
  Souls II (owner, 2026-11-16) can each be added as data plus a few per-game pieces, with the same function and
  UX for every game; only the look changes (owner, 2026-11-15).
- **Done when:** (plan mode: if it doesn't fit one session, split it into tickets here)
  - `GameId` becomes a union (`er`, `ds3`, `ds1`, `ds2`, IDs the session picks), the registry in
    `src/app/game.ts` has each game's name, stats and slots. Routes per game: `/` stays Elden Ring; `/ds3`,
    `/ds1`, `/ds2` landings; builds keep `/build/<id>` (a build knows its game) and `useCurrentGame()` reads
    the route or the build. A game switcher in the header, shown only for games with data.
  - The build model per game: `Equipment` and attributes as a union by `game` (DS games: rings instead of
    talismans (2 in DS1, 4 in DS2 and DS3), infusions instead of affinities, weapon arts fixed by weapon in
    DS3, no Ashes of War, tears, Great Rune or Spirit Ash; DS1 has 8 attributes, DS2 and DS3 9, with different
    names). `firestore.rules` validates by game, one branch evaluated per request: **measure the rules budget**
    (T42; builds are near it) and design for it before writing rules.
  - Game data per folder (`src/data/<game>/`), `@/data` and `@/data/core` loading the current game's files
    lazily (docs/data.md: core stays small); the pipeline takes a game (`npm run data -- ds3`) and the export
    folder becomes `~/Documents/soulsbuilds-gamedata/<game>/` (the owner moves the Elden Ring export into
    `er/`, or the script falls back to the old layout).
  - Per game: skin (`src/theme/skins.ts`), tags, link-preview card text ("Level 120 Dark Souls III build"),
    page titles (T51), sitemap (T50), community stats (`stats/<game>`).
  - The Guide (route and tracking) needs hand-written progression per game (`scripts/data/progression.ts`,
    `places.ts`, `events.ts`). ★ Recommended: Dark Souls builds ship **without the Guide tab** first (tabs.ts
    already decides which tabs show), routes later per game. Owner decides.
  - Elden Ring unchanged: every existing test, e2e and screenshot looks the same. No data migration (every
    build already has `game: 'er'`).
  - Docs: `docs/decisions.md` (the multi-game model), `docs/architecture.md`, `docs/data.md`, AGENTS.md.
- **Context:** `src/app/game.ts`, `src/lib/models.ts` (`GameId`, `Equipment`, `IMAGE_KINDS`, `LIMITS`),
  `src/data/{index,core,schema,rules}.ts`, `scripts/data/` (pipeline), `firestore.rules`,
  `tests/rules/budget.test.ts`, `src/theme/skins.ts`, `features/editor/{slots.ts,gear.ts,tabs.ts}`,
  `src/lib/buildMath.ts` (game tables come in as arguments already). This replaces the backlog's "Other
  games" idea (owner, 2026-11-15: maybe Demon's Souls and Bloodborne later; Sekiro and Nightreign need their
  own build models).

#### T58 — Dark Souls III: the data

- **Status:** blocked — the owner's Smithbox exports of Dark Souls III aren't on the Mac yet (only the Elden
  Ring one is in `~/Documents/soulsbuilds-gamedata`, 2026-11-16); copy them per T57's folder layout. Needs T57.
- **Session:** Opus · extra high effort · plan mode on
- **Goal:** `src/data/ds3/` and its icons, in the same shape and quality as Elden Ring's (docs/data.md), from
  the owner's own export (golden rule 5: the owner's export, no other sources).
- **Done when:**
  - `docs/game-data-extraction.md` gets the Dark Souls III steps (Smithbox: params to CSV, text dump, icons),
    checked against what the owner exported.
  - `npm run data -- ds3` writes weapons (with infusions and weapon arts), armor, rings, spells (sorceries,
    miracles, pyromancies), consumables if builds use them, starting classes and stat curves (HP, FP,
    stamina, equip load), and icons as webp. DS3 params are close to Elden Ring's (`EquipParamWeapon`,
    `EquipParamProtector`, `EquipParamAccessory`, `Magic`), so start from `scripts/data/extract.ts`.
  - `src/data/data.test.ts` integrity checks per game (every icon exists, names unique, known items present:
    spot-check a dozen against the game).
  - Docs: docs/data.md "v2: src/data/ds3/" with what the data taught us.
- **Context:** `scripts/data/` (extract, constants, icons, character, export), docs/data.md "The pipeline" and
  "What the game data taught us", T57's per-game layout. Never Read the JSON files whole (golden rule 4).

#### T59 — Dark Souls III: builds, then seeded

- **Status:** after T58
- **Session:** Opus · high effort · plan mode on
- **Goal:** People can make, browse and share Dark Souls III builds, and the game launches with content.
- **Done when:** the editor, picker (infusions instead of affinities, rings), sidebar stats and build math
  (DS3 tables from T58), item cards, landing (`/ds3`), link-preview card and the SEO pieces (T50, T51, T55
  hubs if done) work for DS3; rules tests for DS3 builds; e2e: make a DS3 build. Then about 15 seeded builds
  with T52's script and credit rule before the game shows in the switcher. Screenshots desktop and `--mobile`.
- **Context:** T57's per-game pieces, T58's data, T52's seed script.

#### T60 — Dark Souls Remastered: data, builds, seeded

- **Status:** blocked — needs the owner's export (as T58) and T59 done
- **Session:** Opus · extra high effort · plan mode on
- **Goal:** Dark Souls (Remastered) like T58 + T59, in one or two sessions (split here if needed).
- **Done when:** data (`src/data/ds1/`: 8 attributes, 2 rings, upgrade paths as infusions, no weapon arts),
  extraction steps in `docs/game-data-extraction.md`, builds and build math, about 15 seeded builds, tests and
  screenshots as T59. Remastered only, not Prepare to Die (owner's call if they want PtDE).
- **Context:** T58/T59 as the pattern; Smithbox's DS1R params are older-style but similar to DS3's.

#### T61 — Dark Souls II: Scholar of the First Sin: data, builds, seeded

- **Status:** blocked — needs the owner's export and T60 done
- **Session:** Opus · extra high effort · plan mode on
- **Goal:** Dark Souls II (SOTFS) like T60. Last because it's the odd one: different param layout
  (`WeaponParam`, `ItemParam`, `ArmorParam`, text in a different format), Adaptability and Agility, power
  stance, 4 rings, infusions, a different equip load and HP model.
- **Done when:** as T60, for `src/data/ds2/`. Plan mode decides what the build model needs for power stance
  (probably nothing: it's two weapons in the right hand).
- **Context:** T58–T60 as the pattern; expect the extraction to need its own code path.

### Parked tickets

Written in full and **set aside by the owner indefinitely**. Never move one to Up next, pick it as the next
ticket, or put it in the **Next:** line unless the owner asks for it by number. Wrapping and starting skip them.

#### T32 — Make a copy: a build based on another

- **Status:** parked indefinitely (owner, 2026-11-16 and again 2026-11-17: wanted, but only when the owner asks
  for it). T42 made room for `basedOn`; the button goes in the build's title section, shorter since T48; owner
  decisions first
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

#### T33 — Variations: every copy of a build, on its page

- **Status:** parked with T32 (after it)
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

### Ideas

- Comments (T62 follow-ups, owner's call): notifications when someone replies, editing a comment, markdown or
  mentions in comments, collapsing a thread, downvotes.
- Hub pages (T55 follow-ups): talismans, spells and spirit ashes get pages the same way (their lists are compacted
  arrays, so `array-contains` works; one index each); landing rows could link their tags (stretched-link row
  instead of a whole-row `<a>`); the item card's weapon name as a link needs a hoverable card.
- Phone sections (T49 follow-ups, small): opening a `/guide` or `/comments` link directly doesn't scroll to that
  section (only navigation within the page does, `BuildSections`); the title section's "Tracking" link does
  nothing when the URL is already `/guide` and the Guide was closed; "Jump to" links under the sticky
  Description header weren't tried on a phone (`MarkdownView` scroll margin).
- Route (T15 follow-ups): upgrade materials (Smithing/Somber stones, needs upgrade levels on builds), rune
  farming to the build's level (where and how long), and the starting class: builds now save one (T8,
  `startingClass`; classes in `character.json`), so the route can say "your Samurai starts with it" instead of
  "or start as X", and suggest a class for builds without one.
- Item cards (T45 follow-up): scaling grades at the build's upgrade level, not +0 (needs upgrade levels on
  builds, like the route's upgrade materials; ReinforceParamWeapon's correction rates from the export).
- Markdown editor in the site's palette: since T28 it's pinned to the editor's own dark theme (`data-color-mode`
  in `index.html`), GitHub's bluish dark rather than `COLOR_INSET`/`COLOR_TEXT`; override its CSS variables in
  `sections/Markdown.tsx` (`--color-canvas-default` and friends, see `@uiw/react-md-editor`'s README).
- Delete the unused 2022 doc `app/tags` in production (no rule matches it; it's in the T12 backup).
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

- T71 — The write-up named in its tab — 2026-11-17 — from the UI/UX pass (owner's pick: name it in the tab, layout
  and fold unchanged): the write-up sat under "Discussion 0" (phones: "Discussion · No comments yet"), so nobody
  found it. `tabs.ts` `tabLabel` + `hasWriteUp`: the tab reads **Write-up & comments** with a write-up, **Comments**
  without (URL still `/discussion`); phones: a **Write-up** section after the gear (glance: its first paragraph),
  then Guide, then **Comments** (comments only); a `/discussion` link opens both. The heading is "Write-up"
  everywhere (view, editor, crawler HTML; was "Description"). Tests: `tabs.test.ts`, `BuildTabs.test.tsx`,
  `BuildSections.test.tsx`, `BuildEditorPage.test.tsx`, six e2e specs. Docs: decision row "Build page layout",
  `docs/architecture.md`.

- T70 — "New here?" strip — 2026-11-17 — `src/app/NewHereStrip.tsx`: signed out on build, weapon and tag pages, one line (what the site is, How it works → `/`, Plan your own → `/build/new`, close; dismissal in localStorage `sb-new-here-dismissed`). A separate 44 px row broke `fold.spec` (+35 px), so from 1200 px wide it sits in the header row (shorter text, no Plan link: the nav has Plan a build) and below that in a row under the header. Header nav items `nowrap`.

- T69 — Home page intro — 2026-11-17 — signed out, `/` opens with `LandingIntro` (the page's h1, one sentence,
  three panels: Start planning, See an example route = the Moonveil seed's Guide, Browse builds; copy in
  `features/builds/intro.ts`); the list title steps down to h2; a static copy in `index.html`'s `#root` for
  crawlers, which the link-preview function strips (`share.ts` `stripHome`); usage `intro-*`; Privacy's counted
  actions updated.
- T68 — Plan a build without an account — 2026-11-17 — owner's request (newcomers can't tell what the site is for;
  first of T68–T70): `/build/new` opens for anyone (`useBuildEditor`: a new build is editable signed out); Save
  signed out opens the sign-up dialog and saves as the new account through `onSignedIn` (`useSaveBuild` takes the
  owner per save, since `useAuth` lags); a note beside Save says an account is needed; a `beforeunload` warning
  while an unsaved new build has a name, write-up, tags or gear; header **Plan a build** signed out (desktop nav,
  phone "+" and menu); GoatCounter events `planner-opened-signed-out`, `signed-in-to-save`. No rules change.
  Tests: `BuildEditorPage.test.tsx` (plan, Save, sign in, saved as the new uid), `Header.test.tsx`, e2e
  `build-flow.spec.ts` "plan a build signed out, then sign up to save it" (the old "Log in to create a build"
  e2e test removed). Docs: decision row "Plan before an account", `docs/product.md` "Low friction".

- T67 — Readability pass — 2026-11-17 — owner's request (the site felt too wide, the serif hard to read): type scale one step up and in rem (`fonts.ts`: UI 15px, secondary 14, small 13, labels 12, `TEXT_BODY` 16, `TEXT_NAME` 22); write-ups in Inter 16px/1.7 (`MarkdownView`), EB Garamond only for names and headings ≥ 22px (400/italic/700 no longer loaded; Inter italic added); running text capped at `MEASURE` 35em ≈ 72 characters (write-ups, comments, taglines, legal); `CONTENT_WIDTH` 1240 → 1200 and the stats column 340 → 312 (the owner chose 1160, but the Equipment tab's five-spell row needs 372px columns for the T66 fold); attribute rows 24px and vitals gaps 10px so 1280×800 still fits (~10px to spare); form fields 16px (iOS focus zoom); buttons 14px with 12px sides on phones so Track/Like/Share share a row at 390px (375px wraps, as before).
- T66 — Build page above the fold — 2026-11-17 — owner's request: no "All builds" (the header's Builds lit on build pages, `$section`); unframed top section: title block (88 px image; Report and Edit/Delete top right) then one sticky 64 px row, tabs left (accent as wide as the label) + `BuildActions` (Track, Like, Share) right; denser Equipment panel (no heading, 68 px tiles, `gear.ts` `equipmentLayout` pairs flask/arrows/spells/items up to 5 tiles) and stats card; a full build (`SEEDFULL0001`) fits 1440×820 and 1280×800 (`tests/e2e/fold.spec.ts`; `screenshot --height`). Also: a saved sign-in that can't renew is signed out and every query reloads (`onAuthChange`, `isDeadSession`; locally after `npm run dev` restarts the Auth emulator empty); comments' Top counts the viewer's own likes, held out of the rank until a sort is chosen (`threadComments` `held`). Remaining tickets moved to Backlog > Priority backlog.
- T62 — Comments worth reading — 2026-11-17 — comments fill the column; a heart per comment (`commentLikes/{commentId}_{uid}` + the comment's `likeCount`, ±1 in one batch); Top/Newest (Top ranks without the viewer's own like); one reply level (`parentId` = a top-level comment, "@Name " on a reply to a reply; first 2 + "Show N more" past 3); a deleted comment's replies stay under "Comment deleted"; no migration (old comments read as null/0); "Author" badge; account deletion, `deleteBuild` and `admin.mjs remove`/`delete-user` handle comment likes (`lib/comments.ts`, `CommentItem`, `CommentForm`).
- T64 — Landing title for "build planner" searches — 2026-11-17 — landing title "Elden Ring Build Planner and Builds | Souls Builds" and a description naming stats, equip load and poise (`homeMeta`, `index.html`); judge the effect in Search Console after T50's deploy.
