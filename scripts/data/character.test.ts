// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { characterSchema } from '../../src/data/schema.ts';
import { formatCharacter } from './build.ts';
import { extractCharacter, talismanModifiers } from './character.ts';
import { fixtureCharacterParams, fixtureParams } from './test-fixtures.ts';

describe('extractCharacter', () => {
  const { character, problems } = extractCharacter(fixtureCharacterParams());

  it('reads the twelve starting classes with their level and base stats', () => {
    expect(problems).toEqual([]);
    expect(characterSchema.safeParse(character).success).toBe(true);
    expect(character.classes.map((c) => c.name)).toEqual([
      'Vagabond',
      'Warrior',
      'Hero',
      'Bandit',
      'Astrologer',
      'Prophet',
      'Confessor',
      'Samurai',
      'Prisoner',
      'Wretch',
      'Idus Knight',
      'Heavy Knight',
    ]);
    expect(character.classes[7]).toEqual({
      id: 3007,
      name: 'Samurai',
      level: 9,
      stats: { vigor: 12, mind: 11, end: 13, str: 12, dex: 15, int: 9, fai: 8, arc: 8 },
    });
  });

  it('copies the stat curves raw', () => {
    expect(character.curves.hp).toEqual({
      stages: [1, 25, 40, 60, 99],
      values: [300, 800, 1450, 1900, 2100],
      exponents: [1.5, 1.1, -1.2, -1.2, 1],
    });
    expect(character.curves.equipLoad.values).toEqual([45, 45, 72, 120, 160]);
  });

  it('reports a class whose level is not its stat sum − 79, and a missing curve', () => {
    const params = fixtureCharacterParams();
    params.CharaInitParam.get(3009)!.soulLv = '2';
    params.CalcCorrectGraph.delete(220);
    expect(extractCharacter(params).problems).toEqual([
      "class Wretch: level 2 isn't stat sum − 79",
      'CalcCorrectGraph: row 220 missing',
    ]);
  });

  it('formats one class or curve per line', () => {
    const text = formatCharacter(character);
    expect(JSON.parse(text)).toEqual(character);
    expect(text.split('\n')).toHaveLength(23);
  });
});

describe('talismanModifiers', () => {
  const spEffects = fixtureParams().SpEffectParam;

  it('keeps only the values that differ from neutral', () => {
    expect(talismanModifiers(spEffects, 310510)).toEqual({
      stats: { vigor: 5, end: 5, str: 5, dex: 5 },
    });
    expect(talismanModifiers(spEffects, 311400)).toEqual({ memorySlots: 2 });
    expect(talismanModifiers(spEffects, 312100)).toEqual({ poiseDamage: 0.75 });
  });

  it('is undefined for an effect the build math ignores or a missing row', () => {
    expect(talismanModifiers(spEffects, 999999)).toBeUndefined();
    expect(talismanModifiers(spEffects, 123)).toBeUndefined();
  });
});
