// Character data for the build math (T8): the twelve starting classes (CharaInitParam 3000–3011) and the
// stat curves (CalcCorrectGraph rows) for HP, FP, stamina and equip load, plus what a talisman changes
// (its SpEffectParam row). Pure: params in, data out. src/lib/buildMath.ts does the arithmetic.
import type { Character, StatCurve, TalismanModifiers } from '../../src/data/schema.ts';
import { num, type Param } from './export.ts';

/** The params this module reads. */
export const CHARACTER_PARAMS = ['CharaInitParam', 'CalcCorrectGraph', 'SpEffectParam'] as const;
export type CharacterParamName = (typeof CHARACTER_PARAMS)[number];

/**
 * The starting classes: Vagabond … Wretch (3000–3009) and the Tarnished Pack's Idus Knight and Heavy
 * Knight (3010, 3011; patch 1.17). firestore.rules `validStartingClass` accepts the same range.
 */
export const CLASS_ROWS = { from: 3000, to: 3011 };

/** CalcCorrectGraph rows (named in the param: "HP Scaling - Vigor", …). */
export const CURVE_ROWS = { hp: 100, fp: 101, stamina: 104, equipLoad: 220 } as const;

const CLASS_STATS = {
  vigor: 'baseVit',
  mind: 'baseWil',
  end: 'baseEnd',
  str: 'baseStr',
  dex: 'baseDex',
  int: 'baseMag',
  fai: 'baseFai',
  arc: 'baseLuc',
} as const;

/** SpEffectParam's flat stat bonuses, by build stat. */
const STAT_BONUSES = {
  vigor: 'addLifeForceStatus',
  mind: 'addWillpowerStatus',
  end: 'addEndureStatus',
  str: 'addStrengthStatus',
  dex: 'addDexterityStatus',
  int: 'addMagicStatus',
  fai: 'addFaithStatus',
  arc: 'addLuckStatus',
} as const;

/** SpEffectParam multipliers (1 = no change), by modifier. */
const RATES = {
  hp: 'maxHpRate',
  fp: 'maxMpRate',
  stamina: 'maxStaminaRate',
  equipLoad: 'equipWeightChangeRate',
  poiseDamage: 'toughnessDamageCutRate',
} as const;

const range = (count: number) => Array.from({ length: count }, (_, i) => i);

function curve(param: Param, id: number, problems: string[]): StatCurve {
  const row = param.get(id);
  if (!row) {
    problems.push(`CalcCorrectGraph: row ${id} missing`);
    return { stages: [], values: [], exponents: [] };
  }
  return {
    stages: range(5).map((i) => num(row, `stageMaxVal${i}`)),
    values: range(5).map((i) => num(row, `stageMaxGrowVal${i}`)),
    exponents: range(5).map((i) => num(row, `adjPt_maxGrowVal${i}`)),
  };
}

export function extractCharacter(params: Record<CharacterParamName, Param>): {
  character: Character;
  problems: string[];
} {
  const problems: string[] = [];
  const classes: Character['classes'] = [];
  for (let id = CLASS_ROWS.from; id <= CLASS_ROWS.to; id += 1) {
    const row = params.CharaInitParam.get(id);
    if (!row) {
      problems.push(`CharaInitParam: starting class ${id} missing`);
      continue;
    }
    const stats = Object.fromEntries(
      Object.entries(CLASS_STATS).map(([stat, column]) => [stat, num(row, column)]),
    ) as Character['classes'][number]['stats'];
    const name = (row.Name ?? '').replace(/^Class - /, '');
    const level = num(row, 'soulLv');
    const sum = Object.values(stats).reduce((total, value) => total + value, 0);
    // calculateLevel (src/lib/buildMath.ts) and firestore.rules rely on this for every class.
    if (sum - 79 !== level) problems.push(`class ${name}: level ${level} isn't stat sum − 79`);
    classes.push({ id, name, level, stats });
  }
  const graphs = params.CalcCorrectGraph;
  return {
    character: {
      classes,
      curves: {
        hp: curve(graphs, CURVE_ROWS.hp, problems),
        fp: curve(graphs, CURVE_ROWS.fp, problems),
        stamina: curve(graphs, CURVE_ROWS.stamina, problems),
        equipLoad: curve(graphs, CURVE_ROWS.equipLoad, problems),
      },
    },
    problems,
  };
}

/**
 * What a talisman's SpEffect changes for the build math, with only the non-neutral values (undefined
 * when it changes none of them). Every effect read here is unconditional for talismans (checked
 * against the 1.17.3 export: none has a state or HP condition).
 */
export function talismanModifiers(spEffects: Param, refId: number): TalismanModifiers | undefined {
  const row = spEffects.get(refId);
  if (!row) return undefined;
  const modifiers: TalismanModifiers = {};
  const stats: NonNullable<TalismanModifiers['stats']> = {};
  for (const [stat, column] of Object.entries(STAT_BONUSES)) {
    const bonus = num(row, column);
    if (bonus) stats[stat as keyof typeof STAT_BONUSES] = bonus;
  }
  if (Object.keys(stats).length) modifiers.stats = stats;
  for (const [key, column] of Object.entries(RATES)) {
    const rate = num(row, column);
    if (rate !== 1) modifiers[key as keyof typeof RATES] = rate;
  }
  const slots = num(row, 'changeMagicSlot');
  if (slots) modifiers.memorySlots = slots;
  return Object.keys(modifiers).length ? modifiers : undefined;
}
