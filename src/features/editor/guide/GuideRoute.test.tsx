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

    // One numbered area per region, in order: a heading each, numbered 1, 2, 3… down the path.
    const regions = within(section)
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent);
    expect(regions).toContain('Limgrave');
    expect(regions).toContain('Caelid');
    expect(regions.indexOf('Limgrave')).toBeLessThan(regions.indexOf('Caelid'));
    const path = within(section).getAllByRole('list')[0]!;
    const areas = within(path)
      .getAllByRole('listitem')
      .filter((li) => li.parentElement === path);
    expect(areas).toHaveLength(regions.length);
    expect(areas.map((area) => area.firstElementChild?.textContent)).toEqual(
      regions.map((_, index) => String(index + 1)),
    );

    // Stops: what to do, the items with notes, bosses marked.
    expect(within(section).getByText('Moonveil')).toBeInTheDocument();
    expect(within(section).getByText('Defeat Magma Wyrm')).toBeInTheDocument();
    expect(within(section).getByText('Defeat Margit, the Fell Omen')).toBeInTheDocument();
    expect(within(section).getByText(SPIRIT_CALLING_BELL_SHOP)).toBeInTheDocument();
    expect(within(section).getByText(/or start as Samurai/)).toBeInTheDocument();
    expect(within(section).getByText('Restore')).toBeInTheDocument();
    expect(within(section).getAllByText('Boss').length).toBeGreaterThan(0);

    // The build's own items show their icon; others (the bell, a key item) a dashed tile.
    const tileOf = (name: string) => within(section).getByText(name).closest('li')!;
    expect(tileOf('Moonveil').querySelector('img')).not.toBeNull();
    expect(tileOf('Spirit Calling Bell').querySelector('img')).toBeNull();
  });
});
