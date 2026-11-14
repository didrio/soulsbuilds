// Pure Elden Ring build math. T8 adds requirements, equip load, poise and HP/FP here.

export const STAT_KEYS = ['vigor', 'mind', 'end', 'str', 'dex', 'int', 'fai', 'arc'];

// Every starting class's stats sum to (its level + 79), so level = sum of the 8 stats - 79.
const LEVEL_OFFSET = 79;

/**
 * Character level from the 8 stats. Stats may be numbers or numeric strings (v1 builds store both).
 * Never below 1. Non-numeric input yields NaN (the editor doesn't clamp yet: T5).
 */
export function calculateLevel(stats) {
  const sum = STAT_KEYS.reduce((total, key) => total + Number(stats[key]), 0);
  return Math.max(sum - LEVEL_OFFSET, 1);
}
