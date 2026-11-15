import { describe, expect, it } from 'vitest';
import { calculateLevel, type Stats } from './buildMath';

const stats = (overrides: Record<string, number | string> = {}) => ({
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

  it('accepts numeric strings, which v1 build documents contain', () => {
    expect(calculateLevel(stats({ vigor: '60', dex: '40' }))).toBe(81);
  });

  it('never goes below level 1', () => {
    expect(calculateLevel(stats({ vigor: 1, mind: 1 }))).toBe(1);
  });

  it('reaches 713 with every stat at 99', () => {
    const maxed = Object.fromEntries(Object.keys(stats()).map((key) => [key, 99])) as Stats;
    expect(calculateLevel(maxed)).toBe(713);
  });
});
