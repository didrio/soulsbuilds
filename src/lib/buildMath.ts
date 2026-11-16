// Pure Elden Ring build math: level, stat clamping, and (T8) what a build's stats and gear add up to.
// No data imports (this module runs on every page): the game tables come in as arguments, from
// src/data/er/character.json and the item files.
//
// Sources. Curves: the game's own CalcCorrectGraph rows 100 (HP from Vigor), 101 (FP from Mind),
// 104 (Stamina from Endurance) and 220 (Equip Load from Endurance), and the starting classes from
// CharaInitParam 3000–3009, both from the owner's export of regulation 1.17.3 (docs/data.md).
// Rounding, roll-type thresholds, two-handing and how talisman rates combine: the Fextralife wiki
// (eldenring.wiki.fextralife.com: Equip Load, Vigor, Mind, Endurance), whose tables the tests check.

export const STAT_KEYS = ['vigor', 'mind', 'end', 'str', 'dex', 'int', 'fai', 'arc'] as const;

export type StatKey = (typeof STAT_KEYS)[number];

/** The 8 attributes, each an integer from MIN_STAT to MAX_STAT. */
export type Stats = Record<StatKey, number>;

export const MIN_STAT = 1;
export const MAX_STAT = 99;
export const DEFAULT_STAT = 10;

// Every starting class's stats sum to (its level + 79), so level = sum of the 8 stats - 79.
const LEVEL_OFFSET = 79;

/** Highest reachable level (every stat at 99). */
export const MAX_LEVEL = STAT_KEYS.length * MAX_STAT - LEVEL_OFFSET;

/** Character level from the 8 stats, never below 1. firestore.rules checks the same formula. */
export function calculateLevel(stats: Stats): number {
  const sum = STAT_KEYS.reduce((total, key) => total + stats[key], 0);
  return Math.max(sum - LEVEL_OFFSET, 1);
}

/**
 * A stat as the editor stores it: a whole number from `min` (1, or the starting class's base) to 99
 * (anything else is pulled into range).
 */
export function clampStat(value: number, min: number = MIN_STAT): number {
  if (!Number.isFinite(value)) return Math.max(DEFAULT_STAT, min);
  return Math.min(MAX_STAT, Math.max(min, Math.round(value)));
}

/** Parses typed or stored stat text ("42", " 7 ", "abc") into a valid stat. */
export function parseStat(value: unknown): number {
  const number = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
  return clampStat(number);
}

// --- T8: what the stats and gear add up to --------------------------------------------------------

/** A CalcCorrectGraph row (src/data/schema.ts statCurveSchema). */
export interface StatCurve {
  stages: readonly number[];
  values: readonly number[];
  exponents: readonly number[];
}

/** What a talisman changes (src/data/schema.ts talismanModifiersSchema); rates multiply. */
export interface Modifiers {
  stats?: Partial<Record<StatKey, number>>;
  hp?: number;
  fp?: number;
  stamina?: number;
  equipLoad?: number;
  poiseDamage?: number;
  memorySlots?: number;
}

/**
 * A CalcCorrectGraph curve at `stat`: between breakpoints i and i+1 the result moves from values[i]
 * to values[i+1] along r^e (e = exponents[i] > 0) or 1 − (1 − r)^−e (e < 0), r being how far the stat
 * is between the two breakpoints. Unrounded.
 */
export function curveValue({ stages, values, exponents }: StatCurve, stat: number): number {
  const last = stages.length - 1;
  if (stat <= (stages[0] ?? 0)) return values[0] ?? 0;
  if (stat >= (stages[last] ?? 0)) return values[last] ?? 0;
  const i = stages.findIndex((stage, index) => index < last && stat < (stages[index + 1] ?? 0));
  const [from, to] = [stages[i] ?? 0, stages[i + 1] ?? 0];
  const [low, high] = [values[i] ?? 0, values[i + 1] ?? 0];
  const exponent = exponents[i] ?? 1;
  const ratio = (stat - from) / (to - from);
  const shaped = exponent > 0 ? ratio ** exponent : 1 - (1 - ratio) ** -exponent;
  return low + (high - low) * shaped;
}

/** The stat bonuses the talismans add together (only the stats they raise). */
export function statBonuses(modifiers: readonly Modifiers[]): Partial<Stats> {
  const bonuses: Partial<Stats> = {};
  for (const { stats } of modifiers)
    for (const [key, bonus] of Object.entries(stats ?? {}) as [StatKey, number][])
      bonuses[key] = (bonuses[key] ?? 0) + bonus;
  return bonuses;
}

/** The stats with the talismans' bonuses, each capped at 99. Requirements and vitals use these. */
export function effectiveStats(stats: Stats, modifiers: readonly Modifiers[]): Stats {
  const bonuses = statBonuses(modifiers);
  return Object.fromEntries(
    STAT_KEYS.map((key) => [key, Math.min(MAX_STAT, stats[key] + (bonuses[key] ?? 0))]),
  ) as Stats;
}

type Rate = 'hp' | 'fp' | 'stamina' | 'equipLoad' | 'poiseDamage';
/** Talisman rates multiply (Great-Jar's Arsenal 1.19 × Erdtree's Favor +2 1.08: Fextralife's 205.6). */
const rate = (modifiers: readonly Modifiers[], key: Rate) =>
  modifiers.reduce((product, modifier) => product * (modifier[key] ?? 1), 1);

/** Rounds to one decimal, as the game shows weights and equip load. */
const tenths = (value: number) => Math.round(value * 10) / 10;

export interface StatCurves {
  hp: StatCurve;
  fp: StatCurve;
  stamina: StatCurve;
  equipLoad: StatCurve;
}

export interface Vitals {
  hp: number;
  fp: number;
  stamina: number;
  /** Maximum equip load, to one decimal. */
  equipLoad: number;
}

/** HP, FP and stamina (whole, rounded down) and maximum equip load (one decimal) from effective stats. */
export function vitals(curves: StatCurves, stats: Stats, modifiers: readonly Modifiers[]): Vitals {
  return {
    hp: Math.floor(curveValue(curves.hp, stats.vigor) * rate(modifiers, 'hp')),
    fp: Math.floor(curveValue(curves.fp, stats.mind) * rate(modifiers, 'fp')),
    stamina: Math.floor(curveValue(curves.stamina, stats.end) * rate(modifiers, 'stamina')),
    equipLoad: tenths(curveValue(curves.equipLoad, stats.end) * rate(modifiers, 'equipLoad')),
  };
}

/** Total weight of the equipped weapons, ammo, armor and talismans, to one decimal. */
export const totalWeight = (weights: readonly number[]) =>
  tenths(weights.reduce((sum, weight) => sum + weight, 0));

export type RollType = 'light' | 'medium' | 'heavy' | 'overloaded';

/** Fextralife: light ≤ 29.9%, medium 30–69.9%, heavy 70–99.9%, overloaded from 100%. */
export function rollType(weight: number, maxLoad: number): RollType {
  const ratio = maxLoad > 0 ? weight / maxLoad : Infinity;
  if (ratio < 0.3) return 'light';
  if (ratio < 0.7) return 'medium';
  if (ratio < 1) return 'heavy';
  return 'overloaded';
}

/** Poise: the armor's, divided by the poise damage taken (Bull-Goat's 0.75 ≈ +33%), rounded down. */
export const poise = (armorPoise: readonly number[], modifiers: readonly Modifiers[]) =>
  Math.floor(armorPoise.reduce((sum, value) => sum + value, 0) / rate(modifiers, 'poiseDamage'));

export type RequirementStat = 'str' | 'dex' | 'int' | 'fai' | 'arc';
export type Requirements = Partial<Record<RequirementStat, number>>;

export interface RequirementCheck {
  /** `two-handed`: only Strength falls short, and two-handing (Strength × 1.5) covers it. */
  status: 'met' | 'two-handed' | 'unmet';
  /** What falls short one-handed, in the game's stat order. */
  missing: readonly { stat: RequirementStat; required: number }[];
}

const REQUIREMENT_STATS: RequirementStat[] = ['str', 'dex', 'int', 'fai', 'arc'];

/** Whether effective stats meet an item's requirements; two-handing counts Strength × 1.5 (rounded down). */
export function checkRequirements(requirements: Requirements, stats: Stats): RequirementCheck {
  const missing = REQUIREMENT_STATS.filter((stat) => stats[stat] < (requirements[stat] ?? 0)).map(
    (stat) => ({ stat, required: requirements[stat] ?? 0 }),
  );
  if (!missing.length) return { status: 'met', missing };
  const twoHanded =
    missing.length === 1 &&
    missing[0]?.stat === 'str' &&
    Math.floor(stats.str * 1.5) >= missing[0].required;
  return { status: twoHanded ? 'two-handed' : 'unmet', missing };
}

/**
 * Memory slots: 2 to start, +1 per Memory Stone; builds assume all 8 stones (owner's call, T8), plus
 * what talismans add (Moon of Nokstella +2).
 */
export const BASE_MEMORY_SLOTS = 10;

export const memorySlots = (modifiers: readonly Modifiers[]) =>
  modifiers.reduce((slots, modifier) => slots + (modifier.memorySlots ?? 0), BASE_MEMORY_SLOTS);

/** Positions of the spells that don't fit: in order, each uses its slot cost until the slots run out. */
export function spellsOverSlots(costs: readonly number[], available: number): number[] {
  let used = 0;
  return costs.flatMap((cost, index) => {
    used += cost;
    return used > available ? [index] : [];
  });
}

/** The stats raised to a starting class's base where they're below it. */
export function applyClassMinimums(stats: Stats, base: Stats): Stats {
  return Object.fromEntries(
    STAT_KEYS.map((key) => [key, Math.max(stats[key], base[key])]),
  ) as Stats;
}
