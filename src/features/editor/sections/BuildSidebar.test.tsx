import { act, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  makeBuild,
  MOONVEIL,
  SEPPUKU_ASH,
  UCHIGATANA,
  WHITE_MASK,
  emptyEquipment,
} from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import { loadBuild } from '../store/build';
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

const renderSidebar = (equipment = true) => {
  const result = renderWithProviders(
    <BuildSidebar editable={false} level={build.level} equipment={equipment} />,
  );
  act(() => {
    result.store.dispatch(loadBuild(build));
  });
  return result;
};

const group = (name: string) => screen.getByRole('list', { name });

describe('BuildSidebar', () => {
  it('shows the stats in full: level, attributes, vitals, equip load and poise', () => {
    renderSidebar();
    const sidebar = screen.getByRole('complementary', { name: 'Stats and equipment' });
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

  it('says so when the build has no gear', () => {
    renderWithProviders(<BuildSidebar editable={false} level={1} equipment />);
    expect(screen.getByText('No items yet.')).toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('is the stats alone on the Equipment tab (the equipment is the tab itself)', () => {
    renderSidebar(false);
    const sidebar = screen.getByRole('complementary', { name: 'Stats' });
    expect(within(sidebar).getByText('Intelligence')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Equipment' })).not.toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
