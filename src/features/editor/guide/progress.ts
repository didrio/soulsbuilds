// The route during a run (T35): the route as numbered stops, and which of them a tracking player has
// done (T34's `collected` item keys). Pure.
import type { AcquisitionFile } from '@/data/schema';
import type { ItemRef, Route, RouteLeg, RouteStep } from './route';

export interface RouteStop {
  /** 1-based, in route order. */
  number: number;
  leg: RouteLeg;
  step: RouteStep;
}

/** The route's steps as one numbered list of stops. */
export function routeStops(route: Route): RouteStop[] {
  return route.legs
    .flatMap((leg) => leg.steps.map((step) => ({ leg, step })))
    .map((stop, index) => ({
      ...stop,
      number: index + 1,
    }));
}

export const refKey = (ref: ItemRef) => `${ref.file}:${ref.id}`;

// The tracking keys an item can have (src/lib/tracking.ts `trackedItems`): weapons by slot, armor by
// piece, the rest by group. Ashes of War, arrows, consumables and key items aren't tracked.
const KEY_SLOTS: Partial<Record<AcquisitionFile, string[]>> = {
  weapons: ['weapon1', 'weapon2', 'weapon3', 'weapon4', 'weapon5', 'weapon6'],
  armor: ['helm', 'chest', 'gauntlet', 'leg'],
  talismans: ['talisman'],
  spells: ['spell'],
  tears: ['tear'],
  greatRunes: ['greatRune'],
  spiritAshes: ['spiritAsh'],
};

/** Whether tracking can mark this kind of item collected. */
export const isTrackable = (ref: ItemRef) => KEY_SLOTS[ref.file] !== undefined;

/** Whether the player has collected the item: any of its tracking keys is collected. */
export function isCollected(ref: ItemRef, collected: ReadonlySet<string>): boolean {
  return (KEY_SLOTS[ref.file] ?? []).some((slot) => collected.has(`${slot}:${ref.id}`));
}

export interface StopProgress {
  /** Per stop, in order. */
  done: boolean[];
  /** Index of the first stop not done; -1 when every stop is. */
  next: number;
  doneCount: number;
}

/**
 * Which stops are done. A stop with the build's tracked items is done when all of them are collected.
 * Any other stop (key items, a boss, an Ash of War) is done once a later stop with tracked items is:
 * the player has evidently moved past it.
 */
export function stopProgress(
  stops: RouteStop[],
  collected: readonly string[],
  own: ReadonlySet<string>,
): StopProgress {
  const have = new Set(collected);
  const tracked = stops.map(({ step }) =>
    step.actions
      .flatMap((action) => action.items)
      .filter((item) => own.has(refKey(item.ref)) && isTrackable(item.ref)),
  );
  const done = tracked.map(
    (items) => items.length > 0 && items.every((item) => isCollected(item.ref, have)),
  );
  // From the end: is any later tracked stop done?
  let laterDone = false;
  for (let index = stops.length - 1; index >= 0; index--) {
    if (tracked[index]!.length === 0) done[index] = laterDone;
    else laterDone ||= done[index]!;
  }
  return { done, next: done.indexOf(false), doneCount: done.filter(Boolean).length };
}
