import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
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
});
