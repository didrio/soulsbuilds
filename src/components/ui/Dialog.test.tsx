import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import Dialog from './Dialog';

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      {open ? (
        <Dialog title="Log in" onClose={() => setOpen(false)}>
          <input aria-label="Email" />
        </Dialog>
      ) : null}
    </>
  );
}

describe('Dialog', () => {
  it('is a labelled modal dialog that traps focus and closes with Escape', async () => {
    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Open' });
    await userEvent.click(opener);

    const dialog = screen.getByRole('dialog', { name: 'Log in' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    // Focus starts on the first field; Tab reaches the close button last, then wraps.
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveFocus();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('closes from the close button', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('tall: the content is a flex column that fills a fixed height', () => {
    render(
      <Dialog title="Items" onClose={() => {}} tall>
        <p>List</p>
      </Dialog>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Items' });
    expect(getComputedStyle(dialog).display).toBe('flex');
    expect(getComputedStyle(dialog).flexDirection).toBe('column');
  });
});
