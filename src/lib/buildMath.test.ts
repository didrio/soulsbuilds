import { describe, expect, it } from 'vitest';
import {
  calculateLevel,
  clampStat,
  MAX_LEVEL,
  parseStat,
  STAT_KEYS,
  type Stats,
} from './buildMath';

const stats = (overrides: Partial<Stats> = {}): Stats => ({
  vigor: 10,
  mind: 10,
  end: 10,
  str: 10,
  dex: 10,
  int: 10,
  fai: 10,
  arc: 10,
  ...overrides,
});

describe('calculateLevel', () => {
  it('matches the starting classes (sum of stats - 79)', () => {
    // Wretch: all 10s, level 1. Vagabond: 15/10/11/14/13/9/9/7, level 9.
    expect(calculateLevel(stats())).toBe(1);
    expect(
      calculateLevel({ vigor: 15, mind: 10, end: 11, str: 14, dex: 13, int: 9, fai: 9, arc: 7 }),
    ).toBe(9);
  });

  it('never goes below level 1', () => {
    expect(calculateLevel(stats({ vigor: 1, mind: 1 }))).toBe(1);
  });

  it('reaches 713 with every stat at 99', () => {
    const maxed = Object.fromEntries(STAT_KEYS.map((key) => [key, 99])) as Stats;
    expect(calculateLevel(maxed)).toBe(713);
    expect(MAX_LEVEL).toBe(713);
  });
});

describe('clampStat / parseStat', () => {
  it.each([
    [0, 1],
    [1, 1],
    [42, 42],
    [99, 99],
    [150, 99],
    [-5, 1],
    [12.6, 13],
    [Number.NaN, 10],
  ])('clampStat(%s) = %s', (input, expected) => {
    expect(clampStat(input)).toBe(expected);
  });

  it.each([
    ['42', 42],
    [' 7 ', 7],
    ['abc', 10],
    ['', 10],
    ['250', 99],
    [60, 60],
    [null, 10],
  ])('parseStat(%j) = %s', (input, expected) => {
    expect(parseStat(input)).toBe(expected);
  });
});
