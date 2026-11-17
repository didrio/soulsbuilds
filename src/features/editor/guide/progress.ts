// The route during a run (T35): the route as numbered stops, and which of them a tracking player has
// done (T34's `collected` item keys, and T44's stops marked done). Pure.
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

/**
 * An item's tracking keys on this build (`items`: `trackedItems(equipment)`): one, or one per slot for
 * a weapon held twice. Checking the item off on the route collects all of them (T46).
 */
export function itemTrackKeys(ref: ItemRef, items: readonly string[]): string[] {
  const slots = KEY_SLOTS[ref.file] ?? [];
  return items.filter((key) => {
    const [slot, id] = key.split(':');
    return slots.includes(slot ?? '') && Number(id) === ref.id;
  });
}

/** The build's items on a stop that tracking checks off (on the route, T46). */
const trackedOn = (stop: RouteStop, own: ReadonlySet<string>) =>
  stop.step.actions
    .flatMap((action) => action.items)
    .filter((item) => own.has(refKey(item.ref)) && isTrackable(item.ref));

/**
 * What marks a stop without tracked items done (T44): its gates (`gate:margit`) and its items
 * (`keyItems:8590`). Keyed by the things on it, not its number, so a mark survives the author editing
 * the build and the route moving. A stop is marked when all of them are.
 */
export function stopMarkKeys(stop: RouteStop, own: ReadonlySet<string>): string[] {
  const keys = stop.step.actions.flatMap((action) => [
    ...(action.gate ? [`gate:${action.gate}`] : []),
    ...action.items
      .filter((item) => !(own.has(refKey(item.ref)) && isTrackable(item.ref)))
      .map((item) => refKey(item.ref)),
  ]);
  return [...new Set(keys)];
}

/** Every mark key on the route: a player's marks are kept to these. */
export const routeMarkKeys = (stops: RouteStop[], own: ReadonlySet<string>) => [
  ...new Set(stops.flatMap((stop) => stopMarkKeys(stop, own))),
];

/**
 * A tracking player's progress, as the route reads it, and how they check items off (T46) and mark a
 * stop done (T44).
 */
export interface RouteTracking {
  collected: string[];
  marked: string[];
  /** Checks an item off, or undoes it: its tracking keys (`itemTrackKeys`). */
  onToggle: (keys: string[]) => void;
  /** Marks a stop done, or undoes it: its mark keys, and every mark key on the route. */
  onMark: (keys: string[], route: string[]) => void;
}

export interface StopProgress {
  /** Per stop, in order. */
  done: boolean[];
  /** Per stop: it has none of the build's tracked items, so the player marks it done (T44). */
  markable: boolean[];
  /** Index of the first stop not done; -1 when every stop is. */
  next: number;
  doneCount: number;
}

/**
 * Which stops are done. A stop with the build's tracked items is done when all of them are collected;
 * any other stop (key items, a boss, an Ash of War) when the player has marked it done (T44). Nothing
 * else counts: players go out of order, so a later stop being done says nothing about an earlier one.
 */
export function stopProgress(
  stops: RouteStop[],
  collected: readonly string[],
  own: ReadonlySet<string>,
  marked: readonly string[],
): StopProgress {
  const have = new Set(collected);
  const marks = new Set(marked);
  const markable = stops.map((stop) => trackedOn(stop, own).length === 0);
  const done = stops.map((stop, index) => {
    if (!markable[index]) return trackedOn(stop, own).every((item) => isCollected(item.ref, have));
    const keys = stopMarkKeys(stop, own);
    return keys.length > 0 && keys.every((key) => marks.has(key));
  });
  return { done, markable, next: done.indexOf(false), doneCount: done.filter(Boolean).length };
}
