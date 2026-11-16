import { act, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { armor, talismans } from '@/data';
import { renderWithProviders } from '@/test/render';
import { updateChest, updateTal } from '../store/equipment';
import CharacterStats from './CharacterStats';

const value = (term: string) =>
  within(screen.getByText(term, { selector: 'dt' }).parentElement!).getByRole('definition');

describe('CharacterStats', () => {
  it('shows HP, FP, stamina, equip load with the roll type, and poise', () => {
    const { store } = renderWithProviders(<CharacterStats />);
    expect(value('HP')).toHaveTextContent('414');
    expect(value('FP')).toHaveTextContent('78');
    expect(value('Stamina')).toHaveTextContent('96');
    expect(value('Equip load')).toHaveTextContent('0.0 / 48.2Light roll · 0%');
    expect(value('Poise')).toHaveTextContent('0');

    const chest = armor.find((piece) => piece.name === 'Bull-Goat Armor') ?? null;
    act(() => {
      store.dispatch(updateChest(chest));
    });
    act(() => {
      store.dispatch(
        updateTal({
          id: 'tal1',
          item: talismans.find((t) => t.name === "Bull-Goat's Talisman") ?? null,
        }),
      );
    });
    expect(value('Equip load')).toHaveTextContent('27.0 / 48.2Medium roll · 56%');
    expect(value('Poise')).toHaveTextContent(String(Math.floor(47 / 0.75)));
  });
});
