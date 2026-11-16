import { act, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { makeBuild, MOONVEIL, UCHIGATANA, WHITE_MASK, emptyEquipment } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import { loadBuild } from '../store/build';
import BuildSummary from './BuildSummary';

const build = makeBuild({
  equipment: {
    ...emptyEquipment(),
    weapons: [MOONVEIL, null, null, UCHIGATANA, null, null],
    helm: WHITE_MASK,
  },
});

const renderSummary = () => {
  const result = renderWithProviders(<BuildSummary level={build.level} />);
  act(() => {
    result.store.dispatch(loadBuild(build));
  });
  return result;
};

describe('BuildSummary', () => {
  it('shows the level, attributes and vitals, without load or poise', () => {
    renderSummary();
    const summary = screen.getByRole('complementary', { name: 'Stats' });
    expect(within(summary).getByText('132')).toBeInTheDocument();
    expect(within(summary).getByTitle('Intelligence')).toBeInTheDocument();
    expect(within(summary).getByText('HP')).toBeInTheDocument();
    expect(within(summary).queryByText('Poise')).not.toBeInTheDocument();
    expect(within(summary).queryByText('Equip load')).not.toBeInTheDocument();
  });

  it('shows filled slots only, as buttons named by the item, grouped', () => {
    renderSummary();
    const armaments = screen.getByRole('list', { name: 'Armaments' });
    expect(
      within(armaments)
        .getAllByRole('button')
        .map((b) => b.getAttribute('aria-label')),
    ).toEqual(['Moonveil', 'Uchigatana']);
    expect(within(screen.getByRole('list', { name: 'Armor' })).getAllByRole('button')).toHaveLength(
      1,
    );
    expect(screen.queryByRole('heading', { name: 'Talismans' })).not.toBeInTheDocument();
  });

  it('names an item on tap, and closes on Escape', async () => {
    const { user } = renderSummary();
    const tile = screen.getByRole('button', { name: 'Moonveil' });
    await user.click(tile);
    expect(within(tile).getByText('Moonveil')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(within(tile).queryByText('Moonveil')).not.toBeInTheDocument();
  });
});
