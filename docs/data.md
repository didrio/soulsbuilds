# Game data

Read this before touching `src/data/`, item lookups, icons or the seed. **Never Read the JSON files whole**
(30–220 KB each): query them with `node -e`, e.g.

```
node -e 'console.log(require("./src/data/er/weapons.json").find(w=>w.name==="Moonveil"))'
node -e 'console.log(require("./src/data/er/spells.json").filter(s=>/Heal/.test(s.name)).map(s=>s.name))'
```

## v2: `src/data/er/` (T7, base game + Shadow of the Erdtree)

Extracted from the owner's own copy of the game (regulation 1.17.3, exported 2026-11-15) and written by
`npm run data`. **The app doesn't use it yet**: T13 switches the app and Firestore over and deletes the 2022
files below. Shapes: zod schemas in `src/data/schema.ts` (app code imports their types only, so zod stays out
of the bundle).

| File                                                                    | What                                                                                                                                  |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `weapons.json` (487, 102 DLC)                                           | type, weight, +0 attack, raw scaling, requirements, damage types, built-in `skill`, `ashesOfWar` (can take one), `affinities` offered |
| `arrows.json` (68)                                                      | arrows, greatarrows, bolts, greatbolts                                                                                                |
| `ashesOfWar.json` (116)                                                 | the skill it grants, weapon types it fits, affinities it allows                                                                       |
| `skills.json` (268)                                                     | weapon skills (built-in and from Ashes), FP of the main use                                                                           |
| `armor.json` (728)                                                      | slot, weight, poise, negation %, resistances                                                                                          |
| `talismans.json` (154)                                                  | effect, weight, `group` (same group can't be worn together, e.g. Erdtree's Favor and +1)                                              |
| `spells.json` (213)                                                     | sorcery/incantation, FP, stamina, slots, INT/FAI/ARC requirements                                                                     |
| `tears.json`, `consumables.json`, `greatRunes.json`, `spiritAshes.json` | name, icon, short effect                                                                                                              |
| `weaponTypes.json`, `affinities.json`, `tags.json`                      | the 46 weapon types (8 DLC), the 13 affinities (key, name, row offset), tag groups                                                    |

Every item has `id`, `name`, `icon` and `dlc`. **IDs are the game's param row IDs** (owner's call,
2026-11-15): stable across patches, unique within a file (each build slot implies its file). Dagger is
`1000000`; a weapon's affinity versions are rows `+100` (Heavy) … `+1200` (Occult), which is how
`affinities` is computed. Affinities are string keys (`'cold'`, `'flame-art'`). Icons are
`public/assets/icons/<icon>.webp`, 160 px (2× the largest slot), only those the data uses (~2,150, 22 MB).

### The pipeline (`scripts/data/`, TypeScript run directly by Node 24)

1. On the Windows PC, the owner exports params (CSV), text (dump) and icons (PNG) with Smithbox:
   `docs/game-data-extraction.md`. The export lives on the Mac at `~/Documents/soulsbuilds-gamedata/`
   (~3 GB, FromSoftware's files: **never in the repo**; `.gitignore` guards against it).
2. `npm run data` reads it (`export.ts`), turns it into the files above (`extract.ts`, enum values in
   `constants.ts` from Paramdex's ER definitions in Smithbox's repo, tags in `tags.ts`), validates
   (schemas, unique IDs, references, icons) and writes. It writes **nothing** if anything fails; it's
   deterministic (a second run changes no byte). Options: `--export <dir>`, `--out <dir>` (trial run
   elsewhere), `--force-icons` (re-encode icons after a patch changes art).
3. Tests: `scripts/data/*.test.ts` run on a small hand-made export (`test-fixtures.ts`), so CI needs no game
   files; `src/data/data.test.ts` checks the committed data (counts, references, icons, known in-game values).

**After a game patch:** re-export (guide steps 2–4), `npm run data`, read what it reports, update the pinned
counts in `src/data/data.test.ts`, look at the diff (one item per line).

### What the game data taught us (handled in `extract.ts` / `constants.ts`)

- Names come from the text dump by row ID; DLC text files win over base ones, except for their "DLC dummy"
  placeholders. Weapon type names are checked against the game's menu text (it says "Great Hammer" and
  "Hand-to-Hand", where Paramdex and the 2022 tags said "Warhammer" and "Hand-to-Hand Art").
- "No Skill" is a real skill: most shields, staffs and seals come with it, and "Ash of War: No Skill" removes
  a weapon's skill. Staffs take one Ash (Spinning Weapon); seals take none.
- `gemMountType` 2 only means "changeable"; a weapon takes Ashes if some Ash also lists its type.
- Katar, Pata and Golem's Halberd come with an Ash their type can't otherwise take (`ODD_DEFAULT_ASHES`).
- Not items: Unarmed (`110000`), the bare Head/Body/Arms/Legs rows, gestures (goods sort group 250).
- Upgrade copies (spirit ash +1…+10, written "+1" or "+ 1"; flasks +1…+12) collapse to one item.

## 2022 files: `src/data/*.json` (frozen, deleted by T13)

Scraped from rankedboost.com in April 2022 (`scripts/legacy-data/`, reference only); base game only, numbers
as strings, wrong affinities ("Frost", no Flame Art), 36 missing skills, 44 consumables without images. The app
still reads them through `src/data/index.ts` (`getWeapon(name)`, `armorList(kind)`…; shapes in
`src/data/types.ts`) with icons in `public/assets/{weapons,armor,items,spells,talismans}/`.

**Builds reference items by name** until T13: a renamed or removed item silently disappears from a build on
its next save. `scripts/data/name-aliases.json` (`node scripts/data/aliases.ts`) maps every 2022 name to its
T7 ID for T13's migration: 1,357 of 1,376 items and all 137 skills (an Ash of War ID, or `null` for a
weapon's built-in skill); the 18 unmapped names (cut armor, upgrade materials, scrape errors) are listed in
it.

Don't add or change data sources without the owner's OK.
