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
- Seed accounts and builds: `scripts/seed.mjs` (two users, four builds; it validates every item name).

## Security rules

- **Production** still has the 2022 test-mode rules, which expired on 2022-05-17: every read and write is
  denied, so the live site shows no data. That's the safe state until relaunch.
- **`firestore.rules` in the repo is INTERIM and local-only** (T1): owner-based writes for the v1 model, but any
  signed-in user can change `likes`/`comments` on any build. **Never deploy it.** T3 writes the real rules
  with tests; T12 deploys them, with the owner.
- `firestore.indexes.json` is empty (v1 has no queries). T3 adds indexes.

## Deploys (owner-approved only)

- `npm run deploy` = `npm run check` then `firebase deploy --project soulsbuilds --only hosting`. It needs
  `npx firebase login` (the owner) and always asks first (`.claude/settings.json`). Hosting serves `dist/` with
  an SPA rewrite to `index.html`.
- Never `firebase deploy` without `--only`, and never deploy rules before T3 lands.
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
