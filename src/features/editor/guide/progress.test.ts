import { describe, expect, it } from 'vitest';
import {
  isCollected,
  isTrackable,
  itemTrackKeys,
  routeMarkKeys,
  routeStops,
  stopMarkKeys,
  stopProgress,
  type RouteStop,
} from './progress';
import type { ItemRef, Route, RouteLeg, RouteStep } from './route';

const ref = (file: ItemRef['file'], id: number): ItemRef => ({ file, id });
const step = (...refs: ItemRef[]): RouteStep => ({
  location: null,
  actions: [{ kind: 'pickup', detail: '', items: refs.map((r) => ({ ref: r })) }],
});
const leg = (...steps: RouteStep[]): RouteLeg => ({ kind: 'region', region: null, steps });

describe('routeStops', () => {
  it('numbers the steps of every leg as one list', () => {
    const route: Route = { legs: [leg(step(), step()), leg(step())] };
    expect(routeStops(route).map((stop) => stop.number)).toEqual([1, 2, 3]);
  });
});

describe('isCollected', () => {
  const have = new Set(['weapon4:7', 'chest:8', 'talisman:9', 'greatRune:191']);

  it('matches a weapon in any slot, armor in its piece, and groups by kind', () => {
    expect(isCollected(ref('weapons', 7), have)).toBe(true);
    expect(isCollected(ref('armor', 8), have)).toBe(true);
    expect(isCollected(ref('talismans', 9), have)).toBe(true);
    expect(isCollected(ref('greatRunes', 191), have)).toBe(true);
    // Same ID, different kind of item: not collected.
    expect(isCollected(ref('spells', 9), have)).toBe(false);
  });

  it('never counts untracked items', () => {
    for (const file of ['ashesOfWar', 'arrows', 'consumables', 'keyItems'] as const) {
      expect(isTrackable(ref(file, 7))).toBe(false);
      expect(isCollected(ref(file, 7), new Set([`weapon1:7`]))).toBe(false);
    }
  });
});

describe('itemTrackKeys', () => {
  const items = ['weapon1:7', 'weapon4:7', 'helm:8', 'talisman:7', 'spell:9'];

  it('finds the item’s keys on the build: a weapon in each slot it’s held in (T46)', () => {
    expect(itemTrackKeys(ref('weapons', 7), items)).toEqual(['weapon1:7', 'weapon4:7']);
    expect(itemTrackKeys(ref('armor', 8), items)).toEqual(['helm:8']);
    expect(itemTrackKeys(ref('talismans', 7), items)).toEqual(['talisman:7']);
    // Not on the build, or not tracked: none.
    expect(itemTrackKeys(ref('spells', 7), items)).toEqual([]);
    expect(itemTrackKeys(ref('ashesOfWar', 7), items)).toEqual([]);
  });
});

describe('stopProgress', () => {
  const W1 = ref('weapons', 1);
  const W2 = ref('weapons', 2);
  const KNIFE = ref('keyItems', 8590);
  const ASH = ref('ashesOfWar', 60600);
  const own = new Set(['weapons:1', 'weapons:2', 'ashesOfWar:60600']);
  const boss: RouteStep = {
    location: null,
    actions: [{ kind: 'gate', detail: 'Defeat Margit', items: [{ ref: KNIFE }], gate: 'margit' }],
  };
  // 1 knife · 2 weapon 1 · 3 ash (own, untracked) · 4 weapon 2 · 5 Margit (drops the knife, say)
  const stops: RouteStop[] = routeStops({
    legs: [leg(step(KNIFE), step(W1), step(ASH), step(W2), boss)],
  });

  it('marks nothing done at the start; the first stop is next', () => {
    expect(stopProgress(stops, [], own, [])).toEqual({
      done: [false, false, false, false, false],
      markable: [true, false, true, false, true],
      next: 0,
      doneCount: 0,
    });
  });

  it('counts a gear stop done when all its tracked items are, and nothing before it', () => {
    // Players go out of order: weapon 2 says nothing about the knife, weapon 1 or the ash.
    const progress = stopProgress(stops, ['weapon3:2'], own, []);
    expect(progress.done).toEqual([false, false, false, true, false]);
    expect(progress.next).toBe(0);
    expect(progress.doneCount).toBe(1);
  });

  it('counts a stop without tracked items done when it is marked, and nothing before it', () => {
    const progress = stopProgress(stops, [], own, ['ashesOfWar:60600']);
    expect(progress.done).toEqual([false, false, true, false, false]);
    expect(stopProgress(stops, ['weapon1:1'], own, ['keyItems:8590']).next).toBe(2);
  });

  it('needs every mark key of a stop: its gate and its items', () => {
    expect(stopMarkKeys(stops[4]!, own)).toEqual(['gate:margit', 'keyItems:8590']);
    expect(stopProgress(stops, [], own, ['gate:margit']).done[4]).toBe(false);
    // The knife is on stop 1 too: marking Margit marks both.
    expect(stopProgress(stops, [], own, ['gate:margit', 'keyItems:8590']).done).toEqual([
      true,
      false,
      false,
      false,
      true,
    ]);
  });

  it('ignores marks on gear stops', () => {
    expect(stopMarkKeys(stops[1]!, own)).toEqual([]);
    expect(stopProgress(stops, [], own, ['weapons:1']).done[1]).toBe(false);
  });

  it('needs every tracked item of a stop', () => {
    const both = routeStops({ legs: [leg(step(W1, W2))] });
    expect(stopProgress(both, ['weapon1:1'], own, []).done).toEqual([false]);
    expect(stopProgress(both, ['weapon1:1', 'weapon2:2'], own, []).next).toBe(-1);
  });

  it('ignores items that are not the build’s (a base armor to alter)', () => {
    const base = routeStops({ legs: [leg(step(ref('armor', 100), W1))] });
    expect(stopProgress(base, ['weapon1:1'], own, []).done).toEqual([true]);
    // As a mark key, it's one of the stop's things.
    const alone = routeStops({ legs: [leg(step(ref('armor', 100)))] });
    expect(stopMarkKeys(alone[0]!, own)).toEqual(['armor:100']);
  });

  it('lists every mark key on the route once', () => {
    expect(routeMarkKeys(stops, own)).toEqual(['keyItems:8590', 'ashesOfWar:60600', 'gate:margit']);
  });
});
