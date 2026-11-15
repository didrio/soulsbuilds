// Typed access to the static game data. Components import from '@/data', never the JSON files.
// Items are looked up by NAME (builds store names until T7 moves them to stable IDs).
//
// JSON boundary: TypeScript infers a literal type for each JSON file; the `as` casts below assert
// it matches the interfaces in ./types (src/data/data.test.ts checks the data's integrity).
import affinitiesJson from './affinities.json';
import armorJson from './armorIndexed.json';
import arrowsJson from './arrowsAndBolts.json';
import consumablesJson from './consumables.json';
import skillsJson from './skillsIndexed.json';
import spellsJson from './spells.json';
import tagsJson from './tags.json';
import talismansJson from './talismans.json';
import tearsJson from './tears.json';
import weaponsJson from './weaponsAndShields.json';
import type {
  Armor,
  ArmorKind,
  Arrow,
  Consumable,
  Skill,
  Spell,
  Talisman,
  Tear,
  Weapon,
} from './types';

export type * from './types';

const weaponsByName = weaponsJson as Record<string, Weapon>;
const armorByName = armorJson as Record<ArmorKind, Record<string, Armor>>;
const skillsByName = skillsJson as Record<string, Skill>;

/** First item wins on duplicate names, like the `Array.find` lookups this replaced. */
function indexByName<T extends { name: string }>(items: readonly T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) if (!map.has(item.name)) map.set(item.name, item);
  return map;
}

export const arrows = arrowsJson as Arrow[];
export const consumables = consumablesJson as Consumable[];
export const spells = spellsJson as Spell[];
export const talismans = talismansJson as Talisman[];
export const tears = tearsJson as Tear[];
export const weapons: Weapon[] = Object.values(weaponsByName);
export const affinities: string[] = affinitiesJson.affinities;
/** Tag groups for the tag picker ("Bosses", "Effects", …) → tag names. */
export const tagGroups = tagsJson as Record<string, string[]>;
/** Every skill name, sorted (the weapon skill picker's options). */
export const skillNames: string[] = Object.values(skillsByName)
  .map(({ name }) => name)
  .sort();

const arrowsByName = indexByName(arrows);
const consumablesByName = indexByName(consumables);
const spellsByName = indexByName(spells);
const talismansByName = indexByName(talismans);
const tearsByName = indexByName(tears);

/** Item lookups by name. `undefined` when the name isn't in the data (renamed or misspelled). */
export const getWeapon = (name: string | null | undefined) =>
  name == null ? undefined : weaponsByName[name];
export const getArmor = (kind: ArmorKind, name: string | null | undefined) =>
  name == null ? undefined : armorByName[kind][name];
export const getArrow = (name: string | null | undefined) =>
  name == null ? undefined : arrowsByName.get(name);
export const getConsumable = (name: string | null | undefined) =>
  name == null ? undefined : consumablesByName.get(name);
export const getSpell = (name: string | null | undefined) =>
  name == null ? undefined : spellsByName.get(name);
export const getTalisman = (name: string | null | undefined) =>
  name == null ? undefined : talismansByName.get(name);
export const getTear = (name: string | null | undefined) =>
  name == null ? undefined : tearsByName.get(name);
export const getSkill = (name: string | null | undefined) =>
  name == null ? undefined : skillsByName[name];

/** All armor pieces of one kind, in data order. */
export const armorList = (kind: ArmorKind): Armor[] => Object.values(armorByName[kind]);
