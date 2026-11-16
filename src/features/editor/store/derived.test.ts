import { describe, expect, it } from 'vitest';
import { makeStore } from '@/app/store';
import { armor, spells, startingClasses, talismans, weapons } from '@/data';
import {
  selectEffectiveStats,
  selectEquipWeight,
  selectMemorySlots,
  selectMemoryUsed,
  selectPoise,
  selectRequirementChecks,
  selectRollType,
  selectSpellsOverSlots,
  selectStatBonuses,
  selectVitals,
} from './derived';
import { updateChest, updateHelm, updateTal, updateWeapon } from './equipment';
import { updateSpell } from './spells';
import { setStartingClass } from './startingClass';
import { setStats, updateStat } from './stats';

const byName = <T extends { name: string }>(items: T[], name: string) => {
  const item = items.find((entry) => entry.name === name);
  if (!item) throw new Error(`No "${name}" in the data`);
  return item;
};
const talisman = (name: string) => byName(talismans, name);
const spell = (name: string) => byName(spells, name);
const samurai = byName(startingClasses, 'Samurai');

describe('derived build numbers', () => {
  it('starts from the Wretch-like default: all 10s, nothing equipped', () => {
    const state = makeStore().getState();
    expect(selectVitals(state)).toEqual({ hp: 414, fp: 78, stamina: 96, equipLoad: 48.2 });
    expect(selectEquipWeight(state)).toBe(0);
    expect(selectRollType(state)).toBe('light');
    expect(selectPoise(state)).toBe(0);
    expect(selectMemorySlots(state)).toBe(10);
  });

  it("counts talisman stat bonuses (Radagon's Soreseal) in effective stats and vitals", () => {
    const store = makeStore();
    store.dispatch(updateTal({ id: 'tal1', item: talisman("Radagon's Soreseal") }));
    const state = store.getState();
    expect(selectStatBonuses(state)).toEqual({ vigor: 5, end: 5, str: 5, dex: 5 });
    expect(selectEffectiveStats(state)).toMatchObject({ vigor: 15, end: 15, str: 15, mind: 10 });
    expect(selectVitals(state)).toMatchObject({ hp: 522, stamina: 105, equipLoad: 56.1 });
  });

  it('sums the weight of weapons, armor and talismans and picks the roll type', () => {
    const store = makeStore();
    const greatsword = byName(weapons, 'Greatsword');
    const chest = byName(armor, 'Bull-Goat Armor');
    const helm = byName(armor, 'Bull-Goat Helm');
    const arsenal = talisman('Arsenal Charm');
    store.dispatch(updateWeapon({ id: 'weapon1', item: greatsword }));
    store.dispatch(updateChest(chest));
    store.dispatch(updateHelm(helm));
    store.dispatch(updateTal({ id: 'tal1', item: arsenal }));
    const state = store.getState();
    const weight =
      Math.round((greatsword.weight + chest.weight + helm.weight + arsenal.weight) * 10) / 10;
    expect(selectEquipWeight(state)).toBe(weight);
    // All 10s with Arsenal Charm: 48.18 × 1.15 = 55.4.
    expect(selectVitals(state).equipLoad).toBe(55.4);
    expect(selectRollType(state)).toBe('overloaded');
    store.dispatch(updateStat({ key: 'end', value: 99 }));
    expect(selectRollType(store.getState())).toBe(weight / 184 < 0.7 ? 'medium' : 'heavy');
  });

  it("sums armor poise; Bull-Goat's Talisman adds a third", () => {
    const store = makeStore();
    const chest = byName(armor, 'Bull-Goat Armor');
    store.dispatch(updateChest(chest));
    expect(selectPoise(store.getState())).toBe(Math.floor(chest.poise));
    store.dispatch(updateTal({ id: 'tal1', item: talisman("Bull-Goat's Talisman") }));
    expect(selectPoise(store.getState())).toBe(Math.floor(chest.poise / 0.75));
  });

  it('flags spells past the memory slots; Moon of Nokstella adds 2', () => {
    const store = makeStore();
    const comet = spell('Comet Azur'); // 3 memory slots
    const slots = ['spell1', 'spell2', 'spell3', 'spell4', 'spell5', 'spell6'] as const;
    slots.forEach((id) => store.dispatch(updateSpell({ id, item: comet })));
    const used = comet.slots * slots.length;
    expect(selectMemoryUsed(store.getState())).toBe(used);
    const over = (state = store.getState()) => [...selectSpellsOverSlots(state)];
    expect(over()).toEqual(slots.filter((_, i) => comet.slots * (i + 1) > 10));
    store.dispatch(updateTal({ id: 'tal1', item: talisman('Moon of Nokstella') }));
    expect(selectMemorySlots(store.getState())).toBe(12);
    expect(over()).toEqual(slots.filter((_, i) => comet.slots * (i + 1) > 12));
  });

  it('checks weapon and spell requirements against effective stats', () => {
    const store = makeStore();
    const uchigatana = byName(weapons, 'Uchigatana'); // Str 11, Dex 15
    store.dispatch(updateWeapon({ id: 'weapon1', item: uchigatana }));
    store.dispatch(updateSpell({ id: 'spell1', item: spell('Glintstone Pebble') }));
    expect(selectRequirementChecks(store.getState())).toEqual({
      weapon1: {
        status: 'unmet',
        missing: [
          { stat: 'str', required: uchigatana.requirements.str },
          { stat: 'dex', required: uchigatana.requirements.dex },
        ],
      },
      spell1: { status: 'met', missing: [] },
    });
    store.dispatch(updateTal({ id: 'tal1', item: talisman('Prosthesis-Wearer Heirloom') }));
    expect(selectRequirementChecks(store.getState()).weapon1?.status).toBe('two-handed');
  });
});

describe('starting class', () => {
  it('raises the stats below its base, and the stat inputs clamp to it', () => {
    const store = makeStore();
    store.dispatch(
      setStats({ vigor: 30, mind: 5, end: 10, str: 10, dex: 40, int: 10, fai: 10, arc: 10 }),
    );
    store.dispatch(setStartingClass(samurai));
    expect(store.getState().stats).toEqual({
      vigor: 30,
      mind: 11,
      end: 13,
      str: 12,
      dex: 40,
      int: 10,
      fai: 10,
      arc: 10,
    });
    store.dispatch(updateStat({ key: 'end', value: 3, min: samurai.stats.end }));
    expect(store.getState().stats.end).toBe(13);
    store.dispatch(setStartingClass(null));
    expect(store.getState().startingClass).toBeNull();
    expect(store.getState().stats.end).toBe(13);
  });
});
