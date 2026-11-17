import { describe, expect, it } from 'vitest';
import type { SearchEntry } from '@/lib/models';
import { arrangeShelves, tagShelves, trendingIds, type Shelf } from './shelves';

const entry = (id: string, createdAt: number, more: Partial<SearchEntry> = {}): SearchEntry => ({
  id,
  name: id,
  tags: [],
  weapons: [],
  level: 100,
  likeCount: 0,
  commentCount: 0,
  playerCount: 0,
  createdAt,
  ...more,
});

/** `count` builds, newest first: b0 is the newest. */
const many = (count: number, more: (i: number) => Partial<SearchEntry> = () => ({})) =>
  Array.from({ length: count }, (_, i) => entry(`b${i}`, count - i, more(i)));

describe('trendingIds', () => {
  it('with no activity anywhere, is the newest builds', () => {
    expect(trendingIds(many(8), 3)).toEqual(['b0', 'b1', 'b2']);
  });

  it('activity lifts a build over newer quiet ones; players count more than likes', () => {
    const index = many(30, (i) =>
      i === 12 ? { likeCount: 3 } : i === 20 ? { playerCount: 3 } : {},
    );
    const top = trendingIds(index, 3);
    expect(top[0]).toBe('b20');
    expect(top).toContain('b12');
  });

  it('age is counted in builds posted since, not days: an old site still trends', () => {
    // Two builds years apart, nothing since: the older one with likes still leads.
    const index = [entry('new', 1_000_000), entry('old', 1, { likeCount: 2 })];
    expect(trendingIds(index)).toEqual(['old', 'new']);
  });

  it('enough newer builds outweigh old likes', () => {
    const index = many(60, (i) => (i === 59 ? { likeCount: 2 } : {}));
    expect(trendingIds(index, 5)).not.toContain('b59');
  });
});

describe('tagShelves', () => {
  it('a Top shelf per most used tag with three builds or more, most liked first', () => {
    const index = many(6, (i) => ({
      tags: i < 4 ? ['Bleed (Hemorrhage)'] : ['Mohg'],
      likeCount: i === 3 ? 5 : 0,
    }));
    expect(tagShelves(index, { 'Bleed (Hemorrhage)': 4, Mohg: 2 })).toEqual([
      {
        key: 'tag:Bleed (Hemorrhage)',
        title: 'Top Bleed builds',
        caption: '4 builds',
        href: '/builds?tag=Bleed+%28Hemorrhage%29',
        ids: ['b3', 'b0', 'b1', 'b2'],
      },
    ]);
  });

  it('three shelves at most, for the three most used tags', () => {
    const index = many(8, () => ({ tags: ['Bleed (Hemorrhage)', 'Dexterity', 'Katana', 'Mohg'] }));
    const counts = { 'Bleed (Hemorrhage)': 4, Dexterity: 4, Katana: 4, Mohg: 3 };
    // Every tag is on all 8 builds, under BROAD_FROM (10), so none counts as too broad.
    expect(tagShelves(index, counts).map((shelf) => shelf.title)).toEqual([
      'Top Bleed builds',
      'Top Dexterity builds',
      'Top Katana builds',
    ]);
  });

  it('no shelf for a tag on most builds ("PVE")', () => {
    const index = many(12, (i) => ({ tags: i < 9 ? ['PVE', 'Faith'] : ['PVE'] }));
    expect(tagShelves(index, { PVE: 12, Faith: 9 }).map((shelf) => shelf.title)).toEqual([]);
    const fewer = many(12, (i) => ({ tags: i < 9 ? ['PVE'] : ['Faith'] }));
    expect(tagShelves(fewer, { PVE: 9, Faith: 3 }).map((s) => s.title)).toEqual([
      'Top Faith builds',
    ]);
  });
});

describe('arrangeShelves', () => {
  const shelf = (key: string): Shelf => ({ key, title: key, caption: '', href: '', ids: [] });
  const keys = (list: Shelf[]) => list.map((s) => s.key);

  it('the Top shelves, then Fresh builds', () => {
    expect(keys(arrangeShelves([shelf('a'), shelf('b'), shelf('c')], shelf('fresh')))).toEqual([
      'a',
      'b',
      'c',
      'fresh',
    ]);
  });

  it('keeps an even number (two across): the last tag shelf goes', () => {
    expect(keys(arrangeShelves([shelf('a'), shelf('b')], shelf('fresh')))).toEqual(['a', 'fresh']);
    expect(keys(arrangeShelves([], shelf('fresh')))).toEqual(['fresh']);
    expect(keys(arrangeShelves([shelf('a'), shelf('b'), shelf('c')], null))).toEqual(['a', 'b']);
  });
});
