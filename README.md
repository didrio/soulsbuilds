# Souls Builds

Create, share and discover **Elden Ring** character builds: stats, weapons with affinities and Ashes of War,
armor, talismans, spells, flask tears, tags and a markdown write-up. Browse everyone's builds, like them and
comment. React 19 + Vite + Redux Toolkit + styled-components on Firebase (Auth, Firestore, Hosting).

**Status:** being modernized and finished for a public relaunch. The backlog is in [TICKETS.md](TICKETS.md).

## Quick start

Needs Node 24 (`.nvmrc`), Java 21+ (for the Firebase emulators) and Google Chrome (for screenshots).

```bash
npm ci
npm run doctor   # what this machine can run
npm run dev      # Firebase emulators + seed data + Vite at http://127.0.0.1:5180
```

Local dev never touches production: it runs on the Firebase emulators (project `demo-soulsbuilds`) with seeded
users and builds (accounts in `scripts/seed.mjs`). Emulator UI: http://127.0.0.1:4005.

## Everyday commands

| Command                                    | What it does                                           |
| ------------------------------------------ | ------------------------------------------------------ |
| `npm run check`                            | Typecheck, lint, format check, tests, production build |
| `npm test` / `npm run test:watch`          | Vitest                                                 |
| `npm run screenshot -- <route> [--mobile]` | PNG of a page of the running app (prints the path)     |
| `npm run format` / `npm run lint:fix`      | Fix formatting / lint                                  |
| `npm run deploy`                           | Check, then deploy hosting to production (owner only)  |

## Working on it (humans and agents)

- [AGENTS.md](AGENTS.md): rules, commands, project map, conventions, gotchas. Claude Code also reads
  [CLAUDE.md](CLAUDE.md).
- [TICKETS.md](TICKETS.md): one ticket per session: `/start T2` → work → `/wrap`.
- [docs/](docs/): `architecture.md`, `firebase.md`, `data.md`, `decisions.md`.
