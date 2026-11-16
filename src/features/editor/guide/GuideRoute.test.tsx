import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
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
import type { RouteTracking } from './progress';

const SPIRIT_CALLING_BELL_SHOP = /Buy from Twin Maiden Husks/;

const equipment: Equipment = {
  ...emptyEquipment(),
  weapons: [MOONVEIL, null, null, UCHIGATANA, null, null],
  weaponSkills: [null, null, null, SEPPUKU_ASH, null, null],
  greatRune: GODRICKS_GREAT_RUNE,
  spiritAsh: 200000, // Black Knife Tiche: needs the Spirit Calling Bell
};

/** A tracking player's progress that marking changes, as the page's tracking hook does (T44). */
function Tracked({
  collected,
  render,
}: {
  collected: string[];
  render: (tracking: RouteTracking) => React.ReactNode;
}) {
  const [marked, setMarked] = useState<string[]>([]);
  const onMark = (keys: string[], route: string[]) =>
    setMarked((now) => {
      const on = !keys.every((key) => now.includes(key));
      const next = on ? [...now, ...keys] : now.filter((key) => !keys.includes(key));
      return next.filter((key) => route.includes(key));
    });
  return render({ collected, marked, onMark });
}

const UCHIGATANA_KEY = `weapon4:${UCHIGATANA}`;

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
      <GuideRoute
        equipment={equipment}
        tracking={{ collected: [UCHIGATANA_KEY], marked: [], onMark: () => {} }}
      />,
    );
    // Only the Uchigatana's own stop is done: players go out of order, so the stops before it aren't.
    expect(screen.getByText(/stops done/)).toHaveTextContent(/^1 of \d+ stops done\.$/);
    const total = Number(screen.getByText(/stops done/).textContent!.match(/of (\d+)/)![1]);

    // Finished stops are hidden until asked for.
    expect(stopsOf(container as HTMLElement)).toHaveLength(total - 1);
    expect(screen.queryByText('Uchigatana')).not.toBeInTheDocument();
    const next = stopsOf(container as HTMLElement)[0]!;
    expect(within(next).getByText('Next stop')).toBeInTheDocument();
    expect(next.firstElementChild).toHaveTextContent('1');

    await user.click(screen.getByRole('button', { name: 'Show the 1 finished stop' }));
    expect(stopsOf(container as HTMLElement)).toHaveLength(total);
    expect(screen.getByText('Uchigatana')).toBeInTheDocument();
    expect(screen.getAllByText('(done)')).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Hide the 1 finished stop' }));
    expect(stopsOf(container as HTMLElement)).toHaveLength(total - 1);
  });

  it('marks a stop without the build’s gear done, and undoes it (T44)', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(
      <Tracked
        collected={[]}
        render={(tracking) => <GuideRoute equipment={equipment} tracking={tracking} />}
      />,
    );
    const stops = () => stopsOf(container as HTMLElement);
    const total = stops().length;
    // Gear stops are checked off on the Loadout tab: no "Mark done" there.
    const gearStop = stops().find((stop) => within(stop).queryByText('Uchigatana'))!;
    expect(within(gearStop).queryByRole('button', { name: 'Mark done' })).toBeNull();

    // The Spirit Calling Bell's stop: a key item.
    const bellStop = () =>
      stops().find((stop) => within(stop).queryByText(SPIRIT_CALLING_BELL_SHOP));
    const number = bellStop()!.firstElementChild!.textContent;
    const button = within(bellStop()!).getByRole('button', { name: 'Mark done' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    await user.click(button);
    expect(screen.getByText(/stops done/)).toHaveTextContent(`1 of ${total} stops done.`);
    expect(bellStop()).toBeUndefined();
    expect(screen.getByText(/stops done/)).toHaveFocus();

    // Shown again, it's pressed ("Done"); pressing it undoes it.
    await user.click(screen.getByRole('button', { name: 'Show the 1 finished stop' }));
    const pressed = within(bellStop()!).getByRole('button', { name: 'Mark done' });
    expect(pressed).toHaveAttribute('aria-pressed', 'true');
    expect(pressed).toHaveTextContent('Done');
    expect(bellStop()!.firstElementChild!.textContent).not.toBe(number);
    await user.click(pressed);
    expect(screen.getByText(/stops done/)).toHaveTextContent(`0 of ${total} stops done.`);
    expect(within(bellStop()!).getByRole('button', { name: 'Mark done' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});

describe('NextStop', () => {
  it('shows the next stop with a link to the whole route', () => {
    renderWithProviders(
      <NextStop
        buildId="b1"
        equipment={equipment}
        tracking={{ collected: [UCHIGATANA_KEY], marked: [], onMark: () => {} }}
      />,
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
        tracking={{ collected: [`weapon1:${UCHIGATANA}`], marked: [], onMark: () => {} }}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('marks a stop without the build’s gear done, and moves on (T44)', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Tracked
        collected={[]}
        render={(tracking) => <NextStop buildId="b1" equipment={equipment} tracking={tracking} />}
      />,
    );
    const title = () => screen.getByRole('heading', { level: 2 }).textContent;
    const first = title();
    // Mark stops done until one with the build's gear is next: that one has no "Mark done".
    let marks = 0;
    while (screen.queryByRole('button', { name: 'Mark done' })) {
      const before = title();
      await user.click(screen.getByRole('button', { name: 'Mark done' }));
      expect(title()).not.toBe(before);
      marks++;
    }
    expect(marks).toBeGreaterThan(0);
    expect(title()).not.toBe(first);
    expect(screen.getByRole('heading', { level: 2 })).toHaveFocus();
  });
});
