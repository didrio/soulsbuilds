#!/usr/bin/env node
// Prints random items with their sources from src/data/er/acquisition.json, for spot-checking the
// acquisition data against the game (T14). Seeded, so the same seed shows the same items.
//
//   node scripts/data/sample-acquisition.ts [count=30] [seed=1]
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Acquisition, AcquisitionFile, Source } from '../../src/data/schema.ts';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'data', 'er');
const read = <T>(file: string): T => JSON.parse(readFileSync(join(DIR, file), 'utf8')) as T;

const [count = 30, seed = 1] = process.argv.slice(2).map(Number);
const acquisition = read<Acquisition>('acquisition.json');
const locations = new Map(acquisition.locations.map((l) => [l.id, l.name]));
const regions = new Map(acquisition.regions.map((r) => [r.id, r.name]));
const names = new Map<string, string>();
for (const item of acquisition.keyItems) names.set(`keyItems:${item.id}`, item.name);

const FILES = [
  'weapons',
  'arrows',
  'armor',
  'talismans',
  'ashesOfWar',
  'spells',
  'tears',
  'consumables',
  'greatRunes',
  'spiritAshes',
] as const;
const items: { file: AcquisitionFile; id: number; name: string }[] = [];
for (const file of FILES)
  for (const item of read<{ id: number; name: string }[]>(`${file}.json`)) {
    items.push({ file, ...item });
    names.set(`${file}:${item.id}`, item.name);
  }

// Mulberry32: a tiny seeded random number generator.
let state = seed;
const random = () => {
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const describe = (source: Source) => {
  const needed = source.item && names.get(`${source.item.file}:${source.item.id}`);
  // A source without a place of its own (crafting, alteration) is placed through the item it needs.
  const unplaced = source.location === null && source.region === null;
  const place =
    source.location !== null
      ? `${locations.get(source.location)} (${regions.get(source.region!)})`
      : source.region !== null
        ? regions.get(source.region)
        : needed
          ? `via ${needed}`
          : source.kind === 'start'
            ? 'character creation'
            : source.kind === 'craft'
              ? 'anywhere'
              : 'no place yet';
  const cost = source.cost ? `, ${source.cost.amount} ${source.cost.currency}` : '';
  const needs = needed && !unplaced ? `, needs ${needed}` : '';
  const detail = source.detail && source.detail !== needed ? ` ${source.detail}` : '';
  return `${source.kind}${detail} @ ${place}${cost}${needs}`;
};

const picked = new Set<number>();
while (picked.size < Math.min(count, items.length)) picked.add(Math.floor(random() * items.length));
for (const index of [...picked].sort((a, b) => a - b)) {
  const item = items[index]!;
  const sources = acquisition.items[item.file][String(item.id)] ?? [];
  console.log(`${item.name} (${item.file})`);
  for (const source of sources.slice(0, 3)) console.log(`    ${describe(source)}`);
  if (sources.length > 3) console.log(`    … ${sources.length - 3} more`);
  if (!sources.length) console.log('    (no source)');
}
