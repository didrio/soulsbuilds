// 2022 item names → game IDs (T13), for scripts/migrate-v1-to-v2.mjs. Names map through
// scripts/data/name-aliases.json (2022 name → T7 ID per category, written by T7's alias script);
// then the game's rules apply (src/data/rules.ts), since the 2022 app let any weapon take any skill
// and affinity. Whatever is dropped or changed comes back as a note, so the dry-run report shows it.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fitAffinity, fitAsh, talismanConflict } from '../../src/data/rules.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const readJson = (path) => JSON.parse(readFileSync(join(ROOT, path), 'utf8'));

/** 2022 tags that the game names differently (owner's call, 2026-11-15). */
export const TAG_RENAMES = { Warhammer: 'Great Hammer' };

const ARMOR_SLOTS = { helm: 'head', chest: 'chest', gauntlet: 'arms', leg: 'legs' };

/** The alias table and the game data the mapping needs, from the repo. */
export function loadGameData() {
  const er = (file) => readJson(`src/data/er/${file}.json`);
  const byId = (items) => new Map(items.map((item) => [item.id, item]));
  return {
    aliases: readJson('scripts/data/name-aliases.json'),
    weapons: byId(er('weapons')),
    armor: byId(er('armor')),
    talismans: byId(er('talismans')),
    ashes: er('ashesOfWar'),
    ashById: byId(er('ashesOfWar')),
    skills: byId(er('skills')),
  };
}

const clean = (value) => (typeof value === 'string' && value.trim() ? value.trim() : null);
const list = (value) => (Array.isArray(value) ? value : []);

/** 2022 tags with the renames applied (and any duplicate they create removed). */
export function renameTags(tags, note = () => {}) {
  const renamed = list(tags).map((tag) => {
    if (!(tag in TAG_RENAMES)) return tag;
    note(`tag "${tag}" → "${TAG_RENAMES[tag]}"`);
    return TAG_RENAMES[tag];
  });
  return [...new Set(renamed)];
}

/**
 * A v1 build's equipment (item names, 2022 affinity and skill names) → the v2 `equipment` input
 * for buildContent (game IDs). `note(message)` is called for every name dropped and every Ash of
 * War, affinity or talisman the game doesn't allow; `dropped(category, name)` for each unknown name.
 */
export function equipmentToIds(
  names,
  game = loadGameData(),
  { note = () => {}, dropped = () => {} } = {},
) {
  const { aliases } = game;
  const id = (category, raw, label = category) => {
    const name = clean(raw);
    if (name === null) return null;
    const itemId = aliases.items[category]?.[name];
    if (itemId === undefined) {
      note(`dropped ${label} "${name}" (not in the game data)`);
      dropped(category, name);
      return null;
    }
    return itemId;
  };
  const ids = (category, values, label) =>
    list(values)
      .map((value) => id(category, value, label))
      .filter((value) => value !== null);

  const weapons = Array.from({ length: 6 }, (_, i) => {
    const weaponId = id('weapons', list(names.weapons)[i], 'weapon');
    return weaponId === null ? null : game.weapons.get(weaponId);
  });

  const ashes = weapons.map((weapon, i) => {
    const name = clean(list(names.weaponSkills)[i]);
    if (name === null) return null;
    if (!weapon) {
      note(`dropped skill "${name}" on empty weapon slot ${i + 1}`);
      return null;
    }
    if (!(name in aliases.weaponSkills)) {
      note(`dropped skill "${name}" on ${weapon.name} (not in the game data)`);
      dropped('weaponSkills', name);
      return null;
    }
    const ashId = aliases.weaponSkills[name];
    const builtIn = game.skills.get(weapon.skill)?.name;
    if (ashId === null) {
      // A unique skill, not an Ash of War: only the weapon it belongs to has it.
      if (builtIn !== name) note(`dropped skill "${name}" on ${weapon.name} (it keeps ${builtIn})`);
      return null;
    }
    const ash = game.ashById.get(ashId);
    const fitted = fitAsh(weapon, ash, game.ashes);
    if (fitted === null && ash.skill !== weapon.skill)
      note(`dropped Ash of War "${name}" on ${weapon.name} (the game doesn't allow it)`);
    return fitted;
  });

  const weaponAffinities = weapons.map((weapon, i) => {
    const name = clean(list(names.weaponAffinities)[i]);
    if (name === null) return null;
    const key = aliases.affinities[name];
    if (key === undefined) {
      note(`dropped affinity "${name}" (not in the game data)`);
      dropped('affinities', name);
      return null;
    }
    if (!weapon) {
      if (key !== 'standard') note(`dropped ${name} affinity on empty weapon slot ${i + 1}`);
      return null;
    }
    const fitted = fitAffinity(weapon, ashes[i], key, game.ashes);
    if (fitted === null && key !== 'standard')
      note(`dropped ${name} affinity on ${weapon.name} (the game doesn't allow it)`);
    return fitted;
  });

  const talismans = [];
  for (const talismanId of ids('talismans', names.talismans, 'talisman')) {
    const talisman = game.talismans.get(talismanId);
    const conflict = talismanConflict(talisman, talismans);
    if (conflict) note(`dropped talisman "${talisman.name}" (can't be worn with ${conflict.name})`);
    else talismans.push(talisman);
  }

  const armor = Object.fromEntries(
    Object.entries(ARMOR_SLOTS).map(([slot, armorSlot]) => {
      const pieceId = id('armor', names[slot], slot);
      const piece = pieceId === null ? undefined : game.armor.get(pieceId);
      if (piece && piece.slot !== armorSlot) {
        note(`dropped ${slot} "${piece.name}" (it's ${piece.slot} armor)`);
        return [slot, null];
      }
      return [slot, piece?.id ?? null];
    }),
  );

  return {
    weapons: weapons.map((weapon) => weapon?.id ?? null),
    weaponAffinities,
    weaponSkills: ashes.map((ash) => ash?.id ?? null),
    arrows: Array.from({ length: 4 }, (_, i) => id('arrows', list(names.arrows)[i], 'arrow')),
    talismans: talismans.map((talisman) => talisman.id),
    spells: ids('spells', names.spells, 'spell'),
    tears: ids('tears', names.tears, 'tear'),
    consumables: ids('consumables', names.consumables, 'item'),
    ...armor,
    greatRune: null,
    spiritAsh: null,
  };
}
