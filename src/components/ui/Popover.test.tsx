import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import Popover from './Popover';

const renderPopover = () =>
  render(
    <>
      <Popover label="Level" value="Any">
        {(close) => (
          <button type="button" onClick={close}>
            125–150
          </button>
        )}
      </Popover>
      <p>Outside</p>
    </>,
  );

describe('Popover (T74)', () => {
  it('a button names the filter and its value, and opens a labelled panel with focus inside', async () => {
    const user = userEvent.setup();
    renderPopover();
    const trigger = screen.getByRole('button', { name: 'Level Any' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('group', { name: 'Level' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '125–150' })).toHaveFocus();
  });

  it('closes on Escape (focus back on the button), a pick, or a click outside', async () => {
    const user = userEvent.setup();
    renderPopover();
    const trigger = screen.getByRole('button', { name: 'Level Any' });

    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('group', { name: 'Level' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: '125–150' }));
    expect(screen.queryByRole('group', { name: 'Level' })).not.toBeInTheDocument();

    await user.click(trigger);
    fireEvent.mouseDown(screen.getByText('Outside'));
    expect(screen.queryByRole('group', { name: 'Level' })).not.toBeInTheDocument();
  });
});
