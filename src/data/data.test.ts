// Integrity checks for the game data v2 in src/data/er/ (T7), written by `npm run data` from the
// owner's export of the game files (docs/data.md).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  armorSchema,
  cardsSchema,
  makeCards,
  arrowSchema,
  ashOfWarSchema,
  affinitySchema,
  DATA_FILES,
  goodsSchema,
  skillSchema,
  spellSchema,
  tagsSchema,
  talismanSchema,
  weaponSchema,
  weaponTypeSchema,
} from './schema';

const DIR = join(import.meta.dirname, 'er');
const ICONS = join(import.meta.dirname, '..', '..', 'public', 'assets', 'icons');
const read = <T extends z.ZodType>(file: string, schema: T): z.infer<T>[] =>
  z.array(schema).parse(JSON.parse(readFileSync(join(DIR, file), 'utf8')));

const affinities = read('affinities.json', affinitySchema);
const weaponTypes = read('weaponTypes.json', weaponTypeSchema);
const skills = read('skills.json', skillSchema);
const ashesOfWar = read('ashesOfWar.json', ashOfWarSchema);
const weapons = read('weapons.json', weaponSchema);
const arrows = read('arrows.json', arrowSchema);
const armor = read('armor.json', armorSchema);
const talismans = read('talismans.json', talismanSchema);
const spells = read('spells.json', spellSchema);
const goods = (file: string) => read(file, goodsSchema);
const tags = tagsSchema.parse(JSON.parse(readFileSync(join(DIR, 'tags.json'), 'utf8')));

const files = {
  'skills.json': skills,
  'ashesOfWar.json': ashesOfWar,
  'weapons.json': weapons,
  'arrows.json': arrows,
  'armor.json': armor,
  'talismans.json': talismans,
  'spells.json': spells,
  'tears.json': goods('tears.json'),
  'consumables.json': goods('consumables.json'),
  'greatRunes.json': goods('greatRunes.json'),
  'spiritAshes.json': goods('spiritAshes.json'),
};
const byName = <T extends { name: string }>(items: T[], name: string) => {
  const item = items.find((i) => i.name === name);
  if (!item) throw new Error(`${name} not found`);
  return item;
};

describe('game data v2', () => {
  it('has every file the schema lists, each valid (parsed above)', () => {
    for (const file of [...Object.keys(DATA_FILES), 'tags.json'])
      expect(existsSync(join(DIR, file)), file).toBe(true);
  });

  it('has unique IDs in every file', () => {
    for (const [file, items] of Object.entries(files)) {
      const ids = items.map((item) => item.id);
      expect(new Set(ids).size, file).toBe(ids.length);
    }
  });

  it('has the expected counts, base game + Shadow of the Erdtree (regulation 1.17.3)', () => {
    const counts = Object.fromEntries(
      Object.entries(files).map(([file, items]) => [
        file,
        [items.length, items.filter((item) => 'dlc' in item && item.dlc).length],
      ]),
    );
    expect(counts).toEqual({
      'skills.json': [268, 80],
      'ashesOfWar.json': [116, 25],
      'weapons.json': [487, 102],
      'arrows.json': [68, 5],
      'armor.json': [728, 145],
      'talismans.json': [154, 40],
      'spells.json': [213, 42],
      'tears.json': [37, 8],
      'consumables.json': [262, 84],
      'greatRunes.json': [6, 0],
      'spiritAshes.json': [84, 20],
    });
  });

  it('resolves every reference: skills, weapon types, Ashes of War', () => {
    const skillIds = new Set(skills.map((s) => s.id));
    const typeIds = new Set(weaponTypes.map((t) => t.id));
    for (const weapon of weapons) {
      if (weapon.skill !== null) expect(skillIds.has(weapon.skill), weapon.name).toBe(true);
      expect(typeIds.has(weapon.type), weapon.name).toBe(true);
    }
    for (const arrow of arrows) expect(typeIds.has(arrow.type), arrow.name).toBe(true);
    for (const ash of ashesOfWar) {
      expect(skillIds.has(ash.skill), ash.name).toBe(true);
      for (const type of ash.weaponTypes) expect(typeIds.has(type), ash.name).toBe(true);
    }
  });

  it('has an icon in public/assets/icons for every item (2022: 44 consumables had none)', () => {
    const missing = Object.values(files)
      .flat()
      .filter((item) => 'icon' in item && !existsSync(join(ICONS, `${item.icon}.webp`)))
      .map((item) => item.name);
    expect(missing).toEqual([]);
  });

  it("gives every weapon's skill a name (2022: 36 were missing or misspelled)", () => {
    const named = weapons.filter((w) => w.skill !== null).length;
    expect(named).toBe(weapons.length);
  });

  it('lists the real affinities, including Cold and Flame Art (2022: "Frost", no Flame Art)', () => {
    expect(affinities.map((a) => a.name)).toEqual([
      'Standard',
      'Heavy',
      'Keen',
      'Quality',
      'Fire',
      'Flame Art',
      'Lightning',
      'Sacred',
      'Magic',
      'Cold',
      'Poison',
      'Blood',
      'Occult',
    ]);
  });

  it('offers per-weapon affinities: unique weapons are standard only', () => {
    expect(byName(weapons, 'Uchigatana').affinities).toHaveLength(13);
    expect(byName(weapons, 'Moonveil')).toMatchObject({
      ashesOfWar: false,
      affinities: ['standard'],
    });
  });

  it('has the DLC weapon types', () => {
    expect(weaponTypes.filter((t) => t.dlc).map((t) => t.name)).toEqual([
      'Hand-to-Hand',
      'Perfume Bottle',
      'Thrusting Shield',
      'Throwing Blade',
      'Backhand Blade',
      'Light Greatsword',
      'Great Katana',
      'Beast Claw',
    ]);
  });

  // Known in-game values, so a change in the pipeline's field mapping can't go unnoticed.
  it.each([
    ['Moonveil', { type: 13, weight: 6.5, requirements: { str: 12, dex: 18, int: 23 } }],
    ['Rivers of Blood', { requirements: { str: 12, dex: 18, arc: 20 } }],
    ['Uchigatana', { weight: 5.5, attack: { physical: 115 } }],
    ['Claymore', { weight: 9, attack: { physical: 138 }, requirements: { str: 16, dex: 13 } }],
    ['Milady', { dlc: true, type: 93 }],
  ])('weapon %s', (name, expected) => {
    expect(byName(weapons, name)).toMatchObject(expected);
  });

  it('knows skills, spells, armor and talismans by their in-game values', () => {
    const skillOf = (weapon: string) => skills.find((s) => s.id === byName(weapons, weapon).skill);
    expect(skillOf('Rivers of Blood')?.name).toBe('Corpse Piler');
    expect(skillOf('Brass Shield')?.name).toBe('No Skill');
    expect(byName(spells, 'Comet Azur')).toMatchObject({
      kind: 'sorcery',
      fp: 40,
      slots: 3,
      requirements: { int: 60 },
    });
    expect(byName(spells, 'Flame, Grant Me Strength')).toMatchObject({
      kind: 'incantation',
      requirements: { fai: 15 },
    });
    expect(byName(armor, "Radahn's Lion Armor")).toMatchObject({ slot: 'chest', poise: 34 });
    expect(byName(talismans, "Erdtree's Favor +1").group).toBe(
      byName(talismans, "Erdtree's Favor").group,
    );
  });

  it('keeps the 2022 tags and adds the DLC bosses and weapon types', () => {
    expect(tags.Bosses).toContain('Radagon / Elden Beast');
    expect(tags.Bosses).toContain('Messmer');
    expect(tags.Bosses).toContain('Promised Consort Radahn');
    expect(tags['Melee Weapons']).toContain('Great Hammer'); // 2022 "Warhammer", renamed in T13
    expect(tags['Melee Weapons']).not.toContain('Warhammer');
    expect(tags['Melee Weapons']).toContain('Great Katana');
  });

  it('has cards.json (the light data the landing page loads) matching the full files', () => {
    const cards = cardsSchema.parse(JSON.parse(readFileSync(join(DIR, 'cards.json'), 'utf8')));
    expect(cards).toEqual(makeCards(weapons, armor));
  });

  it('keeps core.ts, which every page loads, from importing the full data (T11)', () => {
    const core = readFileSync(join(import.meta.dirname, 'core.ts'), 'utf8');
    expect(core).not.toMatch(/from '\.\/(index|er\/(weapons|armor|arrows|spells|talismans|tears))/);
  });
});
