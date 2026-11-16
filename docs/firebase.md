# Firebase

Read this before touching auth, Firestore, rules, emulators or deploys.

## Projects

| Project            | What                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------- |
| `demo-soulsbuilds` | Local emulators only. A `demo-` project has no real backend: nothing can reach production    |
| `soulsbuilds`      | Production, Spark plan: Hosting (soulsbuilds.com; default domains redirect), Firestore, Auth |

`src/lib/firebase.ts` picks the project: `import.meta.env.DEV` (Vite dev server and Vitest) → emulators;
production builds (`npm run build`, `npm run preview`, deploys) → `soulsbuilds`. The web config in that file is
public by design; security rules protect the data.

## Local development

- `npm run dev` = `node scripts/firebase.mjs emulators:exec --only auth,firestore --ui "node scripts/seed.mjs && vite"`.
  Data lives in memory and resets on every start. `npm run emulators` runs them alone; `npm run seed` re-seeds.
- Ports (`firebase.json`; keep `src/lib/firebase.ts` in sync): auth **9099**, firestore **8085**, Emulator UI
  **4005** (http://127.0.0.1:4005), hub 4405, logging 4505. Vite: **5180**.
- **Java 21+** is required by firebase-tools. `scripts/firebase.mjs` finds one (JAVA_HOME, PATH, macOS
  `java_home`, Homebrew `openjdk` kegs) and puts it on PATH for the CLI. `npm run doctor` shows which.
- Seed accounts and builds: `scripts/seed.mjs` (two users, four builds, a like and a comment, in data model
  v2; it validates every item name). It wipes the emulator's Firestore first, so `npm run seed` resets data.
- `npm run test:rules` runs `tests/rules/` (rules + the real data-layer functions as different users) and
  `tests/migration/` against a **separate** Firestore emulator (`firebase.test.json`: port 8185, project
  `demo-soulsbuilds-test`), so it works while `npm run dev` is running.
- `npm run e2e` runs the Playwright tests in `tests/e2e/`. It reuses running emulators and Vite (`npm run dev`)
  or starts and seeds them itself. CI runs both (`emulator-tests` job, Java 21 via `actions/setup-java`).

## Security rules

- **`firestore.rules` is the v2 ruleset** (T3; model in `docs/architecture.md`), tested by `npm run test:rules`.
  The emulators load it, and production has run it since the T12 cutover (2026-11-15, with the v1→v2 migration).
  It now ships with every approved production deploy from CI.
- `firestore.indexes.json` has the composite indexes the queries need (builds by game + likes/date, by tag, by
  owner; likes by user) and, under `fieldOverrides`, collection-group single-field indexes for account
  deletion (likes by `userId`, comments by `authorId`). A new index takes minutes to build in production; queries that need it fail until then.
- Production also holds an unused 2022 doc, `app/tags` (the old boss-tag list). No rule matches it, so clients
  can't read it; it's in the T12 backup.

## Migrating production (T12, owner-approved)

`scripts/migrate-v1-to-v2.mjs` converts v1 documents (2022) to v2. It is dry-run by default, idempotent (v2 docs
are skipped; each build's likes and comments are written before the build doc), and uses Application Default
Credentials, never a key.

```bash
node scripts/migrate-v1-to-v2.mjs                           # dry run against the local emulator
node scripts/migrate-v1-to-v2.mjs --project soulsbuilds     # dry run against production (read-only)
node scripts/migrate-v1-to-v2.mjs --project soulsbuilds --write   # apply (after rules/indexes deploy)
```

Take a backup first (`node scripts/admin.mjs export --project soulsbuilds`, see "Backups").

What it changes: builds get `ownerId`, `game`, numeric stats (clamped 1–99, recomputed level), an `equipment`
map, timestamps from the docs' own create/update times; `comments[]` → comments subcollection;
users' `likedBuilds[]` → likes subcollection, with `likeCount`/`commentCount` counted from what was written.
Users become `{ displayName, createdAt }`: **emails are dropped from Firestore** (they stay in Firebase Auth)
and v1 `admin: true` flags are reported (set a custom claim instead if still wanted). Item names become game
IDs (T13, `scripts/lib/names-to-ids.mjs` with `scripts/data/name-aliases.json`): names the game data doesn't
have, and Ash of War / affinity / talisman combinations the game doesn't allow, are dropped; the tag
"Warhammer" becomes "Great Hammer". The report lists every renamed, clamped or dropped value, and ends with the
dropped item names and how many builds lost each.

## Moderation: reports and admins (T10)

- Signed-in users report a build or a comment from its page ("Report": a reason from a fixed list plus an
  optional note). Reports live in `reports/{targetId}_{uid}`: one per user per target, created from a client,
  readable by admins (and by the reporter, for "already reported"); a reporter may delete their own (account
  deletion). Rules and tests: `firestore.rules`,
  `tests/rules/`.
- **Admins** have the `admin: true` custom claim (never a Firestore field). The rules let admins delete any
  build or comment; the app has no admin UI yet: moderation runs from `scripts/admin.mjs` (Admin SDK, dry run
  unless `--write`, local emulator unless `--project`):

```bash
node scripts/admin.mjs reports                                   # open reports, grouped by target
node scripts/admin.mjs remove <buildId> [commentId] --write      # delete it, resolve its reports
node scripts/admin.mjs dismiss <buildId> [commentId] --write     # keep it, resolve its reports
node scripts/admin.mjs rename <uid> "New name" --write           # fix a display name (1–40 chars)
node scripts/admin.mjs delete-user <uid|email> --write           # account + everything it published
node scripts/admin.mjs grant you@example.com --write             # admin claim (revoke to undo)
node scripts/admin.mjs reports --project soulsbuilds             # production (ADC, owner only)
node scripts/admin.mjs export [--project soulsbuilds]            # JSON backup of every document
```

- **Delete, not hide** (`docs/decisions.md`). `remove` first saves what it deletes (the build with its comments
  and likes, or the comment) as JSON in `.admin-backups/` (gitignored), so a mistake can be restored by hand.
  `delete-user` (T18) does the same for an account: the in-app "Delete account" scope (builds with their likes
  and comments, likes and comments elsewhere with the counters, reports filed, profile, Auth user), backed up
  first, and it resolves open reports about that user's content as `removed`. Use it when someone asks by
  GitHub issue (they can't sign in) or an in-app deletion stopped halfway.
  Resolved reports keep their doc with `status: 'removed' | 'dismissed'` and `resolvedAt`.
- A new admin claim reaches the user's ID token on their next sign-in (or within an hour).

## App Check (set up at T12, owner)

The code is ready (`src/lib/firebase/app.ts`): App Check is on in production builds because
`APP_CHECK_SITE_KEY` is filled in (steps 1, 2 and the code half of step 3 done 2026-11-15; the key allows
`soulsbuilds.web.app`, `soulsbuilds.firebaseapp.com` and `soulsbuilds.com`). It never runs against the
emulators. Steps, in order (don't enforce first,
or the live site breaks):

1. **Create the key.** Google Cloud console, project `soulsbuilds` → search "reCAPTCHA" in the top bar (the
   product may be listed as **reCAPTCHA Enterprise**; enable its API if asked) → Create key: type _Website_, domains `soulsbuilds.web.app` and `soulsbuilds.firebaseapp.com` (plus any custom domain), no
   checkbox challenge. Copy the site key. (The free tier covers 10,000 assessments a month; App Check caches
   tokens, so that's roughly 10,000 visits. If the console insists on a billing account and you'd rather not,
   the fallback is reCAPTCHA v3: `ReCaptchaV3Provider` in `app.ts`, a one-line change.)
2. **Register the app.** Firebase console → App Check → Apps → the web app → reCAPTCHA Enterprise → paste the
   site key → Save.
3. **Ship the key.** Put it in `APP_CHECK_SITE_KEY` in `src/lib/firebase/app.ts` and deploy hosting.
4. **Watch, then enforce.** Firebase console → App Check → APIs: after a day or two of traffic, the
   Cloud Firestore and Authentication metrics should show almost all requests verified. Then click **Enforce**
   on both. Unverified requests (scripts using the public API key) are refused from then on.
5. **Token TTL: 1 day** (owner's call, T23; console: App Check → Apps → the web app → reCAPTCHA Enterprise →
   Token time to live; default 1 hour). A returning visitor with a valid cached token skips the reCAPTCHA chain
   (~0.9 s sooner content), and each exchange is one reCAPTCHA assessment (10,000 a month free). The cost: a
   token copied out of a browser works for up to a day. `npm run perf` prints the TTL the exchange returned.
6. **Local preview** (`npm run preview` serves the production build on 127.0.0.1, which the key doesn't allow):
   the app switches to debug mode there and logs a debug token in the browser console. Register it under
   App Check → Apps → ⋮ → Manage debug tokens. Never commit a debug token.

Things to know (T23, from the SDK source and measurements):

- Every Firestore and Auth request waits for an App Check token, enforced or not. If `enterprise.js` can't load (a
  blocker, a network that blocks Google), the SDK waits forever (it sets only `script.onload`): no request, no
  error. T24: `src/lib/firebase/appCheckStatus.ts` watches the token (`app.ts` feeds it reCAPTCHA script load
  errors) and goes `blocked` if it hasn't arrived 2 s after such an error, or 10 s after start; the shell's
  `AppCheckNotice` then explains it (blocker hint + Reload) at the top of every page. A cached token (returning
  visitor) or a failed exchange (bots' 403: Firestore goes on with a placeholder token) is not "blocked". We
  don't fake a token while unenforced (owner's call). Manual check: an incognito window (no cached token) →
  DevTools → Network request blocking → `*recaptcha*` → reload: the notice shows in ~2.5 s. Measured on a local
  build served at soulsbuilds.com: notice at ~2.4 s, normal loads unchanged (first Firestore request ~1.2 s).
- `index.html` preloads `https://www.google.com/recaptcha/enterprise.js?render=explicit`, the exact URL
  `@firebase/app-check` injects. Re-check it after an SDK upgrade (a mismatch means a wasted download and a
  console warning). Re-checked at SDK 13.3.0 (T25): same URL, requested once (the preload is reused), and the
  blocked-reCAPTCHA notice still shows at ~2.4 s. Method that needs no SDK source: serve `dist/` with Playwright at
  `https://soulsbuilds.com` (`page.route`), record `/recaptcha/` requests, then abort them and wait for the alert.
- Automated browsers (Playwright) often get a 403 from the exchange (reCAPTCHA scores them as bots). That's
  expected and shows up as unverified requests in the App Check metrics.

## Deploys (owner-approved only)

- **The normal path is CI** (`.github/workflows/ci.yml`, after the checks pass):
  - Every PR from this repo → Hosting preview channel `pr-<number>` (expires in 7 days) and a PR comment with its
    URL, updated on each push. Previews use the **production backend** (real data); once App Check is enforced
    they can't reach Firestore or Auth (preview domains aren't on the reCAPTCHA key), so they're for the UI.
  - Every push to `main` → the `deploy` job waits for the owner's approval (GitHub `production` environment:
    the run's page → **Review deployments**), then deploys `hosting,firestore:rules,firestore:indexes`.
    Rejecting or ignoring it deploys nothing (pending approvals expire after 30 days).
- **By hand** (owner; the commands ask first): `npm run deploy` (checks, then hosting only), or
  `node scripts/firebase.mjs deploy --project soulsbuilds --only firestore:rules,firestore:indexes`. Needs
  `node scripts/firebase.mjs login` once.
- Never `firebase deploy` without `--only`. Hosting serves `dist/` with an SPA rewrite to `index.html`.
- **Cache headers** (`firebase.json` "headers", T21; globs match the request path, before the rewrite, and
  don't overlap because the docs don't say which rule wins): hashed Vite files `/assets/*.@(js|css|woff…)` →
  `public, max-age=31536000, immutable`; `/assets/icons/**` → one week (names aren't hashed; `npm run data` can
  change an icon); everything else (`!/assets/**`: every HTML route, favicon, manifest) → `no-cache`, revalidated
  by ETag. Check locally: `npm run build`, then `node scripts/firebase.mjs emulators:exec --project
demo-soulsbuilds --only hosting "curl -sI http://127.0.0.1:5190/"` (Hosting emulator port 5190).
- `index.html` sends `soulsbuilds.web.app` and `soulsbuilds.firebaseapp.com` to `soulsbuilds.com` (same path).
  Preview channels and Firebase's `/__/auth/*` pages (email verification and password reset links) are unaffected.

## CI deploys: Workload Identity Federation (set up 2026-11-15)

GitHub's OIDC token is exchanged for short-lived credentials of `github-deploy@soulsbuilds.iam.gserviceaccount.com`
(`google-github-actions/auth`). Only workflows in this repository (by numeric ID, so a renamed or re-created repo
doesn't match) can use it. No keys exist. To recreate it (`gcloud auth login` first):

```bash
gcloud services enable iamcredentials.googleapis.com sts.googleapis.com --project soulsbuilds
gcloud iam workload-identity-pools create github --project soulsbuilds --location global --display-name "GitHub Actions"
gcloud iam workload-identity-pools providers create-oidc github --project soulsbuilds --location global \
  --workload-identity-pool github --display-name "GitHub" --issuer-uri https://token.actions.githubusercontent.com \
  --attribute-mapping "google.subject=assertion.sub,attribute.repository_id=assertion.repository_id" \
  --attribute-condition "assertion.repository_id == '762413644'"
gcloud iam service-accounts create github-deploy --project soulsbuilds --display-name "GitHub Actions deploys"
gcloud iam service-accounts add-iam-policy-binding github-deploy@soulsbuilds.iam.gserviceaccount.com \
  --project soulsbuilds --role roles/iam.workloadIdentityUser \
  --member "principalSet://iam.googleapis.com/projects/981152509260/locations/global/workloadIdentityPools/github/attribute.repository_id/762413644"
for role in firebasehosting.admin firebaseauth.admin firebaserules.admin datastore.indexAdmin \
  serviceusage.apiKeysViewer serviceusage.serviceUsageConsumer; do
  gcloud projects add-iam-policy-binding soulsbuilds --condition None \
    --member serviceAccount:github-deploy@soulsbuilds.iam.gserviceaccount.com --role "roles/$role"
done
```

Roles: Hosting Admin (deploys, channels), Firebase Authentication Admin (the CLI adds each preview domain to
Auth's authorized domains), Rules Admin and Datastore Index Admin (production deploys), API Keys Viewer and
Service Usage Consumer (the CLI's project checks). One service account serves both jobs: fine for a
single-maintainer repo, since anyone who can push a branch could edit the workflow anyway.

The GitHub side: environment `production` with the owner as required reviewer, deployable from `main` only
(repo Settings → Environments, or `gh api repos/didrio/soulsbuilds/environments/production`).

## Daily stats job (T20)

`.github/workflows/stats.yml` runs `node scripts/admin.mjs stats --project soulsbuilds --write` every day at
04:17 UTC (and from Actions → Community stats → **Run workflow**). It writes `stats/elden-ring` (builds, distinct
authors, accounts, builds per tag) for the landing page: one read per build, plus a `count()` of users.
It runs as its own service account with only **Cloud Datastore User** (no deploy rights; deploys keep theirs),
through the same Workload Identity pool. No GitHub environment or approval: until the role is granted, the job
fails harmlessly. One-time setup (owner, `gcloud auth login` first):

```bash
gcloud iam service-accounts create github-stats --project soulsbuilds --display-name "GitHub Actions stats"
gcloud iam service-accounts add-iam-policy-binding github-stats@soulsbuilds.iam.gserviceaccount.com \
  --project soulsbuilds --role roles/iam.workloadIdentityUser \
  --member "principalSet://iam.googleapis.com/projects/981152509260/locations/global/workloadIdentityPools/github/attribute.repository_id/762413644"
gcloud projects add-iam-policy-binding soulsbuilds --condition None \
  --member serviceAccount:github-stats@soulsbuilds.iam.gserviceaccount.com --role roles/datastore.user
```

Then check it: `node scripts/admin.mjs stats --project soulsbuilds` (dry run with your own credentials) prints what
it would write. Start the first run by hand (Actions → Community stats → Run workflow), read its log, and open
soulsbuilds.com: the top tags and "N builds by M players" appear. Until the doc exists the landing just doesn't
show them.

## Tracking counters backfill (T36)

Builds carry `playerCount` and `finishedCount` (T36), moved by the client with each tracking doc. Builds saved
before T36 have neither until a one-time recount, and "Most played" leaves them out until then (the hero shows
nothing for them, which is right while nobody tracks them). After the first production deploy with T36, back up
and recount:

```bash
node scripts/admin.mjs export --project soulsbuilds
node scripts/admin.mjs counts --project soulsbuilds          # dry run: lists the builds it would change
node scripts/admin.mjs counts --project soulsbuilds --write
```

It reads every tracking doc (collection group) and every build once. A player's change landing mid-run can be
overwritten, so run it at a quiet time; a second dry run should say "Every build is counted right". The same
command repairs counters if they ever drift.

## Backups (Spark plan)

Spark has no managed backups, point-in-time recovery or scheduled exports (all need Blaze). Instead:

```bash
node scripts/admin.mjs export --project soulsbuilds   # every document as JSON in .admin-backups/ (read-only)
```

Run it **before anything risky** (a migration, a rules change that rewrites data, bulk moderation). It walks every
collection and subcollection; restoring is by hand (a small Admin SDK script over the `docs` map). `.admin-backups/`
is gitignored: keep a copy somewhere safe. Moving to Blaze would allow PITR (7 days) and daily managed backups.

## Relaunch checklist (production)

- [ ] Backup: `admin.mjs export --project soulsbuilds` taken before the migration.
- [ ] Rules and indexes deployed; every index READY; migration written; a second dry run finds no v1 docs.
- [ ] Hosting deployed; smoke test on soulsbuilds.com: sign up, create, like, comment, delete; the default domains
      redirect.
- [ ] App Check: metrics show nearly all requests verified, then **enforced** for Firestore and Auth (below).
- [ ] Auth providers: Email/Password and Google (T30; "Sign-in setup" below); email enumeration protection on
      (Settings → User actions).
- [ ] Authorized domains: `soulsbuilds.com`, `soulsbuilds.web.app`, `soulsbuilds.firebaseapp.com` (plus the
      preview domains the CI adds); remove `localhost` (local work uses the emulators).
- [ ] Email templates (Authentication → Templates): sender name "Souls Builds", the verification and reset texts.
- [ ] Analytics: none in the code; unlink Google Analytics in Project settings → Integrations if it's linked.
- [ ] Billing: Spark can't bill, so no budget alert is needed. If the project ever moves to Blaze, add one first.
- [ ] The owner has the admin claim (`admin.mjs grant`), and `admin.mjs reports --project soulsbuilds` works.

## Sign-in setup (T30, owner, before approving T30's deploy)

T30 adds "Continue with Google" and moves the production `authDomain` (`src/lib/firebase/app.ts`) to
`soulsbuilds.com`, so the Google popup runs on the site's own domain (Hosting serves `/__/auth/*` there). Do steps
1 and 2 **before** approving the deploy, or Google sign-in fails with `redirect_uri_mismatch` (email sign-in is
unaffected).

1. **Google provider.** Console → Authentication → Sign-in method → Add new provider → Google → Enable; public name
   "Souls Builds", support email the owner's. Google Cloud console → APIs & Services → OAuth consent screen
   (Branding): app name "Souls Builds", logo, home page `https://soulsbuilds.com`, privacy policy
   `https://soulsbuilds.com/privacy`, terms `https://soulsbuilds.com/terms`, authorized domain `soulsbuilds.com`.
2. **Redirect URI.** Google Cloud console → APIs & Services → Credentials → the "Web client (auto created by Google
   Service)" OAuth client → Authorized redirect URIs: add `https://soulsbuilds.com/__/auth/handler` (keep the
   firebaseapp.com one). Authentication → Settings → Authorized domains: `soulsbuilds.com` is listed.
3. **Password policy.** Authentication → Settings → Password policy: enforce, minimum length 8, no character
   requirements; leave "force upgrade on sign-in" off (existing accounts keep working). Matches
   `LIMITS.password`.
4. **Email enumeration protection.** Authentication → Settings → User actions: on (the app already answers
   neutrally; this makes the API itself stop telling).
5. Smoke test on soulsbuilds.com: Continue with Google → the popup says "continue to soulsbuilds.com" → choose a
   display name; then delete that test account from the Account page (the menu under your name; it
   re-authenticates with Google).

Locally the Auth emulator fakes Google (a "Sign-in with Google.com" popup where you add an account), and it doesn't
enforce the password policy or enumeration protection. Account linking: an email/password account and a Google
sign-in with the same address are the same person to Firebase ("one account per email"); Google is trusted for
gmail.com addresses, so it can take over an unverified password account there, and for other addresses it fails
with "That email already has an account" (`auth/account-exists-with-different-credential`).

## Credentials and admin scripts

- **No service-account keys in the repo or in CI secrets.** In 2022 `serviceAccount.json` (an Admin SDK key) was
  committed to this public repo; it was removed in T1 and **revoked** by the owner on 2026-11-14 (Google
  Cloud Console → IAM → Service Accounts → `firebase-adminsdk-…` → Keys, key id starting `c33393`).
- Admin scripts (migrations, exports) use Application Default Credentials: the owner runs
  `gcloud auth application-default login` and the script uses `initializeApp({ projectId: 'soulsbuilds' })`.
  With user credentials the Auth admin API also needs a quota project: `admin.mjs` sets
  `GOOGLE_CLOUD_QUOTA_PROJECT` to the `--project` it's given (without it, `grant` fails with an
  `adc-troubleshooting/user-creds` error). Other scripts that call Auth need the same.
  Scripts default to dry-run and say exactly what they'd change.
- Cloud Functions are not used (they need the paid Blaze plan). Prefer rules-validated transactions.
