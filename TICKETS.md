# Tickets

Living, ordered backlog. **One ticket per session**: `/clear` → `/start Tn` → work → `/wrap`. The agent that
wraps a session updates this file and picks the next ticket. Rules: `.claude/skills/wrap/SKILL.md`. Capture
ideas any time with `/ticket`. Ticket numbers are never reused; **next free: T86**.

Each ticket has: **Status**, **Session** (model · effort · plan mode), **Goal**, **Done when**, **Context**
(read-first files, decisions, pitfalls). A fresh session reads the ticket and only what it names.

**Next:** T85 (plan and split the Loadout restyle; Opus · extra high · plan mode on), then T81 (analysis and grades),
T83 (key items), T84 (tracking without a button), T82 (compare), then T80 (stats unattended and at scale): all in
Up next, owner's order (2026-11-18). The remaining tickets (T65, T57–T61)
wait in **Backlog > Priority backlog** until the owner says to take them out; copies (T32, T33) stay parked.
T50 is code-complete; deploying it and the Search Console steps are owner to-dos below.
**"The mockup"** (owner's word) is the chosen redesign, "Loadout" (2026-11-18): `design/mockup/README.md` has the
live link, the source, and how to preview, screenshot and republish it; Up next > Design direction "Loadout" has
every decision. It replaces today's look, which came from the 2026-11-16 canvas mock-up ("Souls Builds redesign",
https://claude.ai/artifact/6Wuekku4Q9cGVkmN7iS9ym): read that only to understand the current code.

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
- After T74 deploys (CI on `main`: hosting, functions, rules and indexes together): the home shelves, the builds
  list and weapon/tag pages query new composite indexes (count, then `createdAt`). Wait for them to show
  **Enabled** (Firestore → Indexes; until then those lists fail with "requires an index"), or deploy them first:
  `node scripts/firebase.mjs deploy --only firestore:indexes --project soulsbuilds`. Then run the stats job once
  (Actions → Community stats → Run workflow) so search and the shelves have their index; open `/`, `/builds`,
  search "samurai", and resubmit the sitemap (it now lists `/builds`).
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

In the owner's order (2026-11-18): the redesign first. The earlier run (2026-11-17: newcomers, T68–T71 done; the
UI/UX pass, T74 and T76 done) ended there: T72 was retired (its account-menu link and phone Guide-first went into
T84; its home "Continue your run" row was dropped, since the mockup has no run banner), and T73, T75 and T77
were folded into T85 (Backlog > Folded into T85 keeps their details for its planning session).

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
  (key items) or T84 (tracking) marked as waiting or built without them. It takes what still applies from the
  folded T73, T75 and T77 (Backlog > Folded into T85). Each piece rewrites its part of `docs/architecture.md`
  "Styling" and `docs/decisions.md` (Build page layout, Tracking) as it lands; a check of each piece is a
  screenshot next to the mockup's.
- **Context:** the Loadout direction above, `design/mockup/`; `src/theme/`, `src/features/builds/`,
  `src/features/editor/`, `docs/architecture.md` "Styling"; the old look (gold, in-world frames, Spectral) is
  replaced, not merged.

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
  tears, items…): the pieces the build depends on. Key items get the highlight in the equipment pane (the
  damage-color glow and a KEY tag on weapons, a lit ring on talismans, a lit cell on spells) and "Key item" in the
  item card; everything else is plain. Without any marked, the first right-hand weapon is the key item.
- **Done when (plan mode):** where it's stored (e.g. `Equipment.key`: slot ids, kept valid when a slot changes),
  a cap (about 3–5, so it stays meaningful), the rules change and its cost against the rules budget (Gotchas:
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

### Folded into T85 (reference)

Owner, 2026-11-18: these were the UI/UX pass's next tickets in today's look. The redesign replaces that look, so
T85's planning session reads them for what still applies; nobody runs them on their own.

#### T73 — The planner's first minute

- **Status:** folded into T85 (owner, 2026-11-18): its planning session takes what still applies
- **Session:** Opus · high effort · plan mode on
- **Note (2026-11-18):** the mockup's **New build** covers this and goes further (live card, checklist, Suggest a
  name, tag suggestions, the grade moment). Still useful here: the save-without-a-name behaviour, one name for
  the action, the e2e journeys.
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

#### T75 — Picker rows with facts

- **Status:** folded into T85 (owner, 2026-11-18): its planning session takes what still applies
- **Session:** Sonnet · medium effort · plan mode off
- **Note (2026-11-18):** the mockup's item picker covers this and goes further (a detail pane with your stats vs.
  requirements, "Only what my stats can use", the weapon's second step for skill and affinity). Still useful
  here: phone performance with 487 rows.
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

- **Status:** folded into T85 (owner, 2026-11-18): its planning session takes what still applies (the
  states, motion, keyboard and touch checks hold for the new look)
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
  - **Popovers:** `Chips`' tag picker and `ShareButton`'s menu still hand-roll what `components/ui/Popover`
    (T74) does; move them onto it if it fits, and give the phone Filters sheet (a `Dialog`) a bottom-sheet look.
- **Context:** `src/theme/` (motion, spacing, fonts), `components/ui/` (Dialog, FocusScope, Tooltip),
  `docs/architecture.md` "Styling", the run-app skill for screenshots.

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
- Build comparison view: now T82 (Design direction "Loadout").
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

- Design session (no ticket) — 2026-11-18 — the redesign chosen: "the mockup" (Loadout look, grades and analysis, PvE/PvP, editor and picker) in `design/mockup/` with preview/screenshot tooling and the live artifact; T81–T85 written and put next; T72 retired; T73, T75, T77 folded into T85; `docs/product.md` positioning note. No app code changed.
- T72 — Back to your run — retired 2026-11-18 (owner): the mockup has no home-page run row; the account-menu
  Playing link and the phone Guide-first went into T84.

- T79 — Owner's polish list — 2026-11-17 — one session, no ticket before it. Header: bigger wordmark, the game name is a menu (Dark Souls Remastered/II/III "Coming soon"; phones: in the Menu panel, the bar overflowed signed out at ≤ 390px). Home: intro title + "View all builds" for everyone, the three panels in a box closed for good with its X; order Popular weapons → Trending → Top <tag> ×3 + Fresh (2×2); Most played, the count line and the bottom View all gone. `/builds` titled "View builds". Rows: gold 22px hearts, filled once a build has likes (outlined and dimmer with none), that like/unlike signed in (your like = the count in gold; stretched link on the name; `useLikedIds`, one read), "No tags", quieter divider; a lone compact shelf takes the full width with full rows. Levels in five band colors (`lib/levels.ts`, `LevelNumber`, legend on hover; the Level filter's presets = the bands, so 101–124 and 151+ are new and 200+ went). Spectral replaces EB Garamond (app, crawler HTML, link-preview card), list names 18px. Locally, the home's Popular weapons and Top shelves need more than the 5 test builds: `node scripts/seed-builds.mjs --write` then `node scripts/admin.mjs stats --write` (e2e works with either). Softer contrast (text, bg, gold; `COLOR_LINE_CONTROL` on buttons and tags). Labels in boxes optically centered (`opticalCenter`; `npm run screenshot -- … --scale 2`). Build page: footer follows the content (no gap under Equipment), Character block spaced, HP/FP/stamina colored. Not checked: Safari/Firefox rendering of the centering; the live site (deploy is the owner's; the link-preview card's new font needs the functions deploy).
- T78 — Level filters failed in production — 2026-11-17 — every `/builds` level range said "Couldn't load builds": Firestore wants a range field (`level`) last in the index in the last orderBy's direction, ours were ascending after likes/date/players; 9 indexes flipped to `level` descending (deployed by hand, checked live), `src/lib/firebase/indexes.test.ts` checks every list/search query shape against `firestore.indexes.json` (the emulator never does). Production still holds 18 indexes not in the file (the old ascending ones + older); harmless, delete in the console or with `--force` if wanted.
- T76 — Small fixes from the UI/UX pass — 2026-11-17 — signed-out comment box is one "Log in to comment" button (opens the dialog); Guide legend swatches 12 px; stat "+N" titled "From talismans"; phone tags keep distance from the actions. Not checked: Report's spacing signed in on phones.
- T74 — Home list: shelves and the builds page — 2026-11-17 — `/` = shelves (Trending by activity over builds-since, Most played, Fresh, Top <tag>), `/builds` = feed rows (likes rail), one filter bar (popovers, phone sheet, chips), search over a daily index in `stats/<game>`, likes/played ties newest first (new indexes)
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
