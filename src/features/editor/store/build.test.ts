import { describe, expect, it } from 'vitest';
import { makeStore } from '@/app/store';
import { getWeapon } from '@/data';
import {
  GODRICKS_GREAT_RUNE,
  MOONVEIL,
  SEPPUKU_ASH,
  UCHIGATANA,
  WHITE_MASK,
} from '@/test/fixtures';
import { clearEditor, loadBuild, selectBuildFields, selectLevel, type BuildFields } from './build';
import { updateWeapon } from './equipment';

const RIVERS_OF_BLOOD = 9040000;
const LORD_OF_BLOODS_EXULTATION = 2160;
const MILLICENTS_PROSTHESIS = 1250;
const CRIMSON_CRYSTAL_TEAR = 11002;

// Editor fields modelled on seed build SEEDBLEED001 (scripts/seed.mjs).
const bleed: BuildFields = {
  level: 131,
  stats: { vigor: 50, mind: 15, end: 25, str: 18, dex: 40, int: 9, fai: 8, arc: 45 },
  startingClass: 3007, // Samurai
  equipment: {
    weapons: [RIVERS_OF_BLOOD, null, null, UCHIGATANA, null, null],
    weaponAffinities: [null, null, null, 'blood', null, null],
    weaponSkills: [null, null, null, SEPPUKU_ASH, null, null],
    arrows: [null, null, null, null],
    talismans: [LORD_OF_BLOODS_EXULTATION, MILLICENTS_PROSTHESIS],
    spells: [],
    tears: [CRIMSON_CRYSTAL_TEAR],
    consumables: [],
    helm: WHITE_MASK,
    chest: null,
    gauntlet: null,
    leg: null,
    greatRune: GODRICKS_GREAT_RUNE,
    spiritAsh: null,
  },
};

describe('loadBuild / selectBuildFields', () => {
  it('round-trips a saved build through the editor state', () => {
    const store = makeStore();
    store.dispatch(loadBuild(bleed));
    expect(selectBuildFields(store.getState())).toEqual(bleed);
  });

  it('loads an unknown starting class as none, and keeps the saved stats as they are', () => {
    const store = makeStore();
    store.dispatch(loadBuild({ ...bleed, startingClass: 42 }));
    expect(selectBuildFields(store.getState())).toMatchObject({
      startingClass: null,
      stats: bleed.stats,
    });
  });

  it('empties slots whose IDs are not in the game data, or hold armor for another slot', () => {
    const store = makeStore();
    store.dispatch(
      loadBuild({
        ...bleed,
        equipment: { ...bleed.equipment, weapons: [123], helm: null, chest: WHITE_MASK },
      }),
    );
    const { equipment } = selectBuildFields(store.getState());
    expect(equipment.weapons[0]).toBeNull();
    expect(equipment.chest).toBeNull();
  });

  it("drops an Ash of War or affinity the weapon can't have", () => {
    const store = makeStore();
    const weaponSkills = [SEPPUKU_ASH, null, null, SEPPUKU_ASH, null, null];
    const weaponAffinities = ['cold' as const, null, null, 'fire' as const, null, null];
    store.dispatch(
      loadBuild({ ...bleed, equipment: { ...bleed.equipment, weaponSkills, weaponAffinities } }),
    );
    const { equipment } = selectBuildFields(store.getState());
    // Rivers of Blood takes no Ashes; Seppuku on the Uchigatana allows no Fire.
    expect(equipment.weaponSkills).toEqual([null, null, null, SEPPUKU_ASH, null, null]);
    expect(equipment.weaponAffinities).toEqual([null, null, null, null, null, null]);
  });

  it('ignores saved entries beyond the last slot', () => {
    const store = makeStore();
    const talismans = [3090, 1231, 1040, 4000, 1150];
    store.dispatch(loadBuild({ ...bleed, equipment: { ...bleed.equipment, talismans } }));
    expect(selectBuildFields(store.getState()).equipment.talismans).toEqual(talismans.slice(0, 4));
    expect(Object.keys(store.getState().equipment)).not.toContain('tal5');
  });

  it('replaces whatever was in the editor before', () => {
    const store = makeStore();
    store.dispatch(updateWeapon({ id: 'weapon2', item: getWeapon(MOONVEIL) ?? null }));
    store.dispatch(loadBuild(bleed));
    expect(selectBuildFields(store.getState())).toEqual(bleed);
  });

  it('computes the level from the stats', () => {
    const store = makeStore();
    expect(selectLevel(store.getState())).toBe(1);
    store.dispatch(loadBuild(bleed));
    expect(selectLevel(store.getState())).toBe(131);
  });

  it('clamps out-of-range stats when loading', () => {
    const store = makeStore();
    store.dispatch(loadBuild({ ...bleed, stats: { ...bleed.stats, vigor: 150, mind: 0 } }));
    expect(store.getState().stats).toMatchObject({ vigor: 99, mind: 1 });
  });

  it('clearEditor empties every slot and resets stats to 10', () => {
    const store = makeStore();
    store.dispatch(loadBuild(bleed));
    store.dispatch(updateWeapon({ id: 'weapon2', item: getWeapon(MOONVEIL) ?? null }));
    store.dispatch(clearEditor());
    expect(selectBuildFields(store.getState())).toEqual(selectBuildFields(makeStore().getState()));
  });
});
