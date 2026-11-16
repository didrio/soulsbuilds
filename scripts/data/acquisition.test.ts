// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { acquisitionSchema, type Source } from '../../src/data/schema.ts';
import {
  extractAcquisition,
  formatAcquisition,
  validateAcquisition,
  type AcquisitionInputs,
} from './acquisition.ts';
import { extract } from './extract.ts';
import {
  fixtureAcquisitionInputs,
  fixtureAcquisitionParams,
  fixtureExport,
} from './test-fixtures.ts';

const exported = fixtureExport();
const { data } = extract(exported);
const run = (inputs: AcquisitionInputs = fixtureAcquisitionInputs()) =>
  extractAcquisition({
    params: { ...exported.params, ...fixtureAcquisitionParams() },
    text: exported.text,
    data,
    inputs,
  });
const { acquisition, problems } = run();
const sources = (file: keyof typeof acquisition.items, id: number): Source[] =>
  acquisition.items[file][id] ?? [];
const graceName = (id: number | null) => acquisition.locations.find((l) => l.id === id)?.name;

describe('extractAcquisition', () => {
  it('reports no problems on a consistent export, and the result validates', () => {
    expect(problems).toEqual([]);
    expect(acquisitionSchema.safeParse(acquisition).success).toBe(true);
    expect(validateAcquisition(acquisition, data, fixtureAcquisitionInputs())).toEqual([]);
  });

  it('makes regions in route order and graces as locations, inheriting the region gates', () => {
    expect(acquisition.regions.map((r) => [r.name, r.order, r.requires])).toEqual([
      ['Limgrave', 1, []],
      ['Stormveil Castle', 2, ['margit']],
      ['Caelid', 3, []],
    ]);
    expect(acquisition.locations.map((l) => l.name)).toEqual([
      'The First Step',
      'Church of Elleh',
      'Waypoint Ruins Cellar',
      'Stormveil Main Gate',
      'Godrick the Grafted',
      'Gael Tunnel',
      'Starscourge Radahn',
    ]);
    const radahn = acquisition.locations.find((l) => l.name === 'Starscourge Radahn');
    expect(radahn?.requires).toEqual(['godrick']); // locationRequires
    expect(acquisition.locations.find((l) => l.name === 'Godrick the Grafted')?.requires).toEqual([
      'margit',
    ]);
  });

  it('places open-world lots at the nearest grace (same tile or not), affinity rows as the base weapon', () => {
    expect(sources('weapons', 1000000)[0]).toEqual({
      kind: 'pickup',
      location: 61423600,
      region: 61000,
      detail: '',
    });
    expect(graceName(sources('armor', 40000)[0]!.location)).toBe('Waypoint Ruins Cellar');
    expect(graceName(sources('arrows', 50000000)[0]!.location)).toBe('Church of Elleh'); // carriage
  });

  it('places an enemy lot by its ID before its enemy type', () => {
    const inputs = fixtureAcquisitionInputs();
    inputs.enemies['431100000'] = { at: 'Church of Elleh', note: 'the one by the church' };
    const placed = run(inputs).acquisition.items.weapons[23510000] ?? [];
    expect(placed).toContainEqual({
      kind: 'enemy',
      location: 61423600,
      region: 61000,
      detail: 'Godrick Soldier (the one by the church)',
    });
  });

  it('gives a weapon that comes with an Ash of War (lot or shop) as both items', () => {
    const pickup = { kind: 'pickup', location: 61423600, region: 61000, detail: '' };
    const shop = {
      kind: 'shop',
      location: 61423600,
      region: 61000,
      detail: 'Merchant Kalé',
      cost: { amount: 2000, currency: 'runes' },
    };
    expect(sources('weapons', 23510000)).toEqual(expect.arrayContaining([pickup, shop]));
    expect(sources('ashesOfWar', 10100)).toEqual([pickup, shop]);
  });

  it("places dungeon lots at the dungeon's entrance grace, or via its overworld spot when it has none", () => {
    expect(graceName(sources('spells', 4000)[0]!.location)).toBe('Stormveil Main Gate');
    expect(graceName(sources('talismans', 1000)[0]!.location)).toBe('Waypoint Ruins Cellar');
  });

  it('places event lots from the row-name hint, the events table, or not at all', () => {
    expect(sources('weapons', 9060000)).toEqual([
      { kind: 'boss', location: 320700, region: 64000, detail: 'Magma Wyrm' },
    ]);
    // "Stormveil" is a region alias; the boss's own grace is named after it.
    expect(sources('keyItems', 8148)).toEqual([
      { kind: 'boss', location: 100000, region: 10000, detail: 'Godrick' },
    ]);
    expect(sources('ashesOfWar', 10000)).toEqual([
      { kind: 'quest', location: 61423600, region: 61000, detail: 'Knight Somebody' },
    ]);
    // An upgrade copy (+1) counts for the base item; an unknown hint stays unplaced.
    expect(sources('spiritAshes', 200000)).toEqual([
      { kind: 'quest', location: null, region: null, detail: 'Mystery' },
    ]);
  });

  it('reads enemies, shops, remembrance trades, alterations, recipes and starting classes', () => {
    expect(sources('weapons', 23510000)).toContainEqual({
      kind: 'enemy',
      location: 100008,
      region: 10000,
      detail: 'Godrick Soldier (by the gate)',
    });
    expect(sources('consumables', 1050)).toEqual([
      {
        kind: 'shop',
        location: 61423600,
        region: 61000,
        detail: 'Merchant Kalé',
        cost: { amount: 100, currency: 'runes' },
      },
      { kind: 'craft', location: null, region: null, detail: 'Known from the start' },
    ]);
    expect(sources('weapons', 33000000)).toEqual([
      {
        kind: 'remembrance',
        location: null,
        region: 61000,
        detail: 'Finger Reader Enia',
        item: { file: 'keyItems', id: 2950 },
      },
    ]);
    expect(sources('armor', 40100)).toEqual([
      {
        kind: 'alteration',
        location: null,
        region: null,
        detail: 'Alter at a Site of Grace',
        item: { file: 'armor', id: 40000 },
      },
    ]);
    expect(sources('arrows', 50000000)).toContainEqual({
      kind: 'craft',
      location: null,
      region: null,
      detail: "Nomadic Warrior's Cookbook [1]",
      item: { file: 'keyItems', id: 9300 },
    });
    expect(sources('weapons', 1000000)).toContainEqual({
      kind: 'start',
      location: null,
      region: null,
      detail: 'Vagabond',
    });
  });

  it('makes a restored Great Rune need the boss drop, and lists key items with their sources', () => {
    expect(sources('greatRunes', 191)[0]?.item).toEqual({ file: 'keyItems', id: 8148 });
    expect(acquisition.keyItems).toEqual([
      { id: 2950, name: 'Remembrance of the Grafted', icon: 51 },
      { id: 8148, name: "Godrick's Great Rune (unrestored)", icon: 49 },
      { id: 8158, name: 'Spirit Calling Bell', icon: 50 },
      { id: 9300, name: "Nomadic Warrior's Cookbook [1]", icon: 52 },
    ]);
    expect(acquisition.gates.find((g) => g.id === 'spirit-bell')).toMatchObject({
      item: { file: 'keyItems', id: 8158 },
    });
    expect(acquisition.gates.find((g) => g.id === 'godrick')?.at).toBe(100000);
    expect(acquisition.gates.find((g) => g.id === 'godrick')?.reason).toBe('Shardbearer');
  });

  it('orders sources earliest first (placed before unplaced)', () => {
    expect(sources('weapons', 1000000).map((s) => s.kind)).toEqual(['pickup', 'start']);
  });

  it('is deterministic and formats as parseable JSON, one entry per line', () => {
    const text = formatAcquisition(acquisition);
    expect(formatAcquisition(run().acquisition)).toBe(text);
    expect(JSON.parse(text)).toEqual(JSON.parse(JSON.stringify(acquisition)));
    expect(text).toContain('\n    {"id":61000,"name":"Limgrave"');
  });
});

describe('extractAcquisition problems', () => {
  const inputs = fixtureAcquisitionInputs;

  it('fails on a shop lineup no range classifies, and on unknown places and regions', () => {
    const result = run({
      ...inputs(),
      shops: inputs().shops.filter((shop) => shop.from !== 100500),
      events: { 'Knight Somebody': { kind: 'quest', at: 'Nowhere', detail: '' } },
      regions: [...inputs().regions, { name: 'Atlantis', requires: [] }],
    });
    expect(result.problems).toContain(
      'shop lineup 100500…: 2 row(s) not in places.ts SHOPS (classify the range)',
    );
    expect(result.problems).toContain('event 101000: no place "Nowhere"');
    expect(result.problems).toContain('progression: no region "Atlantis" in the game');
  });

  it('fails when a region is left out of the route order', () => {
    const result = run({ ...inputs(), regions: inputs().regions.slice(0, 2) });
    expect(result.problems).toContain(
      'progression: region "Caelid" has no place in the route order',
    );
  });
});

describe('validateAcquisition', () => {
  const inputs = fixtureAcquisitionInputs;

  it('reports items without a placed source unless allow-listed, and stale allow-list entries', () => {
    const gap = validateAcquisition(acquisition, data, { ...inputs(), pending: [] });
    expect(gap.some((p) => p.startsWith('2 item(s) without a placed source: '))).toBe(true);
    const stale = validateAcquisition(acquisition, data, {
      ...inputs(),
      pending: [...inputs().pending, 'weapons:Dagger'],
    });
    expect(stale).toContain('weapons:Dagger has a placed source now; drop it from the allow-list');
  });

  it('reports unknown gates and gate cycles', () => {
    const broken = structuredClone(acquisition);
    broken.regions[0]!.requires = ['nope'];
    broken.gates.push(
      { id: 'a', label: 'A', requires: ['b'] },
      { id: 'b', label: 'B', requires: ['a'] },
    );
    const result = validateAcquisition(broken, data, inputs());
    expect(result).toContain('region Limgrave: unknown gate "nope"');
    expect(result.some((p) => p.startsWith('gate cycle: a → b → a'))).toBe(true);
    // Every gate but any-of ones says why it's on the route (T35).
    expect(result).toContain('gate a: no reason');
  });

  it('reports references to unknown locations and items', () => {
    const broken = structuredClone(acquisition);
    broken.items.weapons['1000000']![0]!.location = 42;
    broken.items.weapons['33000000']![0]!.item = { file: 'keyItems', id: 1 };
    const result = validateAcquisition(broken, data, inputs());
    expect(result).toContain('weapons 1000000: unknown location 42');
    expect(result).toContain('weapons 33000000: needs keyItems 1, which is no item we know');
  });
});
