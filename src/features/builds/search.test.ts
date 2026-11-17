import { describe, expect, it } from 'vitest';
import type { SearchEntry } from '@/lib/models';
import { MOONVEIL } from '@/test/fixtures';
import { DEFAULT_FILTERS } from './filters';
import {
  compareEntries,
  matchesWords,
  normalize,
  resultCount,
  searchIds,
  suggestions,
  words,
} from './search';

const DARK_MOON_GREATSWORD = 3090000;

const entry = (overrides: Partial<SearchEntry>): SearchEntry => ({
  id: 'x',
  name: '',
  tags: [],
  weapons: [],
  level: 100,
  likeCount: 0,
  commentCount: 0,
  playerCount: 0,
  createdAt: 0,
  ...overrides,
});

const index = [
  entry({ id: 'dmgs', name: 'Level 100 Dark Moon Greatsword Build', likeCount: 1, createdAt: 10 }),
  entry({
    id: 'carrier',
    name: 'Moonlit Spellblade',
    weapons: [DARK_MOON_GREATSWORD],
    createdAt: 30,
  }),
  entry({
    id: 'bleed',
    name: 'Blood Rot Poker',
    tags: ['Bleed (Hemorrhage)'],
    likeCount: 1,
    createdAt: 20,
  }),
  entry({
    id: 'veil',
    name: 'Basic Magic',
    weapons: [MOONVEIL],
    level: 150,
    playerCount: 2,
    createdAt: 5,
  }),
];

const search = (text: string, more = {}) =>
  searchIds(index, { ...DEFAULT_FILTERS, search: text, ...more });

describe('normalize and words', () => {
  it('drops case, accents and punctuation', () => {
    expect(normalize("Godslayer's  SEAL")).toBe('godslayer s seal');
    expect(words('Éclair — of the Rótten')).toEqual(['eclair', 'of', 'the', 'rotten']);
  });

  it('matches words that start words, in any order', () => {
    expect(matchesWords(['moon', 'dark'], words('Dark Moon Greatsword'))).toBe(true);
    expect(matchesWords(['oon'], words('Dark Moon Greatsword'))).toBe(false);
    expect(matchesWords([], words('anything'))).toBe(true);
  });
});

describe('searchIds', () => {
  it('finds words anywhere in the name ("dark moon" was a prefix miss before T74)', () => {
    expect(search('dark moon')).toContain('dmgs');
  });

  it('finds builds by their weapons and tags', () => {
    expect(search('dark moon')).toContain('carrier');
    expect(search('moonveil')).toEqual(['veil']);
    expect(search('bleed')).toEqual(['bleed']);
    expect(search('hemorrhage')).toEqual(['bleed']);
  });

  it('keeps the sort: likes then newest, newest, most played then newest', () => {
    expect(search('')).toEqual(['bleed', 'dmgs', 'carrier', 'veil']);
    expect(search('', { sort: 'new' })).toEqual(['carrier', 'bleed', 'dmgs', 'veil']);
    expect(search('', { sort: 'played' })[0]).toBe('veil');
  });

  it('applies the filters', () => {
    expect(search('', { minLevel: 125, maxLevel: 150 })).toEqual(['veil']);
    expect(search('', { weapon: 'moonveil' })).toEqual(['veil']);
    expect(search('moon', { tags: ['Bleed (Hemorrhage)'] })).toEqual([]);
  });

  it('compareEntries breaks ties newest first', () => {
    const a = entry({ id: 'a', createdAt: 1 });
    const b = entry({ id: 'b', createdAt: 2 });
    expect([a, b].sort(compareEntries('top')).map((e) => e.id)).toEqual(['b', 'a']);
  });
});

describe('suggestions', () => {
  const counts = {
    weaponCounts: { [MOONVEIL]: 4, [DARK_MOON_GREATSWORD]: 2 },
    tagCounts: { 'Bleed (Hemorrhage)': 5 },
  };

  it('offers the weapon and tag pages a search names, with build counts', () => {
    expect(suggestions('dark moon', counts)).toEqual([
      expect.objectContaining({
        kind: 'weapon',
        name: 'Dark Moon Greatsword',
        path: '/weapons/dark-moon-greatsword',
        count: 2,
      }),
    ]);
    expect(suggestions('bleed', counts)).toEqual([
      { kind: 'tag', name: 'Bleed', path: '/tags/bleed', count: 5 },
    ]);
  });

  it('leaves out unused ones and one-letter searches', () => {
    expect(suggestions('uchigatana', counts)).toEqual([]);
    expect(suggestions('m', counts)).toEqual([]);
  });
});

describe('resultCount', () => {
  it('is exact when everything is loaded, else the index count (at least what is loaded)', () => {
    expect(resultCount(3, false, null, DEFAULT_FILTERS)).toBe(3);
    expect(resultCount(24, true, null, DEFAULT_FILTERS)).toBeUndefined();
    expect(resultCount(2, true, { searchIndex: index }, DEFAULT_FILTERS)).toBe(4);
    expect(resultCount(9, true, { searchIndex: index }, DEFAULT_FILTERS)).toBe(9);
  });
});
