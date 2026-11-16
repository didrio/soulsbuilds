// The picker follows the game's rules: Ashes that fit the weapon, shared affinities, fixed skills,
// talisman groups (src/data/rules.ts).
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EditorWithPicker, searchItems } from '@/test/editor';
import { renderWithProviders } from '@/test/render';
import Loadout from './sections/Loadout';

const optionLabels = (name: string) =>
  within(screen.getByRole('combobox', { name }))
    .getAllByRole('option')
    .map((option) => option.textContent);

type User = ReturnType<typeof renderWithProviders>['user'];

/** Puts a weapon in the first slot and opens its Ash of War and affinity step. */
async function chooseWeapon(user: User, name: string) {
  await user.click(screen.getAllByRole('button', { name: 'Choose weapon' })[0]!);
  await searchItems(user, name);
  await user.click(screen.getByRole('button', { name: new RegExp(`^${name}`) }));
  // Weapons with nothing to choose close the picker: open the slot again.
  if (!screen.queryByRole('dialog', { name: 'Ash of War and affinity' })) {
    await user.click(screen.getByRole('button', { name: new RegExp(`^Change ${name}`) }));
  }
}

/** The item rows in the picker's list. */
const listed = () =>
  within(screen.getByRole('dialog'))
    .getAllByRole('listitem')
    .map((row) => row.textContent);

describe('ItemSelector', () => {
  it('an empty weapon slot opens the list; a weapon with Ashes to choose moves to its step', async () => {
    const { user } = renderWithProviders(<EditorWithPicker />);
    await user.click(screen.getAllByRole('button', { name: 'Choose weapon' })[0]!);
    expect(screen.getByRole('dialog', { name: 'Weapons' })).toBeInTheDocument();
    expect(screen.getByLabelText('Search items')).toHaveFocus();
    expect(screen.queryByRole('combobox', { name: 'Ash of War' })).not.toBeInTheDocument();

    await searchItems(user, 'Uchigatana');
    await user.click(screen.getByRole('button', { name: /^Uchigatana/ }));
    expect(screen.getByRole('dialog', { name: 'Ash of War and affinity' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Ash of War' })).toHaveFocus();

    // Change weapon goes back to the list, with the current weapon marked.
    // The search is kept.
    await user.click(screen.getByRole('button', { name: 'Change weapon' }));
    expect(screen.getByLabelText('Search items')).toHaveValue('Uchigatana');
    expect(screen.getByRole('button', { name: /^Uchigatana/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('a unique weapon closes the picker straight away', async () => {
    const { user } = renderWithProviders(<EditorWithPicker />);
    await user.click(screen.getAllByRole('button', { name: 'Choose weapon' })[0]!);
    await searchItems(user, 'Moonveil');
    await user.click(screen.getByRole('button', { name: /^Moonveil/ }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('filters by weapon type and by base game or DLC, and clears the filters', async () => {
    const { user } = renderWithProviders(<EditorWithPicker />);
    await user.click(screen.getAllByRole('button', { name: 'Choose weapon' })[0]!);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Weapon type' }), 'Katana');
    expect(listed()).toContain('Uchigatana');
    expect(listed()).not.toContain('Claymore');
    await user.click(screen.getByRole('button', { name: 'DLC' }));
    expect(listed()).toContain('Star-Lined Sword');
    expect(listed()).not.toContain('Uchigatana');
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByRole('combobox', { name: 'Weapon type' })).toHaveValue('');
    expect(screen.getByText(/^\d+ items$/)).toHaveTextContent(/^4\d\d items$/);
  });

  it('filters spells by kind', async () => {
    const { user } = renderWithProviders(
      <>
        <Loadout editable />
        <EditorWithPicker />
      </>,
    );
    await user.click(screen.getAllByRole('button', { name: 'Choose spell' })[0]!);
    await searchItems(user, 'Comet Azur');
    await user.click(screen.getByRole('button', { name: 'Incantations' }));
    expect(screen.getByText('Nothing matches. Try another search.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Sorceries' }));
    expect(listed()).toEqual([expect.stringMatching(/^Comet Azur\d+ slots?$/)]);
  });

  it('offers only the Ashes that fit the weapon, and the affinities it shares with the Ash', async () => {
    const { user } = renderWithProviders(<EditorWithPicker />);
    await chooseWeapon(user, 'Uchigatana');
    const ashes = optionLabels('Ash of War');
    expect(ashes[0]).toBe('Built-in: Unsheathe');
    expect(ashes).toContain('Seppuku');
    expect(ashes).not.toContain('Unsheathe'); // the built-in option already
    expect(ashes).not.toContain('Shield Bash'); // shields only
    expect(optionLabels('Affinity')).toContain('Fire');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Ash of War' }), 'Seppuku');
    expect(optionLabels('Affinity')).toEqual([
      'Standard',
      'Heavy',
      'Keen',
      'Quality',
      'Poison',
      'Blood',
      'Occult',
    ]);
  });

  it("shows a unique weapon's fixed skill and no affinity", async () => {
    const { user } = renderWithProviders(<EditorWithPicker />);
    await chooseWeapon(user, 'Moonveil');
    expect(screen.getByText("Transient Moonlight (can't be changed)")).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it("disables talismans that can't be worn with one already worn", async () => {
    const { user, store } = renderWithProviders(<EditorWithPicker />);
    const [first, second] = screen.getAllByRole('button', { name: 'Choose talisman' });
    await user.click(first!);
    await searchItems(user, "Erdtree's Favor");
    await user.click(screen.getByRole('button', { name: "Erdtree's Favor" }));

    await user.click(second!);
    await searchItems(user, "Erdtree's Favor");
    const plusOne = screen.getByRole('button', { name: /^Erdtree's Favor \+1/ });
    expect(plusOne).toHaveAttribute('aria-disabled', 'true');
    expect(plusOne).toHaveTextContent("Can't be worn with Erdtree's Favor");
    expect(
      screen.getByRole('button', { name: /^Erdtree's Favor Already worn/ }),
    ).toBeInTheDocument();
    await user.click(plusOne);
    expect(store.getState().equipment.tal2).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Close' }));

    // Swapping in place: the slot that holds the Favor can take the +1.
    await user.click(screen.getByRole('button', { name: "Change Erdtree's Favor" }));
    await searchItems(user, "Erdtree's Favor +1");
    await user.click(screen.getByRole('button', { name: "Erdtree's Favor +1" }));
    expect(store.getState().equipment.tal1?.name).toBe("Erdtree's Favor +1");
  });

  it('renders the long weapon list a page at a time', async () => {
    const { user } = renderWithProviders(<EditorWithPicker />);
    await user.click(screen.getAllByRole('button', { name: 'Choose weapon' })[0]!);
    const before = listed().length;
    await user.click(screen.getByRole('button', { name: /^Show more \(\d+ left\)$/ }));
    expect(listed().length).toBeGreaterThan(before);
    // A search narrows the whole list first: a short result has no "Show more".
    await searchItems(user, 'Uchigatana');
    expect(screen.queryByRole('button', { name: /^Show more/ })).not.toBeInTheDocument();
  });
});
