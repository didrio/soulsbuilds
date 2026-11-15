import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAppSelector } from '@/app/hooks';
import { renderWithProviders } from '@/test/render';
import ItemSelector from '../ItemSelector';
import { selectSlotType } from '../store/selectors';
import EquipmentEditor from './EquipmentEditor';

/** The editor plus the picker modal, as App renders it (open while a slot type is set). */
function EditorWithPicker() {
  const open = useAppSelector(selectSlotType) !== null;
  return (
    <>
      <EquipmentEditor editable />
      {open ? <ItemSelector /> : null}
    </>
  );
}

describe('EquipmentEditor + item picker', () => {
  it('chooses, changes in place and removes a weapon', async () => {
    const { user, store } = renderWithProviders(<EditorWithPicker />);

    await user.click(screen.getAllByRole('button', { name: 'Choose weapon' })[0]!);
    await user.type(screen.getByLabelText('Search items'), 'Moonveil');
    await user.click(screen.getByRole('button', { name: /^Moonveil/ }));
    expect(store.getState().equipment.weapon1?.name).toBe('Moonveil');

    // A filled slot opens the picker (it used to delete the weapon): change its affinity.
    await user.click(screen.getByRole('button', { name: 'Change Moonveil' }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Affinity' }), 'Heavy');
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(store.getState().equipment).toMatchObject({
      weapon1: expect.objectContaining({ name: 'Moonveil' }),
      weaponAffinity1: 'Heavy',
    });

    // Remove empties the slot and drops its affinity.
    await user.click(screen.getByRole('button', { name: 'Change Moonveil' }));
    await user.click(screen.getByRole('button', { name: 'Remove Moonveil' }));
    expect(store.getState().equipment).toMatchObject({ weapon1: null, weaponAffinity1: null });
    expect(screen.queryByRole('button', { name: 'Change Moonveil' })).not.toBeInTheDocument();
  });

  it('read-only slots are not buttons', () => {
    renderWithProviders(<EquipmentEditor editable={false} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
