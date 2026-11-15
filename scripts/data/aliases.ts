#!/usr/bin/env node
// 2022 item names → T7 IDs, for T13's names→IDs migration of saved builds. One-off: it reads the 2022
// files in src/data/*.json, which T13 deletes along with this script once the migration has run.
//
//   node scripts/data/aliases.ts      writes scripts/data/name-aliases.json and lists what didn't map
//
// Names match after normalizing (case, punctuation, accents); MANUAL fixes the 2022 scrape's typos.
// Anything left is `unmapped`: items the game doesn't have as equipment (cut armor, upgrade materials).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AffinityKey } from '../../src/data/schema.ts';
import { AFFINITY_KEYS } from '../../src/data/schema.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Build field → the T7 file its IDs come from. */
export const CATEGORIES = {
  weapons: 'weapons',
  armor: 'armor',
  talismans: 'talismans',
  spells: 'spells',
  tears: 'tears',
  arrows: 'arrows',
  consumables: 'consumables',
} as const;
type Category = keyof typeof CATEGORIES;

/** 2022 scrape typos → the game's name (checked against the T7 data, 2026-11-15). */
export const MANUAL: Partial<Record<Category | 'weaponSkills', Record<string, string>>> = {
  weapons: { 'Watchdogs Greatsword': "Watchdog's Greatsword" },
  armor: {
    'Raptors Black Feathers': "Raptor's Black Feathers",
    'Nox Monk Bracelets': 'Nox Bracelets',
    'Nox Monk Greaves': 'Nox Greaves',
  },
  talismans: {
    'Golden Scarab': 'Gold Scarab',
    'Faithful Canvas Talisman': "Faithful's Canvas Talisman",
    'Stargazer Heriloom': 'Stargazer Heirloom',
    'Spelldrake Talisma +1n': 'Spelldrake Talisman +1',
    "Crepu's Vial": "Crepus's Vial",
  },
  spells: {
    'Terra Magicus': 'Terra Magica',
    'Aspect of the Crucible Breath': 'Aspects of the Crucible: Breath',
    'Aspect of the Crucible Tail': 'Aspects of the Crucible: Tail',
  },
  consumables: { 'Rejuvenating Boluces': 'Rejuvenating Boluses' },
  weaponSkills: { 'Parry Skill': 'Parry', "Onyx Lord's Repulsion": "Onyx Lords' Repulsion" },
};

export const normalize = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9+]+/g, ' ')
    .trim();

interface Named {
  id: number;
  name: string;
}

export interface Aliases {
  /** Per build field: 2022 name → T7 ID. */
  items: Record<Category, Record<string, number>>;
  /** 2022 skill name → Ash of War ID, or null for a weapon's own built-in skill. */
  weaponSkills: Record<string, number | null>;
  /** 2022 affinity name → T7 key ("Frost" was the 2022 name for Cold). */
  affinities: Record<string, AffinityKey>;
  /** 2022 names with no T7 item; the migration drops them and reports each one. */
  unmapped: Partial<Record<Category | 'weaponSkills', string[]>>;
}

export interface AliasInput {
  old: Record<Category | 'weaponSkills', string[]> & { affinities: string[] };
  v2: Record<Category, Named[]> & { ashesOfWar: Named[]; skills: Named[] };
}

export function buildAliases({ old, v2 }: AliasInput): Aliases {
  const result: Aliases = {
    items: Object.fromEntries(Object.keys(CATEGORIES).map((c) => [c, {}])) as Aliases['items'],
    weaponSkills: {},
    affinities: {},
    unmapped: {},
  };
  const miss = (category: Category | 'weaponSkills', name: string) =>
    (result.unmapped[category] ??= []).push(name);
  const index = (items: Named[], strip: string | RegExp = '') => {
    const map = new Map<string, number>();
    for (const item of items) map.set(normalize(item.name.replace(strip, '')), item.id);
    return map;
  };

  for (const category of Object.keys(CATEGORIES) as Category[]) {
    const ids = index(v2[category]);
    for (const name of [...new Set(old[category])].sort()) {
      const id = ids.get(normalize(MANUAL[category]?.[name] ?? name));
      if (id === undefined) miss(category, name);
      else result.items[category][name] = id;
    }
  }

  const ashes = index(v2.ashesOfWar, /^Ash of War: /);
  const skills = new Set(v2.skills.map((skill) => normalize(skill.name)));
  for (const name of [...new Set(old.weaponSkills)].sort()) {
    const key = normalize(MANUAL.weaponSkills?.[name] ?? name);
    const ash = ashes.get(key);
    if (ash !== undefined) result.weaponSkills[name] = ash;
    else if (skills.has(key)) result.weaponSkills[name] = null;
    else miss('weaponSkills', name);
  }

  for (const name of old.affinities) {
    const key = name === 'Frost' ? 'cold' : (normalize(name).replace(/ /g, '-') as AffinityKey);
    if (!AFFINITY_KEYS.includes(key)) throw new Error(`2022 affinity "${name}" has no key`);
    result.affinities[name] = key;
  }
  return result;
}

const readJson = (path: string): unknown => JSON.parse(readFileSync(join(ROOT, path), 'utf8'));

/** The 2022 names and T7 items, from the repo. */
export function loadInput(): AliasInput {
  // JSON boundary: shapes as in src/data/types.ts (2022) and src/data/schema.ts (T7).
  const names = (path: string) => (readJson(path) as { name: string }[]).map((item) => item.name);
  const v2 = (file: string) => readJson(`src/data/er/${file}.json`) as Named[];
  const armor = readJson('src/data/armorIndexed.json') as Record<string, Record<string, unknown>>;
  return {
    old: {
      weapons: Object.keys(readJson('src/data/weaponsAndShields.json') as object),
      armor: Object.values(armor).flatMap((group) => Object.keys(group)),
      talismans: names('src/data/talismans.json'),
      spells: names('src/data/spells.json'),
      tears: names('src/data/tears.json'),
      arrows: names('src/data/arrowsAndBolts.json'),
      consumables: names('src/data/consumables.json'),
      weaponSkills: Object.keys(readJson('src/data/skillsIndexed.json') as object),
      affinities: (readJson('src/data/affinities.json') as { affinities: string[] }).affinities,
    },
    v2: {
      ...(Object.fromEntries(
        Object.entries(CATEGORIES).map(([category, file]) => [category, v2(file)]),
      ) as Record<Category, Named[]>),
      ashesOfWar: v2('ashesOfWar'),
      skills: v2('skills'),
    },
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const aliases = buildAliases(loadInput());
  writeFileSync(
    join(ROOT, 'scripts', 'data', 'name-aliases.json'),
    `${JSON.stringify(aliases, null, 2)}\n`,
  );
  const mapped = Object.values(aliases.items).reduce(
    (n, items) => n + Object.keys(items).length,
    0,
  );
  console.log(
    `✓ name-aliases.json: ${mapped} items, ${Object.keys(aliases.weaponSkills).length} skills`,
  );
  for (const [category, names] of Object.entries(aliases.unmapped))
    console.log(`  unmapped ${category}: ${names.join(' | ')}`);
}
