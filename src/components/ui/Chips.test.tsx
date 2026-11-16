import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import Chips from './Chips';

describe('Chips', () => {
  it('removes a chip with its labelled button', async () => {
    const onRemove = vi.fn();
    renderWithProviders(<Chips onAdd={vi.fn()} onRemove={onRemove} values={['Malenia']} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove Malenia' }));
    expect(onRemove).toHaveBeenCalledWith('Malenia');
  });

  it('adds a tag by searching from the keyboard, then closes', async () => {
    const onAdd = vi.fn();
    renderWithProviders(<Chips onAdd={onAdd} onRemove={vi.fn()} values={[]} />);
    const add = screen.getByRole('button', { name: 'Add tag' });
    await userEvent.click(add);
    expect(add).toHaveAttribute('aria-expanded', 'true');
    // The search field has focus (FocusScope); matching is case-insensitive.
    await userEvent.keyboard('mALEN');
    await userEvent.click(screen.getByRole('button', { name: 'Malenia' }));
    expect(onAdd).toHaveBeenCalledWith('Malenia');
    expect(screen.queryByRole('searchbox', { name: 'Search tags' })).not.toBeInTheDocument();
  });

  it('hides tags already chosen, and Escape closes the popover', async () => {
    renderWithProviders(<Chips onAdd={vi.fn()} onRemove={vi.fn()} values={['Malenia']} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add tag' }));
    await userEvent.keyboard('malenia');
    expect(screen.getByText('No tags match.')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('searchbox', { name: 'Search tags' })).not.toBeInTheDocument();
  });
});
