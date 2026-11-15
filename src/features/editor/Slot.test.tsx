import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { getWeapon } from '@/data';
import { renderWithProviders } from '@/test/render';
import Slot from './Slot';

const uchigatana = getWeapon('Uchigatana')!;

describe('Slot', () => {
  it('view mode: the affinity and skill badges toggle their details on tap or keyboard', async () => {
    const { user } = renderWithProviders(
      <Slot
        disabled
        item={uchigatana}
        affinity="Blood"
        subItem="Seppuku"
        type="SLOT_TYPE_WEAPON"
      />,
    );
    const skill = screen.getByRole('button', { name: 'Skill: Seppuku' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    await user.click(skill);
    expect(skill).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('tooltip')).toHaveTextContent('Seppuku');
    await user.click(skill);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    screen.getByRole('button', { name: 'Affinity: Blood' }).focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('tooltip')).toHaveTextContent('Blood');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('mouse hover still shows the details; touch pointers wait for the tap', () => {
    renderWithProviders(
      <Slot disabled item={uchigatana} affinity="Blood" type="SLOT_TYPE_WEAPON" />,
    );
    const badge = screen.getByRole('button', { name: 'Affinity: Blood' });
    fireEvent.pointerEnter(badge, { pointerType: 'touch' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    fireEvent.pointerEnter(badge, { pointerType: 'mouse' });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.pointerLeave(badge, { pointerType: 'mouse' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('edit mode: one button per slot, named with its affinity and skill', () => {
    renderWithProviders(
      <Slot
        id="weapon1"
        item={uchigatana}
        affinity="Blood"
        subItem="Seppuku"
        type="SLOT_TYPE_WEAPON"
      />,
    );
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(
      screen.getByRole('button', { name: 'Change Uchigatana (Blood affinity, Seppuku skill)' }),
    ).toBeInTheDocument();
  });
});
