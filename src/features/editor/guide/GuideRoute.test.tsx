import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import type { Equipment } from '@/lib/models';
import {
  emptyEquipment,
  makeBuild,
  GODRICKS_GREAT_RUNE,
  MOONVEIL,
  SEPPUKU_ASH,
  UCHIGATANA,
} from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import { loadBuild } from '../store/build';
import GuideRoute from './GuideRoute';
import type { RouteTracking } from './progress';

const SPIRIT_CALLING_BELL_SHOP = /Buy from Twin Maiden Husks/;

const equipment: Equipment = {
  ...emptyEquipment(),
  weapons: [MOONVEIL, null, null, UCHIGATANA, null, null],
  weaponSkills: [null, null, null, SEPPUKU_ASH, null, null],
  greatRune: GODRICKS_GREAT_RUNE,
  spiritAsh: 200000, // Black Knife Tiche: needs the Spirit Calling Bell
};

/**
 * A tracking player's progress that checking items off (T46) and marking stops (T44) change, as the
 * page's tracking hook does.
 */
function Tracked({ equipment: gear }: { equipment: Equipment }) {
  const [collected, setCollected] = useState<string[]>([]);
  const [marked, setMarked] = useState<string[]>([]);
  const onToggle = (keys: string[]) =>
    setCollected((now) =>
      keys.some((key) => now.includes(key))
        ? now.filter((key) => !keys.includes(key))
        : [...now, ...keys],
    );
  const onMark = (keys: string[], route: string[]) =>
    setMarked((now) => {
      const on = !keys.every((key) => now.includes(key));
      const next = on ? [...now, ...keys] : now.filter((key) => !keys.includes(key));
      return next.filter((key) => route.includes(key));
    });
  const tracking: RouteTracking = { collected, marked, onToggle, onMark };
  return <GuideRoute equipment={gear} tracking={tracking} />;
}

const noop = () => {};

const UCHIGATANA_KEY = `weapon4:${UCHIGATANA}`;

/** The route's stops (the top-level list items), in order. */
const stopsOf = (container: HTMLElement) => {
  const list = container.querySelector('ol')!;
  return within(list)
    .getAllByRole('listitem')
    .filter((li) => li.parentElement === list);
};

describe('GuideRoute', () => {
  it("shows the build's items' cards on mouse hover over their tiles, and none for key items (T45)", async () => {
    const { user, store } = renderWithProviders(<GuideRoute equipment={equipment} />);
    act(() => {
      store.dispatch(loadBuild(makeBuild({ equipment })));
    });
    const row = (name: string | RegExp) => screen.getAllByText(name)[0]!.closest('li')!;

    const uchigatana = row('Uchigatana');
    await user.hover(uchigatana.querySelector('img')!);
    expect(within(uchigatana).getByText('Katana · Seppuku (4 FP)')).toBeInTheDocument();
    expect(within(uchigatana).getByText('Scaling')).toBeInTheDocument();
    await user.unhover(uchigatana.querySelector('img')!);
    expect(within(uchigatana).queryByText('Scaling')).not.toBeInTheDocument();

    const bell = row('Spirit Calling Bell');
    await user.hover(bell.querySelector('img')!);
    expect(within(bell).queryByText('Scaling')).not.toBeInTheDocument();
    expect(bell.querySelector('[aria-hidden="true"]')).toBeNull();
  });

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
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
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
        tracking={{ collected: [UCHIGATANA_KEY], marked: [], onToggle: noop, onMark: noop }}
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

  it('checks the build’s items off, and folds a stop once its last one is (T46)', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<Tracked equipment={equipment} />);
    const total = stopsOf(container as HTMLElement).length;
    // The build's tracked items are checkboxes; other items (the bell, the Ash of War: not tracked)
    // aren't.
    expect(screen.queryByRole('checkbox', { name: /Spirit Calling Bell/ })).toBeNull();
    expect(screen.queryByRole('checkbox', { name: /Seppuku/ })).toBeNull();
    const moonveil = screen.getByRole('checkbox', { name: /^Moonveil/ });
    expect(moonveil).not.toBeChecked();

    // The Uchigatana is alone at its stop: checked off, the stop is done and folds away.
    await user.click(screen.getByRole('checkbox', { name: /^Uchigatana/ }));
    expect(screen.getByText(/stops done/)).toHaveTextContent(`1 of ${total} stops done.`);
    expect(screen.queryByRole('checkbox', { name: /^Uchigatana/ })).toBeNull();
    expect(screen.getByText(/stops done/)).toHaveFocus();

    // Shown again, it's checked; unchecking it brings the stop back.
    await user.click(screen.getByRole('button', { name: 'Show the 1 finished stop' }));
    const uchigatana = screen.getByRole('checkbox', { name: /^Uchigatana/ });
    expect(uchigatana).toBeChecked();
    await user.click(uchigatana);
    expect(screen.getByText(/stops done/)).toHaveTextContent(`0 of ${total} stops done.`);
    expect(screen.getByRole('checkbox', { name: /^Uchigatana/ })).not.toBeChecked();
  });

  it('marks a stop without the build’s gear done, and undoes it (T44)', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<Tracked equipment={equipment} />);
    const stops = () => stopsOf(container as HTMLElement);
    const total = stops().length;
    // Gear stops are checked off item by item: no "Mark done" there.
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
