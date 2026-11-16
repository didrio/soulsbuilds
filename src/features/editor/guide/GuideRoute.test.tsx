import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  emptyEquipment,
  GODRICKS_GREAT_RUNE,
  MOONVEIL,
  SEPPUKU_ASH,
  UCHIGATANA,
} from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import GuideRoute from './GuideRoute';

const SPIRIT_CALLING_BELL_SHOP = /Buy from Twin Maiden Husks/;

describe('GuideRoute', () => {
  it('says so when no item has a known source', () => {
    renderWithProviders(<GuideRoute equipment={emptyEquipment()} />);
    expect(screen.getByText(/has a known source/)).toBeInTheDocument();
  });

  it('lists numbered steps by region, with items and what to do', () => {
    const { container } = renderWithProviders(
      <GuideRoute
        equipment={{
          ...emptyEquipment(),
          weapons: [MOONVEIL, null, null, UCHIGATANA, null, null],
          weaponSkills: [null, null, null, SEPPUKU_ASH, null, null],
          greatRune: GODRICKS_GREAT_RUNE,
          spiritAsh: 200000, // Black Knife Tiche: needs the Spirit Calling Bell
        }}
      />,
    );
    const section = container as HTMLElement;

    // Regions are headings; the lists are ordered and numbering runs on from one region to the next.
    const regions = within(section)
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent);
    expect(regions).toContain('Limgrave');
    expect(regions).toContain('Caelid');
    expect(regions.indexOf('Limgrave')).toBeLessThan(regions.indexOf('Caelid'));
    const lists = within(section).getAllByRole('list');
    expect(lists[0]).toHaveAttribute('start', '1');
    expect(lists[1]).toHaveAttribute(
      'start',
      String(within(lists[0]!).getAllByRole('listitem').length + 1),
    );

    // Items, actions and notes.
    expect(within(section).getByText('Moonveil')).toBeInTheDocument();
    expect(within(section).getByText('Defeat Magma Wyrm:')).toBeInTheDocument();
    expect(within(section).getByText('Defeat Margit, the Fell Omen')).toBeInTheDocument();
    expect(within(section).getByText(SPIRIT_CALLING_BELL_SHOP)).toBeInTheDocument();
    expect(within(section).getByText('(or start as Samurai)')).toBeInTheDocument();
    expect(within(section).getByText('Restore:')).toBeInTheDocument();
  });
});
