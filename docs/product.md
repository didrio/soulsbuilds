# Product: where Souls Builds fits

The owner's direction as of 2026-11-16, from a design conversation and the canvas mockups (the private "Souls
Builds redesign" artifact linked from `TICKETS.md`). Keep this current when the positioning changes; decisions
that follow from it go in `docs/decisions.md`.

## In one line

**The best way to share a Souls build, and the easiest way to actually get one.**

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
- **Like and Track, not Favorite.** A like is public appreciation and doubles as your long-term favorites (the
  profile's Liked tab). Tracking means "I'm playing this now": private by default, with only totals on the build
  page ("37 playing · 12 finished").
- **Rewards celebrate the game, never site use.** Items lighting up, a progress bar, a "Build complete" moment, a
  shelf of finished builds. No streaks, daily rewards, points for site activity, badges for posting or
  commenting, nagging notifications or completion leaderboards. People come back because their run moved on, not
  because the site pulls them.
- **Low friction without added risk.** Tracking starts without an account; the site asks for one once there's
  progress worth keeping. Sign-in details: T30.

## Priorities

1. **Redesign** (T26–T29): the build page is the product.
2. **Measurement** (T38): know whether the next features get used. Blocked on the owner's decision.
3. **Tracking** (T34–T36): serves most users and works alone.
4. **Link previews** (T37): a pasted link shows the build. Needs server rendering (Blaze plan).
5. **Sign-in and account polish** (T30–T31).
6. **Copies and variations** (T32–T33): better once there's a crowd.

## Validate cheaply

- Talk to 5–10 people who post builds: how they share today, what annoys them.
- Post a few strong builds with routes to the Elden Ring subreddits, and see what people open.
- Ship tracking small (items first, stats next) and check that people come back mid-run.

## Later ideas

In the backlog, not planned: suggest a change to a build's author (a variation they can pull into the original);
builds marked "updated for patch 1.x" with a changelog; creating a build page from an uploaded save file
(research first); a few play-based milestones, only if users ask; a side-by-side compare view.
