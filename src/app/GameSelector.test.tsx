import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import GameSelector from './GameSelector';

afterEach(() => {
  vi.useRealTimers();
});

describe('GameSelector', () => {
  it('shows "Coming soon!" for another game, then hides it', () => {
    vi.useFakeTimers();
    render(<GameSelector />);
    fireEvent.click(screen.getByRole('button', { name: 'Dark Souls II' }));
    expect(screen.getByText('Coming soon!')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.queryByText('Coming soon!')).not.toBeInTheDocument();
  });

  it('restarts the timer when another game is chosen, and clears it on unmount', () => {
    vi.useFakeTimers();
    const { unmount } = render(<GameSelector />);
    fireEvent.click(screen.getByRole('button', { name: 'Dark Souls' }));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Dark Souls III' }));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    // The first game's timer was cleared, so the second message is still showing.
    expect(screen.getByText('Coming soon!')).toBeInTheDocument();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
