// Pure Elden Ring build math. T8 adds requirements, equip load, poise and HP/FP here.

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

/** A stat as the editor stores it: a whole number from 1 to 99 (anything else is pulled into range). */
export function clampStat(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_STAT;
  return Math.min(MAX_STAT, Math.max(MIN_STAT, Math.round(value)));
}

/** Parses typed or stored stat text ("42", " 7 ", "abc") into a valid stat. */
export function parseStat(value: unknown): number {
  const number = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
  return clampStat(number);
}
