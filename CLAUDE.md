@AGENTS.md

## Claude Code specifics

- Session workflow: `/start [Tn]` → work → `/wrap` (both only run when the user types them), `/ticket` to capture
  work for later. When wrapping, recommend the next session's model, effort and plan mode using the table in
  `.claude/skills/wrap/SKILL.md`; every ticket in `TICKETS.md` carries its own **Session** line.
- Other project skills: `/run-app` (dev server, screenshots, driving the app), `/add-feature` (where code goes).
- A PostToolUse hook runs Prettier on every file you write or edit, so don't spend turns on formatting.
- Run `npm run dev` in the background; it's long-lived. Then `npm run screenshot -- <route> [--mobile]` and open
  the printed PNG with Read; that's how you see the app. In the desktop app you can also drive
  `http://127.0.0.1:5180` in the built-in browser pane (sign in, click, type).
- Screenshots cost tokens and stay in context: take them of the pages you changed, not after every edit.
- Don't spawn subagents for work you can do directly; they start cold and cost more. Delegate only big
  read-only sweeps whose answer is small.
- Plan mode: read the files the ticket names yourself, ask the owner's questions in one AskUserQuestion up
  front, keep the plan short (what changes, where, how it's verified). If the plan spans sessions, write it as
  tickets in `TICKETS.md`: the plan file doesn't survive `/clear`.
- Permissions: routine checks are pre-allowed in `.claude/settings.json`; deploys, anything with
  `--project soulsbuilds`, and `git push` always ask.
