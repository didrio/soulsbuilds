# The mockup

**"The mockup"** (owner's term, 2026-11-18) is the design the site is being rebuilt to: the dark, dense
"Loadout" look with grades and analysis. It is the guiding reference for the redesign (`TICKETS.md`,
Backlog > Design direction "Loadout", and T81–T85). When the owner says "the mockup", this is it.

- **Live:** the private claude.ai artifact **"Souls Builds Loadout"**,
  https://claude.ai/artifact/AjMju7aaNeottSYU1K6JzR. An agent reads it with the Artifact tool (`action: "read"`).
- **Source:** this folder. The page and its data are kept exactly as published; edit here, then republish.
- **History:** how it was chosen (three pitches, then rounds of feedback) is the older "Souls Builds Directions"
  artifact, https://claude.ai/artifact/TyFTCcL3YfBitcciV4o8zZ. Don't use it for the design itself.
- The **even older** canvas mock-up ("Souls Builds redesign", 6Wuekku4Q9cGVkmN7iS9ym, 2026-11-16) is the
  current live site's look, which this one replaces.

## What's in it

One page with three views, switched by the pitch bar at the top (mock-up chrome, not part of the design):

- **Home** (`#home`): the build list (grid or list layout; the toggle is desktop-only), filter rail, PvE / PvP,
  Popular chips.
- **Build page** (`#build`): tabs Loadout · Analysis · Notes · Guide · Comments. **Test build** switches between
  three builds that cover the variations: _Full_ (magic, PvP, every slot), _Half_ (bleed, PvE, the Rivers of
  Blood seed plus five test spells), _Sparse_ (physical/neutral, a few items, no starting class).
- **New build** (`#new`): the editor and the item picker. **Editor** switches between an empty and an
  in-progress build.

Real: item names, icons, stats, requirements, weights, poise, where items come from, guide routes, vitals (from
`src/data/er/`). Sample: grades, verdicts, analysis text, likes, comments, most authors, the picker's short lists.

| File                        | What                                                                            | Made by                         |
| --------------------------- | ------------------------------------------------------------------------------- | ------------------------------- |
| `souls-builds-loadout.html` | The page: styles, markup, all scripts (no `<html>`/`<head>`: the host wraps it) | by hand                         |
| `data.js`                   | The 22 seeded builds for the home list, with sample likes and counts            | once, from `content/builds/er/` |
| `data-r2.js`                | Sample grades and verdicts per seeded build; the Rivers of Blood analysis       | by hand                         |
| `data-loadouts.js`          | The three test builds' gear, stats, vitals and routes                           | `scripts/loadouts.cjs`          |
| `data-builds.js`            | The test builds' names, colors, analysis, notes, comments                       | by hand                         |
| `data-editor.js`            | Classes, stat curves, the picker's sample lists, Ashes of War                   | `scripts/editor-data.cjs`       |

Icons are not copied here: `scripts/preview.mjs` takes them from `public/assets/icons/`.

## Look at it, change it, republish it

```bash
node design/mockup/scripts/preview.mjs
```

```bash
node design/mockup/scripts/preview.mjs "build|1440|900|build|window.__tab('t-guide')" "phone|390|844|new|window.__edExample('progress')|full"
```

The first builds `.artifacts/loadout-mockup/` (the page, the data files, the 244 icons it uses). The second also
takes screenshots into `.artifacts/loadout-mockup/shots/` (spec `name|width|height|view|js|full`; the script's
header lists the page's test hooks: `__tab`, `__layout`, `__edExample`, `__edPick`). Open the PNGs with Read.

To republish to the same link, run the first command, then call the Artifact tool with `url` =
`https://claude.ai/artifact/AjMju7aaNeottSYU1K6JzR`, `file_path` = `.artifacts/loadout-mockup/souls-builds-loadout.html`,
`root` = `.artifacts/loadout-mockup`, and `files` = the data files plus any icons the artifact doesn't have yet (a
publish keeps files it isn't sent; one publish takes at most 255 files). Read the artifact first if this session
hasn't. After changing gear or lists, regenerate with `node design/mockup/scripts/loadouts.cjs` or
`node design/mockup/scripts/editor-data.cjs`.

## Rules the page follows

The design decisions themselves live in `TICKETS.md` (Design direction "Loadout"); keep the two in step. A few
mechanics worth knowing before editing: the build's signature color is the CSS variable `--sig` on the view
(`#v-build`, `#v-new`), set from the build's damage or status type; every hoverable item carries `data-item` and
is looked up in `byName`; the build page renders from `META` + `LOADOUTS` in `renderBuild(key)`; the editor is a
separate script at the end of the page (state `E`, `renderAll()`, the picker `openPicker('right:0')`).
