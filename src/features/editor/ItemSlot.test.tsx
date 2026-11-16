import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { talismans } from '@/data';
import { renderWithProviders } from '@/test/render';
import type { SlotEntry } from './ItemRow';
import ItemSlot from './ItemSlot';

const favor: SlotEntry = {
  id: 'tal1',
  type: 'SLOT_TYPE_TAL',
  item: talismans.find(({ name }) => name === "Erdtree's Favor")!,
};

// The bubble is visual only (the button carries the name), so look for its text, not a role.
const bubble = () => screen.queryByText("Erdtree's Favor");

describe('ItemSlot', () => {
  it('view: a button named after the item; hover shows the name', async () => {
    const { user } = renderWithProviders(<ItemSlot entry={favor} editable={false} />);
    const tile = screen.getByRole('button', { name: "Erdtree's Favor" });
    expect(bubble()).not.toBeInTheDocument();
    await user.hover(tile);
    expect(bubble()).toBeInTheDocument();
    await user.unhover(tile);
    expect(bubble()).not.toBeInTheDocument();
  });

  it('view: keyboard focus shows the name, Escape hides it', async () => {
    const { user } = renderWithProviders(<ItemSlot entry={favor} editable={false} />);
    await user.tab();
    expect(screen.getByRole('button', { name: "Erdtree's Favor" })).toHaveFocus();
    expect(bubble()).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(bubble()).not.toBeInTheDocument();
  });

  it('view: a tap pins the name until a second tap or a tap elsewhere', async () => {
    const { user } = renderWithProviders(
      <>
        <ItemSlot entry={favor} editable={false} />
        <p>elsewhere</p>
      </>,
    );
    const tile = screen.getByRole('button', { name: "Erdtree's Favor" });
    await user.pointer({ keys: '[TouchA]', target: tile });
    expect(bubble()).toBeInTheDocument();
    await user.pointer({ keys: '[TouchA]', target: tile });
    expect(bubble()).not.toBeInTheDocument();
    await user.pointer({ keys: '[TouchA]', target: tile });
    await user.pointer({ keys: '[TouchA]', target: screen.getByText('elsewhere') });
    expect(bubble()).not.toBeInTheDocument();
  });

  it('edit: named like a row, opens the picker; an empty slot says what goes in it', async () => {
    const { user, store } = renderWithProviders(
      <>
        <ItemSlot entry={favor} editable />
        <ItemSlot entry={{ id: 'tal2', type: 'SLOT_TYPE_TAL', item: null }} editable />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Choose talisman' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: "Change Erdtree's Favor" }));
    expect(store.getState().app).toMatchObject({ slotType: 'SLOT_TYPE_TAL', editSlot: 'tal1' });
  });
});
