import { act, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { talismans } from '@/data';
import { renderWithProviders } from '@/test/render';
import { updateTal } from '../store/equipment';
import StatEditor from './StatEditor';

describe('StatEditor', () => {
  it('accepts digits only and clamps stats to 1–99', async () => {
    const { user, store } = renderWithProviders(<StatEditor editable level={1} />);
    const vigor = screen.getByLabelText('Vigor');

    await user.clear(vigor);
    await user.type(vigor, 'abc');
    expect(vigor).toHaveValue('');
    expect(store.getState().stats.vigor).toBe(10);

    await user.type(vigor, '0');
    expect(store.getState().stats.vigor).toBe(1);

    await user.clear(vigor);
    await user.type(vigor, '150');
    expect(vigor).toHaveValue('15');
    expect(store.getState().stats.vigor).toBe(15);
  });

  it('shows the stored value again after an emptied field loses focus', async () => {
    const { user } = renderWithProviders(<StatEditor editable level={1} />);
    const mind = screen.getByLabelText('Mind');
    await user.clear(mind);
    await user.tab();
    expect(mind).toHaveValue('10');
  });

  it('a starting class raises the stats to its base, and no stat goes below it', async () => {
    const { user, store } = renderWithProviders(<StatEditor editable level={1} />);
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Starting class' }),
      'Samurai · level 9',
    );
    expect(store.getState().startingClass?.name).toBe('Samurai');
    expect(store.getState().stats).toMatchObject({ vigor: 12, end: 13, dex: 15, int: 10 });

    const dex = screen.getByLabelText('Dexterity');
    await user.clear(dex);
    await user.type(dex, '9');
    expect(store.getState().stats.dex).toBe(15);
    await user.tab();
    expect(dex).toHaveValue('15');
  });

  it('shows the starting class and talisman bonuses when read-only', () => {
    const { store } = renderWithProviders(<StatEditor editable={false} level={1} />);
    expect(screen.queryByText(/Starting class/)).not.toBeInTheDocument();
    const heirloom = talismans.find((t) => t.name === 'Starscourge Heirloom') ?? null;
    act(() => {
      store.dispatch(updateTal({ id: 'tal1', item: heirloom }));
    });
    expect(screen.getByText('Strength', { exact: false })).toHaveTextContent(
      'Strength +5 from talismans',
    );
  });
});
