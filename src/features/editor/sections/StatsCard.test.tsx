import { act, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { armor, talismans, weapons } from '@/data';
import { renderWithProviders } from '@/test/render';
import { updateChest, updateTal, updateWeapon } from '../store/equipment';
import StatsCard from './StatsCard';

const talisman = (name: string) => talismans.find((t) => t.name === name) ?? null;
const value = (term: string) =>
  within(screen.getByText(term, { selector: 'dt' }).parentElement!).getByRole('definition');

describe('StatsCard', () => {
  it('shows the rune level and each attribute', () => {
    renderWithProviders(<StatsCard editable={false} level={42} />);
    expect(screen.getByText('Rune level').nextSibling).toHaveTextContent('42');
    const rows = within(screen.getByRole('region', { name: 'Attributes' })).getAllByRole(
      'listitem',
    );
    expect(rows).toHaveLength(8);
    expect(rows[0]).toHaveTextContent('Vigor');
    expect(rows[0]).toHaveTextContent('10');
  });

  it('accepts digits only and clamps stats to 1–99', async () => {
    const { user, store } = renderWithProviders(<StatsCard editable level={1} />);
    const vigor = screen.getByLabelText('Vigor');

    await user.clear(vigor);
    await user.type(vigor, 'abc');
    expect(vigor).toHaveValue('');
    expect(store.getState().stats.vigor).toBe(10);

    await user.type(vigor, '0');
    expect(store.getState().stats.vigor).toBe(1);

    await user.clear(vigor);
    await user.type(vigor, '150');
    expect(vigor).toHaveValue('15');
    expect(store.getState().stats.vigor).toBe(15);
  });

  it('shows the stored value again after an emptied field loses focus', async () => {
    const { user } = renderWithProviders(<StatsCard editable level={1} />);
    const mind = screen.getByLabelText('Mind');
    await user.clear(mind);
    await user.tab();
    expect(mind).toHaveValue('10');
  });

  it('a starting class raises the stats to its base, and no stat goes below it', async () => {
    const { user, store } = renderWithProviders(<StatsCard editable level={1} />);
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Starting class' }),
      'Samurai · level 9',
    );
    expect(store.getState().startingClass?.name).toBe('Samurai');
    expect(store.getState().stats).toMatchObject({ vigor: 12, end: 13, dex: 15, int: 10 });

    const dex = screen.getByLabelText('Dexterity');
    await user.clear(dex);
    await user.type(dex, '9');
    expect(store.getState().stats.dex).toBe(15);
    await user.tab();
    expect(dex).toHaveValue('15');
  });

  it('shows the starting class and talisman bonuses when read-only', () => {
    const { store } = renderWithProviders(<StatsCard editable={false} level={1} />);
    expect(screen.queryByText(/Starting class/)).not.toBeInTheDocument();
    act(() => {
      store.dispatch(updateTal({ id: 'tal1', item: talisman('Starscourge Heirloom') }));
    });
    expect(screen.getByText(/\+5/).closest('li')).toHaveTextContent(
      'StrengthStr +5 from talismans',
    );
  });

  it('shows HP, FP, stamina, equip load with the roll type, and poise', () => {
    const { store } = renderWithProviders(<StatsCard editable={false} level={1} />);
    expect(value('HP')).toHaveTextContent('414');
    expect(value('FP')).toHaveTextContent('78');
    expect(value('Stamina')).toHaveTextContent('96');
    expect(value('Equip load')).toHaveTextContent('0.0 / 48.2Light roll · 0%MediumHeavy');
    expect(value('Poise')).toHaveTextContent('0');

    act(() => {
      store.dispatch(updateChest(armor.find((piece) => piece.name === 'Bull-Goat Armor') ?? null));
    });
    act(() => {
      store.dispatch(updateTal({ id: 'tal1', item: talisman("Bull-Goat's Talisman") }));
    });
    expect(value('Equip load')).toHaveTextContent('27.0 / 48.2LightMedium roll · 56%Heavy');
    expect(value('Poise')).toHaveTextContent(String(Math.floor(47 / 0.75)));
  });

  it('says when the load is over the limit', () => {
    const { store } = renderWithProviders(<StatsCard editable={false} level={1} />);
    const shield = weapons.find((w) => w.name === 'Fingerprint Stone Shield') ?? null; // 29
    act(() => {
      store.dispatch(updateWeapon({ id: 'weapon4', item: shield }));
      store.dispatch(updateWeapon({ id: 'weapon5', item: shield }));
    });
    // 58 is over a level-1 character's 48.2.
    expect(value('Equip load')).toHaveTextContent(/Overloaded · \d+(\.\d)?%/);
  });
});
