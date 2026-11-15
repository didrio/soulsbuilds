// Moving a whole v1 build between Firestore and the editor state: `loadBuild` puts a saved build
// into the slots, `selectBuildFields` reads the slots back as the fields a build document stores.
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
import type { BuildDoc } from '@/lib/models';
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
import {
  clearStats,
  updateArc,
  updateDex,
  updateEnd,
  updateFai,
  updateInt,
  updateMind,
  updateStr,
  updateVigor,
} from './stats';
import { clearTears, updateTear } from './tears';

type AppThunk = ThunkAction<void, RootState, unknown, UnknownAction>;

/** The build fields that live in the editor's Redux state. */
export type BuildFields = Omit<
  BuildDoc,
  'user' | 'name' | 'description' | 'tags' | 'likes' | 'comments'
>;

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
 * fill slots in order; entries beyond the last slot are ignored.
 */
export const loadBuild =
  (build: BuildFields): AppThunk =>
  (dispatch) => {
    const {
      arrows = [],
      cons = [],
      tals = [],
      spells = [],
      tears = [],
      weapons = [],
      weaponAffinities = [],
      weaponSkills = [],
    } = build;
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
    dispatch(updateHelm(getArmor('helms', build.helm) ?? null));
    dispatch(updateLeg(getArmor('legs', build.leg) ?? null));
    dispatch(updateChest(getArmor('chests', build.chest) ?? null));
    dispatch(updateGauntlet(getArmor('gauntlets', build.gauntlet) ?? null));
    // v1 stats are numbers or numeric strings (unvalidated: a missing one gives level NaN, as in 2022).
    dispatch(updateArc(build.arc));
    dispatch(updateDex(build.dex));
    dispatch(updateEnd(build.end));
    dispatch(updateFai(build.fai));
    dispatch(updateInt(build.int));
    dispatch(updateMind(build.mind));
    dispatch(updateStr(build.str));
    dispatch(updateVigor(build.vigor));
  };

/** Character level as v1 stores it (a string). */
export const selectLevel = createSelector(selectStats, (stats) => String(calculateLevel(stats)));

/** The editor state as build document fields (what `handleSave` writes). */
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
    arrows,
    cons,
    tals,
    weapons,
    weaponAffinities,
    weaponSkills,
    spells,
    tears,
    ...stats,
    helm: helm?.name ?? null,
    leg: leg?.name ?? null,
    chest: chest?.name ?? null,
    gauntlet: gauntlet?.name ?? null,
  }),
);
