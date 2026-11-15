import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import DropDown from './DropDown';

describe('DropDown', () => {
  it('reports the chosen option, and null when the placeholder clears it', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <DropDown
        label="Affinity"
        onChange={onChange}
        options={['Heavy', 'Keen']}
        placeholder="-- Choose an Affinity --"
        value="Heavy"
      />,
    );
    const select = screen.getByRole('combobox', { name: 'Affinity' });
    await user.selectOptions(select, 'Keen');
    expect(onChange).toHaveBeenLastCalledWith('Keen');
    await user.selectOptions(select, '-- Choose an Affinity --');
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});
