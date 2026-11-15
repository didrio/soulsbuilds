import { describe, expect, it } from 'vitest';
import { makeStore } from '@/app/store';
import { getWeapon } from '@/data';
import { clearEditor, loadBuild, selectBuildFields, selectLevel, type BuildFields } from './build';
import { updateWeapon } from './equipment';

// Editor fields modelled on seed build SEEDBLEED001 (scripts/seed.mjs).
const bleed: BuildFields = {
  level: 131,
  stats: { vigor: 50, mind: 15, end: 25, str: 18, dex: 40, int: 9, fai: 8, arc: 45 },
  equipment: {
    weapons: ['Rivers of Blood', null, null, 'Uchigatana', null, null],
    weaponAffinities: [null, null, null, 'Blood', null, null],
    weaponSkills: [null, null, null, 'Seppuku', null, null],
    arrows: [null, null, null, null],
    talismans: ["Lord of Blood's Exultation", "Millicent's Prosthesis"],
    spells: [],
    tears: ['Crimson Crystal Tear'],
    consumables: [],
    helm: 'White Mask',
    chest: null,
    gauntlet: null,
    leg: null,
  },
};

describe('loadBuild / selectBuildFields', () => {
  it('round-trips a saved build through the editor state', () => {
    const store = makeStore();
    store.dispatch(loadBuild(bleed));
    expect(selectBuildFields(store.getState())).toEqual(bleed);
  });

  it('empties slots whose item names are not in the game data', () => {
    const store = makeStore();
    store.dispatch(
      loadBuild({
        ...bleed,
        equipment: { ...bleed.equipment, weapons: ['Renamed Sword'], helm: 'Old Hat' },
      }),
    );
    const { equipment } = selectBuildFields(store.getState());
    expect(equipment.weapons[0]).toBeNull();
    expect(equipment.helm).toBeNull();
  });

  it('ignores saved entries beyond the last slot', () => {
    const store = makeStore();
    const talismans = [
      'Godfrey Icon',
      'Shard of Alexander',
      "Erdtree's Favor",
      'Dragoncrest Shield Talisman',
      'Green Turtle Talisman',
    ];
    store.dispatch(loadBuild({ ...bleed, equipment: { ...bleed.equipment, talismans } }));
    expect(selectBuildFields(store.getState()).equipment.talismans).toEqual(talismans.slice(0, 4));
    expect(Object.keys(store.getState().equipment)).not.toContain('tal5');
  });

  it('replaces whatever was in the editor before', () => {
    const store = makeStore();
    store.dispatch(updateWeapon({ id: 'weapon2', item: getWeapon('Moonveil') ?? null }));
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
    store.dispatch(updateWeapon({ id: 'weapon2', item: getWeapon('Moonveil') ?? null }));
    store.dispatch(clearEditor());
    expect(selectBuildFields(store.getState())).toEqual(selectBuildFields(makeStore().getState()));
  });
});
