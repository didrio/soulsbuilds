import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import GameMenu from './GameMenu';

describe('GameMenu (T79)', () => {
  it('opens the games: Elden Ring, then the Dark Souls games as coming soon', async () => {
    const { user } = renderWithProviders(<GameMenu />);
    const button = screen.getByRole('button', { name: 'Game: Elden Ring' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    const games = screen.getByRole('list', { name: 'Games' });
    expect(within(games).getByRole('link', { name: 'Elden Ring' })).toHaveAttribute('href', '/');
    const items = within(games).getAllByRole('listitem');
    expect(items.slice(1).map((item) => item.textContent)).toEqual([
      'Dark Souls RemasteredComing soon',
      'Dark Souls IIComing soon',
      'Dark Souls IIIComing soon',
    ]);
    // Only the current game is a link.
    expect(within(games).getAllByRole('link')).toHaveLength(1);
  });

  it('closes on Escape', async () => {
    const { user } = renderWithProviders(<GameMenu />);
    await user.click(screen.getByRole('button', { name: 'Game: Elden Ring' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('list', { name: 'Games' })).not.toBeInTheDocument();
  });
});
