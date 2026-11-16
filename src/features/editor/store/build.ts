// Moving a whole build between Firestore (model v2) and the editor state: `loadBuild` puts a saved
// build's stats and equipment into the slots, `selectBuildFields` reads the slots back.
import { createSelector, type ThunkAction, type UnknownAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import {
  getArmor,
  getArrow,
  getAsh,
  getConsumable,
  getGreatRune,
  getSpell,
  getSpiritAsh,
  getStartingClass,
  getTalisman,
  getTear,
  getWeapon,
} from '@/data';
import { calculateLevel } from '@/lib/buildMath';
import type { BuildContent } from '@/lib/models';
import {
  ARROW_SLOTS,
  CONSUMABLE_SLOTS,
  SPELL_SLOTS,
  TALISMAN_SLOTS,
  TEAR_SLOTS,
  WEAPON_AFFINITY_SLOTS,
  WEAPON_SKILL_SLOTS,
  WEAPON_SLOTS,
} from '../slots';
import { clearApp } from './app';
import {
  clearEquipment,
  updateArrow,
  updateChest,
  updateCon,
  updateGauntlet,
  updateGreatRune,
  updateHelm,
  updateLeg,
  updateSpiritAsh,
  updateTal,
  updateWeapon,
  updateWeaponAffinity,
  updateWeaponSkill,
} from './equipment';
import {
  selectArrows,
  selectChest,
  selectCons,
  selectGauntlet,
  selectGreatRune,
  selectHelm,
  selectLeg,
  selectSpells,
  selectSpiritAsh,
  selectStartingClass,
  selectStats,
  selectTals,
  selectTears,
  selectWeaponAffinities,
  selectWeapons,
  selectWeaponSkills,
} from './selectors';
import { clearSpells, updateSpell } from './spells';
import { clearStartingClass, setStartingClass } from './startingClass';
import { clearStats, setStats } from './stats';
import { clearTears, updateTear } from './tears';

type AppThunk = ThunkAction<void, RootState, unknown, UnknownAction>;

/** The build fields that live in the editor's Redux state. */
export type BuildFields = Pick<BuildContent, 'level' | 'stats' | 'startingClass' | 'equipment'>;

/** Empties the editor: no items, all stats 10, picker closed. */
export const clearEditor = (): AppThunk => (dispatch) => {
  dispatch(clearApp());
  dispatch(clearEquipment());
  dispatch(clearSpells());
  dispatch(clearStats());
  dispatch(clearStartingClass());
  dispatch(clearTears());
};

/**
 * Puts a saved build into the editor slots, looking each item up by ID. IDs that aren't in the game
 * data (or armor in the wrong slot) leave the slot empty and are dropped on the next save. Each
 * weapon goes in before its Ash of War and affinity, which the reducers keep only if the weapon
 * allows them. Saved arrays fill slots in order; entries beyond the last slot are ignored. Starts
 * from an empty editor.
 */
export const loadBuild =
  ({ stats, startingClass, equipment }: Omit<BuildFields, 'level'>): AppThunk =>
  (dispatch) => {
    dispatch(clearEditor());
    const {
      arrows,
      consumables: cons,
      talismans: tals,
      spells,
      tears,
      weapons,
      weaponAffinities,
      weaponSkills,
    } = equipment;
    ARROW_SLOTS.forEach((id, i) => {
      if (i < arrows.length) dispatch(updateArrow({ id, item: getArrow(arrows[i]) ?? null }));
    });
    CONSUMABLE_SLOTS.forEach((id, i) => {
      if (i < cons.length) dispatch(updateCon({ id, item: getConsumable(cons[i]) ?? null }));
    });
    TALISMAN_SLOTS.forEach((id, i) => {
      if (i < tals.length) dispatch(updateTal({ id, item: getTalisman(tals[i]) ?? null }));
    });
    SPELL_SLOTS.forEach((id, i) => {
      if (i < spells.length) dispatch(updateSpell({ id, item: getSpell(spells[i]) ?? null }));
    });
    TEAR_SLOTS.forEach((id, i) => {
      if (i < tears.length) dispatch(updateTear({ id, item: getTear(tears[i]) ?? null }));
    });
    WEAPON_SLOTS.forEach((id, i) => {
      if (i < weapons.length) dispatch(updateWeapon({ id, item: getWeapon(weapons[i]) ?? null }));
    });
    WEAPON_SKILL_SLOTS.forEach((id, i) => {
      if (i < weaponSkills.length)
        dispatch(updateWeaponSkill({ id, item: getAsh(weaponSkills[i]) ?? null }));
    });
    WEAPON_AFFINITY_SLOTS.forEach((id, i) => {
      if (i < weaponAffinities.length)
        dispatch(updateWeaponAffinity({ id, item: weaponAffinities[i] ?? null }));
    });
    dispatch(updateHelm(getArmor(equipment.helm, 'head') ?? null));
    dispatch(updateChest(getArmor(equipment.chest, 'chest') ?? null));
    dispatch(updateGauntlet(getArmor(equipment.gauntlet, 'arms') ?? null));
    dispatch(updateLeg(getArmor(equipment.leg, 'legs') ?? null));
    dispatch(updateGreatRune(getGreatRune(equipment.greatRune) ?? null));
    dispatch(updateSpiritAsh(getSpiritAsh(equipment.spiritAsh) ?? null));
    // The class first: the saved stats then go in as they are (an unknown class ID loads as none).
    dispatch(setStartingClass(getStartingClass(startingClass) ?? null));
    dispatch(setStats(stats));
  };

/** Character level from the stats. */
export const selectLevel = createSelector(selectStats, (stats) => calculateLevel(stats));

/** The editor state as build fields (what saving writes, with name/description/tags). */
export const selectBuildFields = createSelector(
  [
    selectStats,
    selectLevel,
    selectStartingClass,
    selectArrows,
    selectCons,
    selectTals,
    selectWeapons,
    selectWeaponAffinities,
    selectWeaponSkills,
    selectSpells,
    selectTears,
    selectHelm,
    selectLeg,
    selectChest,
    selectGauntlet,
    selectGreatRune,
    selectSpiritAsh,
  ],
  (
    stats,
    level,
    startingClass,
    arrows,
    cons,
    tals,
    weapons,
    weaponAffinities,
    weaponSkills,
    spells,
    tears,
    helm,
    leg,
    chest,
    gauntlet,
    greatRune,
    spiritAsh,
  ): BuildFields => ({
    level,
    stats,
    startingClass: startingClass?.id ?? null,
    equipment: {
      weapons,
      weaponAffinities,
      weaponSkills,
      arrows,
      talismans: tals,
      spells,
      tears,
      consumables: cons,
      helm: helm?.id ?? null,
      chest: chest?.id ?? null,
      gauntlet: gauntlet?.id ?? null,
      leg: leg?.id ?? null,
      greatRune: greatRune?.id ?? null,
      spiritAsh: spiritAsh?.id ?? null,
    },
  }),
);
