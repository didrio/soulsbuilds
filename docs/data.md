# Game data

Read this before touching `src/data/`, item lookups, images or the seed. **The JSON files are large (30–220 KB):
never Read them whole.** The app reads them only through `src/data/index.ts` (typed accessors such as
`getWeapon(name)`, `getArmor(kind, name)`, `armorList(kind)`, `skillNames`; shapes in `src/data/types.ts`).
Query the JSON from the shell instead, e.g.:

```
node -e 'const w=require("./src/data/weaponsAndShields.json"); console.log(w["Moonveil"])'
node -e 'console.log(require("./src/data/spells.json").filter(s=>/Heal/.test(s.name)).map(s=>s.name))'
```

## Files (2022, base game only)

| File                                                                                     | Shape                                                                                 | Used by the app                  |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------- |
| `weaponsAndShields.json`                                                                 | `{ [name]: weapon }` (374): type, skill, weight, scaling letters, `strReq`… (strings) | yes (editor, slots, item picker) |
| `armorIndexed.json`                                                                      | `{ helms, chests, gauntlets, legs }` each `{ [name]: piece }` (491 total)             | yes                              |
| `armor.json`                                                                             | same pieces as arrays, same order as `armorIndexed.json`                              | no (since T2)                    |
| `skillsIndexed.json`                                                                     | `{ [name]: skill }`                                                                   | yes (Ash of War dropdown)        |
| `affinities.json`                                                                        | `{ affinities: string[] }` (wrong: "Frost", no Flame Art)                             | yes                              |
| `talismans.json`, `spells.json`, `tears.json`, `arrowsAndBolts.json`, `consumables.json` | arrays of `{ name, imageUrl, effect, … }`                                             | yes                              |
| `tags.json`                                                                              | `{ Bosses: string[] }`                                                                | yes (tag chips)                  |
| `weapons.json`, `shields.json`, `skills.json`                                            | scraper intermediates                                                                 | no                               |
| `spirits.json`, `materials.json`                                                         | scraped, never wired up (no spirit images exist)                                      | no                               |

`imageUrl` is a path under `public/assets/` (e.g. `/weapons/Coil Shield.png`), with spaces and apostrophes
unencoded. Numbers are strings (`"weight": "1.5"`).

## Known gaps (pinned by `it.fails` tests in `src/data/data.test.ts`)

- 36 weapon built-in skills are missing from `skillsIndexed.json` or misspelled (e.g. "Glinstone Pebble").
- 44 consumables have no image.
- Affinities list is wrong (Frost → Cold; Flame Art missing); every weapon is offered every affinity.
- Some weapons lack stat requirements; names carry scrape quirks ("Flame Grant me Strength").
- **No Shadow of the Erdtree content** (no DLC weapons, weapon types, armor, spells, bosses).

When T7 fixes a gap, its `it.fails` starts failing: turn it into a normal `it`.

## Where it came from

All of it was scraped from **rankedboost.com** in April 2022 by the scripts now in `scripts/legacy-data/`
(see its README); icons were downloaded from the same site. Those scripts no longer run, and both the data and
images have unclear licensing. **T7 picks a new source with the owner** (licensing first), builds a re-runnable
typed pipeline with stable item IDs, and adds the DLC. Don't add or change data sources without the owner's OK.

## Builds reference items by name

Firestore builds store item **names**; loading looks them up in these files. A renamed or removed item silently
disappears from a build on its next save. T7 moves builds to stable IDs with a migration.
