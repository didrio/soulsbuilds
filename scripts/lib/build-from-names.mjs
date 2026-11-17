// Builds written with item names, as people read them, → game IDs (the v2 `equipment`), for the emulator seed
// (scripts/seed.mjs) and the seeded builds (scripts/seed-builds.mjs, T52). Strict: an unknown name, an Ash of
// War or affinity the weapon can't have, talismans that can't be worn together or armor in the wrong slot
// throw, so a seed never shows something the editor would drop. The game's rules: src/data/rules.ts.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fitAffinity, fitAsh, talismanConflict } from '../../src/data/rules.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const ITEM_FILES = [
  'weapons',
  'armor',
  'arrows',
  'talismans',
  'spells',
  'tears',
  'consumables',
  'greatRunes',
  'spiritAshes',
  'ashesOfWar',
  'skills',
  'affinities',
  'weaponTypes',
];

/** The game data the conversion and the checks read, from src/data/er/ (item lists, classes, tags). */
export function loadItemData(dir = join(ROOT, 'src', 'data', 'er')) {
  const read = (file) => JSON.parse(readFileSync(join(dir, `${file}.json`), 'utf8'));
  const data = Object.fromEntries(ITEM_FILES.map((file) => [file, read(file)]));
  data.character = read('character');
  data.tags = new Set(Object.values(read('tags')).flat());
  return data;
}

export const ARMOR_SLOTS = { helm: 'head', chest: 'chest', gauntlet: 'arms', leg: 'legs' };

/**
 * `equipment` with item names → the v2 `equipment` with game IDs. Weapons are positional (1–3 main hand,
 * 4–6 off hand, null for empty), each with an affinity key (`weaponAffinities`, null = Standard) and an Ash
 * of War by the skill it grants (`weaponSkills`, null = the built-in skill). `label` starts every error.
 */
export function toEquipmentIds(e, data, label = 'Build') {
  const fail = (what) => {
    throw new Error(`${label}: ${what}`);
  };
  const find = (file, name, matches = () => true) =>
    data[file].find((item) => item.name === name && matches(item)) ??
    fail(`no ${file} item "${name}"`);
  const ids = (file, names = []) => names.map((name) => (name ? find(file, name).id : null));
  const skillName = (ash) => data.skills.find((skill) => skill.id === ash.skill)?.name;

  const weapons = (e.weapons ?? []).map((name) => (name ? find('weapons', name) : null));
  const weaponSkills = weapons.map((weapon, i) => {
    const name = e.weaponSkills?.[i];
    if (!name) return null;
    if (weapon && skillName({ skill: weapon.skill }) === name)
      fail(`${name} is the ${weapon.name}'s own skill: leave its Ash of War empty`);
    const ash = find('ashesOfWar', `Ash of War: ${name}`, (a) => skillName(a) === name);
    if (!weapon || fitAsh(weapon, ash, data.ashesOfWar) !== ash)
      fail(`${weapon?.name ?? 'an empty slot'} can't take the Ash of War "${name}"`);
    return ash;
  });
  const weaponAffinities = weapons.map((weapon, i) => {
    const key = e.weaponAffinities?.[i] ?? null;
    if (key && (!weapon || fitAffinity(weapon, weaponSkills[i], key, data.ashesOfWar) !== key))
      fail(`${weapon?.name ?? 'an empty slot'} can't have the affinity "${key}"`);
    return key;
  });
  const talismans = (e.talismans ?? []).map((name) => find('talismans', name));
  talismans.forEach((talisman, i) => {
    const conflict = talismanConflict(talisman, talismans.slice(0, i));
    if (conflict) fail(`"${talisman.name}" can't be worn with "${conflict.name}"`);
  });
  const armor = Object.fromEntries(
    Object.entries(ARMOR_SLOTS).map(([slot, armorSlot]) => [
      slot,
      e[slot] ? find('armor', e[slot], (piece) => piece.slot === armorSlot).id : null,
    ]),
  );
  return {
    weapons: weapons.map((weapon) => weapon?.id ?? null),
    weaponAffinities,
    weaponSkills: weaponSkills.map((ash) => ash?.id ?? null),
    arrows: ids('arrows', e.arrows),
    talismans: talismans.map((talisman) => talisman.id),
    spells: ids('spells', e.spells),
    tears: ids('tears', e.tears),
    consumables: ids('consumables', e.consumables),
    ...armor,
    greatRune: e.greatRune ? find('greatRunes', e.greatRune).id : null,
    spiritAsh: e.spiritAsh ? find('spiritAshes', e.spiritAsh).id : null,
  };
}

/** The data file behind each build image kind (T40). */
export const IMAGE_FILES = {
  weapon: 'weapons',
  helm: 'armor',
  chest: 'armor',
  gauntlet: 'armor',
  leg: 'armor',
  talisman: 'talismans',
  spell: 'spells',
  tear: 'tears',
  greatRune: 'greatRunes',
  spiritAsh: 'spiritAshes',
};

/** The build image (T40): `{ kind, name }` → `{ kind, id }`, null for the default (the main weapon). */
export function imageOf(image, data, label = 'Build') {
  if (!image) return null;
  const { kind, name } = image;
  const found = data[IMAGE_FILES[kind]]?.find((item) => item.name === name);
  if (!found) throw new Error(`${label}: no ${kind} "${name}" for the image`);
  return { kind, id: found.id };
}

/** A starting class name → its CharaInitParam ID, null for none. */
export function classId(name, data, label = 'Build') {
  if (!name) return null;
  const found = data.character.classes.find((item) => item.name === name);
  if (!found) throw new Error(`${label}: no starting class "${name}"`);
  return found.id;
}
