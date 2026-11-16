import { act, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { spells, talismans, weapons } from '@/data';
import { EditorWithPicker, searchItems } from '@/test/editor';
import { renderWithProviders } from '@/test/render';
import { updateTal, updateWeapon } from '../store/equipment';
import { updateSpell } from '../store/spells';
import { updateStat } from '../store/stats';
import Loadout from './Loadout';

const spell = (name: string) => spells.find((entry) => entry.name === name) ?? null;
const talisman = (name: string) => talismans.find((entry) => entry.name === name) ?? null;
const group = (name: string) => screen.getByRole('list', { name });

describe('Loadout + item picker', () => {
  // Slow in jsdom: the weapon list (487 rows) re-renders on every step.
  it(
    'chooses a weapon, then its Ash of War and affinity, and removes it',
    { timeout: 15000 },
    async () => {
      const { user, store } = renderWithProviders(<EditorWithPicker />);

      // The right hand's first slot is weapon1 (the left hand is shown first).
      await user.click(within(group('Right hand')).getAllByRole('button')[0]!);
      await searchItems(user, 'Uchigatana');
      await user.click(screen.getByRole('button', { name: /^Uchigatana/ }));
      expect(store.getState().equipment.weapon1?.name).toBe('Uchigatana');

      // A weapon with Ashes to choose stays in the picker, on its Ash of War and affinity step.
      expect(screen.getByRole('dialog', { name: 'Ash of War and affinity' })).toBeInTheDocument();
      await user.selectOptions(screen.getByRole('combobox', { name: 'Ash of War' }), 'Seppuku');
      await user.selectOptions(screen.getByRole('combobox', { name: 'Affinity' }), 'Blood');
      await user.click(screen.getByRole('button', { name: 'Done' }));
      expect(store.getState().equipment).toMatchObject({
        weaponSkill1: expect.objectContaining({ name: 'Ash of War: Seppuku' }),
        weaponAffinity1: 'blood',
      });

      // The row shows and names the affinity, skill and unmet requirements (all stats are 10); a
      // filled weapon slot opens on that step.
      const row = screen.getByRole('button', {
        name: 'Change Uchigatana (Blood affinity, Seppuku skill, Needs 11 Str, 15 Dex)',
      });
      expect(row).toHaveTextContent('Blood · Seppuku');
      expect(row).toHaveTextContent('Needs 11 Str, 15 Dex');
      await user.click(row);
      await user.click(screen.getByRole('button', { name: 'Change weapon' }));
      // Remove empties the slot and drops its Ash and affinity.
      await user.click(screen.getByRole('button', { name: 'Remove Uchigatana' }));
      expect(store.getState().equipment).toMatchObject({
        weapon1: null,
        weaponSkill1: null,
        weaponAffinity1: null,
      });
      expect(screen.queryByRole('button', { name: /^Change Uchigatana/ })).not.toBeInTheDocument();
    },
  );

  it('shows the consumables and one empty slot to add the next', async () => {
    const { user, store } = renderWithProviders(<EditorWithPicker />);
    expect(screen.getByRole('heading', { name: 'Consumables' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Choose item' })).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Choose item' }));
    await searchItems(user, 'Acid Spraymist');
    await user.click(screen.getByRole('button', { name: /^Acid Spraymist/ }));
    expect(store.getState().equipment.con1?.name).toBe('Acid Spraymist');
    expect(screen.getByRole('button', { name: 'Change Acid Spraymist' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Choose item' }));
    await searchItems(user, 'Boiled Crab');
    await user.click(screen.getByRole('button', { name: /^Boiled Crab/ }));
    expect(store.getState().equipment.con2?.name).toBe('Boiled Crab');
  });

  it('has a great rune and a spirit ash slot', async () => {
    const { user, store } = renderWithProviders(<EditorWithPicker />);
    await user.click(screen.getByRole('button', { name: 'Choose great rune' }));
    await user.click(screen.getByRole('button', { name: /^Malenia's Great Rune/ }));
    await user.click(screen.getByRole('button', { name: 'Choose spirit ash' }));
    await searchItems(user, 'Mimic');
    await user.click(screen.getByRole('button', { name: /^Mimic Tear Ashes/ }));
    expect(store.getState().equipment.greatRune?.name).toBe("Malenia's Great Rune");
    expect(store.getState().equipment.spiritAsh?.name).toBe('Mimic Tear Ashes');
  });
});

describe('Loadout', () => {
  it('read-only: every slot shows, empty ones as placeholders; items by name', () => {
    const { store } = renderWithProviders(<Loadout editable={false} />);
    act(() => store.dispatch(updateTal({ id: 'tal2', item: talisman("Erdtree's Favor") })));

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    // No weapons: no hands at all. Four armor and talisman slots; two tears.
    expect(screen.queryByRole('heading', { name: /hand$/ })).not.toBeInTheDocument();
    expect(within(group('Armor')).getAllByRole('listitem')).toHaveLength(4);
    expect(within(group('Flask of Wondrous Physick')).getAllByRole('listitem')).toHaveLength(2);
    expect(within(group('Great rune and spirit ash')).getAllByRole('listitem')).toHaveLength(2);
    const talismanList = within(group('Talismans')).getAllByRole('listitem');
    expect(talismanList.map((item) => item.textContent)).toEqual([
      'No talisman',
      "Erdtree's Favor",
      'No talisman',
      'No talisman',
    ]);
    expect(screen.getByText('1 item · 0 spells')).toBeInTheDocument();
  });

  it('read-only: weapon rows hide when both hands are empty, one-handed rows keep the placeholder', () => {
    const { store } = renderWithProviders(<Loadout editable={false} />);
    const weapon = (name: string) => weapons.find((entry) => entry.name === name) ?? null;
    // weapon1 = right hand 1, weapon4 = left hand 1: one row with both hands.
    act(() => {
      store.dispatch(updateWeapon({ id: 'weapon1', item: weapon('Uchigatana') }));
      store.dispatch(updateWeapon({ id: 'weapon4', item: weapon('Dagger') }));
    });
    expect(screen.getAllByRole('heading', { name: /hand$/ }).map((h) => h.textContent)).toEqual([
      'Left hand',
      'Right hand',
    ]);
    expect(within(group('Left hand')).getAllByRole('listitem')).toHaveLength(1);
    expect(within(group('Right hand')).getAllByRole('listitem')).toHaveLength(1);

    // Slot 3 right hand only: a second row, with a placeholder on the left.
    act(() => store.dispatch(updateWeapon({ id: 'weapon3', item: weapon('Uchigatana') })));
    expect(within(group('Left hand')).getAllByRole('listitem')).toHaveLength(2);
    expect(within(group('Right hand')).getAllByRole('listitem')).toHaveLength(2);
    expect(within(group('Left hand')).getAllByRole('listitem')[1]).toHaveTextContent('No weapon');
  });

  it('read-only: arrows and consumables only when the build has some', () => {
    renderWithProviders(<Loadout editable={false} />);
    expect(screen.queryByRole('heading', { name: 'Arrows and bolts' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Consumables' })).not.toBeInTheDocument();
    expect(screen.getByText('No items yet')).toBeInTheDocument();
  });

  it('editable: every slot is a picker button, "Choose …" when empty', async () => {
    const { user, store } = renderWithProviders(<Loadout editable />);
    expect(screen.getAllByRole('button', { name: 'Choose weapon' })).toHaveLength(6);
    expect(screen.getAllByRole('button', { name: 'Choose talisman' })).toHaveLength(4);
    expect(screen.getAllByRole('button', { name: 'Choose arrow or bolt' })).toHaveLength(4);
    await user.click(screen.getByRole('button', { name: 'Choose helm' }));
    expect(store.getState().app).toMatchObject({ slotType: 'SLOT_TYPE_HELM', editSlot: 'helm' });
  });

  it('spells: hidden without any; then one cell per spell, no placeholders', () => {
    const { store } = renderWithProviders(<Loadout editable={false} />);
    const cells = () => within(group('Spells')).getAllByRole('listitem');
    expect(screen.queryByRole('heading', { name: 'Spells' })).not.toBeInTheDocument();

    act(() => {
      store.dispatch(updateSpell({ id: 'spell1', item: spell("Rennala's Full Moon") })); // 2 slots
      store.dispatch(updateSpell({ id: 'spell2', item: spell('Glintstone Pebble') })); // 1 slot
    });
    expect(cells()).toHaveLength(2);
    expect(screen.getByText(/of 10 memory slots/)).toHaveTextContent('3 of 10 memory slots');
    expect(screen.getByText('0 items · 2 spells')).toBeInTheDocument();
  });

  it('spells, editable: the filled ones and one "Choose spell"', () => {
    const { store } = renderWithProviders(<Loadout editable />);
    act(() => {
      store.dispatch(updateSpell({ id: 'spell1', item: spell('Glintstone Pebble') }));
    });
    expect(screen.getByRole('button', { name: 'Change Glintstone Pebble' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Choose spell' })).toHaveLength(1);
    // 1 spell + "Choose spell" + 8 free slots.
    expect(within(group('Spells')).getAllByRole('listitem')).toHaveLength(10);
  });

  it('spells: flags unmet requirements and spells past the memory slots', () => {
    const { store } = renderWithProviders(<Loadout editable={false} />);
    const comet = spell('Comet Azur'); // 3 slots, Int 60
    act(() => {
      for (const id of ['spell1', 'spell2', 'spell3', 'spell4'] as const)
        store.dispatch(updateSpell({ id, item: comet }));
    });
    expect(screen.getByText(/memory slots/)).toHaveTextContent('12 of 10 memory slots');
    expect(screen.getAllByText('Needs 60 Int')).toHaveLength(4);

    act(() => {
      store.dispatch(updateStat({ key: 'int', value: 60 }));
    });
    expect(screen.getAllByText('Over the memory slots')).toHaveLength(1);

    act(() => {
      store.dispatch(updateTal({ id: 'tal1', item: talisman('Moon of Nokstella') }));
    });
    expect(screen.getByText(/memory slots/)).toHaveTextContent('12 of 12 memory slots');
    expect(screen.queryByText('Over the memory slots')).not.toBeInTheDocument();
  });
});
