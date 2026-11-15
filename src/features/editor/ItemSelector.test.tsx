// The picker follows the game's rules: Ashes that fit the weapon, shared affinities, fixed skills,
// talisman groups (src/data/rules.ts).
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EditorWithPicker, searchItems } from '@/test/editor';
import { renderWithProviders } from '@/test/render';

const optionLabels = (name: string) =>
  within(screen.getByRole('combobox', { name }))
    .getAllByRole('option')
    .map((option) => option.textContent);

async function chooseWeapon(user: ReturnType<typeof renderWithProviders>['user'], name: string) {
  await user.click(screen.getAllByRole('button', { name: 'Choose weapon' })[0]!);
  await searchItems(user, name);
  await user.click(screen.getByRole('button', { name: new RegExp(`^${name}`) }));
  await user.click(screen.getByRole('button', { name: new RegExp(`^Change ${name}`) }));
}

describe('ItemSelector', () => {
  it('says to choose a weapon before its Ash of War and affinity', async () => {
    const { user } = renderWithProviders(<EditorWithPicker />);
    await user.click(screen.getAllByRole('button', { name: 'Choose weapon' })[0]!);
    expect(screen.getByText(/Choose a weapon, then open it again/)).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
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
});
