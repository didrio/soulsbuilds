import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import FocusScope from './FocusScope';

function Harness({ trap, onEscape = () => {} }: { trap: boolean; onEscape?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      {open ? (
        <FocusScope
          trap={trap}
          onEscape={() => {
            onEscape();
            setOpen(false);
          }}>
          <input aria-label="Search" />
          <button type="button">Close</button>
        </FocusScope>
      ) : null}
      <button type="button">After</button>
    </>
  );
}

describe('FocusScope', () => {
  it('focuses the first field, traps Tab, and Escape returns focus to the opener', async () => {
    const user = userEvent.setup();
    const onEscape = vi.fn();
    render(<Harness trap onEscape={onEscape} />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByLabelText('Search')).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    await user.tab();
    expect(screen.getByLabelText('Search')).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(onEscape).toHaveBeenCalledOnce();
    expect(screen.queryByLabelText('Search')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus();
  });

  it('without trap, Tab leaves the scope', async () => {
    const user = userEvent.setup();
    render(<Harness trap={false} />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });
});
