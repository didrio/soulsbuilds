# Tickets

Living, ordered backlog. **One ticket per session**: `/clear` → `/start Tn` → work → `/wrap`. The agent that
wraps a session updates this file and picks the next ticket. Rules: `.claude/skills/wrap/SKILL.md`. Capture
ideas any time with `/ticket`. Ticket numbers are never reused; **next free: T86**.

Each ticket has: **Status**, **Session** (model · effort · plan mode), **Goal**, **Done when**, **Context**
(read-first files, decisions, pitfalls). A fresh session reads the ticket and only what it names.

**Next:** T85 (plan and split the Loadout restyle; Opus · extra high · plan mode on). Then, in Up next and in the
owner's order (2026-11-18): the tickets T85 splits off, T81 (analysis and grades), T83 (key items), T84 (tracking
without a button), T82 (compare), T80 (stats unattended and at scale). After Up next: **Backlog > Priority
backlog** (T65, T57–T61), only once the owner says so; copies (T32, T33) stay parked.

**"The mockup"** (owner's word) is the chosen redesign, "Loadout" (2026-11-18): `design/mockup/README.md` has the
live link, the source, and how to preview, screenshot and republish it; Up next > Design direction "Loadout" has
every decision. Today's code still has the previous look (from the 2026-11-16 canvas mock-up,
https://claude.ai/artifact/6Wuekku4Q9cGVkmN7iS9ym): history only, never a target.

## In progress

(none)

## Up next

In the owner's order (2026-11-18): the redesign first (T85, then the tickets it splits off, placed right after it),
then T81, T83, T84, T82, then T80.

### Design direction "Loadout" (owner, 2026-11-18)

The owner picked a new look and new features in a design session on 2026-11-18. **The mockup** is the private
"Souls Builds Loadout" artifact (https://claude.ai/artifact/AjMju7aaNeottSYU1K6JzR; Artifact tool, `read`); its
source and tools are in `design/mockup/` (README: preview, screenshots, republish). Its pitch bar switches Home,
Build page and New build, three test builds (magic + PvP + every slot, bleed + half, neutral + sparse + no
class) and the editor's empty / in-progress states. How it was chosen (three pitches, then rounds of feedback):
the "Souls Builds Directions" artifact (https://claude.ai/artifact/TyFTCcL3YfBitcciV4o8zZ), history only.
The site is about **browsing, comparing, sharing and discussing** builds; planning and tracking stay but are
never the selling point. Owner's calls (2026-11-18), all in the mockup:

- **Look:** dark and dense, numbers first; reads as a professional site from a family of sites, not a fan site
  (owner liked that: keep it, no ornament). The only color besides the neutrals is each build's **signature color
  from its damage or status effect** (bleed, frost, fire, magic, holy, lightning, physical), computed from the
  gear (weapon damage types, affinity, status buildup), not from tags. Grades are a neutral black/white badge.
  **Build names are always in capitals** (Barlow Condensed, uppercase) wherever a build is named: cards, list
  rows, the build page, the editor and its live card. Users type them in any case; it's display only.
  **The site has no accent color of its own:** every highlight on a build page (key items, lit attributes, the
  active tab, Guide checks, the gear column) takes that build's signature color, and a physical build's is a
  neutral steel grey, so it reads as uncolored. Affinity is per weapon (each card shows its own); a build has no
  single affinity. Its signature comes from what its key items (T83), or else its main weapon, actually do
  (a Blood-affinity or bleed weapon → bleed). The mockup's three test builds (switch at the top) show magic +
  PvP + every slot, bleed + half the slots, and physical + a few items + no starting class.
- **Starting class is optional** (the model already allows `startingClass: null`): the header leaves it out and
  the attributes column says "Starting class: Any".
- **Home / list:** PvE and PvP are separate lists (mode switch, T81). Filters in the order search, mode, main
  stats, level, grade, damage & status, class (no patch or DLC filters for now), with a **Popular** row of
  one-tap chips mixing filter kinds above the list, **different for PvE and PvP** (each mode's most used picks);
  phones get a Filters button. **Main stats** are same-width chips (name left, count right) in two columns,
  Strength / Dexterity / Quality on the left and Intelligence / Faith / Arcane on the right, with a faint line
  between. Sorts: **Top graded** (default), Most liked, Trending, New. The **level** filter names the game stage:
  Early game 1–50, Mid 51–100, Late 101–124, Endgame 125–150, NG+ 151+ (in the PvP list: the usual brackets
  instead). Cards: grade badge, a one-line verdict (T81), the eight-bar stat profile with the top two lit, the
  gear strip, likes and comments, author. **Grid or list is undecided**: the mockup has a toggle (list = one
  build per row, columns Grade · Build · Verdict · Attributes · Loadout · Likes) for the owner to choose; it may
  stay as a toggle, but **only on desktop** (above ~1100px): tablets and phones always get the grid and no toggle.
  No player counts anywhere, no "your run" banner. **New build** is a secondary button.
- **Build page header:** the build image, then title, mode tag, level, class, "by <author>", tags; **Like and
  Share at the top right** (both secondary buttons: no bright white button on the page; under the title on
  phones). No patch number, no Track button, no "playing / finished" counts, no stat bar under the header.
- **Tabs: Loadout · Analysis · Notes · Guide · Comments**, no grade on any tab label; the tab row stays sticky;
  on phones it scrolls with a faded right edge. **Loadout:** left column = attributes (soft caps marked, Vigor
  and the top two scaling stats lit), then HP, FP, Stamina, Poise in a 2×2 box, then starting class and level;
  middle = the equipment pane; right = the grade with sub-scores and a short analysis ending in "Full analysis →".
  **Analysis:** its own page (T81): a hero with the big grade, title, summary, ease label and four sub-score
  tiles; then the breakdown (all four sub-scores in **one** panel, divided by lines), how it plays, strengths and
  weaknesses, through the game, one change that would raise it; a side column explains the analysis, the grade
  scale and the PvP note. **Notes:** the Author's Notes in a panel (title, author and date in its header), with a
  seeded build's source credit in a side box. **Guide:** a panel of stop rows, every row the same height (number,
  region and place, "You get", how, done), and a **Your gear** side column: every item the route gets, by group,
  dimmed until collected, with a check in the signature color, plus "N of M" and a bar. **The collected items
  are the one source of truth** (T84): ticking a stop collects all its items; clicking an item toggles it; a
  stop shows done when all its items are collected and part-done (the checkbox's middle state) when some are.
  "You get" never wraps: the items that don't fit become "+N more", whose hover card lists them together. Tablets
  drop the How column; phones show the gear grid first (no group labels), then the stops as compact cards.
  Checkboxes in the build's signature color, not green. **Comments:** the same panel and side box as Notes:
  header with the count and Top / Newest, a one-line comment box, comments with avatar, an "Author" tag on the
  build author's, like, Reply and a menu; one reply level, indented; "Show more".
- **Phones and tablets can differ structurally from desktop** (owner, 2026-11-18): same colors, type and style,
  but denser and arranged for the screen; usability beats parity. In the mockup, phones get a smaller build
  header, the grade summary first on Loadout (grade, title, four scores, "Full analysis"; the text stays on the
  Analysis tab), attributes in two columns, HP/FP/Stamina/Poise in one row, smaller weapon cards, armor 2×2,
  talismans in one row, the Guide as above, and the grid list only.
- **Equipment pane:** the equip load bar heads it (weight / max, light-medium tick marks, roll type, no label).
  Hands side by side; every armament is the same full-size card: type, name, then its **affinity** ("Heavy
  affinity", "Standard affinity", or "Can't be infused" for weapons that take none), plus "· Needs Fai 28" in
  amber only when the build misses a requirement (the full requirements are in the hover card); the skill's name
  is not on the card. No slot numbers, no "X of 3", no empty placeholders (a hand with nothing shows one line).
  **Every armament with a skill has a skill badge** (48px) in the bottom-right corner of the card, with its own
  hover card: the Ash of War's icon (the one applied,
  or the one the weapon comes with, marked so) with skill, FP, affinities, where to get it; or, for a weapon with a
  unique skill, a skill glyph in the signature color with the skill, FP and "can't take an Ash of War". Ammo as
  chips when present. Armor as Head / Chest / Arms / Legs rows (per-piece poise and weight only in the card).
  Talismans as four rings. **Spells:** one same-size cell per spell, name under it; a spell that costs more memory
  leaves fewer free cells (as in the game), no cost or kind marks on the cells. Physick tears, Great Rune, Spirit
  Ash as three small cards; quick items as a 10-cell strip; unused groups collapse into one "Not used" line.
  **Key items** (T83) are the only highlighted items, with no "Key" label.
- **Item cards** on hover/focus (desktop) or a bottom sheet on tap (phones), for every item on the site: weight,
  poise, memory, requirements checked against the build's stats, skill, effect, where to get it (no stop number).
  The cursor stays the normal arrow over items (the card opens on hover; nothing to click).
- **New build (the editor)** is the build page in edit mode, so making a build looks like the result (the mockup's
  "New build" view, with Empty / In progress states). Goal (owner, 2026-11-18): guide the player and make it feel
  like building, not a form. **Required: PvE or PvP, at least one armament, a name** (level comes from the stats;
  starting class, armor, talismans, spells, key items, tags and notes are optional).
  - Header: the build picture (the key item, else the first weapon; "Your first weapon goes here" while empty), the
    signature line, a large name field with **Suggest a name** (key or main weapon + signature + class, e.g.
    "Uchigatana Bleed Samurai"), the PvE / PvP switch ("We grade them separately"), level and class, and **tags**:
    suggested chips (main stats ≥ 30, weapon types, signature, "Early game") that one tap adds; Cancel and Save.
  - Tabs: Loadout and Notes; Analysis and Guide show as locked ("after you save").
  - Loadout: left = starting class (a list with each class's level and top stats; "Any class" = no minimums, a
    class sets the minimums), attributes with − / + steppers and typed values, soft caps, the level, live
    HP/FP/Stamina/Poise. Middle = the equipment pane with every empty slot as an invitation ("Add your main weapon"
    first, with one hint line: start with your main weapon, everything else follows), "+ Add another" under each
    hand, filled slots with hover actions (key star, replace, remove; up to 3 key items; the first weapon becomes
    key by default), the equip load bar live, optional groups (ammo, spells, physick, Great Rune, spirit ash,
    items) behind "Also add" chips until used. Right = **the build's card as it will look in the list, live**
    (color, name, level, stat profile, gear strip, a "?" grade), a **checklist** (required and optional steps, each
    jumps to its place, "2 of 3 required"), and Save in the build's signature color. Phones: a sticky bottom bar
    with the count and Save.
  - Notes: a markdown box with Heading / Bold / List, and prompt buttons that insert the sections players want
    (How it plays, Why these pieces, Stats, Swaps), with the note that our analysis covers grades and numbers.
  - **Saving is the reward:** a "Grading your build…" card fills the four sub-scores, then reveals the grade
    ("B as a PvE build") with "See the analysis" / "Keep editing" (the real grade comes from T81).
  - **The item picker** (T75, rebuilt): a large dialog, list left and the selected item right. Search, type
    chips, "Only what my stats can use", sorts (armor: name, lightest, most poise; spells: fewest slots). Each row:
    icon, name, one fact line (weapons: type + requirements with misses in amber; armor: weight · poise; spells:
    kind · slots · FP; talismans: effect), "Equipped" on the current one. The right pane: the item's facts, **your
    stats vs. its requirements as bars**, effect, where to get it. Weapons take a **second step**: Skill (keep the
    one it comes with, or an Ash of War that fits the weapon type, with FP) and **Affinity** (13 buttons, the ones
    the weapon or the chosen Ash doesn't allow disabled; "can't be infused" for unique weapons). Remove is in the
    picker's footer. Phones: full-screen, the list first, tapping a row opens its detail with Back.

#### T85 — The Loadout restyle

- **Status:** next (owner, 2026-11-18); this session plans and splits it, nothing else
- **Session:** Opus · extra high effort · plan mode on
- **Goal:** Make the live site look and work like the mockup (the section above has every call): theme tokens and
  type (Barlow, Barlow Condensed, JetBrains Mono), the home list and filters, the build page header and tabs, the
  equipment pane, item cards, the Analysis, Notes, Guide and Comments tabs, **the editor and the item picker**
  (New build), phones and tablets (denser, not a copy of desktop).
- **Done when:** the planning session reads `design/mockup/README.md`, screenshots the mockup's views
  (`node design/mockup/scripts/preview.mjs …`), reads the current code, asks the owner what's left open (grid or
  list on home), and splits the work into session-sized tickets placed right after this one in Up next (likely:
  tokens and type; home list and filters; build page header and tabs; equipment pane and item cards; Analysis,
  Notes, Guide and Comments; the editor; the item picker; phones), with the pieces that need T81 (grades), T83
  (key items) or T84 (tracking) marked as waiting or built without them, and the carried-over items below
  assigned to pieces. Each piece rewrites its part of `docs/architecture.md`
  "Styling" and `docs/decisions.md` (Build page layout, Tracking) as it lands; a check of each piece is a
  screenshot next to the mockup's.
- **Context:** the Loadout direction above, `design/mockup/`; `src/theme/`, `src/features/builds/`,
  `src/features/editor/`, `docs/architecture.md` "Styling"; the old look (gold, in-world frames, Spectral) is
  replaced, not merged.
- **Carried over** (T73, T75 and T77 were tickets for the old look, folded in here on 2026-11-18; their full text
  is in git, commit `1c4a06d`). What the mockup doesn't already cover:
  - From T73 (the planner's first minute): saving without a name scrolls to the name field, focuses it and shows
    the error under it (today the message shows only in the bottom bar, even with the field off screen; the check
    is in `features/editor/useBuildEditor.ts`; `features/auth/FormField` + `useFieldErrors` do errors by field).
    One name for the action (today "Plan a build" signed out, "New build" in the header, "Create a build" on the
    profile). The e2e journeys `build-flow` and the signed-out planner follow the new editor.
  - From T75 (picker rows with facts): the picker stays fast on a phone with 487 weapon rows (measure before and
    after); the rows' fact lines come from `features/editor/itemFacts.ts`.
  - From T77 (craft pass), for the new look: review every page and dialog at full resolution with the
    screenshot script (1440, 1000 and `--mobile`); loading (no blank panels or layout jumps; the picker's first open
    loads ~1 MB), empty, error and offline states on every page; small, purposeful motion that honours
    `prefers-reduced-motion` (tabs, dialogs, popovers, checking an item, the progress bar, and the Build complete
    moment: the rewards rule in `docs/product.md`); every flow by keyboard and screen reader (focus order, visible
    focus, the page behind a dialog out of reach); phones end to end, targets ≥ 44 px, nothing that needs hover;
    `Chips`' tag picker and `ShareButton`'s menu moved onto `components/ui/Popover` if it fits, and the phone
    Filters sheet as a bottom sheet.

#### T81 — Souls Builds analysis: a grade and a write-up for every build

- **Status:** ready to plan; after T85 (owner's order, 2026-11-18)
- **Session:** Opus · extra high effort · plan mode on
- **Goal:** Every build gets an **analysis** written by an LLM when it's saved: a letter grade (S, A, B, C, D) with
  sub-scores and the reasoning behind each, plus playstyle, strengths, weaknesses, how it holds up across the base
  game and Shadow of the Erdtree, and one change that would raise the grade. Gives visitors a way to judge
  builds while the site has few likes. The author's write-up becomes **Author's Notes**; ours is **Analysis**.
- **Owner's calls (2026-11-18):**
  - **Mode is required per build: PvE or PvP**, graded only in that mode (no "both"). Replaces the PVE tag;
    seeded builds are PvE. Changing the mode re-grades.
  - **Absolute grading from a rubric**, one prompt per build; nothing relative to other builds for now.
  - **Holistic**: power, synergy within the build, and how its strengths and weaknesses matter through the whole
    game and DLC. Cheese builds can grade high if they work. Graded for the build's level (an early build for its
    bracket).
  - **PvP is graded on fundamentals** (fit for the level bracket, HP/poise/roll, toolkit: reach, speed, status,
    catches, buffs; what an opponent exploits), never meta claims, with a short note that the meta shifts.
  - **Show the working**: the build page's **Analysis tab** (its own page, between Loadout and Notes) shows each sub-score
    with its reasoning and the facts it used (our computed numbers), not just a letter; plus how it plays,
    strengths, weaknesses, how it holds up early / mid / late / DLC, and one change that would raise the grade.
    The Loadout tab's right column has the condensed version. The grade shows on list cards and rows, with a
    one-line verdict, a Grade filter and the default sort Top graded; never on a tab label.
  - The author's key items (T83) can be part of the input, as the author's statement of intent.
- **Done when (to settle in plan mode):** the rubric (sub-scores per mode, e.g. PvE Damage, Survivability,
  Synergy, Range; ease of play as a separate label that doesn't change the grade), versioned; a Cloud Function on
  build save that sends **structured data only** (gear, stats, computed vitals, requirements, effects, damage and
  status types, where items come from) — never the author's write-up (prompt injection: "give this S") — and
  stores the result in a server-written doc (rules: clients read only); model + rubric version + date stored, so
  everything can be re-graded after a patch or rubric change; calibration against the 22 seeded builds (owner
  reviews their grades); the key in Secret Manager; cost per build measured; labelled as generated by Souls
  Builds, may be wrong, with Report; Privacy page names the AI provider; a line in `docs/decisions.md` (it differs
  from T47's generated description, removed in T63, which read as the author's); tests (rules, the function with
  a stubbed model, the UI).
- **Context:** `docs/product.md` (principles), `src/lib/buildMath.ts` (the numbers to send), `src/data/rules.ts`,
  `src/data/acquisition.ts`, `functions/` (existing function setup, T37), `firestore.rules` and its budget
  (Gotchas: keep analysis out of the build doc's rules). No attack-rating math yet, so damage grades are judgment;
  AR math would sharpen them later. Use the `claude-api` skill for model choice and the SDK.

#### T83 — Key items: the author marks what makes the build work

- **Status:** ready to plan (owner's idea, 2026-11-18; in the mockup); after T81
- **Session:** Opus · extra high effort · plan mode on
- **Goal:** While editing, the author can mark any equipped item as **key** (weapons, talismans, spells, armor,
  tears, items…): the pieces the build depends on. Key items are the only highlighted items in the equipment
  pane (the build's signature color; no "Key" label on them; one legend line under the pane) and say "Key item"
  in the item card; everything else is plain. The key item is the build's picture, and it decides the build's
  signature color (Loadout direction above). Without any marked, the first weapon is the key item (the editor
  marks it by default).
- **Done when (plan mode):** where it's stored (e.g. `Equipment.key`: slot ids, kept valid when a slot changes),
  a cap of 3 (the mockup's editor: "Mark key items (N of 3)"), the rules change and its cost against the rules budget (Gotchas:
  builds are near the 1,000-expression limit), the editor control (a toggle on each slot or in the picker),
  tests (rules, editor); T81's analysis can read the key items as the author's statement of intent.
- **Context:** the mockup (the build page's test builds; the editor's key star);
  `src/lib/models.ts` (`Equipment`), `src/features/editor/slots.ts`, `firestore.rules`, `tests/rules/budget.test.ts`.

#### T84 — Tracking without a Track button

- **Status:** ready to plan (owner's call, 2026-11-18); after T83
- **Session:** Opus · high effort · plan mode on
- **Goal:** Tracking isn't a mode you switch on: it starts when a player ticks the first checkbox in a build's
  Guide, and that's all. No Track button, no "Tracking" state on the page, no "37 playing · 12 finished" on the
  build page or in lists. The profile still lists the builds you're playing and have completed (T36). The
  checks are the Guide's: tick a stop, or click an item in its "Your gear" column (Loadout direction above:
  collected items are the source of truth, a stop is done when all its items are).
- **Done when (plan mode):** what replaces the Track button and `TrackingIntro` (T41): signed out, the first tick
  asks to sign up or log in to keep the checks (or keeps them locally until then; decide); what happens to
  `TrackingBar` (progress, Your stats, Stop) and the "Build complete" moment (rewards rule in `docs/product.md`);
  whether `playerCount`/`finishedCount` stay (still used by the profile counters? "Most played" sort is gone from
  the new design); from the retired T72: an account-menu **Playing** link to the profile's Playing tab, and on
  phones, on a build you're tracking, the Guide first; no home-page run row; e2e journey updated; screenshots.
- **Context:** `src/features/tracking/` (TrackButton, TrackingIntro, TrackingBar, useBuildTracking),
  `src/features/editor/guide/`, T34–T36, T41, T44, T46 in `docs/tickets-archive.md`; the Loadout direction above.

#### T82 — Compare builds side by side

- **Status:** ready to plan (owner's call, 2026-11-18: wanted, not in the mockup yet); after T84
- **Session:** Opus · high effort · plan mode on
- **Goal:** Pick two or three builds (a Compare checkbox on list cards and a button on the build page) and see
  them side by side: grade and sub-scores (T81), stats with the top attributes highlighted, vitals, gear, route
  length. Browsing and comparing builds is the site's selling point (owner, 2026-11-18).
- **Done when:** plan mode settles the URL (e.g. `/compare?ids=a,b,c`, shareable), the phone layout, and what
  shows before T81 lands; e2e journey; screenshots desktop and `--mobile`.
- **Context:** the Loadout direction above; replaces the "Build comparison view" idea (T33's "Compare with the
  original" can reuse it later).

#### T80 — Home shelves that hold up unattended and at scale

- **Status:** ready (found while wrapping T79, 2026-11-17); after the redesign tickets, or sooner if the stats job stops
- **Session:** Opus · extra high effort · plan mode on
- **Goal:** Trending, the Top <tag> shelves and `/builds` search keep working with no one tending the site, at
  tens of thousands of builds. Today two things break that:
  1. **The daily job stops.** `.github/workflows/stats.yml` is a `schedule` in a **public** repo, and GitHub turns
     scheduled workflows off after 60 days without repository activity. Then `stats/<game>` freezes: Trending,
     the Top shelves, Popular weapons, search and the counts all go stale (Fresh builds still work: Firestore).
  2. **The index is one document.** `searchIndex` (`scripts/admin.mjs` ~line 459, T74) holds one entry per build
     in `stats/<game>`, ~200 bytes each (45 builds = 9 KB), with no cap. Firestore's 1 MB document limit is hit
     near ~5,000 builds: the write fails and the stats freeze. Every home visit also downloads the whole index.
- **Done when:**
  - The daily stats run without depending on repo activity (e.g. a scheduled Cloud Function / Cloud Scheduler on
    Blaze, or a keep-alive the owner approves); a failing or missing run is noticed (an alert, or the page shows
    the index's age and falls back sensibly).
  - The index can't outgrow a document: cap it (e.g. the newest N plus the all-time top M), or shard it, or move
    search to queries; the home page reads a small precomputed doc (shelf ids only) instead of the whole index.
  - Trending stays meaningful at volume: today's score is activity ÷ (1 + builds-posted-since/10)^1.5 on
    all-time likes; at hundreds of builds a day that is "the last day's most liked". Decide (owner) whether to
    count recent likes (needs like timestamps per window) or keep the rank decay with a larger step.
  - Top <tag> shelves rank by all-time likes: decide whether they should favour recent builds (patch drift).
  - Tests for the cap/shard and the shelf picks at 10k+ entries; docs (architecture "Search", firebase "Deploys").
- **Context:** `scripts/admin.mjs` (`updateStats`, `searchEntry`), `src/features/builds/{shelves.ts,search.ts,
queries.ts}`, `src/lib/firebase/stats.ts`, `.github/workflows/stats.yml`, `docs/product.md` (the rewards rule).
  Production today: 66 builds, so nothing is urgent except the 60-day schedule rule.

## Backlog

### Priority backlog

Set aside by the owner on 2026-11-17. These come **after Up next**, in this order, but stay here until the owner
says to take them out of the priority backlog: never move one to Up next, pick it as the next ticket, or name it
in the **Next:** line before then. They were written before the Loadout redesign: where they name parts of
today's UI (landing, sidebar, hero, skin), read them as "its equivalent after the redesign".

#### T65 — Second batch of seeded builds, from real search data

- **Status:** blocked — wait for 4–6 weeks of Search Console data (set up by the owner by 2026-11-18, so not
  before late December 2026; T50's crawler pages and the T52 seeds are live)
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
    the route or the build. The header's game menu (T79: the Dark Souls games "Coming soon") links the games
    that have data.
  - The build model per game: `Equipment` and attributes as a union by `game` (DS games: rings instead of
    talismans (2 in DS1, 4 in DS2 and DS3), infusions instead of affinities, weapon arts fixed by weapon in
    DS3, no Ashes of War, tears, Great Rune or Spirit Ash; DS1 has 8 attributes, DS2 and DS3 9, with different
    names). `firestore.rules` validates by game, one branch evaluated per request: **measure the rules budget**
    (T42; builds are near it) and design for it before writing rules.
  - Game data per folder (`src/data/<game>/`), `@/data` and `@/data/core` loading the current game's files
    lazily (docs/data.md: core stays small); the pipeline takes a game (`npm run data -- ds3`) and the export
    folder becomes `~/Documents/soulsbuilds-gamedata/<game>/` (the owner moves the Elden Ring export into
    `er/`, or the script falls back to the old layout).
  - Per game: the look (today `src/theme/skins.ts`; the Loadout redesign has no site accent, so T85 decides
    what, if anything, differs per game), tags, link-preview card text ("Level 120 Dark Souls III build"),
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
Written before the Loadout redesign: the model, rules and tests stand; where the button, banner, tab and rows go
is for the mockup's layout to decide when one is picked up.

#### T32 — Make a copy: a build based on another

- **Status:** parked indefinitely (owner, 2026-11-16 and again 2026-11-17: wanted, but only when the owner asks
  for it). T42 made room for `basedOn`; the button goes in the build's title section, shorter since T48; owner
  decisions first
- **Session:** Opus · extra high effort · plan mode on
- **Goal:** Any signed-in user can start a new build from any build they see, change as little or as much as they
  like, and save it as their own. The copy always credits the original, so its author doesn't feel copied
  without appreciation (owner's idea, 2026-11-16).
- **Done when:** (ask the owner about the ★ items in one question at the start; mock the button, banner and
  credit line in the mockup's style first)
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
  - ★ A "Variations" tab on the build page with its count, shown only when there's at least one (the redesign's
    tabs are Loadout · Analysis · Notes · Guide · Comments: decide then where it goes). The count is one `count()` aggregation (`where('basedOn.buildId', '==', id)`, about 1
    read), not a stored counter: no counter rules, and nothing drifts when copies are deleted.
  - The tab lists the copies, most liked first (composite index in `firestore.indexes.json`), as the home list's
    rows or cards. Each row says what changed against this build, e.g. "3 items changed · Faith 80 → 60 · +1 spell ·
    Level 201 → 150", or "No changes yet" (identical copies sort last). The summary is a pure function in
    `src/lib/` (e.g. `buildDiff.ts`) with unit tests; item names come from `@/data`.
  - ★ On a copy, the credit line adds "and N other variations", linking to the original's Variations tab.
  - Landing rows unchanged for now (a count per row would cost a query per row).
  - Tests: unit tests for the diff and the tab; T32's e2e test extended (the original shows "Variations 1" and
    the copy's summary); `npm run check` and `npm run e2e` pass; screenshots desktop and `--mobile`.
  - Docs: a decision row (counting with a query instead of a counter), AGENTS.md's project map.
- **Context:** T32's `basedOn`; T28's tabs; `features/builds/BuildsList.tsx` rows;
  `features/editor/queries.ts` and `lib/queryKeys.ts`. Compare (T82) is the natural next step: each variation row
  could link to "Compare with the original".

### Ideas

- Comments (T62 follow-ups, owner's call): notifications when someone replies, editing a comment, markdown or
  mentions in comments, collapsing a thread, downvotes.
- Hub pages (T55 follow-ups): talismans, spells and spirit ashes get pages the same way (their lists are compacted
  arrays, so `array-contains` works; one index each); landing rows could link their tags (stretched-link row
  instead of a whole-row `<a>`); the item card's weapon name as a link needs a hoverable card.
- Route (T15 follow-ups): upgrade materials (Smithing/Somber stones, needs upgrade levels on builds), rune
  farming to the build's level (where and how long), and the starting class: builds now save one (T8,
  `startingClass`; classes in `character.json`), so the route can say "your Samurai starts with it" instead of
  "or start as X", and suggest a class for builds without one.
- Item cards (T45 follow-up): scaling grades at the build's upgrade level, not +0 (needs upgrade levels on
  builds, like the route's upgrade materials; ReinforceParamWeapon's correction rates from the export).
- Markdown editor in the site's palette, if T85's editor piece keeps `@uiw/react-md-editor`: since T28 it's
  pinned to its own dark theme (`data-color-mode` in `index.html`), GitHub's bluish dark; override its CSS
  variables in `sections/Markdown.tsx` (`--color-canvas-default` and friends, see its README).
- Delete the unused 2022 doc `app/tags` in production (no rule matches it; it's in the T12 backup). Also from
  T78: production holds 18 indexes not in `firestore.indexes.json` (old ascending ones and older); harmless,
  delete them in the console or deploy indexes with `--force` (owner's go-ahead).
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

Finished tickets, newest first; `/wrap` moves the older ones to `docs/tickets-archive.md` (every finished ticket
since T1, oldest first).

- Tickets cleanup (no ticket) — 2026-11-18 — owner to-dos removed (owner: all checked); T73/T75/T77's
  still-useful parts merged into T85 ("Carried over"); T83, T57, T32, T33 and T65 brought in line with the mockup
  and what's live; old Done lines moved to `docs/tickets-archive.md`; `/wrap` keeps Done to the last session or
  two. No app code changed.
- Design session (no ticket) — 2026-11-18 — the redesign chosen: "the mockup" (Loadout look, grades and analysis, PvE/PvP, editor and picker) in `design/mockup/` with preview/screenshot tooling and the live artifact; T81–T85 written and put next; T72 retired; T73, T75, T77 folded into T85; `docs/product.md` positioning note. No app code changed.
- T73, T75, T77 — folded into T85 — 2026-11-18 (owner) — tickets for the old look; what still applies is under
  T85's **Carried over**. T72 (Back to your run) was retired the same day: its account-menu Playing link and the
  phone Guide-first went into T84.
