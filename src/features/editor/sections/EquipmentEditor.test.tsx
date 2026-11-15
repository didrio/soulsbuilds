import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EditorWithPicker, searchItems } from '@/test/editor';
import { renderWithProviders } from '@/test/render';
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

      // A filled slot opens the picker (it used to delete the weapon): choose its Ash and affinity.
      await user.click(screen.getByRole('button', { name: 'Change Uchigatana (Unsheathe skill)' }));
      await user.selectOptions(screen.getByRole('combobox', { name: 'Ash of War' }), 'Seppuku');
      await user.selectOptions(screen.getByRole('combobox', { name: 'Affinity' }), 'Blood');
      await user.click(screen.getByRole('button', { name: 'Close' }));
      expect(store.getState().equipment).toMatchObject({
        weaponSkill1: expect.objectContaining({ name: 'Ash of War: Seppuku' }),
        weaponAffinity1: 'blood',
      });

      // The slot's name includes the affinity and skill (the badges are hover-only in edit mode).
      // Remove empties the slot and drops its Ash and affinity.
      await user.click(
        screen.getByRole('button', { name: 'Change Uchigatana (Blood affinity, Seppuku skill)' }),
      );
      await user.click(screen.getByRole('button', { name: 'Remove Uchigatana' }));
      expect(store.getState().equipment).toMatchObject({
        weapon1: null,
        weaponSkill1: null,
        weaponAffinity1: null,
      });
      expect(screen.queryByRole('button', { name: /^Change Uchigatana/ })).not.toBeInTheDocument();
    },
  );

  it('has ten consumable slots and fills one from the picker', async () => {
    const { user, store } = renderWithProviders(<EditorWithPicker />);
    expect(screen.getByRole('heading', { name: 'Consumables' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Choose item' })).toHaveLength(10);

    await user.click(screen.getAllByRole('button', { name: 'Choose item' })[0]!);
    await searchItems(user, 'Acid Spraymist');
    await user.click(screen.getByRole('button', { name: /^Acid Spraymist/ }));
    expect(store.getState().equipment.con1?.name).toBe('Acid Spraymist');
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

  it('read-only slots are not buttons', () => {
    renderWithProviders(<EquipmentEditor editable={false} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
