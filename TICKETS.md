# Tickets

Living, ordered backlog. **One ticket per session**: `/clear` → `/start Tn` → work → `/wrap`. The agent that
wraps a session updates this file and picks the next ticket. Rules: `.claude/skills/wrap/SKILL.md`. Capture
ideas any time with `/ticket`. Ticket numbers are never reused; **next free: T62**.

Each ticket has: **Status**, **Session** (model · effort · plan mode), **Goal**, **Done when**, **Context**
(read-first files, decisions, pitfalls). A fresh session reads the ticket and only what it names.

**Next:** T51 (head tags per page) · Sonnet · medium effort · plan mode off. Then T52–T56 (discoverability), then
T57–T61 (Dark Souls). Copies (T32, T33) are parked in the Backlog until the owner asks for them.
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
- Before T52: sign up a "Souls Builds" account on the live site (it posts the seeded builds), and pick the first
  five community builds to recreate (links).
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
desktop), T49 (phones), T43 (email action page) and T50 (crawlable build pages).

## In progress

(none)

## Up next

Discoverability (T50–T56) and more games (T57–T61) were planned with the owner on 2026-11-16, after T37's link
previews. Order: crawlers can read the site (T50 done, T51), then content (T52, T53), then sharing and hub pages
(T54, T55), then T56. Dark Souls follows (T57 first; the data tickets are blocked on the exports).

#### T51 — Head tags per page: titles, descriptions, canonicals, noindex

- **Status:** ready (after T50 or before; independent)
- **Session:** Sonnet · medium effort · plan mode off
- **Goal:** Every page has its own title and description in the browser tab and in Google's rendered view, one
  canonical URL on soulsbuilds.com, and pages that shouldn't be in search say so. Today nothing sets
  `document.title`: every page is "Souls Builds".
- **Done when:**
  - React 19 hoists `<title>`, `<meta>` and `<link>` rendered anywhere into `<head>` (no library: check
    `node_modules/@types/react` for the types). A small `PageHead({ title, description, canonical, noindex })`
    in `src/components/ui/` (or `src/app/`), used by every route.
  - Titles: home `Elden Ring Builds: Create, Share and Discover | Souls Builds` (from `useCurrentGame()`, so
    each game gets its own in T57); build `<name> · Level <n> Elden Ring build | Souls Builds` (match
    `shareMeta`'s wording: put the format in `src/lib/share.ts` so the function and the app agree); profile
    `<name>'s Elden Ring builds`; privacy, terms, 404.
  - Descriptions: home says "Elden Ring builds" in its first words; builds reuse `shareMeta`.
  - Canonicals on soulsbuilds.com for every indexable page: home without the filter query (search and filter
    URLs canonical to `/`), builds to `/build/<id>` whatever the tab. The static meta in `index.html` stays as
    the fallback, but **no static canonical** there (it would claim every page is `/`); check the function's
    injected canonical and the app's don't both end up in the head (dedupe, or the app skips it when one is there).
  - `noindex`: `/account`, `/auth/action`, the 404 page, profiles with no builds.
  - `index.html`: the home title and description with the keywords; the "Per-build previews would need server
    rendering (backlog)" comment is stale since T37, fix it.
  - Tests: one per kind of page (title and canonical in `document.head`). `npm run check`; e2e still passes.
- **From T50:** the function's build page already has the build's title, description, canonical and (for a
  missing build, status 404) `noindex` in the head (`injectMeta`, `injectNoindex` in `src/lib/share.ts`), and the
  build as plain HTML in `#root`. React 19 hoisting adds tags beside them rather than replacing them, so check the
  head of a function-served page (Hosting emulator, docs/firebase.md "Link previews and crawlers") for duplicates.
- **Context:** `src/app/routes.tsx`, `features/builds/Landing.tsx` (already titled `${game.name} builds`),
  `features/editor/BuildEditorPage.tsx`, `features/profile/Profile.tsx`, `src/lib/share.ts`, `index.html`.

#### T52 — Seeded builds: an import script and the first five, credited

- **Status:** ready (after T50/T51 ideally, so they're crawlable the day they land)
- **Session:** Opus · high effort · plan mode on
- **Goal:** Fill the site with good builds people search for, recreated from community builds the owner picks,
  each one crediting where it came from. A new site with few builds ranks for nothing; content does more than
  any tag (owner, 2026-11-16).
- **Decisions to confirm with the owner at the start** (recommended answers given):
  - **The loadout is copied; the write-up isn't.** Stats and gear are facts anyone can recreate; someone's
    write-up is their writing, and credit isn't permission. Copied text also ranks badly: Google shows the
    original instead (duplicate content). So each seeded build gets an original short write-up (how it plays,
    why these pieces), written by the agent from the source's facts and reviewed by the owner, or the author's
    own text **only with their OK** (a Reddit DM is enough; note it in the seed file).
  - **Credit line** at the end of the write-up, in one fixed format the script adds: "Loadout from <author>'s
    build on <site> ([original](url)). Write-up by Souls Builds." At the end, not the start: the first
    paragraph is the share description (`shareMeta`). No model change; a structured `source` field (shown on
    the card, can't be edited away) is a later option, and it costs rules budget (T42).
  - **Posted by a "Souls Builds" account** (the owner signs it up on the live site), never accounts in the
    original authors' names.
- **Done when:**
  - `scripts/seed-builds.mjs` (or an `admin.mjs` command): reads `content/builds/<game>/*.json` (names, not
    IDs, so the owner can read and edit them: name → ID through `src/data/er/*.json` like
    `scripts/lib/names-to-ids.mjs`, with `src/data/rules.ts` for affinities, Ashes and talisman conflicts),
    checks each build as the rules would (LIMITS, level matches stats), and writes them as the Souls Builds
    account. Dry run by default (prints each build and what it dropped), `--write`, `--project`. Idempotent: a
    seed file carries a stable build ID, so re-running updates instead of duplicating. Runs against the
    emulators first. Production writes are the owner's go-ahead, every time (golden rule 2), after
    `admin.mjs export`.
  - Five Elden Ring builds the owner picks (popular weapons or archetypes: bleed, Moonveil, faith, a DLC build),
    with tags, starting class and build image set. The agent reads the sources (owner's links) with the
    browser tools, never invents a loadout.
  - Tests: `tests/admin/` style tests for the parsing, the name mapping errors and idempotency.
  - Docs: `docs/product.md` (seeding and the credit rule under Principles), AGENTS.md commands table.
- **Context:** `scripts/admin.mjs` (ADC, `--project`, dry run pattern), `scripts/seed.mjs` (the emulator
  seed; don't import it, it wipes on import), `scripts/lib/{names-to-ids,model-v2}.mjs`, `src/lib/models.ts`
  (`BuildDoc`, `LIMITS`), `firestore.rules` (what a valid build is). Admin SDK writes skip the rules, so the
  script's own checks matter.

#### T53 — Seed 20 more Elden Ring builds

- **Status:** ready after T52
- **Session:** Sonnet · medium effort · plan mode off
- **Goal:** About 25 strong builds covering what people search for, so the landing page and T55's hubs aren't
  empty.
- **Done when:** the owner picks 20 sources (or approves a list the agent proposes from what people search:
  Search Console data if T50 has been live a while); each gets a seed file with T52's credit line and an
  original write-up; dry run reviewed by the owner, then `--write` to production with the owner's go-ahead.
  Cover the main archetypes (strength, dexterity, quality, bleed, frost, int, faith, arcane, hybrid), a few
  levels (60, 125, 150, 200+), and DLC weapons.
- **Context:** T52's script and `content/builds/er/`. Split into batches of five if it runs long.

#### T54 — Share button: copy the link, copy for Reddit, download the card

- **Status:** ready
- **Session:** Sonnet · medium effort · plan mode off
- **Goal:** Builds spread on Reddit, Discord and YouTube descriptions; make posting one a single click, with a
  link back every time (traffic and backlinks).
- **Done when:**
  - A Share button in the build's title section (next to like and report; on phones in the same place) opens a
    small menu (`FocusScope`): **Copy link** (the canonical URL, "Copied" feedback), **Copy for Reddit**
    (markdown: name and level, attributes, weapons with affinity and skill, armor, talismans, spells, then the
    link), **Download image** (the T37 card, `/og/build/<id>.png`), and on phones **Share…** through
    `navigator.share` when it exists.
  - The Reddit text is a pure function in `src/lib/` (e.g. `shareText.ts`) with unit tests; item names from
    `@/data`.
  - A GoatCounter event per action (T38's `usage.ts`), so we learn which one gets used.
  - Tests: the menu (renderWithProviders, clipboard stubbed); `npm run check`; screenshots desktop and
    `--mobile` with the menu open (`--click "Share"`).
- **Context:** `features/editor/sections/BuildHeader.tsx` (title section actions), TrackingBar's clipboard use
  (`features/tracking/TrackingBar.tsx` ~line 167), `src/lib/usage.ts`, `features/editor/gear.ts` (gear groups).

#### T55 — Weapon and tag pages: "Moonveil builds", "Bleed builds"

- **Status:** ready after T50 and T51 (sitemap and head tags)
- **Session:** Opus · extra high effort · plan mode on
- **Goal:** Landing pages for what people actually search ("rivers of blood build", "best bleed build"):
  community builds using a weapon or with a tag, plus what the site already knows about the item. The biggest
  search lever, and it links builds together.
- **Done when:**
  - `/weapons/<slug>` (e.g. `/weapons/moonveil`): the weapon's facts (T45 item card facts, scaling,
    requirements), where to get it (T14's acquisition data), and the builds using it, most liked first. Needs
    a way to query builds by weapon: an array field of weapon IDs on builds (`weaponIds`, written with the
    build, rules check it matches `equipment.weapons`, rules budget measured per T42) or a query the session
    finds cheaper. Same for `/tags/<slug>` (tags are already queryable, T9).
  - Pages with fewer than 3 builds are `noindex` and left out of the sitemap (no thin pages).
  - The function serves their head tags and plain-HTML content like T50 does for builds, and the sitemap lists
    them.
  - Links in: the item card's weapon name, tag chips on build pages and rows, a few on the landing page.
  - ★ Owner questions at the start: which item kinds get pages (weapons only first, or talismans and spells
    too), slugs (lowercased English names, DLC duplicates), the page's design (mock it on the redesign
    canvas).
  - Tests: unit tests for slugs and the page data; rules tests for any new field; e2e: open a weapon page from a
    build; screenshots desktop and `--mobile`.
- **Context:** `src/data/index.ts` and `acquisition.ts`, `features/editor/ItemCard.tsx` + `itemFacts.ts`,
  `features/builds/{filters.ts,queries.ts,BuildsList.tsx}`, `firestore.rules` + `tests/rules/budget.test.ts`,
  T50's function routes. Licensing: only the owner's game export (golden rule 5).

#### T56 — Build URLs with names, and structured data

- **Status:** ready
- **Session:** Sonnet · medium effort · plan mode off
- **Goal:** `/build/ABC123/bleed-samurai-katana`: keywords in the URL and a readable link; plus JSON-LD so
  search engines know what a build page is.
- **Done when:**
  - Build URLs carry a slug of the name after the ID; the ID alone decides the build, any or no slug works,
    and the app replaces a stale or missing slug in the URL (`replace`, no extra history entry). Tabs still
    work (`/build/<id>/<slug>/guide`, or the session picks a shape that keeps T48's tab URLs and old links
    working: check `features/editor/tabs.ts`). The function's `PAGE` regex and the canonical (T50/T51) use the
    slugged URL; old links keep working.
  - JSON-LD in the function's HTML: `CreativeWork` (name, author, dates, `about` Elden Ring as a `VideoGame`,
    likes and comments as `interactionStatistic`) and a `BreadcrumbList` (Souls Builds › Elden Ring builds ›
    the build). Checked with Google's Rich Results Test after deploy (owner).
  - Tests: slug function (accents, emoji, empty names), routes, `handler.test.ts`. `npm run check`, e2e.
- **Context:** `src/app/routes.tsx`, `features/editor/tabs.ts`, `functions/src/handler.ts`, `src/lib/share.ts`.

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

## Backlog

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

- T50 — Crawlable build pages — 2026-11-17 — the `site` function serves `/sitemap.xml` (home + every build,
  `updatedAt`), each build as plain HTML in `#root` (`functions/src/page.ts` via the editor store; write-up as
  sanitized markdown, `markdown.ts`), 404 + `noindex` for missing builds; `robots.txt`; lazy card chunk, minified
  bundle (~0.9 MB); `screenshot --no-js`. Sitemap left uncached at the CDN (header glob risk); `minInstances` waits
  for a post-deploy cold-start measure (owner to-dos).
- T37 — Link previews — 2026-11-17 — a Cloud Function (`functions/`, Blaze) behind Hosting rewrites for `/build/**` and `/og/build/**`: per-build title, description and `og:*` tags, and a Satori/resvg card (picture item, name, level, author, weapons) in the game's skin; cached, falls back to the plain page. **Not live until the owner's first deploy** (`docs/firebase.md` "Link previews").
- T38 — Cookie-free usage counts — 2026-11-17 — GoatCounter (`lib/usage.ts`, live site only): page views by path (`usePageViews`) and events `tracking-started`, `item-collected`, `build-completed`, `route-opened`; privacy page, decision "Analytics" and docs updated. `copy-made` waits for T32.
- T43 — Branded email action page — 2026-11-16 — `/auth/action` (`features/auth/action/`: ActionPage →
  ResetPassword, VerifyEmail): reset-password form, verify and email-change links applied once (query hooks, no
  refetch), expired or used links offer a new one; `auth.ts` `checkPasswordResetCode`, `confirmNewPassword`,
  `applyEmailLink`, `isDeadLink`; e2e from the emulator's oobCodes. Owner sets the action URL after the deploy.
- T45 — Item cards on hover — 2026-11-16 — `ItemCard` (in `Tooltip`, 264 px) on read-only sidebar tiles (hover,
  focus, tap; facts as `aria-describedby`; editing keeps the short tooltip) and the route's own items (mouse
  hover only, `gearByRef`); phone rows show `factsLines`. Pure `itemFacts.ts` per kind. Pipeline: weapon
  `scaling` per affinity (tuples, +0), spirit ash `fp`/`hp`; `scalingGrade` from MenuValueTableParam 100–105.
- T49 — Build page v3, phones — 2026-11-16 — below 900 px collapsible sections (`BuildSections`,
  `PhoneSection`) instead of the tab bar and sidebar, one layout per width in JS (`useMediaQuery`, jsdom stub
  `src/test/viewport.ts`); closed headers show glances (`glances.ts`: level + top attributes, gear icons, "None"
  for empty gear, Guide items, newest comment via `fetchLatestComment` `limit(1)`); URL's section open, taps
  replace the URL, outside navigation opens and scrolls; editing as rows; e2e `build-phone.spec.ts`.
- T48 — Build page v3, desktop — 2026-11-16 — split (owner): desktop + shared now, phones → T49. Tabs
  Description (`/build/:id`) · Guide · Comments, old `/description` `/route` redirect (`isCanonical`); one
  `BuildSidebar` (StatsCard + gear tiles named on hover/focus/tap, warning dots; editable while editing,
  Description the only tab) from `gear.ts` `gearGroups(selectGearState)`; 72px title tile. Gone: Loadout tab,
  `LoadoutPanel`, `Loadout`, `TabLinkCard`, `MoreByAuthor`, `BuildSummary`, `BELOW_WIDE`, `SHORT_SCREEN`.
- T47 — Auto-generated description — 2026-11-16 — Description tab always shown: the write-up, or `describe.ts`
  `describeBuild(selectDescriptionFacts)` made at view time (weapons, top attributes, load, poise, talismans,
  spells, "Worth knowing"), with an "automatically generated" note; `visibleTabs` lost `hasDescription`.
