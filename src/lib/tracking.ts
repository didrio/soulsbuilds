// Tracking a build (T34): which of the build's items the player has collected and how far their stats
// are, as pure functions. The state lives in users/{uid}/tracking/{buildId} (signed in) or local
// storage (signed out); docs/architecture.md "Tracking".
import { calculateLevel, MAX_STAT, STAT_KEYS, type StatKey, type Stats } from './buildMath';
import type { Equipment } from './models';

/** One player's progress on one build, as the app holds it (dates as Dates). */
export interface TrackingState {
  /** Item keys (`trackKey`) the player has marked collected. */
  collected: string[];
  /** Item keys the player has seen on the build, so items the author adds later show as new. */
  seen: string[];
  /**
   * Route stops without tracked items that the player marked done (T44), by the gates and items on
   * them (`stopMarkKeys` in features/editor/guide/progress.ts). Not part of the percentage.
   */
  marked: string[];
  /** The player's attribute levels. */
  stats: Stats;
  startedAt: Date;
  /** When it first reached 100%; null while in progress. */
  completedAt: Date | null;
}

/**
 * The most keys a tracking doc holds in each list (firestore.rules checks it). A build has at most 30
 * items; marks are kept to the route's current stops.
 */
export const MAX_TRACKED_KEYS = 64;

/** Where a stat starts without a starting class: the Wretch's 10 (lowered to the target). */
export const NO_CLASS_STAT = 10;

const SINGLE_SLOTS = new Set(['helm', 'chest', 'gauntlet', 'leg', 'greatRune', 'spiritAsh']);
// Lists saved compacted (no slot positions): keyed by group, so a spell listed twice is one item.
const LIST_GROUPS: Record<string, string> = { tal: 'talisman', tear: 'tear', spell: 'spell' };

/**
 * An item's tracking key from its editor slot id ("weapon1", "tal2", "spell3", "helm") and game ID, or
 * null for slots that aren't tracked (arrows and consumables: bought or crafted in bulk). Weapons are
 * keyed by slot, so two copies of a weapon are two items; talismans, tears and spells by group.
 */
export function trackKey(slot: string, itemId: number): string | null {
  if (/^weapon[1-6]$/.test(slot) || SINGLE_SLOTS.has(slot)) return `${slot}:${itemId}`;
  const group = /^(tal|tear|spell)\d+$/.exec(slot)?.[1];
  return group ? `${LIST_GROUPS[group]}:${itemId}` : null;
}

/** The build's tracked items as keys, in Loadout order, without duplicates. */
export function trackedItems(equipment: Equipment): string[] {
  const keys: (string | null)[] = [
    ...equipment.weapons.map((id, index) => (id === null ? null : `weapon${index + 1}:${id}`)),
    ...(['helm', 'chest', 'gauntlet', 'leg'] as const).map((slot) =>
      equipment[slot] === null ? null : `${slot}:${equipment[slot]}`,
    ),
    ...equipment.talismans.map((id) => `talisman:${id}`),
    ...equipment.tears.map((id) => `tear:${id}`),
    ...(['greatRune', 'spiritAsh'] as const).map((slot) =>
      equipment[slot] === null ? null : `${slot}:${equipment[slot]}`,
    ),
    ...equipment.spells.map((id) => `spell:${id}`),
  ];
  return [...new Set(keys.filter((key): key is string => key !== null))];
}

const mapStats = (fn: (key: StatKey) => number) =>
  Object.fromEntries(STAT_KEYS.map((key) => [key, fn(key)])) as Stats;

/**
 * Where the player's stats start: the build's starting class, or 10 in every stat (lowered to the
 * target where it's below 10) for builds without one. The − buttons stop here.
 */
export function trackingBaseline(target: Stats, classStats: Stats | null): Stats {
  return classStats ? { ...classStats } : mapStats((key) => Math.min(NO_CLASS_STAT, target[key]));
}

export interface TrackingContext {
  /** The build's tracked items (`trackedItems`). */
  items: string[];
  /** The build's stats. */
  target: Stats;
  baseline: Stats;
}

export interface TrackingProgress {
  gear: { done: number; total: number };
  level: { yours: number; target: number };
  /** The levels half, 0–100 (100 when there's nothing to level). */
  levelPercent: number;
  /** Half gear, half levels, rounded down: 100 only when complete. */
  percent: number;
  complete: boolean;
}

/**
 * How far the player is. Gear: tracked items collected out of the build's current items (items the
 * author removed don't count). Levels: the sum of min(yours, target) over the 8 stats, measured from
 * the baseline to the target. The percentage averages the two halves; a half with nothing to measure
 * (no items, or every stat already at its target from the start) is left out.
 */
export function trackingProgress(
  state: Pick<TrackingState, 'collected' | 'stats'>,
  { items, target, baseline }: TrackingContext,
): TrackingProgress {
  const collected = new Set(state.collected);
  const done = items.filter((key) => collected.has(key)).length;
  const sum = (fn: (key: StatKey) => number) =>
    STAT_KEYS.reduce((total, key) => total + fn(key), 0);
  const levelsStart = sum((key) => Math.min(baseline[key], target[key]));
  const levelsDone = sum((key) => Math.min(state.stats[key], target[key]));
  const levelsTotal = sum((key) => target[key]);

  const gearFraction = items.length > 0 ? done / items.length : null;
  const levelFraction =
    levelsTotal > levelsStart ? (levelsDone - levelsStart) / (levelsTotal - levelsStart) : null;
  const halves = [gearFraction, levelFraction].filter((part): part is number => part !== null);
  const average = halves.length ? halves.reduce((a, b) => a + b, 0) / halves.length : 1;
  const complete =
    done === items.length && STAT_KEYS.every((key) => state.stats[key] >= target[key]);

  return {
    gear: { done, total: items.length },
    level: { yours: calculateLevel(state.stats), target: calculateLevel(target) },
    levelPercent: levelFraction === null ? 100 : Math.floor(Math.max(0, levelFraction) * 100),
    percent: complete ? 100 : Math.min(99, Math.floor(Math.max(0, average) * 100)),
    complete,
  };
}

/** Items on the build the player hasn't seen yet (added by the author since), not collected. */
export function newItems(state: Pick<TrackingState, 'collected' | 'seen'>, items: string[]) {
  const known = new Set([...state.seen, ...state.collected]);
  return items.filter((key) => !known.has(key));
}

/** A fresh start: nothing collected, the stats at the baseline, every current item seen. */
export function startTracking(context: TrackingContext, now: Date): TrackingState {
  const state = {
    collected: [],
    seen: [...context.items],
    marked: [],
    stats: { ...context.baseline },
    startedAt: now,
  };
  return { ...state, completedAt: trackingProgress(state, context).complete ? now : null };
}

export type TrackingChange =
  /**
   * Checking an item off on the route, or undoing it (T46): its keys (a weapon the build holds in two
   * slots has two). None collected: all of them are; otherwise none is.
   */
  | { type: 'toggle'; keys: string[] }
  | { type: 'stat'; key: StatKey; value: number }
  /** "Got it" on the new-items notice. */
  | { type: 'acknowledge' }
  /**
   * "Mark done" on a route stop (T44), or undoing it: the stop's mark keys, and every mark key on the
   * route now (marks of stops the author's edits removed are dropped).
   */
  | { type: 'mark'; keys: string[]; route: string[] };

/**
 * The state after a player's change. Keys are kept to the build's current items (so the doc stays
 * small). `completedAt` is set when the build first reaches 100% and cleared when the player's own
 * change takes it below; acknowledging new items doesn't touch it, so an author's edit alone never
 * un-completes a build.
 */
export function applyChange(
  state: TrackingState,
  change: TrackingChange,
  context: TrackingContext,
  now: Date,
): TrackingState {
  const current = new Set(context.items);
  const keep = (keys: string[]) => keys.filter((key) => current.has(key));
  let { collected, seen, stats } = state;

  if (change.type === 'mark') {
    const marks = new Set(state.marked);
    const on = !change.keys.every((key) => marks.has(key));
    change.keys.forEach((key) => (on ? marks.add(key) : marks.delete(key)));
    const route = new Set(change.route);
    const marked = [...marks].filter((key) => route.has(key)).slice(0, MAX_TRACKED_KEYS);
    // The percentage leaves marks out, so completedAt stays as it is.
    return { ...state, marked };
  }

  if (change.type === 'toggle') {
    const keys = change.keys.filter((key) => current.has(key));
    if (!keys.length) return state;
    const on = !keys.some((key) => collected.includes(key));
    collected = on
      ? [...collected, ...keys.filter((key) => !collected.includes(key))]
      : collected.filter((key) => !keys.includes(key));
    seen = [...seen, ...keys.filter((key) => !seen.includes(key))];
  } else if (change.type === 'stat') {
    const min = context.baseline[change.key];
    const value = Math.min(MAX_STAT, Math.max(min, Math.round(change.value)));
    stats = { ...stats, [change.key]: value };
  } else {
    seen = [...context.items];
  }

  const next = { ...state, collected: keep(collected), seen: keep(seen), stats };
  if (change.type === 'acknowledge') return next;
  const { complete } = trackingProgress(next, context);
  return { ...next, completedAt: complete ? (state.completedAt ?? now) : null };
}

/** Whole days from start to finish ("12 days"), at least 0. */
export const daysBetween = (from: Date, to: Date) =>
  Math.max(0, Math.round((to.getTime() - from.getTime()) / 86_400_000));

/**
 * Where a player stands on a build, as the build's public counters see it (T36): no tracking doc,
 * one in progress, or one finished.
 */
export type TrackingStatus = 'none' | 'playing' | 'finished';

export const trackingStatus = (state: Pick<TrackingState, 'completedAt'> | null): TrackingStatus =>
  state === null ? 'none' : state.completedAt ? 'finished' : 'playing';

/** The counters on builds/{id}: everyone tracking it, and those who finished it (firestore.rules). */
export interface TrackingCounters {
  playerCount: number;
  finishedCount: number;
}

const counters = (status: TrackingStatus): TrackingCounters => ({
  playerCount: status === 'none' ? 0 : 1,
  finishedCount: status === 'finished' ? 1 : 0,
});

/** How a player's status change moves the build's counters (each −1, 0 or +1). */
export function counterDelta(from: TrackingStatus, to: TrackingStatus): TrackingCounters {
  const [before, after] = [counters(from), counters(to)];
  return {
    playerCount: after.playerCount - before.playerCount,
    finishedCount: after.finishedCount - before.finishedCount,
  };
}
