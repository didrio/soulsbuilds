import { describe, expect, it } from 'vitest';
import character from '@/data/er/character.json';
import {
  applyClassMinimums,
  calculateLevel,
  checkRequirements,
  clampStat,
  curveValue,
  effectiveStats,
  MAX_LEVEL,
  memorySlots,
  type Modifiers,
  parseStat,
  poise,
  rollType,
  spellsOverSlots,
  STAT_KEYS,
  statBonuses,
  type Stats,
  totalWeight,
  vitals,
} from './buildMath';

// The game's curves (character.json, from the owner's export), checked against Fextralife's tables.
const { curves } = character;

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

describe('clampStat with a minimum (the starting class base)', () => {
  it.each([
    [5, 12, 12],
    [40, 12, 40],
    [Number.NaN, 12, 12],
    [120, 12, 99],
  ])('clampStat(%s, min %s) = %s', (value, min, expected) => {
    expect(clampStat(value, min)).toBe(expected);
  });
});

// Fextralife tables (Vigor, Mind, Endurance, Equip Load pages), one row per curve segment and soft cap.
describe('vitals from the game curves', () => {
  it.each([
    [1, 300],
    [2, 304],
    [10, 414],
    [20, 652],
    [25, 800],
    [26, 833],
    [40, 1450],
    [41, 1476],
    [50, 1704],
    [60, 1900],
    [61, 1906],
    [70, 1959],
    [99, 2100],
  ])('Vigor %i → %i HP', (vigor, hp) => {
    expect(vitals(curves, stats({ vigor }), []).hp).toBe(hp);
  });

  // Fextralife lists Mind 1–8 lower than the game's curve (no class starts below 9), so from 9.
  it.each([
    [9, 75],
    [10, 78],
    [15, 95],
    [16, 100],
    [35, 200],
    [36, 207],
    [41, 242],
    [50, 300],
    [60, 350],
    [61, 352],
    [99, 450],
  ])('Mind %i → %i FP', (mind, fp) => {
    expect(vitals(curves, stats({ mind }), []).fp).toBe(fp);
  });

  it.each([
    [1, 80, 45],
    [8, 92, 45],
    [9, 94, 46.6],
    [10, 96, 48.2],
    [13, 101, 52.9],
    [25, 121, 72],
    [26, 123, 73],
    [30, 130, 77.6],
    [50, 155, 105.2],
    [51, 155, 106.6],
    [60, 158, 120],
    [61, 158, 121],
    [99, 170, 160],
  ])('Endurance %i → %i stamina, %d equip load', (end, stamina, equipLoad) => {
    expect(vitals(curves, stats({ end }), [])).toMatchObject({ stamina, equipLoad });
  });

  it('multiplies talisman rates: 99 End + Great-Jar’s Arsenal + Erdtree’s Favor +2 = 205.6', () => {
    const talismans: Modifiers[] = [
      { equipLoad: 1.19 },
      { hp: 1.04, stamina: 1.1, equipLoad: 1.08 },
    ];
    expect(vitals(curves, stats({ end: 99, vigor: 40 }), talismans)).toMatchObject({
      equipLoad: 205.6,
      hp: Math.floor(1450 * 1.04),
      stamina: Math.floor(170 * 1.1),
    });
  });

  it('is the curve value at the breakpoints and clamps outside them', () => {
    expect(curveValue(curves.hp, 0)).toBe(300);
    expect(curveValue(curves.hp, 40)).toBe(1450);
    expect(curveValue(curves.hp, 150)).toBe(2100);
  });
});

describe('effectiveStats', () => {
  const soreseal: Modifiers = { stats: { vigor: 5, end: 5, str: 5, dex: 5 } };
  const heirloom: Modifiers = { stats: { str: 5 } };

  it('adds talisman bonuses, capped at 99', () => {
    expect(effectiveStats(stats({ str: 97 }), [soreseal, heirloom])).toEqual(
      stats({ vigor: 15, end: 15, str: 99, dex: 15 }),
    );
    expect(statBonuses([soreseal, heirloom])).toEqual({ vigor: 5, end: 5, str: 10, dex: 5 });
  });
});

describe('equip load and roll type', () => {
  it('sums weights to one decimal', () => {
    expect(totalWeight([0.1, 0.2, 3.8, 8.8])).toBe(12.9);
    expect(totalWeight([])).toBe(0);
  });

  // Fextralife: light ≤ 29.9%, medium 30–69.9%, heavy 70–99.9%, overloaded from 100%.
  it.each([
    [0, 'light'],
    [29.9, 'light'],
    [30, 'medium'],
    [69.9, 'medium'],
    [70, 'heavy'],
    [99.9, 'heavy'],
    [100, 'overloaded'],
    [150, 'overloaded'],
  ])('%d of 100 is %s', (weight, type) => {
    expect(rollType(weight, 100)).toBe(type);
  });
});

describe('poise', () => {
  it("sums armor poise; Bull-Goat's (poise damage × 0.75) adds a third", () => {
    expect(poise([6, 18, 4, 9], [])).toBe(37);
    expect(poise([6, 18, 4, 9], [{ poiseDamage: 0.75 }])).toBe(49);
    expect(poise([], [])).toBe(0);
  });
});

describe('checkRequirements', () => {
  it.each([
    [{ str: 10, dex: 10 }, stats(), 'met', []],
    [{ str: 15 }, stats(), 'two-handed', [{ stat: 'str', required: 15 }]],
    [{ str: 16 }, stats(), 'unmet', [{ stat: 'str', required: 16 }]],
    [
      { str: 12, dex: 14 },
      stats(),
      'unmet',
      [
        { stat: 'str', required: 12 },
        { stat: 'dex', required: 14 },
      ],
    ],
    [{ int: 28 }, stats({ int: 28 }), 'met', []],
    [{ fai: 12, arc: 15 }, stats({ fai: 12 }), 'unmet', [{ stat: 'arc', required: 15 }]],
  ] as const)('%j with %j is %s', (requirements, current, status, missing) => {
    expect(checkRequirements(requirements, current)).toEqual({ status, missing });
  });

  it('rounds two-handed Strength down (11 × 1.5 = 16)', () => {
    expect(checkRequirements({ str: 16 }, stats({ str: 11 })).status).toBe('two-handed');
    expect(checkRequirements({ str: 17 }, stats({ str: 11 })).status).toBe('unmet');
  });
});

describe('memory slots', () => {
  it('assumes all 8 Memory Stones (10); Moon of Nokstella adds 2', () => {
    expect(memorySlots([])).toBe(10);
    expect(memorySlots([{ memorySlots: 2 }, { hp: 1.06 }])).toBe(12);
  });

  it('flags the spells past the limit, in order', () => {
    expect(spellsOverSlots([1, 2, 3, 2, 1], 10)).toEqual([]);
    expect(spellsOverSlots([2, 3, 3, 1, 2, 1], 10)).toEqual([4, 5]);
    expect(spellsOverSlots([3, 3, 3, 1, 1], 10)).toEqual([4]);
  });
});

describe('applyClassMinimums', () => {
  it('raises only the stats below the class base', () => {
    const samurai = character.classes.find((c) => c.name === 'Samurai')!.stats;
    expect(applyClassMinimums(stats({ dex: 40, int: 5 }), samurai)).toEqual({
      vigor: 12,
      mind: 11,
      end: 13,
      str: 12,
      dex: 40,
      int: 9,
      fai: 10,
      arc: 10,
    });
  });
});
