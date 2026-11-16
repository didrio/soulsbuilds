# Game data

Read this before touching `src/data/`, item lookups, icons or the seed. **Never Read the JSON files whole**
(30–220 KB each): query them with `node -e`, e.g.

```
node -e 'console.log(require("./src/data/er/weapons.json").find(w=>w.name==="Moonveil"))'
node -e 'console.log(require("./src/data/er/spells.json").filter(s=>/Heal/.test(s.name)).map(s=>s.name))'
```

## v2: `src/data/er/` (T7, base game + Shadow of the Erdtree)

Extracted from the owner's own copy of the game (regulation 1.17.3, exported 2026-11-15) and written by
`npm run data`. The app reads it through `src/data/index.ts` (`@/data`): lists (`weapons`, `armorList(slot)`,
**Light vs full data (T11):** `src/data/core.ts` is what every page loads: affinities, skills, Ashes of War, tags
and `er/cards.json` (id, name, icon, skill for weapons; id, name, icon, slot for armor, derived from the full
files by `npm run data`). `src/data/index.ts` re-exports it and adds the full lists (stats, spells…, ~1 MB), which
only the item picker and the editor page load. Build cards, `ItemRow` and the Redux store import `@/data/core`,
never `@/data` (a test guards `core.ts`).
`greatRunes`…), lookups by ID (`getWeapon(id)`, `getArmor(id, slot)`, `getAsh(id)`…, `undefined` for an
unknown ID), `iconUrl(icon)`, display helpers (`affinityName`, `ashLabel`, `weaponSkill`). Shapes: zod schemas
in `src/data/schema.ts` (app code imports their types only, so zod stays out of the bundle).

**Equipment rules** (`src/data/rules.ts`, pure functions, type-only imports; the seed and the migration import
the file directly): `ashChoices` (the Ashes a weapon can take, minus the one granting its built-in skill),
`fitAsh` / `fitAffinity` (what a slot keeps; Standard = null), `allowedAffinities` (the weapon's own ∩ the
Ash's, or the built-in skill's Ash when none is chosen; standard only when it takes no Ashes),
`talismanConflict` (same `group`). The editor's reducers, the picker, the seed and the migration all go
through them.

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
| `acquisition.json`                                                      | where every item comes from (T14; section below)                                                                                      |

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

## Acquisition: where every item comes from (T14)

`src/data/er/acquisition.json` (~400 KB, 39 KB gzipped) is what T15's "How to get this build" composes a route
from. Written by `npm run data` (`scripts/data/acquisition.ts`) from the item lots, shops, recipes, starting
classes and graces, plus hand-written facts. Read it through `src/data/acquisition.ts` (`sourcesOf(file, id)`,
`getLocation`, `getRegion`, `getGate`, `keyItemName`, `implied`): its own module, never imported by `core.ts`
or `index.ts`, so load it lazily. Shape: `acquisitionSchema` in `src/data/schema.ts`.

- **regions**: the 54 travel-menu sub-categories (Limgrave, Stormveil Castle, Gravesite Plain…) in canonical
  route order, each with the gates it needs. **locations**: the 419 Sites of Grace (BonfireWarpParam IDs).
  **gates**: bosses (`margit`, `two-great-runes`, `dlc` = Mohg + Radahn…), medallions and tools
  (`spirit-bell`, `whetstone-knife`, the whetblades), acyclic. **implied**: the gate an item type or affinity
  needs. **keyItems**: whetblades, cookbooks, remembrances, unrestored Great Runes… (no icons).
- **items**: file → item ID → sources, earliest first. A source is `{ kind, location, region, detail, cost?,
item?, requires? }`; kinds: `pickup boss enemy shop remembrance quest start alteration craft`. `item` is what
  you need first (the remembrance to trade, the cookbook, the armor to alter, the unrestored rune). `location`
  null + `region` set = only the region is known; both null = no place yet.

**How places are derived** (the export has no map positions):

| Source                          | Placed by                                                                                            |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Open-world lot `1 0XX ZZ …`     | tile m60_XX_ZZ (`2…` = m61, DLC; `9XXZZ…` = carriages) → nearest grace                               |
| Dungeon lot `AABB …`            | mAA_BB → its entrance grace (lowest menu sort); no grace → WorldMapLegacyConvParam → nearest         |
| Event lot (ID < 10⁷)            | row-name hint `[Place - Boss]` (+ `ALIASES`; a boss named like a grace gets that grace), or `EVENTS` |
| Enemy lot                       | `ENEMIES` farm spot by lot ID, else by enemy type (the lot's hint)                                   |
| Shop / remembrance / alteration | `SHOPS` ID ranges (unclassified range = build fails); material from EquipMtrlSetParam                |
| Recipe                          | its release flag is the cookbook's own lot/shop flag; flag 0 = known from the start                  |
| Starting class                  | CharaInitParam 3000–3009                                                                             |

A lot or shop entry of category "custom weapon" (`EquipParamCustomWeapon`: Edgar's halberd, Yura's Nagakiba,
the DLC's new weapon types) gives both the weapon and the Ash of War on it, since the ash can be taken off.
Reverting an altered armor piece is an `alteration` source too (the only way to some unaltered pieces).

Limits: every item in a big dungeon shows at its entrance grace; open-world items at the grace nearest their
tile, which may be across a cliff. Good enough for "go here"; not a walkthrough.

**Hand-written inputs** (TypeScript, commented): `scripts/data/progression.ts` (regions in route order, gates,
implied gates), `places.ts` (shop ranges, hint aliases, enemy farm spots), `events.ts` (event lots, extra
sources such as keepsakes, `NO_SOURCE` with reasons, `PENDING_FACTS`, empty since T19). Enemy spots are a
good farm, not every place the enemy appears; quest rewards sit where the quest pays out, with who and when in
`detail`; a few facts are region-only where no grace fits (Gowry, Pidia, some DLC field bosses). Facts may be checked on a wiki, facts
only (`docs/decisions.md`). **Validation**: every pickable item has a placed source unless allow-listed, an
allow-listed item that has one fails (keeps the lists true), references resolve, gates are acyclic.

**Spot-check**: `node scripts/data/sample-acquisition.ts [count] [seed]` prints random items with their sources.

## Builds and the 2022 names

Builds store these IDs (`Equipment` in `src/lib/models.ts`; `docs/architecture.md`). The 2022 app stored item
names from a rankedboost.com scrape (deleted in T13; scrapers in `scripts/legacy-data/` for reference).
`scripts/data/name-aliases.json` maps every 2022 name to its ID (1,357 of 1,376 items, all 137 skills as an Ash
of War ID or `null` for a built-in skill, affinities with "Frost" → `cold`); the 18 `unmapped` names (cut armor,
upgrade materials, scrape errors) are dropped. `scripts/migrate-v1-to-v2.mjs` uses it through
`scripts/lib/names-to-ids.mjs` when T12 migrates production. The script that generated it went with the 2022
files; the JSON stays until that migration has run.

Don't add or change data sources without the owner's OK.
