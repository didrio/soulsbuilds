// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildAliases, loadInput, normalize, type Aliases } from './aliases.ts';

const empty = {
  weapons: [],
  armor: [],
  talismans: [],
  spells: [],
  tears: [],
  arrows: [],
  consumables: [],
};

describe('buildAliases', () => {
  const aliases = buildAliases({
    old: {
      ...empty,
      weapons: ['Dagger', 'Watchdogs Greatsword', 'Winged Spear'],
      talismans: ["Crepu's Vial"],
      weaponSkills: ['Bloody Slash', 'Corpse Piler', 'Parry Skill', 'Made Up'],
      affinities: ['Frost', 'Flame Art', 'Heavy'],
    },
    v2: {
      ...empty,
      weapons: [
        { id: 1000000, name: 'Dagger' },
        { id: 4010000, name: "Watchdog's Greatsword" },
      ],
      talismans: [{ id: 6000, name: "Crepus's Vial" }],
      ashesOfWar: [
        { id: 20400, name: 'Ash of War: Bloody Slash' },
        { id: 30200, name: 'Ash of War: Parry' },
      ],
      skills: [{ id: 300, name: 'Corpse Piler' }],
    },
  });

  it('maps names after normalizing, with the manual typo fixes', () => {
    expect(aliases.items.weapons).toEqual({ Dagger: 1000000, 'Watchdogs Greatsword': 4010000 });
    expect(aliases.items.talismans).toEqual({ "Crepu's Vial": 6000 });
  });

  it('maps skills to an Ash of War, or null for a built-in skill', () => {
    expect(aliases.weaponSkills).toEqual({
      'Bloody Slash': 20400,
      'Corpse Piler': null,
      'Parry Skill': 30200,
    });
  });

  it('lists what has no match, and maps affinities (Frost → cold)', () => {
    expect(aliases.unmapped).toEqual({ weapons: ['Winged Spear'], weaponSkills: ['Made Up'] });
    expect(aliases.affinities).toEqual({ Frost: 'cold', 'Flame Art': 'flame-art', Heavy: 'heavy' });
  });

  it('normalizes case, punctuation and accents', () => {
    expect(normalize("Jolán's Blade, +1")).toBe('jolan s blade +1');
  });
});

describe('name-aliases.json (committed)', () => {
  // JSON boundary: written by `node scripts/data/aliases.ts` with the Aliases shape.
  const committed = JSON.parse(
    readFileSync(join(import.meta.dirname, 'name-aliases.json'), 'utf8'),
  ) as Aliases;

  it('is what the generator produces from the current data', () => {
    expect(buildAliases(loadInput())).toEqual(committed);
  });

  it('maps all but a known handful of 2022 names', () => {
    const unmapped = Object.values(committed.unmapped).flat();
    expect(unmapped).toHaveLength(18);
    expect(Object.keys(committed.weaponSkills)).toHaveLength(137);
  });
});
