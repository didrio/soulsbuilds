import { act, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { spells, talismans } from '@/data';
import {
  makeBuild,
  MOONVEIL,
  SEPPUKU_ASH,
  UCHIGATANA,
  WHITE_MASK,
  emptyEquipment,
} from '@/test/fixtures';
import { EditorWithPicker, searchItems } from '@/test/editor';
import { renderWithProviders } from '@/test/render';
import { loadBuild } from '../store/build';
import { updateTal } from '../store/equipment';
import { updateSpell } from '../store/spells';
import { updateStat } from '../store/stats';
import BuildSidebar from './BuildSidebar';

const build = makeBuild({
  equipment: {
    ...emptyEquipment(),
    weapons: [UCHIGATANA, null, null, MOONVEIL, null, null],
    weaponAffinities: ['blood', null, null, null, null, null],
    weaponSkills: [SEPPUKU_ASH, null, null, null, null, null],
    helm: WHITE_MASK,
  },
});

const renderSidebar = (editable = false) => {
  const result = renderWithProviders(<BuildSidebar editable={editable} level={build.level} />);
  act(() => {
    result.store.dispatch(loadBuild(build));
  });
  return result;
};

const group = (name: string) => screen.getByRole('list', { name });
const spell = (name: string) => spells.find((entry) => entry.name === name) ?? null;

describe('BuildSidebar', () => {
  it('shows the stats in full: level, attributes, vitals, equip load and poise', () => {
    renderSidebar();
    const sidebar = screen.getByRole('complementary', { name: 'Stats and gear' });
    expect(within(sidebar).getByText('132')).toBeInTheDocument();
    expect(within(sidebar).getByText('Intelligence')).toBeInTheDocument();
    expect(within(sidebar).getByText('HP')).toBeInTheDocument();
    expect(within(sidebar).getByText('Equip load')).toBeInTheDocument();
    expect(within(sidebar).getByText('Poise')).toBeInTheDocument();
  });

  it('shows filled slots only, as tiles named by the item and what to know about it', () => {
    renderSidebar();
    expect(
      within(group('Armaments'))
        .getAllByRole('button')
        .map((tile) => tile.getAttribute('aria-label')),
    ).toEqual([
      // Right hand first.
      'Uchigatana (Blood affinity, Seppuku skill)',
      'Moonveil (Transient Moonlight skill)',
    ]);
    expect(within(group('Armor')).getAllByRole('button')).toHaveLength(1);
    expect(screen.queryByRole('heading', { name: 'Talismans' })).not.toBeInTheDocument();
    // No names on the page: only the tiles (and their tooltips, closed).
    expect(screen.queryByText('Uchigatana')).not.toBeInTheDocument();
  });

  it('shows the item card on tap, and closes it on Escape', async () => {
    const { user } = renderSidebar();
    const tile = screen.getByRole('button', { name: /^Uchigatana/ });
    await user.click(tile);
    expect(within(tile).getByText('Uchigatana')).toBeInTheDocument();
    expect(within(tile).getByText('Katana · Blood · Seppuku (4 FP)')).toBeInTheDocument();
    expect(within(tile).getByText('Scaling')).toBeInTheDocument();
    expect(within(tile).getByText('Arc D')).toBeInTheDocument();
    expect(within(tile).getByText('5.5')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(within(tile).queryByText('Uchigatana')).not.toBeInTheDocument();
  });

  it('shows the item card on mouse hover and keyboard focus, and hides it as they leave', async () => {
    const { user } = renderSidebar();
    const mask = screen.getByRole('button', { name: 'White Mask' });
    await user.hover(mask);
    expect(within(mask).getByText('Helm')).toBeInTheDocument();
    expect(within(mask).getByText('Poise')).toBeInTheDocument();
    await user.unhover(mask);
    expect(within(mask).queryByText('Helm')).not.toBeInTheDocument();

    await user.tab();
    const uchigatana = screen.getByRole('button', { name: /^Uchigatana/ });
    expect(uchigatana).toHaveFocus();
    expect(within(uchigatana).getByText('Requires')).toBeInTheDocument();
    await user.tab();
    expect(within(uchigatana).queryByText('Requires')).not.toBeInTheDocument();
  });

  it("describes each tile with the card's facts for screen readers", () => {
    renderSidebar();
    expect(screen.getByRole('button', { name: /^Uchigatana/ })).toHaveAccessibleDescription(
      /^Katana\. Blood · Seppuku \(4 FP\)\. Scaling: Str D, Dex D, Arc D\. Requires: Str 11/,
    );
  });

  it('shows the warning in the tooltip when the stats fall short', async () => {
    const { user, store } = renderSidebar();
    act(() => {
      store.dispatch(updateSpell({ id: 'spell1', item: spell('Comet Azur') })); // Int 60
      store.dispatch(updateStat({ key: 'int', value: 20 }));
    });
    const tile = within(group('Spells')).getByRole('button', {
      name: 'Comet Azur (Needs 60 Int)',
    });
    await user.click(tile);
    expect(within(tile).getByText('Needs 60 Int')).toBeInTheDocument();
    // The card flags the requirement this build doesn't meet.
    expect(within(tile).getByText('Int 60')).toBeInTheDocument();
    expect(screen.getByText(/memory slots/)).toHaveTextContent('3 of 10 memory slots');
  });

  it('says so when the build has no gear', () => {
    renderWithProviders(<BuildSidebar editable={false} level={1} />);
    expect(screen.getByText('No items yet.')).toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('editable: every slot is a tile that opens the picker, "Choose …" when empty', async () => {
    const { user, store } = renderWithProviders(<BuildSidebar editable level={1} />);
    expect(
      within(group('Right hand')).getAllByRole('button', { name: 'Choose weapon' }),
    ).toHaveLength(3);
    expect(
      within(group('Left hand')).getAllByRole('button', { name: 'Choose weapon' }),
    ).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: 'Choose talisman' })).toHaveLength(4);
    expect(screen.getAllByRole('button', { name: 'Choose arrow or bolt' })).toHaveLength(4);
    expect(screen.getAllByRole('button', { name: 'Choose spell' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Choose item' })).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Choose helm' }));
    expect(store.getState().app).toMatchObject({ slotType: 'SLOT_TYPE_HELM', editSlot: 'helm' });
  });

  it('editable: names a filled tile "Change …" on hover', async () => {
    const { user, store } = renderWithProviders(<BuildSidebar editable level={1} />);
    const favor = talismans.find((entry) => entry.name === "Erdtree's Favor") ?? null;
    act(() => {
      store.dispatch(updateTal({ id: 'tal1', item: favor }));
    });
    const tile = screen.getByRole('button', { name: "Change Erdtree's Favor" });
    await user.hover(tile);
    expect(within(tile).getByText("Erdtree's Favor")).toBeInTheDocument();
    // Editing keeps the short tooltip: no card covering the other tiles.
    expect(within(tile).queryByText('Talisman')).not.toBeInTheDocument();
  });
});

describe('BuildSidebar + item picker', () => {
  // Slow in jsdom: the weapon list (487 rows) re-renders on every step.
  it(
    'chooses a weapon, then its Ash of War and affinity, and removes it',
    { timeout: 15000 },
    async () => {
      const { user, store } = renderWithProviders(<EditorWithPicker />);

      // The right hand's first slot is weapon1.
      await user.click(within(group('Right hand')).getAllByRole('button')[0]!);
      await searchItems(user, 'Uchigatana');
      await user.click(screen.getByRole('button', { name: /^Uchigatana/ }));
      expect(store.getState().equipment.weapon1?.name).toBe('Uchigatana');

      // A weapon with Ashes to choose stays in the picker, on its Ash of War and affinity step.
      expect(screen.getByRole('dialog', { name: 'Ash of War and affinity' })).toBeInTheDocument();
      await user.selectOptions(screen.getByRole('combobox', { name: 'Ash of War' }), 'Seppuku');
      await user.selectOptions(screen.getByRole('combobox', { name: 'Affinity' }), 'Blood');
      await user.click(screen.getByRole('button', { name: 'Done' }));
      expect(store.getState().equipment).toMatchObject({
        weaponSkill1: expect.objectContaining({ name: 'Ash of War: Seppuku' }),
        weaponAffinity1: 'blood',
      });

      // The tile names the affinity, skill and unmet requirements (all stats are 10); a filled
      // weapon slot opens on that step.
      const tile = screen.getByRole('button', {
        name: 'Change Uchigatana (Blood affinity, Seppuku skill, Needs 11 Str, 15 Dex)',
      });
      await user.click(tile);
      await user.click(screen.getByRole('button', { name: 'Change weapon' }));
      // Remove empties the slot and drops its Ash and affinity.
      await user.click(screen.getByRole('button', { name: 'Remove Uchigatana' }));
      expect(store.getState().equipment).toMatchObject({
        weapon1: null,
        weaponSkill1: null,
        weaponAffinity1: null,
      });
      expect(screen.queryByRole('button', { name: /^Change Uchigatana/ })).not.toBeInTheDocument();
    },
  );

  it('adds items one after another, always with one empty slot for the next', async () => {
    const { user, store } = renderWithProviders(<EditorWithPicker />);
    await user.click(screen.getByRole('button', { name: 'Choose item' }));
    await searchItems(user, 'Acid Spraymist');
    await user.click(screen.getByRole('button', { name: /^Acid Spraymist/ }));
    expect(store.getState().equipment.con1?.name).toBe('Acid Spraymist');
    expect(screen.getByRole('button', { name: 'Change Acid Spraymist' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Choose item' }));
    await searchItems(user, 'Boiled Crab');
    await user.click(screen.getByRole('button', { name: /^Boiled Crab/ }));
    expect(store.getState().equipment.con2?.name).toBe('Boiled Crab');
  });

  it('has a great rune and a spirit ash slot', async () => {
    const { user, store } = renderWithProviders(<EditorWithPicker />);
    await user.click(screen.getByRole('button', { name: 'Choose great rune' }));
    await user.click(screen.getByRole('button', { name: /^Malenia's Great Rune/ }));
    await user.click(screen.getByRole('button', { name: 'Choose spirit ash' }));
    await searchItems(user, 'Mimic');
    await user.click(screen.getByRole('button', { name: /^Mimic Tear Ashes/ }));
    expect(store.getState().equipment.greatRune?.name).toBe("Malenia's Great Rune");
    expect(store.getState().equipment.spiritAsh?.name).toBe('Mimic Tear Ashes');
  });
});
