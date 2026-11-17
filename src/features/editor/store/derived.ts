// What the build in the editor adds up to (T8): effective stats, HP/FP/stamina, equip load and roll
// type, poise, memory slots, and whether each weapon and spell's requirements are met. The arithmetic
// is src/lib/buildMath.ts; these selectors feed it the editor state and the game curves.
import { createSelector } from '@reduxjs/toolkit';
import { statCurves } from '@/data';
import {
  calculateLevel,
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
import type { DescriptionFacts, WeaponFact } from '../describe';
import { itemWarning, weaponDetails } from '../itemDetails';
import {
  ARMOR_SLOTS,
  ARROW_SLOTS,
  CONSUMABLE_SLOTS,
  SPELL_SLOTS,
  TALISMAN_SLOTS,
  TEAR_SLOTS,
  WEAPON_AFFINITY_SLOTS,
  WEAPON_SKILL_SLOTS,
  WEAPON_SLOTS,
  type ItemSlot,
} from '../slots';
import {
  selectEquipment,
  selectSpellSlots,
  selectStartingClass,
  selectStats,
  selectTearSlots,
} from './selectors';

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

/** What the generated description (T47, features/editor/describe.ts) says about the build. */
export const selectDescriptionFacts = createSelector(
  [
    selectEquipment,
    selectSpellSlots,
    selectTearSlots,
    selectStats,
    selectStartingClass,
    selectEffectiveStats,
    selectVitals,
    selectEquipWeight,
    selectPoise,
    selectMemorySlots,
    selectMemoryUsed,
    selectSpellsOverSlots,
    selectRequirementChecks,
  ],
  (
    equipment,
    spellSlots,
    tearSlots,
    baseStats,
    startingClass,
    stats,
    vitalsNow,
    weight,
    poiseNow,
    available,
    used,
    over,
    checks,
  ): DescriptionFacts => {
    const weaponFact = (index: number): WeaponFact | null => {
      const weapon = equipment[WEAPON_SLOTS[index]!];
      if (!weapon) return null;
      const details = weaponDetails(
        weapon,
        equipment[WEAPON_SKILL_SLOTS[index]!],
        equipment[WEAPON_AFFINITY_SLOTS[index]!],
      );
      return {
        name: weapon.name,
        details: [details.affinity, details.skill?.name].filter(
          (part): part is string => part != null,
        ),
      };
    };
    // Weapons 1–3 are the right hand (the main one), 4–6 the left.
    const firstFilled = (indexes: number[]) => indexes.map(weaponFact).find(notNull) ?? null;
    const right = firstFilled([0, 1, 2]);
    const left = firstFilled([3, 4, 5]);
    const weapons = right ? [right, left] : [left];

    const spells = SPELL_SLOTS.map((slot) => spellSlots[slot]).filter(notNull);
    const tears = TEAR_SLOTS.map((slot) => tearSlots[slot]).filter(notNull);
    const armor = ARMOR_SLOTS.map((slot) => equipment[slot]).filter(notNull);
    const talismans = TALISMAN_SLOTS.map((slot) => equipment[slot]).filter(notNull);
    const arrows = ARROW_SLOTS.map((slot) => equipment[slot]).filter(notNull);
    const consumables = CONSUMABLE_SLOTS.map((slot) => equipment[slot]).filter(notNull);
    const ashes = WEAPON_SKILL_SLOTS.map((slot) => equipment[slot]).filter(notNull);
    const weaponItems = WEAPON_SLOTS.map((slot) => equipment[slot]).filter(notNull);
    const singles = [equipment.greatRune, equipment.spiritAsh].filter(notNull);

    const warnings = [
      ...WEAPON_SLOTS.flatMap((slot) => {
        const weapon = equipment[slot];
        const warning = weapon ? itemWarning(checks[slot]) : null;
        return weapon && warning ? [{ name: weapon.name, text: warning.text }] : [];
      }),
      ...SPELL_SLOTS.flatMap((slot) => {
        const spell = spellSlots[slot];
        const warning = spell ? itemWarning(checks[slot], over.has(slot)) : null;
        return spell && warning ? [{ name: spell.name, text: warning.text }] : [];
      }),
    ];
    const everything = [
      ...weaponItems,
      ...ashes,
      ...arrows,
      ...armor,
      ...talismans,
      ...spells,
      ...tears,
      ...consumables,
      ...singles,
    ];

    return {
      level: calculateLevel(baseStats),
      className: startingClass?.name ?? null,
      gearCount: everything.length - ashes.length,
      weapons: weapons.filter(notNull),
      stats,
      load:
        weight > 0
          ? { weight, max: vitalsNow.equipLoad, roll: rollType(weight, vitalsNow.equipLoad) }
          : null,
      poise: poiseNow,
      talismans: talismans.map((item) => item.name),
      spiritAsh: equipment.spiritAsh?.name ?? null,
      spells: {
        incantations: spells.filter((spell) => spell.kind === 'incantation').length,
        sorceries: spells.filter((spell) => spell.kind === 'sorcery').length,
        used,
        available,
      },
      warnings,
      dlcItems: [...new Set(everything.filter((item) => item.dlc).map((item) => item.name))],
    };
  },
);
