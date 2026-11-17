// Typed access to the full game data v2 (T7) in ./er: every weapon, armor piece, spell… with stats.
// Components import from '@/data', never the JSON files. Items are looked up by their game param row
// ID; each build slot implies the file the ID belongs to (docs/data.md).
//
// The big files (weapons, armor, spells, ~1 MB) are only needed in the editor, so code that runs on every
// page (build cards, slots, the Redux store) imports from './core' instead (small files + cards.json,
// T11). This module re-exports core, so editor code can keep importing everything from '@/data'.
//
// JSON boundary: TypeScript infers a literal type for each JSON file; the `as` casts below assert the
// types from ./schema (src/data/data.test.ts validates the committed files against the schemas).
import armorJson from './er/armor.json';
import characterJson from './er/character.json';
import arrowsJson from './er/arrows.json';
import consumablesJson from './er/consumables.json';
import greatRunesJson from './er/greatRunes.json';
import spellsJson from './er/spells.json';
import spiritAshesJson from './er/spiritAshes.json';
import talismansJson from './er/talismans.json';
import tearsJson from './er/tears.json';
import weaponTypesJson from './er/weaponTypes.json';
import weaponsJson from './er/weapons.json';
import { lookup } from './core';
import type {
  Armor,
  Arrow,
  Character,
  Goods,
  Spell,
  SpiritAsh,
  StartingClass,
  Talisman,
  Weapon,
  WeaponType,
} from './schema';

export * from './core';

/** Anything that can sit in an editor slot (what `Slot` renders). */
export type SlotItem = Weapon | Armor | Arrow | Talisman | Spell | Goods | SpiritAsh;

export const weapons = weaponsJson as Weapon[];
/** Weapon types (Dagger, Straight Sword…) in the game's order. */
export const weaponTypes = weaponTypesJson as WeaponType[];
export const armor = armorJson as Armor[];
export const arrows = arrowsJson as Arrow[];
export const talismans = talismansJson as Talisman[];
export const spells = spellsJson as Spell[];
export const tears = tearsJson as Goods[];
export const consumables = consumablesJson as Goods[];
export const greatRunes = greatRunesJson as Goods[];
export const spiritAshes = spiritAshesJson as SpiritAsh[];

export const getWeapon = lookup(weapons);
export const getWeaponType = lookup(weaponTypes);
export const getArrow = lookup(arrows);
export const getTalisman = lookup(talismans);
export const getSpell = lookup(spells);
export const getTear = lookup(tears);
export const getConsumable = lookup(consumables);
export const getGreatRune = lookup(greatRunes);
export const getSpiritAsh = lookup(spiritAshes);

/** An armor piece by ID, whatever its slot. */
export const getArmorById = lookup(armor);
/** An armor piece by ID, only if it goes in `slot` (a helm ID in the chest slot is undefined). */
export const getArmor = (id: number | null | undefined, slot: Armor['slot']): Armor | undefined => {
  const piece = getArmorById(id);
  return piece?.slot === slot ? piece : undefined;
};

/** All armor pieces for one slot, in data order. */
export const armorList = (slot: Armor['slot']): Armor[] =>
  armor.filter((piece) => piece.slot === slot);

const character = characterJson as Character;
/** The ten starting classes (Vagabond … Wretch), in the game's order. */
export const startingClasses: StartingClass[] = character.classes;
/** A starting class by its CharaInitParam ID (builds store it as `startingClass`). */
export const getStartingClass = lookup(startingClasses);
/** The CalcCorrectGraph curves for HP, FP, stamina and equip load (src/lib/buildMath.ts). */
export const statCurves = character.curves;
