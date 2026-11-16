# Tickets

Living, ordered backlog. **One ticket per session**: `/clear` → `/start Tn` → work → `/wrap`. The agent that
wraps a session updates this file and picks the next ticket. Rules: `.claude/skills/wrap/SKILL.md`. Capture
ideas any time with `/ticket`. Ticket numbers are never reused; **next free: T26**.

Each ticket has: **Status**, **Session** (model · effort · plan mode), **Goal**, **Done when**, **Context**
(read-first files, decisions, pitfalls). A fresh session reads the ticket and only what it names.

**Next:** nothing queued (T25 was the last ticket; the owner sets no order). Pick from the Backlog or the owner to-dos below,
and turn the chosen item into a ticket with `/ticket`.

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
done, and so are T18 (account deletion), T22 (layout), T20 (community feel), T23 (App Check wait) T24 (blocked reCAPTCHA) and T25 (Firebase SDK 13).

## In progress

(none)

## Up next

(none: T25 done; add tickets with `/ticket`)

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
- Per-build share previews (Open Graph image/title per build): needs SSR or a Cloud Function (Blaze plan).
- Build comparison view; "copy this build" to start from someone else's.
- Firebase MCP server for agents (local emulator use only) once its emulator support is clear.
- Build history / "updated" badge using `updatedAt`; edit comments (rules allow no comment updates today).
- Admin page in the app (list reports, remove/dismiss) if `scripts/admin.mjs` gets tedious; the rules already
  let admins list reports and delete content.

## Done

Older entries: `docs/tickets-archive.md`.

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
