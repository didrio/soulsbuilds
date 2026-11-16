import { describe, expect, it } from 'vitest';
import { acquisition } from '@/data/acquisition';
import {
  ACQUISITION_FILES,
  AFFINITY_KEYS,
  type Acquisition,
  type AffinityKey,
  type Source,
} from '@/data/schema';
import type { Equipment } from '@/lib/models';
import {
  emptyEquipment,
  GODRICKS_GREAT_RUNE,
  SEPPUKU_ASH,
  UCHIGATANA,
  WHITE_MASK,
} from '@/test/fixtures';
import { planRoute, type Route } from './route';

// A tiny world: Limgrave (Church 10, Margit 11, Shop 12) → Stormveil (Gate 20, Godrick 21, needs Margit)
// → Liurnia (Lake 30 = Radahn's arena, Tower 31 = Mohg's) → Capital (50, two of Godrick/Radahn… here one)
// → the DLC (40, needs Mohg + Radahn).
const region = (id: number, name: string, order: number, requires: string[] = [], dlc = false) => ({
  id,
  name,
  order,
  requires,
  dlc,
});
const regions = [
  region(1, 'Limgrave', 1),
  region(2, 'Stormveil', 2, ['margit']),
  region(3, 'Liurnia', 3, ['margit']),
  region(5, 'Capital', 4, ['runes']),
  region(4, 'Land of Shadow', 5, ['dlc'], true),
];
const location = (id: number, name: string, regionId: number, order: number) => ({
  id,
  name,
  region: regionId,
  order,
  requires: regions.find((r) => r.id === regionId)?.requires ?? [],
});
const locations = [
  location(10, 'Church', 1, 1),
  location(11, 'Margit', 1, 2),
  location(12, 'Shop', 1, 3),
  location(20, 'Castle Gate', 2, 4),
  location(21, 'Godrick', 2, 5),
  location(30, 'Lake', 3, 6),
  location(31, 'Tower', 3, 7),
  location(50, 'Capital Gate', 5, 8),
  location(40, 'Shadow Gate', 4, 9),
];

const at = (
  where: number,
  kind: Source['kind'] = 'pickup',
  detail = '',
  more: Partial<Source> = {},
) => {
  const place = locations.find((l) => l.id === where);
  return { kind, location: where, region: place?.region ?? null, detail, ...more } as Source;
};
const nowhere = (kind: Source['kind'], detail: string, more: Partial<Source> = {}): Source => ({
  kind,
  location: null,
  region: null,
  detail,
  ...more,
});
const key = (id: number) => ({ file: 'keyItems' as const, id });

const items = Object.fromEntries(
  ACQUISITION_FILES.map((file) => [file, {}]),
) as Acquisition['items'];
Object.assign(items, {
  weapons: {
    1: [at(20)], // behind Margit
    2: [at(10, 'shop', 'Kalé', { requires: ['radahn'] }), at(20)], // the gated shop is later
    3: [at(10), nowhere('start', 'Vagabond')],
    4: [nowhere('start', 'Bandit')],
    5: [at(40)], // DLC
    6: [
      at(12, 'remembrance', 'Enia', { cost: { amount: 100, currency: 'runes' }, item: key(910) }),
    ],
    7: [at(10)],
    8: [at(50)], // behind the any-of gate
  },
  armor: {
    100: [
      at(12),
      nowhere('alteration', 'Revert at a Site of Grace', { item: { file: 'armor', id: 101 } }),
    ],
    101: [nowhere('alteration', 'Alter at a Site of Grace', { item: { file: 'armor', id: 100 } })],
  },
  greatRunes: { 50: [at(31, 'pickup', '', { item: key(920) })] },
  ashesOfWar: { 60: [at(10)] },
  spiritAshes: { 70: [at(12)] },
  tears: { 80: [at(30)] },
  consumables: {
    90: [nowhere('craft', 'Cookbook [1]', { item: key(930) })],
    91: [nowhere('craft', 'Known from the start')],
  },
  arrows: { 95: [nowhere('enemy', 'Skeleton')] },
  keyItems: {
    900: [at(10)], // knife
    901: [at(30)], // whetblade
    902: [at(12, 'shop', 'Maidens')], // bell
    903: [at(10)], // flask
    910: [at(21, 'boss', 'Godrick')], // remembrance
    920: [at(31, 'boss', 'Mohg')], // unrestored rune
    930: [at(12, 'shop', 'Merchant')], // cookbook
  },
});

const data: Acquisition = {
  regions,
  locations,
  gates: [
    { id: 'margit', label: 'Defeat Margit', requires: [], at: 11, reason: 'Main-path boss' },
    { id: 'godrick', label: 'Defeat Godrick', requires: ['margit'], at: 21 },
    { id: 'radahn', label: 'Defeat Radahn', requires: [], at: 30 },
    { id: 'mohg', label: 'Defeat Mohg', requires: [], at: 31 },
    {
      id: 'runes',
      label: 'Hold a Great Rune',
      requires: [],
      anyOf: { count: 1, gates: ['godrick', 'radahn'] },
    },
    { id: 'dlc', label: 'Enter the DLC', requires: ['mohg', 'radahn'] },
    { id: 'knife', label: 'Get the knife', requires: [], item: key(900), reason: 'For ashes' },
    { id: 'whetblade', label: 'Get the whetblade', requires: ['knife'], item: key(901) },
    { id: 'bell', label: 'Get the bell', requires: [], item: key(902) },
    { id: 'flask', label: 'Get the flask', requires: [], item: key(903) },
  ],
  keyItems: [900, 901, 902, 903, 910, 920, 930].map((id) => ({ id, name: `Key ${id}`, icon: id })),
  implied: {
    ashesOfWar: 'knife',
    spiritAshes: 'bell',
    tears: 'flask',
    affinities: Object.fromEntries(
      AFFINITY_KEYS.map((k) => [k, k === 'heavy' ? 'whetblade' : null]),
    ) as Record<AffinityKey, string | null>,
  },
  items,
};

const build = (equipment: Partial<Equipment>): Equipment => ({ ...emptyEquipment(), ...equipment });
const weapons = (...ids: number[]) => [...ids, ...Array<null>(6 - ids.length).fill(null)];

/** The route as lines: "Place: kind detail → items", numbered in order. */
function lines(route: Route): string[] {
  return route.legs.flatMap((leg) =>
    leg.steps.map(
      (step) =>
        `${step.location?.name ?? leg.region?.name ?? leg.kind}: ` +
        step.actions
          .map(
            (a) =>
              `${a.kind}${a.detail ? ` ${a.detail}` : ''} → ${a.items.map((i) => i.ref.id).join(',')}`,
          )
          .join(' | '),
    ),
  );
}
const itemIds = (route: Route) =>
  route.legs.flatMap((leg) =>
    leg.steps.flatMap((step) => step.actions.flatMap((a) => a.items.map((i) => i.ref.id))),
  );
const indexOf = (route: Route, text: string) =>
  lines(route).findIndex((line) => line.includes(text));

describe('planRoute', () => {
  it('returns no legs for an empty build', () => {
    expect(planRoute(emptyEquipment(), data).legs).toEqual([]);
  });

  it('puts gated items after their gates', () => {
    const route = planRoute(build({ weapons: weapons(1) }), data);
    expect(lines(route)).toEqual(['Margit: gate Defeat Margit → ', 'Castle Gate: pickup → 1']);
    expect(route.legs.map((leg) => leg.region?.name)).toEqual(['Limgrave', 'Stormveil']);
  });

  it('chooses the source reachable earliest, not the first listed', () => {
    expect(lines(planRoute(build({ weapons: weapons(2) }), data))).toEqual([
      'Margit: gate Defeat Margit → ',
      'Castle Gate: pickup → 2',
    ]);
  });

  it('merges items at the same place and deduplicates', () => {
    const route = planRoute(build({ weapons: weapons(3, 7, 3) }), data);
    expect(lines(route)).toEqual(['Church: pickup → 3,7']);
  });

  it('prefers world sources over starting gear, and starts as a class only when it must', () => {
    const route = planRoute(build({ weapons: weapons(3, 4) }), data);
    expect(lines(route)).toEqual(['start: start Bandit → 4', 'Church: pickup → 3']);
    expect(route.legs[0]?.kind).toBe('start');
    expect(route.legs[1]?.steps[0]?.actions[0]?.items[0]?.startAlso).toEqual(['Vagabond']);
  });

  it('puts DLC items after Mohg and Radahn', () => {
    const route = planRoute(build({ weapons: weapons(5) }), data);
    const dlc = indexOf(route, 'Shadow Gate');
    expect(indexOf(route, 'Defeat Radahn')).toBeLessThan(dlc);
    expect(indexOf(route, 'Defeat Mohg')).toBeLessThan(dlc);
    // A gate with no place of its own follows its latest prerequisite.
    expect(lines(route)).toContain('Tower: gate Defeat Mohg →  | gate Enter the DLC → ');
  });

  it.each([
    [
      'remembrance (boss first, back to the shop)',
      { weapons: weapons(6) },
      'boss',
      'Shop: remembrance Enia → 6',
    ],
    ['great rune (unrestored rune first)', { greatRune: 50 }, 'boss Mohg → 920', 'restore → 50'],
    [
      'cookbook before crafting',
      { consumables: [90] },
      'shop Merchant → 930',
      'craft Cookbook [1] → 90',
    ],
    [
      'armor before altering it',
      { chest: 101 },
      'pickup → 100',
      'alteration Alter at a Site of Grace → 101',
    ],
  ] as [string, Partial<Equipment>, string, string][])(
    'gets what a %s needs first',
    (_name, equipment, first, then) => {
      const route = planRoute(build(equipment), data);
      expect(indexOf(route, first)).toBeGreaterThanOrEqual(0);
      expect(indexOf(route, first)).toBeLessThanOrEqual(indexOf(route, then));
    },
  );

  it('folds a boss that is also a gate into one line and revisits a region later', () => {
    // Weapon 8 needs the any-of gate, which takes Godrick; his boss drop (the remembrance) joins his line.
    const route = planRoute(build({ weapons: weapons(6, 8) }), data);
    expect(lines(route)).toEqual([
      'Margit: gate Defeat Margit → ',
      'Godrick: gate Defeat Godrick → 910',
      'Shop: remembrance Enia → 6',
      'Capital Gate: pickup → 8',
    ]);
    expect(route.legs[1]?.steps[0]?.actions[0]?.gate).toBe('godrick');
    expect(route.legs.map((leg) => leg.region?.name)).toEqual([
      'Limgrave',
      'Stormveil',
      'Limgrave',
      'Capital',
    ]);
    expect(route.legs[2]?.steps[0]?.actions[0]?.items[0]).toMatchObject({
      cost: { amount: 100, currency: 'runes' },
      needs: { file: 'keyItems', id: 910 },
    });
  });

  it.each([
    ['the earliest member alone', weapons(8), 'Defeat Godrick'],
    ['a member the route needs anyway', weapons(8, 5), 'Defeat Radahn'],
  ])('settles an any-of gate with %s', (_name, ids, expected) => {
    const route = planRoute(build({ weapons: ids }), data);
    expect(indexOf(route, expected)).toBeLessThan(indexOf(route, 'Capital Gate'));
    if (expected === 'Defeat Radahn') expect(indexOf(route, 'Defeat Godrick')).toBe(-1);
  });

  it.each([
    [
      'an affinity: its whetblade (and the knife)',
      {
        weapons: weapons(7),
        weaponAffinities: ['heavy', null, null, null, null, null],
      },
      [900, 901],
    ],
    [
      'an Ash of War: the knife',
      { weapons: weapons(7), weaponSkills: [60, null, null, null, null, null] },
      [900, 60],
    ],
    ['a spirit ash: the bell', { spiritAsh: 70 }, [902]],
    ['a tear: the flask', { tears: [80] }, [903]],
  ] as [string, Partial<Equipment>, number[]][])(
    'adds the gates %s',
    (_name, equipment, expected) => {
      expect(itemIds(planRoute(build(equipment), data))).toEqual(expect.arrayContaining(expected));
    },
  );

  it('ignores a skill or affinity on an empty weapon slot', () => {
    const route = planRoute(
      build({
        weaponSkills: [60, null, null, null, null, null],
        weaponAffinities: ['heavy', null, null, null, null, null],
      }),
      data,
    );
    expect(route.legs).toEqual([]);
  });

  it('says why things are on the route: gate reasons, gate items and what prerequisites unlock', () => {
    const route = planRoute(
      build({
        weapons: weapons(6, 7),
        weaponSkills: [null, 60, null, null, null, null],
        consumables: [90],
        greatRune: 50,
      }),
      data,
    );
    const actions = route.legs.flatMap((leg) => leg.steps.flatMap((step) => step.actions));
    const itemOf = (id: number) =>
      actions.flatMap((a) => a.items).find((routeItem) => routeItem.ref.id === id);
    expect(actions.find((a) => a.detail === 'Defeat Margit')?.reason).toBe('Main-path boss');
    // Its id too (T44: a stop is marked done by its gates and items).
    expect(actions.find((a) => a.detail === 'Defeat Margit')?.gate).toBe('margit');
    expect(itemOf(900)?.gate?.reason).toBe('For ashes');
    expect(itemOf(910)?.usedFor).toEqual([
      { kind: 'remembrance', detail: 'Enia', items: [{ file: 'weapons', id: 6 }] },
    ]);
    expect(itemOf(930)?.usedFor).toEqual([
      { kind: 'craft', detail: 'Cookbook [1]', items: [{ file: 'consumables', id: 90 }] },
    ]);
    expect(itemOf(920)?.usedFor?.[0]?.kind).toBe('restore');
    // The build's own items need no reason.
    expect(itemOf(6)?.usedFor).toBeUndefined();
    expect(itemOf(6)?.gate).toBeUndefined();
  });

  it('lists recipes known from the start first and placeless sources last', () => {
    const route = planRoute(build({ consumables: [91], arrows: [95, null, null, null] }), data);
    expect(lines(route)).toEqual([
      'start: craft Known from the start → 91',
      'elsewhere: enemy Skeleton → 95',
    ]);
    expect(route.legs.map((leg) => leg.kind)).toEqual(['start', 'elsewhere']);
  });
});

describe('planRoute with the real data', () => {
  // Uchigatana (Blood) + Seppuku, White Mask, Godrick's Great Rune: a typical early build.
  const route = planRoute(
    build({
      weapons: weapons(UCHIGATANA),
      weaponAffinities: ['blood', null, null, null, null, null],
      weaponSkills: [SEPPUKU_ASH, null, null, null, null, null],
      helm: WHITE_MASK,
      greatRune: GODRICKS_GREAT_RUNE,
    }),
    acquisition,
  );
  const text = lines(route);

  it('respects the gates and stays out of the DLC', () => {
    expect(text.join('\n')).not.toContain('Miquella');
    const margit = indexOf(route, 'Defeat Margit');
    expect(margit).toBeGreaterThan(-1);
    expect(indexOf(route, 'Defeat Godrick')).toBeGreaterThan(margit);
    // Godrick's Great Rune is restored after Godrick, at a Divine Tower.
    expect(indexOf(route, `restore → ${GODRICKS_GREAT_RUNE}`)).toBeGreaterThan(
      indexOf(route, 'Defeat Godrick'),
    );
    // The Whetstone Knife comes with the ash, the Black Whetblade with the Blood affinity.
    expect(indexOf(route, '8590')).toBeGreaterThan(-1);
  });

  it('numbers every item once', () => {
    const ids = route.legs.flatMap((leg) =>
      leg.steps.flatMap((step) =>
        step.actions.flatMap((a) => a.items.map((i) => `${i.ref.file}:${i.ref.id}`)),
      ),
    );
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of [UCHIGATANA, SEPPUKU_ASH, WHITE_MASK, GODRICKS_GREAT_RUNE]) {
      expect(ids.some((ref) => ref.endsWith(`:${id}`))).toBe(true);
    }
  });
});
