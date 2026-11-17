# Seeded builds

Builds the **Souls Builds** account posts (T52, T53): community builds recreated with credit, each with our own
write-up. Why and how they're picked: `docs/product.md` "Seeding". Written to Firestore by
`scripts/seed-builds.mjs` (dry run by default; AGENTS.md has the commands).

Each build is two files in `er/` with the same name:

- `<slug>.json`: the loadout by the game's item names, and the source to credit.
- `<slug>.md`: the write-up (markdown). The script adds the credit line at the end.

## The JSON

```json
{
  "id": "8Ki6WIsgqkGq15LTSAT5", // the build's Firestore ID: set once, never change it (re-runs update this doc)
  "name": "Rivers of Blood Bleed Samurai", // the page title adds "· Level 150 Elden Ring build"
  "level": 150, // must equal the stat sum − 79
  "startingClass": "Samurai", // or null; stats can't be below its base
  "stats": {
    "vigor": 58,
    "mind": 30,
    "end": 18,
    "str": 16,
    "dex": 38,
    "int": 9,
    "fai": 15,
    "arc": 45
  },
  "rightHand": [{ "weapon": "Rivers of Blood" }], // up to 3: { weapon, affinity, ash }
  "leftHand": [{ "weapon": "Uchigatana", "affinity": "Blood", "ash": "Seppuku" }],
  "arrows": [], // 4 positional slots (arrow, arrow, bolt, bolt), null for empty
  "talismans": [], // up to 4
  "spells": [], // up to 12, within the memory slots
  "tears": [], // up to 2
  "consumables": [], // up to 10
  "armor": { "helm": null, "chest": null, "gauntlet": null, "leg": null },
  "greatRune": null,
  "spiritAsh": null,
  "tags": ["Dexterity", "Arcane", "Bleed (Hemorrhage)", "Katana", "PVE"], // from src/data/er/tags.json
  "image": { "kind": "weapon", "name": "Rivers of Blood" }, // or null for the main weapon
  "source": {
    "author": "Fextralife", // or null when the site is the only name
    "site": "the Fextralife wiki",
    "title": "Sanguine Samurai",
    "url": "https://…",
    "filled": ["stats", "armor"], // what the source left out and we chose (said in the credit)
    "permission": null // where/when the author OK'd using their own write-up (then the .md is theirs)
  },
  "allowUnmet": [], // items kept although the stats don't meet them, when the source says why
  "notes": "Unpublished: what the source said, and what we filled in and why."
}
```

(Comments are for this page only; JSON has none.) Names are the game's, exactly as in `src/data/er/`; an
affinity is its name (`Keen`, `Flame Art`), an Ash of War the skill it grants (`Seppuku`); leave `ash` out for
the weapon's own skill.

## Rules

- **Never invent a loadout.** Read the source. Where it leaves gaps (exact stats, "any medium-roll armor"), fill
  them the way it says and list them in `source.filled`. If nothing readable exists, pick another build.
- **The write-up is ours** (or the author's, with their OK in `source.permission`): 150–350 words, no copied
  sentences. The first paragraph is the search and share description: what the build is and who it's for, in
  about 150 characters. Then `## How it plays`, `## Why these pieces`, `## Stats`.
- **No fake engagement:** seeded builds start with no likes, comments or players.
- `node scripts/seed-builds.mjs` checks everything (the rules, requirements, memory slots, tags) and prints
  each build's numbers; `npm test` runs the same checks on every file.
