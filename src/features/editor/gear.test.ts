import { describe, expect, it } from 'vitest';
import { makeStore } from '@/app/store';
import { arrows, spells, talismans, weapons } from '@/data';
import { gearGroups } from './gear';
import { selectGearState } from './store/derived';
import { updateArrow, updateTal, updateWeapon } from './store/equipment';
import { updateSpell } from './store/spells';
import { updateStat } from './store/stats';

const byName = <T extends { name: string }>(items: T[], name: string) => {
  const item = items.find((entry) => entry.name === name);
  if (!item) throw new Error(`No "${name}" in the data`);
  return item;
};

const setup = () => {
  const store = makeStore();
  const groups = (editable: boolean) => gearGroups(selectGearState(store.getState()), editable);
  const names = (editable: boolean, key: string) =>
    groups(editable)
      .find((group) => group.key === key)
      ?.entries.map((entry) => entry.item?.name ?? null);
  return { store, groups, names };
};

describe('gearGroups, read-only', () => {
  it('has no groups for a build without gear', () => {
    expect(setup().groups(false)).toEqual([]);
  });

  it('lists filled slots only, leaving out empty groups', () => {
    const { store, groups, names } = setup();
    store.dispatch(updateTal({ id: 'tal3', item: byName(talismans, "Erdtree's Favor") }));
    expect(groups(false).map((group) => group.title)).toEqual(['Talismans']);
    expect(names(false, 'talismans')).toEqual(["Erdtree's Favor"]);
  });

  it('puts the right hand first, then the left, then arrows', () => {
    const { store, names } = setup();
    store.dispatch(updateWeapon({ id: 'weapon4', item: byName(weapons, 'Dagger') }));
    store.dispatch(updateWeapon({ id: 'weapon1', item: byName(weapons, 'Uchigatana') }));
    store.dispatch(updateArrow({ id: 'arrow1', item: byName(arrows, 'Arrow') }));
    expect(names(false, 'armaments')).toEqual(['Uchigatana', 'Dagger', 'Arrow']);
  });

  it('counts memory slots and flags unmet requirements and spells past the slots', () => {
    const { store, groups } = setup();
    const comet = byName(spells, 'Comet Azur'); // 3 slots, Int 60
    for (const id of ['spell1', 'spell2', 'spell3', 'spell4'] as const)
      store.dispatch(updateSpell({ id, item: comet }));
    const spellGroup = () => groups(false).find((group) => group.key === 'spells')!;
    expect(spellGroup().memory).toEqual({ used: 12, available: 10 });
    expect(spellGroup().entries.map((entry) => entry.warning?.text)).toEqual(
      Array(4).fill('Needs 60 Int'),
    );

    store.dispatch(updateStat({ key: 'int', value: 60 }));
    expect(spellGroup().entries.map((entry) => entry.warning?.text ?? null)).toEqual([
      null,
      null,
      null,
      'Over the memory slots',
    ]);
  });
});

describe('gearGroups, editable', () => {
  it('has every slot, each hand and the arrows on their own', () => {
    const { groups } = setup();
    const sizes = Object.fromEntries(
      groups(true).map((group) => [group.title, group.entries.length]),
    );
    expect(sizes).toEqual({
      'Right hand': 3,
      'Left hand': 3,
      'Arrows and bolts': 4,
      Armor: 4,
      Talismans: 4,
      Spells: 1,
      'Tears, rune and ash': 4,
      Items: 1,
    });
  });

  it('shows the filled spells and items plus one to choose next', () => {
    const { store, names } = setup();
    store.dispatch(updateSpell({ id: 'spell1', item: byName(spells, 'Glintstone Pebble') }));
    expect(names(true, 'spells')).toEqual(['Glintstone Pebble', null]);
    expect(names(true, 'items')).toEqual([null]);
  });

  it('offers no spell slot once the memory slots are full', () => {
    const { store, names } = setup();
    const comet = byName(spells, 'Comet Azur'); // 3 slots: 4 of them fill (and pass) 10
    for (const id of ['spell1', 'spell2', 'spell3', 'spell4'] as const)
      store.dispatch(updateSpell({ id, item: comet }));
    expect(names(true, 'spells')).toEqual(Array(4).fill('Comet Azur'));
  });
});
