// Integrity checks for the static game data in src/data. The `it.fails` cases are KNOWN gaps in the
// 2022 data: they pass while the gap exists. When T7 (game data v2) fixes one, its `it.fails`
// starts failing: turn it into a plain `it`.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import affinitiesData from './affinities.json';
import armorIndexed from './armorIndexed.json';
import arrowsAndBolts from './arrowsAndBolts.json';
import consumables from './consumables.json';
import skillsIndexed from './skillsIndexed.json';
import spells from './spells.json';
import talismans from './talismans.json';
import tears from './tears.json';
import weaponsAndShields from './weaponsAndShields.json';

type Item = { name: string; imageUrl?: string };

const PUBLIC_ASSETS = join(import.meta.dirname, '..', '..', 'public', 'assets');
const weapons = Object.values(weaponsAndShields) as (Item & { skill: string; type: string })[];
const armor = Object.values(armorIndexed).flatMap((group) => Object.values(group)) as Item[];
const missingImages = (items: Item[]) =>
  items.filter((item) => !item.imageUrl || !existsSync(join(PUBLIC_ASSETS, item.imageUrl)));

describe('game data', () => {
  it('has the expected base-game counts (no DLC yet: T7)', () => {
    expect(weapons).toHaveLength(374);
    expect(armor).toHaveLength(491);
    expect(talismans).toHaveLength(116);
    expect(spells).toHaveLength(171);
  });

  it('keys weaponsAndShields by item name', () => {
    for (const [key, weapon] of Object.entries(weaponsAndShields)) {
      expect(weapon.name).toBe(key);
    }
  });

  it.each([
    ['weapons and shields', weapons],
    ['armor', armor],
    ['talismans', talismans as Item[]],
    ['spells', spells as Item[]],
    ['tears', tears as Item[]],
    ['arrows and bolts', arrowsAndBolts as Item[]],
  ])('every one of the %s has an image in public/assets', (_label, items) => {
    expect(missingImages(items).map((item) => item.name)).toEqual([]);
  });

  it.fails('every consumable has an image (44 are missing: T7)', () => {
    expect(missingImages(consumables as Item[])).toEqual([]);
  });

  it.fails(
    "every weapon's built-in skill exists in skillsIndexed (36 missing or misspelled: T7)",
    () => {
      const skills = skillsIndexed as Record<string, unknown>;
      const missing = weapons
        .map((weapon) => weapon.skill)
        .filter((skill) => skill && !skills[skill]);
      expect([...new Set(missing)]).toEqual([]);
    },
  );

  it.fails('lists the real affinities (Cold, not "Frost"; Flame Art is missing: T7)', () => {
    expect(affinitiesData.affinities).toContain('Cold');
    expect(affinitiesData.affinities).toContain('Flame Art');
  });
});
