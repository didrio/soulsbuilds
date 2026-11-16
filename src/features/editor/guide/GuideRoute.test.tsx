import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { Equipment } from '@/lib/models';
import {
  emptyEquipment,
  GODRICKS_GREAT_RUNE,
  MOONVEIL,
  SEPPUKU_ASH,
  UCHIGATANA,
} from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import GuideRoute from './GuideRoute';
import NextStop from './NextStop';

const SPIRIT_CALLING_BELL_SHOP = /Buy from Twin Maiden Husks/;

const equipment: Equipment = {
  ...emptyEquipment(),
  weapons: [MOONVEIL, null, null, UCHIGATANA, null, null],
  weaponSkills: [null, null, null, SEPPUKU_ASH, null, null],
  greatRune: GODRICKS_GREAT_RUNE,
  spiritAsh: 200000, // Black Knife Tiche: needs the Spirit Calling Bell
};

/** The route's stops (the top-level list items), in order. */
const stopsOf = (container: HTMLElement) => {
  const list = container.querySelector('ol')!;
  return within(list)
    .getAllByRole('listitem')
    .filter((li) => li.parentElement === list);
};

describe('GuideRoute', () => {
  it('says so when no item has a known source', () => {
    renderWithProviders(<GuideRoute equipment={emptyEquipment()} />);
    expect(screen.getByText(/has a known source/)).toBeInTheDocument();
  });

  it('lists numbered stops with their area, what to do, the items and why', () => {
    const { container } = renderWithProviders(<GuideRoute equipment={equipment} />);
    const section = container as HTMLElement;

    // One flat list, numbered 1, 2, 3…; no progress without tracking.
    const stops = stopsOf(section);
    expect(stops.map((stop) => stop.firstElementChild?.textContent)).toEqual(
      stops.map((_, index) => String(index + 1)),
    );
    expect(screen.queryByText(/stops done/)).not.toBeInTheDocument();
    expect(within(stops[0]!).getByText('Limgrave')).toBeInTheDocument();

    expect(within(section).getByText('Moonveil')).toBeInTheDocument();
    expect(within(section).getByText('Defeat Magma Wyrm')).toBeInTheDocument();
    expect(within(section).getByText('Defeat Margit, the Fell Omen')).toBeInTheDocument();
    expect(within(section).getAllByText(/^Main-path boss/).length).toBeGreaterThan(0);
    expect(within(section).getByText(SPIRIT_CALLING_BELL_SHOP)).toBeInTheDocument();
    expect(within(section).getByText(/or start as Samurai/)).toBeInTheDocument();
    expect(within(section).getByText('Restore')).toBeInTheDocument();

    // Key items say why they're needed.
    expect(within(section).getByText('Lets you summon Spirit Ashes')).toBeInTheDocument();
    expect(within(section).getByText('Lets you put Ashes of War on weapons')).toBeInTheDocument();
    expect(within(section).getByText('Restore it at its Divine Tower')).toBeInTheDocument();

    // Every item has its icon; the build's own are lit, others dimmed.
    const tileOf = (name: string) =>
      within(section).getByText(name).closest('li')!.querySelector('img')!;
    expect(tileOf('Moonveil')).not.toBeNull();
    expect(tileOf('Spirit Calling Bell')).not.toBeNull();
  });

  it('shows progress while tracking: done stops folded, the next one marked', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(
      <GuideRoute equipment={equipment} collected={[`weapon4:${UCHIGATANA}`]} />,
    );
    const progress = screen.getByText(/stops done/);
    const [done, total] = progress.textContent!.match(/\d+/g)!.map(Number);
    expect(done).toBeGreaterThan(0);
    expect(done).toBeLessThan(total!);

    // Finished stops are hidden until asked for.
    expect(stopsOf(container as HTMLElement)).toHaveLength(total! - done!);
    expect(screen.queryByText('Uchigatana')).not.toBeInTheDocument();
    expect(screen.getByText('Next stop')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: `Show the ${done} finished stops` }));
    expect(stopsOf(container as HTMLElement)).toHaveLength(total!);
    expect(screen.getByText('Uchigatana')).toBeInTheDocument();
    expect(screen.getAllByText('(done)')).toHaveLength(done!);
    await user.click(screen.getByRole('button', { name: `Hide the ${done} finished stops` }));
    expect(stopsOf(container as HTMLElement)).toHaveLength(total! - done!);
  });
});

describe('NextStop', () => {
  it('shows the next stop with a link to the whole route', () => {
    renderWithProviders(
      <NextStop buildId="b1" equipment={equipment} collected={[`weapon4:${UCHIGATANA}`]} />,
    );
    const card = screen.getByRole('region', { name: /./ });
    expect(within(card).getByText('Next stop')).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: 'See the whole route' })).toHaveAttribute(
      'href',
      '/build/b1/route',
    );
  });

  it('shows nothing once every stop is done', () => {
    const { container } = renderWithProviders(
      <NextStop
        buildId="b1"
        equipment={{ ...emptyEquipment(), weapons: [UCHIGATANA, null, null, null, null, null] }}
        collected={[`weapon1:${UCHIGATANA}`]}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
