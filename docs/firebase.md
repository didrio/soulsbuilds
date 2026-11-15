# Firebase

Read this before touching auth, Firestore, rules, emulators or deploys.

## Projects

| Project            | What                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `demo-soulsbuilds` | Local emulators only. A `demo-` project has no real backend: nothing can reach production |
| `soulsbuilds`      | Production (Firebase Hosting at soulsbuilds.web.app, Firestore, Auth, Analytics)          |

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

- **Production** still has the 2022 test-mode rules, which expired on 2022-05-17: every read and write is
  denied, so the live site shows no data. That's the safe state until relaunch.
- **`firestore.rules` is the real v2 ruleset** (T3; model in `docs/architecture.md`), tested by
  `npm run test:rules`. The emulators load it. It is **not deployed yet**: production still holds v1 data, so
  deploying rules, indexes and running the migration happen together in T12, with the owner.
- `firestore.indexes.json` has the composite indexes the queries need (builds by game + likes/date, by tag, by
  owner; likes by user). Production builds its indexes when T12 deploys them.

## Migrating production (T12, owner-approved)

`scripts/migrate-v1-to-v2.mjs` converts v1 documents (2022) to v2. It is dry-run by default, idempotent (v2 docs
are skipped; each build's likes and comments are written before the build doc), and uses Application Default
Credentials, never a key.

```bash
node scripts/migrate-v1-to-v2.mjs                           # dry run against the local emulator
node scripts/migrate-v1-to-v2.mjs --project soulsbuilds     # dry run against production (read-only)
node scripts/migrate-v1-to-v2.mjs --project soulsbuilds --write   # apply (after rules/indexes deploy)
```

What it changes: builds get `ownerId`, `game`, numeric stats (clamped 1–99, recomputed level), an `equipment`
map, timestamps from the docs' own create/update times; `comments[]` → comments subcollection;
users' `likedBuilds[]` → likes subcollection, with `likeCount`/`commentCount` counted from what was written.
Users become `{ displayName, createdAt }`: **emails are dropped from Firestore** (they stay in Firebase Auth)
and v1 `admin: true` flags are reported (set a custom claim instead if still wanted). The report lists every
renamed, clamped or dropped value.

## Deploys (owner-approved only)

- `npm run deploy` = `npm run check` then `firebase deploy --project soulsbuilds --only hosting`. It needs
  `npx firebase login` (the owner) and always asks first (`.claude/settings.json`). Hosting serves `dist/` with
  an SPA rewrite to `index.html`.
- Never `firebase deploy` without `--only`. Rules, indexes and the migration go out together (T12).
- T12 replaces manual deploys with GitHub Actions (preview channels per PR, approved production deploys,
  Workload Identity Federation instead of keys).

## Credentials and admin scripts

- **No service-account keys in the repo or in CI secrets.** In 2022 `serviceAccount.json` (an Admin SDK key) was
  committed to this public repo; it was removed in T1 and **revoked** by the owner on 2026-11-14 (Google
  Cloud Console → IAM → Service Accounts → `firebase-adminsdk-…` → Keys, key id starting `c33393`).
- Admin scripts (migrations, exports) use Application Default Credentials: the owner runs
  `gcloud auth application-default login` and the script uses `initializeApp({ projectId: 'soulsbuilds' })`.
  Scripts default to dry-run and say exactly what they'd change.
- Cloud Functions are not used (they need the paid Blaze plan). Prefer rules-validated transactions.
