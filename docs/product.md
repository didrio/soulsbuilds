# Product: where Souls Builds fits

The owner's direction as of 2026-11-16, from a design conversation and the canvas mockups (the private "Souls
Builds redesign" artifact linked from `TICKETS.md`). Keep this current when the positioning changes; decisions
that follow from it go in `docs/decisions.md`.

## In one line

**The best way to share a Souls build, and the easiest way to actually get one.**

The home page says it to signed-out visitors (T69, `features/builds/intro.ts`): **"Plan, share and follow
Elden Ring builds"**, then "A free build planner: put a build together with live stats, follow a step-by-step
route to every item in it, and share it with one link. No account needed to start." Plan, follow, share: the
three buttons.

**Update 2026-11-18 (owner, design session; `TICKETS.md` "Design direction Loadout", T81–T85):** the selling
point is **browsing, comparing, sharing and discussing** builds. Every build gets a Souls Builds **analysis and
grade** (PvE or PvP, graded separately), so visitors can judge builds before there are many likes. Planning and
tracking stay, but quietly: no Track button or player counts; ticking the Guide's checklist is tracking. Where
this page still leads with "get" and tracking, the update wins until the restyle (T85) rewrites it.

## Three jobs

- **Share**: post a build as a page worth linking: every item named, visual, readable on a phone.
- **Get**: follow a build through a playthrough: the route ("How to get this build") and tracking (check off
  gear, level the stats, see the next stop).
- **Improve**: copy a build with credit, see its variations, discuss it. Builds belong to the community; their
  authors get the credit.

## Who it's for

In order of how many there are:

1. **Players following a build.** Most visitors. They read, then track. They arrive from creators' links and
   from search.
2. **People who post builds**: YouTubers, Reddit and Discord regulars. They make the content and bring their
   audiences, and they need one link that shows the whole build.
3. **Tinkerers and PvP players.** They build at fixed levels (125, 150, 200) and adjust after every patch: the
   natural users of variations. They judge a site on numbers, and attack rating isn't calculated yet.

Not a PvP-only brand: PvP players are a welcome second wave, not the identity.

## The ecosystem

From a quick survey in November 2026; check before relying on details.

- **Fextralife's wiki**: community build lists as wiki text
  ([PvE](https://eldenring.wiki.fextralife.com/PvE+Builds), [PvP](https://eldenring.wiki.fextralife.com/PvP+Builds));
  it dominates search.
- **Planners and calculators** with share links (MugenMonkey, tarnished.dev, eip.gg, 8Bit Design and others):
  stat math, spreadsheet-like pages.
- **Big guide sites**: Maxroll (reportedly an Elden Ring database), Mobalytics.
- **Reddit, Discord and YouTube**: where builds actually spread, as text lists, screenshots and spreadsheets.

The gap: no standard "build link" (the role Path of Building links play for Path of Exile), and nobody combines a
shareable page, the acquisition route and credited variations.

## Principles

- **Useful to one person first.** Every core feature works with no community around (the route, tracking).
  Community features (likes, comments, variations) add to that; they can't be the reason to come while the site is
  small (52 builds by 33 players at relaunch).
- **Credit is permanent.** A copy always links to the original, and the link can't be removed (T32).
- **Seeded builds credit their source** (T52). The Souls Builds account recreates community builds: the
  loadout is copied, the write-up is our own (or the author's, with their OK), and a fixed credit line links
  the original and says what we filled in where the source left gaps. No fake engagement: seeds start with no
  likes, comments or players. "Seeding" below.
- **Like and Track, not Favorite.** A like is public appreciation and doubles as your long-term favorites (the
  profile's Liked tab). Tracking means "I'm playing this now": private by default, with only totals on the build
  page ("37 playing · 12 finished").
- **Rewards celebrate the game, never site use.** Items lighting up, a progress bar, a "Build complete" moment, a
  shelf of finished builds. No streaks, daily rewards, points for site activity, badges for posting or
  commenting, nagging notifications or completion leaderboards. People come back because their run moved on, not
  because the site pulls them.
- **Low friction without added risk.** Planning a build needs no account: Save asks for one (T68). Tracking needs
  one (T41: progress worth keeping). Sign-in details: T30.

## Priorities

1. **Redesign** (T26–T29; build page v3, T46–T49: the build in a fixed sidebar; T63: Equipment · Guide · Discussion,
   tracking only in the Guide; T48 desktop done, T49 the phone sections next): the build page is the product.
2. **Measurement** (T38): know whether the next features get used. Blocked on the owner's decision.
3. **Tracking** (T34–T36): serves most users and works alone.
4. **Link previews** (T37): a pasted link shows the build (a card with the main item). One small Cloud Function on the Blaze plan.
5. **Sign-in and account polish** (T30–T31).
6. **Copies and variations** (T32–T33): better once there's a crowd. Parked indefinitely in `TICKETS.md` until the
   owner asks for them.
7. **Discoverability** (T50–T56, planned 2026-11-16): crawlers can read every build (sitemap, content in the
   HTML, real 404s, per-page titles), seeded builds, a Share button with "Copy for Reddit", and weapon and tag
   pages for what people search. Fextralife owns generic searches; the chance is the long tail and shared links.
8. **More games** (T57–T61): Dark Souls III, Remastered and II from the owner's exports, same UX, seeded at
   launch.

## Seeding (T52, T53)

22 Elden Ring builds by the "Souls Builds" account (`content/builds/er/`, `scripts/seed-builds.mjs`; format and
rules in `content/builds/README.md`), picked on 2026-11-17 from what people search, since Search Console had no
data yet:

- **Google autocomplete** for "elden ring build" puts _calculator, planner, builder, maker_ first, then "best …
  builds for beginners 2026", "tarnished edition", "first playthrough". Per weapon or archetype the modifiers are
  _stats, talismans, armor, starting class, early game, level 100/150/200, leveling guide, progression_: what a
  build page plus the Guide answers. So names lead with the searched phrase (the title adds "· Level N Elden
  Ring build"), and the write-up's first paragraph is the search snippet.
- **Patch 1.17, the Tarnished Pack and the Switch 2 edition** (2026-08-27/28) brought new players and two new
  classes. Idus Knight and Heavy Knight videos drew 100–330K YouTube views each in two months, and Fextralife
  had no text build pages for them: hence four new-class builds (and the classes in the data, T52).
- **Single weapons with deep autocomplete**: Rivers of Blood, Moonveil, Blasphemous Blade, Bloodhound's Fang, Dark
  Moon Greatsword, Sword of Night and Flame, Giant-Crusher, Bolt of Gransax, Nagakiba; DLC: Milady, Rellana's
  Twin Blades, Backhand Blades, Bloodfiend's Arm, the Carian Sorcery Sword.
- The mix: 4 new-class, 5 early-game (they suit the Guide's route), 13 endgame and DLC; levels 20 to 195; sources
  KeenGamer, Console Pulse, Game8, eip.gg (community authors) and the Fextralife wiki (10, under half). Reddit
  is unreadable for the agent; posts the owner pastes in can be seeded with their author's credit.
- **Next batch**: from Search Console's queries and GoatCounter's page views once the site has a few weeks of
  data; then message the credited creators with their page's link (outreach does more than SEO for a new site).

## Validate cheaply

- Talk to 5–10 people who post builds: how they share today, what annoys them.
- Post a few strong builds with routes to the Elden Ring subreddits, and see what people open.
- Ship tracking small (items first, stats next) and check that people come back mid-run.

## Later ideas

In the backlog, not planned: suggest a change to a build's author (a variation they can pull into the original);
builds marked "updated for patch 1.x" with a changelog; creating a build page from an uploaded save file
(research first); a few play-based milestones, only if users ask; a side-by-side compare view.
