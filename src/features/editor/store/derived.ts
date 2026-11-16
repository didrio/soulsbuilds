// What the build in the editor adds up to (T8): effective stats, HP/FP/stamina, equip load and roll
// type, poise, memory slots, and whether each weapon and spell's requirements are met. The arithmetic
// is src/lib/buildMath.ts; these selectors feed it the editor state and the game curves.
import { createSelector } from '@reduxjs/toolkit';
import { statCurves } from '@/data';
import {
  checkRequirements,
  effectiveStats,
  memorySlots,
  poise,
  rollType,
  spellsOverSlots,
  statBonuses,
  totalWeight,
  vitals,
  type Modifiers,
  type RequirementCheck,
} from '@/lib/buildMath';
import {
  ARMOR_SLOTS,
  ARROW_SLOTS,
  SPELL_SLOTS,
  TALISMAN_SLOTS,
  WEAPON_SLOTS,
  type ItemSlot,
} from '../slots';
import { selectEquipment, selectSpellSlots, selectStats } from './selectors';

const notNull = <T>(value: T | null | undefined): value is T => value != null;

/** What the equipped talismans change (only those that change something). */
export const selectModifiers = createSelector(selectEquipment, (equipment): Modifiers[] =>
  TALISMAN_SLOTS.map((slot) => equipment[slot]?.modifiers).filter(notNull),
);

/** Stat bonuses from talismans, for the "+5" beside a stat. */
export const selectStatBonuses = createSelector(selectModifiers, statBonuses);

/** The stats with talisman bonuses: what requirements and vitals use. */
export const selectEffectiveStats = createSelector([selectStats, selectModifiers], effectiveStats);

export const selectVitals = createSelector([selectEffectiveStats, selectModifiers], (stats, mods) =>
  vitals(statCurves, stats, mods),
);

/** Weight of everything equipped that counts: weapons, arrows and bolts, armor, talismans. */
export const selectEquipWeight = createSelector(selectEquipment, (equipment) =>
  totalWeight(
    [
      ...WEAPON_SLOTS.map((slot) => equipment[slot]?.weight),
      ...ARROW_SLOTS.map((slot) => equipment[slot]?.weight),
      ...ARMOR_SLOTS.map((slot) => equipment[slot]?.weight),
      ...TALISMAN_SLOTS.map((slot) => equipment[slot]?.weight),
    ].filter(notNull),
  ),
);

export const selectRollType = createSelector([selectEquipWeight, selectVitals], (weight, v) =>
  rollType(weight, v.equipLoad),
);

export const selectPoise = createSelector([selectEquipment, selectModifiers], (equipment, mods) =>
  poise(ARMOR_SLOTS.map((slot) => equipment[slot]?.poise).filter(notNull), mods),
);

export const selectMemorySlots = createSelector(selectModifiers, memorySlots);

/** Memory slots the chosen spells take. */
export const selectMemoryUsed = createSelector(selectSpellSlots, (spells) =>
  SPELL_SLOTS.reduce((used, slot) => used + (spells[slot]?.slots ?? 0), 0),
);

/** The spell slots whose spell doesn't fit in the memory slots (counting in slot order). */
export const selectSpellsOverSlots = createSelector(
  [selectSpellSlots, selectMemorySlots],
  (spells, available): Set<ItemSlot> => {
    const filled = SPELL_SLOTS.filter((slot) => spells[slot]);
    const costs = filled.map((slot) => spells[slot]?.slots ?? 0);
    return new Set(spellsOverSlots(costs, available).map((index) => filled[index]!));
  },
);

/** Each filled weapon or spell slot's requirement check against the effective stats. */
export const selectRequirementChecks = createSelector(
  [selectEquipment, selectSpellSlots, selectEffectiveStats],
  (equipment, spells, stats): Partial<Record<ItemSlot, RequirementCheck>> => {
    const checks: Partial<Record<ItemSlot, RequirementCheck>> = {};
    for (const slot of WEAPON_SLOTS) {
      const weapon = equipment[slot];
      if (weapon) checks[slot] = checkRequirements(weapon.requirements, stats);
    }
    for (const slot of SPELL_SLOTS) {
      const spell = spells[slot];
      if (spell) checks[slot] = checkRequirements(spell.requirements, stats);
    }
    return checks;
  },
);
