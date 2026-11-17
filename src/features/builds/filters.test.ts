import { describe, expect, it } from 'vitest';
import type { Build } from '@/lib/models';
import { emptyEquipment, makeBuild, MOONVEIL, UCHIGATANA } from '@/test/fixtures';
import {
  activeFilters,
  buildsHref,
  clampLevel,
  DEFAULT_FILTERS,
  filterBuilds,
  isFiltered,
  LEVEL_PRESETS,
  levelPreset,
  levelText,
  parseFilters,
  toggleTag,
  topTags,
  toSearchParams,
  weaponIdOf,
} from './filters';

const build = (id: string, level: number, tags: string[]) => ({ id, level, tags }) as Build;
const builds = [
  build('a', 50, ['Malenia']),
  build('b', 150, ['Malenia', 'Mohg']),
  build('c', 150, ['Mohg']),
  build('d', 300, []),
];
const ids = (list: Build[]) => list.map((b) => b.id);

describe('filterBuilds', () => {
  it('applies the tag and level filters together', () => {
    // 2022 bug: a tag filter started again from all builds, dropping the level range.
    expect(
      ids(
        filterBuilds(builds, { ...DEFAULT_FILTERS, tags: ['Mohg'], minLevel: 100, maxLevel: 200 }),
      ),
    ).toEqual(['b', 'c']);
    expect(
      ids(filterBuilds(builds, { ...DEFAULT_FILTERS, tags: ['Malenia'], maxLevel: 100 })),
    ).toEqual(['a']);
  });

  it('needs every selected tag', () => {
    expect(ids(filterBuilds(builds, { ...DEFAULT_FILTERS, tags: ['Malenia', 'Mohg'] }))).toEqual([
      'b',
    ]);
  });

  it('keeps builds without tags when no tag is selected', () => {
    expect(ids(filterBuilds(builds, DEFAULT_FILTERS))).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('URL filters', () => {
  it('round-trips through the query string, leaving out defaults', () => {
    const filters = {
      search: 'moon',
      sort: 'new' as const,
      tags: ['Malenia', 'Mohg'],
      weapon: 'moonveil',
      minLevel: 50,
      maxLevel: 150,
    };
    const params = toSearchParams(filters);
    expect(params.toString()).toBe(
      'q=moon&sort=new&tag=Malenia&tag=Mohg&weapon=moonveil&min=50&max=150',
    );
    expect(parseFilters(params)).toEqual(filters);
    expect(toSearchParams(DEFAULT_FILTERS).toString()).toBe('');
    expect(parseFilters(new URLSearchParams('sort=played')).sort).toBe('played');
  });

  it('ignores junk and swaps a reversed range', () => {
    expect(
      parseFilters(new URLSearchParams('sort=hot&min=abc&max=99999&weapon=no-such-sword')),
    ).toEqual(DEFAULT_FILTERS);
    expect(parseFilters(new URLSearchParams('min=200&max=100'))).toMatchObject({
      minLevel: 100,
      maxLevel: 200,
    });
  });

  it('clampLevel', () => {
    expect(clampLevel('0', 1)).toBe(1);
    expect(clampLevel('1000', 1)).toBe(713);
    expect(clampLevel('', 713)).toBe(713);
    expect(clampLevel(' 42', 1)).toBe(42);
  });
});

describe('toggleTag', () => {
  it('adds a tag at the end, or removes it', () => {
    expect(toggleTag(['Mohg'], 'Malenia')).toEqual(['Mohg', 'Malenia']);
    expect(toggleTag(['Mohg', 'Malenia'], 'Mohg')).toEqual(['Malenia']);
    expect(toggleTag([], 'Mohg')).toEqual(['Mohg']);
  });
});

describe('topTags', () => {
  const known = new Set(['Malenia', 'Mohg', 'PvP', 'Bleed', 'Rennala']);

  it('picks the most used known tags, ties by name, at most `count`', () => {
    const counts = { Mohg: 4, Malenia: 9, PvP: 4, Bleed: 1, Rennala: 2 };
    expect(topTags(counts, 3, known)).toEqual([
      { tag: 'Malenia', count: 9 },
      { tag: 'Mohg', count: 4 },
      { tag: 'PvP', count: 4 },
    ]);
  });

  it('leaves out unknown (renamed or removed) and unused tags', () => {
    expect(topTags({ Malenia: 2, 'Old Tag': 50, Mohg: 0 }, 10, known)).toEqual([
      { tag: 'Malenia', count: 2 },
    ]);
  });

  it('uses the real tag list by default', () => {
    expect(topTags({ Malenia: 1, 'Not A Tag': 5 })).toEqual([{ tag: 'Malenia', count: 1 }]);
  });
});

describe('the weapon filter (T74)', () => {
  const withWeapons = [
    makeBuild({
      id: 'm',
      equipment: { ...emptyEquipment(), weapons: [null, null, null, MOONVEIL, null, null] },
    }),
    makeBuild({
      id: 'u',
      equipment: { ...emptyEquipment(), weapons: [UCHIGATANA, null, null, null, null, null] },
    }),
  ];

  it('finds the weapon in any hand, by its slug', () => {
    const filters = { ...DEFAULT_FILTERS, weapon: 'moonveil' };
    expect(weaponIdOf(filters)).toBe(MOONVEIL);
    expect(ids(filterBuilds(withWeapons, filters))).toEqual(['m']);
    expect(weaponIdOf(DEFAULT_FILTERS)).toBeUndefined();
  });
});

describe('levels (T74)', () => {
  it('names the presets and any other range briefly', () => {
    expect(levelText(DEFAULT_FILTERS)).toBe('Any');
    expect(levelText({ minLevel: 125, maxLevel: 150 })).toBe('125–150');
    expect(levelText({ minLevel: 200, maxLevel: 713 })).toBe('200+');
    expect(levelText({ minLevel: 1, maxLevel: 50 })).toBe('Up to 50');
    expect(levelText({ minLevel: 80, maxLevel: 80 })).toBe('80');
  });

  it('knows which preset a range is', () => {
    expect(levelPreset({ minLevel: 125, maxLevel: 150 })?.label).toBe('125–150');
    expect(levelPreset(DEFAULT_FILTERS)).toBe(LEVEL_PRESETS[0]);
    expect(levelPreset({ minLevel: 126, maxLevel: 150 })).toBeUndefined();
  });
});

describe('activeFilters (T74)', () => {
  it('lists level, tags, then the weapon, each with the change that removes it', () => {
    const filters = {
      ...DEFAULT_FILTERS,
      search: 'moon',
      sort: 'new' as const,
      tags: ['Bleed (Hemorrhage)', 'PvP'],
      weapon: 'moonveil',
      minLevel: 125,
      maxLevel: 150,
    };
    const active = activeFilters(filters);
    expect(active.map((f) => f.label)).toEqual(['Level 125–150', 'Bleed', 'PvP', 'Moonveil']);
    expect(active[0]!.without).toEqual({ minLevel: 1, maxLevel: 713 });
    expect(active[1]!.without).toEqual({ tags: ['PvP'] });
    expect(active[3]!.without).toEqual({ weapon: '' });
    expect(activeFilters(DEFAULT_FILTERS)).toEqual([]);
  });

  it('isFiltered ignores the sort', () => {
    expect(isFiltered({ ...DEFAULT_FILTERS, sort: 'new' })).toBe(false);
    expect(isFiltered({ ...DEFAULT_FILTERS, weapon: 'moonveil' })).toBe(true);
  });

  it('buildsHref: the builds page with filters, defaults left out', () => {
    expect(buildsHref()).toBe('/builds');
    expect(buildsHref({ tags: ['PvP'] })).toBe('/builds?tag=PvP');
    expect(buildsHref({ sort: 'played' })).toBe('/builds?sort=played');
  });
});
