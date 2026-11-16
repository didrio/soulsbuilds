# Tickets

Living, ordered backlog. **One ticket per session**: `/clear` → `/start Tn` → work → `/wrap`. The agent that
wraps a session updates this file and picks the next ticket. Rules: `.claude/skills/wrap/SKILL.md`. Capture
ideas any time with `/ticket`. Ticket numbers are never reused; **next free: T20**.

Each ticket has: **Status**, **Session** (model · effort · plan mode), **Goal**, **Done when**, **Context**
(read-first files, decisions, pitfalls). A fresh session reads the ticket and only what it names.

**Next:** T18, Account deletion and admin rename · Opus · high · plan mode on.

**Owner to-dos** (from T12; checklist in `docs/firebase.md` "Relaunch checklist"):

- Approve the first CI production run (Actions → the run → Review deployments); it proves Workload Identity end to
  end. Open a throwaway PR once to see the preview comment.
- In a day or two: App Check → APIs, check that nearly all requests are verified, then **Enforce** for Firestore
  and Auth (`docs/firebase.md` "App Check" step 4).
- Console: delete the disposable test account "claude" (Authentication → Users); unlink Google Analytics if it's
  linked (Project settings → Integrations); set the email templates' sender name to "Souls Builds".
- Decide on the display name "Anne Frankly" (migrated from 2022; public on profiles). T18 adds an admin rename.
- Keep a copy of `.admin-backups/export_soulsbuilds_2026-11-15T22-59-34-751Z.json` (the v1 data) outside the repo.

**Relaunched** 2026-11-15 (T12) on soulsbuilds.com. **Order from here** (owner's calls, 2026-11-15): the redesign
(T16, T17), "How to get this build" (T14, T19, T15), build math (T8) and browse (T9) are done. T18
(account deletion) can slot in anywhere; the privacy policy promises deletion by GitHub issue until then.

## In progress

(none)

## Up next

### T18 — Account deletion (in-app) and admin rename

- **Status:** ready
- **Session:** Opus · high effort · plan mode on
- **Goal:** Let users delete their account themselves, and let admins fix a display name, so the privacy policy's
  "open a GitHub issue" path becomes a fallback.
- **Done when:**
  - [ ] Profile (owner only): "Delete account", with a confirm step that says what goes (account, builds with
        their likes and comments, your comments and likes elsewhere, your reports). Re-authentication if Auth asks
        for it (`auth/requires-recent-login`).
  - [ ] Data removal without Cloud Functions (Spark): client-side batches under rules that allow an owner to delete
        their own docs, and the counters (`likeCount`, `commentCount`) on other people's builds kept right in the
        same batches; then `deleteUser`. Decide and document what happens if it fails halfway (re-runnable).
  - [ ] `scripts/admin.mjs rename <uid> <name> [--write]` (display name moderation) and `delete-user <uid>`
        (the same removal via the Admin SDK, with a JSON backup like `remove`).
  - [ ] Rules tests for every new delete path; e2e: sign up, create, comment, delete account, the build is gone.
  - [ ] Privacy page updated (delete it yourself from your profile; GitHub issue as a fallback).
- **Context:** `firestore.rules` (expression budget: keep it cheap), `tests/rules/`, `src/lib/firebase/`
  (`builds.ts`, `likes.ts`, `comments.ts`, `users.ts`, `auth.ts`), `src/features/profile/Profile.tsx`,
  `scripts/admin.mjs` (`removeContent` is the pattern), `src/features/legal/Privacy.tsx`. Counters change in
  the same batch as the doc they count (AGENTS.md).

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
- Firebase JS SDK 13 (and `@firebase/rules-unit-testing` 6, which requires it): check the changelog, upgrade,
  run all three test suites.
- Build history / "updated" badge using `updatedAt`; edit comments (rules allow no comment updates today).
- Admin page in the app (list reports, remove/dismiss) if `scripts/admin.mjs` gets tedious; the rules already
  let admins list reports and delete content.

## Done

Older entries: `docs/tickets-archive.md`.

- T9 — Browse and discovery — 2026-11-15 — level range and search + tag now Firestore queries (multi-field range
  next to the sort `orderBy`; 7 new composite indexes ending in `level`, plus `tags`+`game`+`nameLower`); data-layer
  test. Indexes are untested against production (the emulator ignores them): check the first level/search
  queries after the next deploy.

- T8 — Build math — 2026-11-15 — `character.json` (classes + CalcCorrectGraph curves) and talisman `modifiers`
  from the export; pure `buildMath` (vitals, equip load/roll, poise, requirements incl. two-handing, memory
  slots) tested against Fextralife; `startingClass` saved (rules + tests), spells ≤ 12; Character panel,
  class picker with minimums, requirement and memory-slot warnings.
- T15 — "How to get this build" — 2026-11-15 — pure route solver (`features/editor/guide/route.ts`: earliest
  reachable source, item prerequisites, implied and any-of gates, topological order, steps by grace, legs by
  region) + lazy `GuideSection` on the build view (numbered, collapsible regions, item icons); unit, component
  and e2e tests. Upgrade materials, rune farming and a starting-class suggestion are in the Backlog.
- T19 — Acquisition facts — 2026-11-15 — every pickable item placed (Ragged set → `NO_SOURCE`): ~100 enemy farm
  spots, base-game NPC/quest/painting rewards, DLC bosses and quests, Husks/Moore/Enia shop ranges, reversions;
  pipeline reads weapons that come with an Ash of War and enemy lots by ID. Owner shown a 30-item sample.
- T14 — Acquisition data — 2026-11-15 — `npm run data` writes `acquisition.json`: sources per item (lots placed by ID →
  nearest grace, event hints, shops by range, recipes by cookbook flag, classes), 54 regions in route order, 419
  graces, 27 gates, key items, validation with explicit allow-lists; ~670 items' facts pending (T19).
- T17 — Redesign: build page, editor and item picker — 2026-11-15 — view and edit in one mockup layout (title
  block, framed panels, `ItemRow` tiles, stat bars, prose write-up), picker on a tall `Dialog` with filters and a
  weapon step for Ash of War/affinity, comments/report/like restyled; `legacy.ts`, `Slot` and 2022 icons deleted.
- T16 — Redesign: design system, shell, browse pages — 2026-11-15 — ~50/50 modern and in-world (approved HTML
  mockup v2): base tokens + per-game skin (CSS vars, `skins.ts`, AA contrast test), Inter/Cinzel/Garamond, in-world
  components (Frame, Ornament, PageHero, ItemTile, selection bar), Dialog auth, game tabs removed, landing as dense
  rows with authors, profile/legal/404 restyled; 2022 tokens kept in `legacy.ts` for T17.
- T10 — Moderation — 2026-11-15 — reports on builds and comments (`reports/{targetId}_{uid}`, rules + tests,
  "Report" buttons), `scripts/admin.mjs` (reports, remove with JSON backup, dismiss, grant/revoke admin; tested
  on the emulators), App Check code (off until the owner's key: moved to T12). Delete, not hide
  (`docs/decisions.md`); no admin UI (backlog).
