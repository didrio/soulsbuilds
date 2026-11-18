---
name: wrap
description: End a work session — final quality pass, update TICKETS.md (outcomes, handoff notes, new or reordered tickets, next pick with recommended model/effort/plan mode), update docs, commit and push, and print the steps for the next session. Only when the user types /wrap.
disable-model-invocation: true
---

# Wrap a session

The next session starts with only `AGENTS.md`, `TICKETS.md`, `docs/` and git history. Make them enough.

## 1. Final pass

- `npm run check` passes. Fix what it reports, or stop and tell the user why you can't.
- Firestore rules or data access changed: the rules tests pass (from T3: `npm run test:rules`).
- UI changed: with `npm run dev` running, `npm run screenshot -- <route>` and `-- <route> --mobile` for the
  affected pages, and look at them. Note any problems the script prints (console errors, failed requests).
- Review `git diff`: no debug logging, stray files, commented-out code, secrets, or TODOs you meant to finish.
- If a convention, command, script or architecture changed, update `AGENTS.md` / `docs/` / skills so they stay
  true. Docs describe the project **as it is now**: replace outdated text, don't append history (git has it).
  Keep AGENTS.md's "Where things stand" to 8 lines or fewer.

## 2. Update TICKETS.md (the most important step)

- **Finished tickets** → move to **Done** as one line: `T5 — Title — YYYY-MM-DD — what changed, in a phrase`.
- **Unfinished tickets** → stay in **Up next** with an updated status and a **Handoff** bullet: what's done,
  what's left, where (files), gotchas, how to verify.
- **New work discovered** → new tickets with the next unused number (never reuse numbers). Write them so a fresh
  agent can start without re-investigating: goal, done-when checklist, the files and decisions involved, pitfalls,
  how to test. Vague ideas go to **Backlog** instead.
- **Parked tickets** (Backlog > Parked tickets, e.g. T32, T33) stay there until the owner asks for one by number.
  Never move one to **Up next**, recommend it, or name it in the **Next:** line, even if it looks like the obvious
  next piece of work. If nothing else is ready, say so and ask.
- **Priority backlog** tickets (Backlog > Priority backlog) are next after the owner's current requests but stay
  there until the owner says to take them out: don't move one to **Up next** or name it in the **Next:** line before
  then. With **Up next** empty, the **Next:** line is "the owner's next request".
- Re-read **Up next** top to bottom: reorder by what should happen next; merge, split or rewrite stale tickets.
- Set the **Next:** line at the top to the recommended ticket and its session settings (table below). Every ticket
  in **Up next** has a **Session** line.
- Keep the file lean: **Done** holds only the last session or two (about 10 lines); move older lines to the end
  of `docs/tickets-archive.md` (oldest first).

### Choosing session settings

Goal: the best ratio of quality to cost and time. Pick the **cheapest row that will still get it right**.

| Ticket shape                                                                    | Model  | Effort     | Plan mode |
| ------------------------------------------------------------------------------- | ------ | ---------- | --------- |
| Data model, security rules, data pipeline, big refactor, ambiguous product call | Opus   | extra high | on        |
| New feature across several pages; auth; deploy/release; hard bugs; build math   | Opus   | high       | on        |
| Well-specified feature or fix: the ticket already says what and where           | Sonnet | medium     | off       |
| Small UI/copy/styling tweaks, chores, docs                                      | Sonnet | low        | off       |

- A detailed ticket (files, decisions, how to verify) is what lets a cheaper session do the job well. Write it.
- Torn between two rows: go higher for things that are expensive to change later (Firestore model, rules, item
  IDs, auth, routes), lower for everything else.

## 3. Commit and push

- Stage everything that belongs to the session's work (`git status` must end clean, apart from intentionally
  untracked local files).
- Message: `T5: <summary>` (several tickets: `T5, T6: …`; no ticket: a plain summary), then short bullets of what
  changed, then the attribution trailer your harness asks for.
- Commit on the current branch (normally `main`), then **push it**: `git push`, or `git push -u origin <branch>`
  when it has no upstream yet. This is a standing approval (owner's call, 2026-11-14): don't ask first.
- **Never force-push.** If the push is rejected (remote has new commits, auth fails), stop and tell the user what
  happened; don't rebase, merge or retry with force on your own.
- After pushing to `main`, note the CI run (`gh run list --branch main --limit 1`); if it's still running, say
  so in the hand-off rather than waiting on it.

## 4. Hand off

End your reply with exactly this shape (fill in the values):

```
✓ Wrapped T5 — <title> (<short hash>, pushed to <branch>; CI <passed|running|failed>)

Next session:
1. /clear
2. Model: <Opus|Sonnet> · Effort: <low|medium|high|extra high> · Plan mode: <on|off>
3. /start T6 — <title>
```

The settings in line 2 come from the next ticket's **Session** line (effort = thinking level). Add at most two
lines for anything the user must do before then (e.g. a console setting only they can change). Then stop: the
session is over.
