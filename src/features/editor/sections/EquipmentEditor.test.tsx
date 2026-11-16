import { act, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { talismans } from '@/data';
import { EditorWithPicker, searchItems } from '@/test/editor';
import { renderWithProviders } from '@/test/render';
import { updateTal } from '../store/equipment';
import EquipmentEditor from './EquipmentEditor';

describe('EquipmentEditor + item picker', () => {
  // Slow in jsdom: the weapon list (487 rows) re-renders on every step.
  it(
    'chooses a weapon, then its Ash of War and affinity, and removes it',
    { timeout: 15000 },
    async () => {
      const { user, store } = renderWithProviders(<EditorWithPicker />);

      await user.click(screen.getAllByRole('button', { name: 'Choose weapon' })[0]!);
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

  it('read-only: only filled slots, as text, and only the groups that have one', () => {
    const { store } = renderWithProviders(<EquipmentEditor editable={false} />);
    const favor = talismans.find(({ name }) => name === "Erdtree's Favor")!;
    act(() => store.dispatch(updateTal({ id: 'tal2', item: favor })));
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Talismans' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText("Erdtree's Favor")).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Consumables' })).not.toBeInTheDocument();
  });

  it('read-only and empty: says so', () => {
    renderWithProviders(<EquipmentEditor editable={false} />);
    expect(screen.getByText('No equipment yet.')).toBeInTheDocument();
  });
});
