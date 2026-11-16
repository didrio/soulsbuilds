import { act, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { spells, talismans } from '@/data';
import { renderWithProviders } from '@/test/render';
import { updateTal } from '../store/equipment';
import { updateSpell } from '../store/spells';
import { updateStat } from '../store/stats';
import SpellEditor from './SpellEditor';

const spell = (name: string) => spells.find((entry) => entry.name === name) ?? null;

describe('SpellEditor', () => {
  it('counts memory slots, flags unmet requirements and spells past the slots', () => {
    const { store } = renderWithProviders(<SpellEditor editable={false} />);
    const comet = spell('Comet Azur'); // 3 slots, Int 60
    act(() => {
      for (const id of ['spell1', 'spell2', 'spell3', 'spell4'] as const)
        store.dispatch(updateSpell({ id, item: comet }));
    });
    expect(screen.getByText('12 of 10 memory slots used')).toBeInTheDocument();
    expect(screen.getAllByText('Needs 60 Int')).toHaveLength(4);

    act(() => {
      store.dispatch(updateStat({ key: 'int', value: 60 }));
    });
    expect(screen.getAllByText('Over the memory slots')).toHaveLength(1);

    const nokstella = talismans.find((t) => t.name === 'Moon of Nokstella') ?? null;
    act(() => {
      store.dispatch(updateTal({ id: 'tal1', item: nokstella }));
    });
    expect(screen.getByText('12 of 12 memory slots used')).toBeInTheDocument();
    expect(screen.queryByText('Over the memory slots')).not.toBeInTheDocument();
  });
});
