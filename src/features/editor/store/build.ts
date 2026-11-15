// Moving a whole build between Firestore (model v2) and the editor state: `loadBuild` puts a saved
// build's stats and equipment into the slots, `selectBuildFields` reads the slots back.
import { createSelector, type ThunkAction, type UnknownAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import {
  getArmor,
  getArrow,
  getConsumable,
  getSpell,
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
  updateHelm,
  updateLeg,
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
  selectHelm,
  selectLeg,
  selectSpells,
  selectStats,
  selectTals,
  selectTears,
  selectWeaponAffinities,
  selectWeapons,
  selectWeaponSkills,
} from './selectors';
import { clearSpells, updateSpell } from './spells';
import { clearStats, setStats } from './stats';
import { clearTears, updateTear } from './tears';

type AppThunk = ThunkAction<void, RootState, unknown, UnknownAction>;

/** The build fields that live in the editor's Redux state. */
export type BuildFields = Pick<BuildContent, 'level' | 'stats' | 'equipment'>;

/** Empties the editor: no items, all stats 10, picker closed. */
export const clearEditor = (): AppThunk => (dispatch) => {
  dispatch(clearApp());
  dispatch(clearEquipment());
  dispatch(clearSpells());
  dispatch(clearStats());
  dispatch(clearTears());
};

/**
 * Puts a saved build into the editor slots, looking each item up by name. Names that aren't in the
 * game data leave the slot empty (and are dropped on the next save; T7 moves to IDs). Saved arrays
 * fill slots in order; entries beyond the last slot are ignored. Starts from an empty editor.
 */
export const loadBuild =
  ({ stats, equipment }: Pick<BuildFields, 'stats' | 'equipment'>): AppThunk =>
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
    WEAPON_AFFINITY_SLOTS.forEach((id, i) => {
      if (i < weaponAffinities.length)
        dispatch(updateWeaponAffinity({ id, item: weaponAffinities[i] ?? null }));
    });
    WEAPON_SKILL_SLOTS.forEach((id, i) => {
      if (i < weaponSkills.length)
        dispatch(updateWeaponSkill({ id, item: weaponSkills[i] ?? null }));
    });
    dispatch(updateHelm(getArmor('helms', equipment.helm) ?? null));
    dispatch(updateLeg(getArmor('legs', equipment.leg) ?? null));
    dispatch(updateChest(getArmor('chests', equipment.chest) ?? null));
    dispatch(updateGauntlet(getArmor('gauntlets', equipment.gauntlet) ?? null));
    dispatch(setStats(stats));
  };

/** Character level from the stats. */
export const selectLevel = createSelector(selectStats, (stats) => calculateLevel(stats));

/** The editor state as build fields (what saving writes, with name/description/tags). */
export const selectBuildFields = createSelector(
  [
    selectStats,
    selectLevel,
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
  ],
  (
    stats,
    level,
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
  ): BuildFields => ({
    level,
    stats,
    equipment: {
      weapons,
      weaponAffinities,
      weaponSkills,
      arrows,
      talismans: tals,
      spells,
      tears,
      consumables: cons,
      helm: helm?.name ?? null,
      chest: chest?.name ?? null,
      gauntlet: gauntlet?.name ?? null,
      leg: leg?.name ?? null,
    },
  }),
);
