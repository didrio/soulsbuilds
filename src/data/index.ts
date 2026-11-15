// Typed access to the game data v2 (T7) in ./er. Components import from '@/data', never the JSON
// files. Items are looked up by their game param row ID; each build slot implies the file the ID
// belongs to (docs/data.md).
//
// JSON boundary: TypeScript infers a literal type for each JSON file; the `as` casts below assert the
// types from ./schema (src/data/data.test.ts validates the committed files against the schemas).
import affinitiesJson from './er/affinities.json';
import armorJson from './er/armor.json';
import arrowsJson from './er/arrows.json';
import ashesOfWarJson from './er/ashesOfWar.json';
import consumablesJson from './er/consumables.json';
import greatRunesJson from './er/greatRunes.json';
import skillsJson from './er/skills.json';
import spellsJson from './er/spells.json';
import spiritAshesJson from './er/spiritAshes.json';
import tagsJson from './er/tags.json';
import talismansJson from './er/talismans.json';
import tearsJson from './er/tears.json';
import weaponsJson from './er/weapons.json';
import * as rules from './rules';
import type {
  Affinity,
  AffinityKey,
  Armor,
  Arrow,
  AshOfWar,
  Goods,
  Skill,
  Spell,
  Tags,
  Talisman,
  Weapon,
} from './schema';

export type * from './schema';

/** Anything that can sit in an editor slot (what `Slot` renders). */
export type SlotItem = Weapon | Armor | Arrow | Talisman | Spell | Goods;

/** The skill most shields, staffs and seals come with ("No Skill" is a real skill in the game). */
export const NO_SKILL_ID = 10;

export const weapons = weaponsJson as Weapon[];
export const armor = armorJson as Armor[];
export const arrows = arrowsJson as Arrow[];
export const ashesOfWar = ashesOfWarJson as AshOfWar[];
export const skills = skillsJson as Skill[];
export const talismans = talismansJson as Talisman[];
export const spells = spellsJson as Spell[];
export const tears = tearsJson as Goods[];
export const consumables = consumablesJson as Goods[];
export const greatRunes = greatRunesJson as Goods[];
export const spiritAshes = spiritAshesJson as Goods[];
/** The 13 affinities in the game's order, Standard first. */
export const affinities = affinitiesJson as Affinity[];
/** Tag groups for the tag picker ("Bosses", "Melee Weapons", …) → tag names. */
export const tagGroups = tagsJson as Tags;

/** A lookup by ID over `items`; `undefined` for null or an ID that isn't in the data. */
function lookup<T extends { id: number }>(items: readonly T[]) {
  const byId = new Map(items.map((item) => [item.id, item]));
  return (id: number | null | undefined): T | undefined => (id == null ? undefined : byId.get(id));
}

export const getWeapon = lookup(weapons);
export const getArrow = lookup(arrows);
export const getAsh = lookup(ashesOfWar);
export const getSkill = lookup(skills);
export const getTalisman = lookup(talismans);
export const getSpell = lookup(spells);
export const getTear = lookup(tears);
export const getConsumable = lookup(consumables);
export const getGreatRune = lookup(greatRunes);
export const getSpiritAsh = lookup(spiritAshes);

const armorById = lookup(armor);
/** An armor piece by ID, only if it goes in `slot` (a helm ID in the chest slot is undefined). */
export const getArmor = (id: number | null | undefined, slot: Armor['slot']): Armor | undefined => {
  const piece = armorById(id);
  return piece?.slot === slot ? piece : undefined;
};

/** All armor pieces for one slot, in data order. */
export const armorList = (slot: Armor['slot']): Armor[] =>
  armor.filter((piece) => piece.slot === slot);

/** The image of an item's `icon`. */
export const iconUrl = (icon: number) => `/assets/icons/${icon}.webp`;

const affinityNames = new Map(affinities.map(({ key, name }) => [key, name]));
/** Display name of an affinity key ('flame-art' → "Flame Art"). */
export const affinityName = (key: AffinityKey) => affinityNames.get(key) ?? key;

/** What the player sees for an Ash of War: the skill it grants ("Seppuku"). */
export const ashLabel = (ash: AshOfWar) =>
  getSkill(ash.skill)?.name ?? ash.name.replace(/^Ash of War: /, '');

/** The skill a weapon has: the Ash's if one is applied, else its built-in one. */
export const weaponSkill = (weapon: Weapon, ash: AshOfWar | null | undefined) =>
  getSkill(ash ? ash.skill : weapon.skill);

// The rules in ./rules, bound to the data.
export const ashChoices = (weapon: Weapon) => rules.ashChoices(weapon, ashesOfWar);
export const fitAsh = (weapon: Weapon, ash: AshOfWar | null | undefined) =>
  rules.fitAsh(weapon, ash, ashesOfWar);
export const allowedAffinities = (weapon: Weapon, ash: AshOfWar | null) =>
  rules.allowedAffinities(weapon, ash, ashesOfWar);
export const fitAffinity = (
  weapon: Weapon,
  ash: AshOfWar | null,
  affinity: AffinityKey | null | undefined,
) => rules.fitAffinity(weapon, ash, affinity, ashesOfWar);
export const { talismanConflict } = rules;
