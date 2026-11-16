import { describe, expect, it } from 'vitest';
import type { Build } from '@/lib/models';
import {
  clampLevel,
  DEFAULT_FILTERS,
  filterBuilds,
  parseFilters,
  toggleTag,
  topTags,
  toSearchParams,
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
      minLevel: 50,
      maxLevel: 150,
    };
    const params = toSearchParams(filters);
    expect(params.toString()).toBe('q=moon&sort=new&tag=Malenia&tag=Mohg&min=50&max=150');
    expect(parseFilters(params)).toEqual(filters);
    expect(toSearchParams(DEFAULT_FILTERS).toString()).toBe('');
  });

  it('ignores junk and swaps a reversed range', () => {
    expect(parseFilters(new URLSearchParams('sort=hot&min=abc&max=99999'))).toEqual(
      DEFAULT_FILTERS,
    );
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
