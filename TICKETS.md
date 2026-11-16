# Tickets

Living, ordered backlog. **One ticket per session**: `/clear` → `/start Tn` → work → `/wrap`. The agent that
wraps a session updates this file and picks the next ticket. Rules: `.claude/skills/wrap/SKILL.md`. Capture
ideas any time with `/ticket`. Ticket numbers are never reused; **next free: T46**.

Each ticket has: **Status**, **Session** (model · effort · plan mode), **Goal**, **Done when**, **Context**
(read-first files, decisions, pitfalls). A fresh session reads the ticket and only what it names.

**Next:** T42 — Free up rules budget on builds before the next field · Opus · extra high · plan mode on (it
unblocks copies and variations, T32 → T33). Also from `docs/product.md` "Priorities": usage counts (T38, blocked on
the owner), link previews (T37, blocked on the Blaze decision), the branded email action page (T43), and item
hover cards (T45, no rush).
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
T40 (the build image), T30 (sign up and log in), T31 (profile and account settings) and T44 (route stops done).

## In progress

(none)

## Up next

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

### T42 — Free up rules budget on builds before the next field

- **Status:** ready (must land before T32, whose `basedOn` adds a field and a `get`)
- **Session:** Opus · extra high effort · plan mode on
- **Goal:** Room in `builds/{id}`'s rules for new fields. After T40 (the build image) the full-equipment test
  (`tests/rules/firestore.rules.test.ts`, "accepts a build with every slot filled…") fails if `validContent`
  gains about five more comparisons: Firestore's ~1,000-expression limit, denied with a bare `PERMISSION_DENIED`.
- **Done when:**
  - The worst-case create and owner edit (every slot filled, an image set) have measured headroom, recorded in
    the `firestore.rules` budget comment and `docs/firebase.md`: e.g. at least 100 padding comparisons still
    pass.
  - The same writes are accepted and rejected as before: every existing rules test passes unchanged, plus tests
    for anything newly checked or no longer checked.
  - `npm run test:rules`, `npm run check`, `npm run e2e` pass; a decision row if what's validated changes.
- **Context:** budget comment above `isItemIdOrNull` in `firestore.rules`. What T40 learned: each use of a
  function argument re-walks `request.resource.data…`. `let` bindings are **not** memoized (binding the
  equipment lists in `validEquipment` made it worse). `d.get('image', null)` with no `hasAll` was cheaper than
  `'image' in d` + `hasExactly`. Literal key lists instead of `contentKeys().concat(…)` on create gained
  nothing. Ideas to measure: drop the per-entry type checks of `weaponSkills` (size only, like talismans: the
  app ignores unknown IDs); check `slots6` entries with fewer re-walks; skip `validContent` parts whose fields
  aren't in `changedKeys()` on update. How to measure: temporarily prepend `(1 == 1 && … ×N) &&` to a check in
  `validContent` and run `npm run test:rules`; T40 found N = 5 already fails.

### T32 — Make a copy: a build based on another

- **Status:** ready after T42 (rules budget for `basedOn`; the button goes in T28's build hero); owner decisions first
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

- **Status:** ready (owner, 2026-11-16: no rush)
- **Session:** Opus · high effort · plan mode on
- **Goal:** Hovering over (or focusing) any item image on the build page, on any tab (Loadout, Description, How
  to get, the hero, the summary column), shows a small card with the item's name and the few facts a player
  wants at a glance. The landing page's rows stay as they are.
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
    ★ tap shows it, or the card stays desktop-only. It never covers the edit-mode tile buttons or blocks a
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
- T30 — Sign up and log in — 2026-11-16 — owner: Google + email, display name in its own step, 8 characters,
  action page later (T43), no canvas mock. `features/auth/AuthDialog` (views Login, SignUp, ForgotPassword,
  ChooseName; any signed-in account without `users/{uid}` gets the name step, closing it logs out), GoogleButton
  (popup; emulator fakes it), `PasswordInput`, FormField + `useFieldErrors` (errors by field, focus the first);
  `signUp` no longer writes the profile; reset answers the same for unknown emails (was a leak); Google-only
  deletion re-auths with a popup; production `authDomain` → soulsbuilds.com. Console steps: docs/firebase.md
  "Sign-in setup" (owner, before the deploy). Dialog focus starts on "Continue with Google".
- T40 — Choose the build's main image — 2026-11-16 — owner: picker in edit mode's title block ("Change image" →
  `BuildImageDialog`, radio rows), gear only (no arrows/consumables); `image: { kind, id } | null` (rules check the
  shape, optional on create), `buildImage` / `imageChoices` in `lib/equipment.ts` (read-time fallback to the main
  weapon; the editor saves a gone pick as null), `getCardItem` + 5 new card kinds (cards.json +7 KB gzipped);
  hero, landing rows, profile panels; e2e `build-image.spec.ts`. Rules budget nearly exhausted → T42.
