import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { getAsh, getWeapon } from '@/data';
import { SEPPUKU_ASH, UCHIGATANA } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import ItemRow, { type SlotEntry } from './ItemRow';

const weaponEntry: SlotEntry = {
  id: 'weapon1',
  type: 'SLOT_TYPE_WEAPON',
  item: getWeapon(UCHIGATANA)!,
  affinityId: 'weaponAffinity1',
  subId: 'weaponSkill1',
  affinity: 'blood',
  ash: getAsh(SEPPUKU_ASH)!,
};

describe('ItemRow', () => {
  it('read-only: the name and the affinity and skill as text, no button', () => {
    renderWithProviders(<ItemRow entry={weaponEntry} editable={false} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Uchigatana')).toBeInTheDocument();
    expect(screen.getByText('Blood · Seppuku')).toBeInTheDocument();
  });

  it('editable: a button named with the affinity and skill that opens the picker', async () => {
    const { user, store } = renderWithProviders(<ItemRow entry={weaponEntry} editable />);
    await user.click(
      screen.getByRole('button', { name: 'Change Uchigatana (Blood affinity, Seppuku skill)' }),
    );
    expect(store.getState().app).toEqual({
      slotType: 'SLOT_TYPE_WEAPON',
      editSlot: 'weapon1',
      editAffinitySlot: 'weaponAffinity1',
      editSubSlot: 'weaponSkill1',
    });
  });

  it('editable and empty: says what goes in the slot', () => {
    renderWithProviders(
      <ItemRow entry={{ id: 'tal1', type: 'SLOT_TYPE_TAL', item: null }} editable />,
    );
    expect(screen.getByRole('button', { name: 'Choose talisman' })).toHaveTextContent(
      'Choose talisman',
    );
  });
});
