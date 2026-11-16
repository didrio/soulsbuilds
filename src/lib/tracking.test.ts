import { describe, expect, it } from 'vitest';
import { emptyEquipment } from '@/test/fixtures';
import type { Stats } from './buildMath';
import {
  applyChange,
  daysBetween,
  mergeTracking,
  newItems,
  startTracking,
  trackedItems,
  trackingBaseline,
  trackingProgress,
  trackKey,
  type TrackingContext,
  type TrackingState,
} from './tracking';

const stats = (values: number[]): Stats => {
  const [vigor, mind, end, str, dex, int, fai, arc] = values as [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  return { vigor, mind, end, str, dex, int, fai, arc };
};

const WRETCH = stats([10, 10, 10, 10, 10, 10, 10, 10]);
const NOW = new Date('2026-11-16T12:00:00Z');

describe('trackKey', () => {
  it('keys weapons and single slots by slot, lists by group, and skips arrows and consumables', () => {
    expect(trackKey('weapon4', 9000000)).toBe('weapon4:9000000');
    expect(trackKey('helm', 680000)).toBe('helm:680000');
    expect(trackKey('greatRune', 191)).toBe('greatRune:191');
    expect(trackKey('tal3', 1000)).toBe('talisman:1000');
    expect(trackKey('tear2', 11)).toBe('tear:11');
    expect(trackKey('spell12', 4000)).toBe('spell:4000');
    expect(trackKey('arrow1', 50000000)).toBeNull();
    expect(trackKey('con2', 1)).toBeNull();
  });
});

describe('trackedItems', () => {
  it('lists the filled slots in Loadout order, a spell listed twice once', () => {
    const equipment = {
      ...emptyEquipment(),
      weapons: [1, null, null, 1, null, 2],
      arrows: [5, null, null, null],
      helm: 3,
      talismans: [7, 8],
      tears: [9],
      spiritAsh: 10,
      spells: [20, 20, 21],
      consumables: [30],
    };
    expect(trackedItems(equipment)).toEqual([
      'weapon1:1',
      'weapon4:1',
      'weapon6:2',
      'helm:3',
      'talisman:7',
      'talisman:8',
      'tear:9',
      'spiritAsh:10',
      'spell:20',
      'spell:21',
    ]);
    expect(trackedItems(emptyEquipment())).toEqual([]);
  });

  it('gives the same keys as the Loadout slots', () => {
    const equipment = { ...emptyEquipment(), talismans: [7], spells: [20] };
    expect(trackedItems(equipment)).toEqual([trackKey('tal1', 7), trackKey('spell1', 20)]);
  });
});

describe('trackingBaseline', () => {
  it('is the starting class, or 10 lowered to the target', () => {
    const samurai = stats([12, 11, 13, 12, 15, 9, 8, 8]);
    const target = stats([40, 15, 25, 18, 40, 9, 8, 45]);
    expect(trackingBaseline(target, samurai)).toEqual(samurai);
    expect(trackingBaseline(target, null)).toEqual(stats([10, 10, 10, 10, 10, 9, 8, 10]));
  });
});

const context = (overrides: Partial<TrackingContext> = {}): TrackingContext => ({
  items: ['weapon1:1', 'helm:3', 'talisman:7', 'spell:20'],
  target: stats([20, 10, 10, 10, 10, 10, 10, 10]),
  baseline: WRETCH,
  ...overrides,
});

describe('trackingProgress', () => {
  it('averages gear and levels', () => {
    const progress = trackingProgress(
      { collected: ['weapon1:1'], stats: stats([15, 10, 10, 10, 10, 10, 10, 10]) },
      context(),
    );
    expect(progress.gear).toEqual({ done: 1, total: 4 });
    expect(progress.level).toEqual({ yours: 6, target: 11 });
    expect(progress.levelPercent).toBe(50);
    expect(progress.percent).toBe(37); // (25 + 50) / 2, rounded down
    expect(progress.complete).toBe(false);
  });

  it('counts only the build’s current items and caps stats at the target', () => {
    const progress = trackingProgress(
      { collected: ['weapon1:1', 'removed:9'], stats: stats([60, 10, 10, 10, 10, 10, 10, 10]) },
      context(),
    );
    expect(progress.gear.done).toBe(1);
    expect(progress.levelPercent).toBe(100);
  });

  it('shows 100 only when complete', () => {
    const items = Array.from({ length: 200 }, (_, index) => `spell:${index}`);
    const almost = trackingProgress(
      { collected: items.slice(1), stats: stats([20, 10, 10, 10, 10, 10, 10, 10]) },
      context({ items }),
    );
    expect(almost.percent).toBe(99);
    const done = trackingProgress(
      { collected: items, stats: stats([20, 10, 10, 10, 10, 10, 10, 10]) },
      context({ items }),
    );
    expect(done).toMatchObject({ percent: 100, complete: true });
  });

  it('leaves out a half with nothing to measure', () => {
    // No items: levels only.
    expect(
      trackingProgress(
        { collected: [], stats: stats([15, 10, 10, 10, 10, 10, 10, 10]) },
        context({ items: [] }),
      ).percent,
    ).toBe(50);
    // Target = baseline: gear only.
    expect(
      trackingProgress({ collected: ['weapon1:1'], stats: WRETCH }, context({ target: WRETCH }))
        .percent,
    ).toBe(25);
  });
});

describe('startTracking and applyChange', () => {
  const ctx = context();
  const start = () => startTracking(ctx, NOW);

  it('starts at the baseline with every item seen', () => {
    expect(start()).toEqual({
      collected: [],
      seen: ctx.items,
      stats: WRETCH,
      startedAt: NOW,
      completedAt: null,
    });
  });

  it('toggles items and ignores keys that aren’t on the build', () => {
    const on = applyChange(start(), { type: 'toggle', key: 'helm:3' }, ctx, NOW);
    expect(on.collected).toEqual(['helm:3']);
    expect(applyChange(on, { type: 'toggle', key: 'helm:3' }, ctx, NOW).collected).toEqual([]);
    expect(applyChange(on, { type: 'toggle', key: 'nope:1' }, ctx, NOW)).toBe(on);
  });

  it('clamps stats to the baseline and 99', () => {
    const low = applyChange(start(), { type: 'stat', key: 'vigor', value: 3 }, ctx, NOW);
    expect(low.stats.vigor).toBe(10);
    const high = applyChange(start(), { type: 'stat', key: 'vigor', value: 120 }, ctx, NOW);
    expect(high.stats.vigor).toBe(99);
  });

  it('sets completedAt on reaching 100%, keeps it, and clears it when the player goes back', () => {
    let state = start();
    for (const key of ctx.items) state = applyChange(state, { type: 'toggle', key }, ctx, NOW);
    expect(state.completedAt).toBeNull();
    state = applyChange(state, { type: 'stat', key: 'vigor', value: 20 }, ctx, NOW);
    expect(state.completedAt).toEqual(NOW);
    const later = new Date('2026-11-20T12:00:00Z');
    state = applyChange(state, { type: 'stat', key: 'mind', value: 11 }, ctx, later);
    expect(state.completedAt).toEqual(NOW);
    state = applyChange(state, { type: 'toggle', key: 'helm:3' }, ctx, later);
    expect(state.completedAt).toBeNull();
  });

  it('keeps a finished build finished when the author adds an item, until the player acts', () => {
    let state = start();
    for (const key of ctx.items) state = applyChange(state, { type: 'toggle', key }, ctx, NOW);
    state = applyChange(state, { type: 'stat', key: 'vigor', value: 20 }, ctx, NOW);
    const edited = context({ items: [...ctx.items, 'talisman:8'] });
    expect(newItems(state, edited.items)).toEqual(['talisman:8']);
    const acknowledged = applyChange(state, { type: 'acknowledge' }, edited, NOW);
    expect(newItems(acknowledged, edited.items)).toEqual([]);
    expect(acknowledged.completedAt).toEqual(NOW);
  });

  it('drops keys the author removed', () => {
    let state = applyChange(start(), { type: 'toggle', key: 'helm:3' }, ctx, NOW);
    const edited = context({ items: ['weapon1:1'] });
    state = applyChange(state, { type: 'toggle', key: 'weapon1:1' }, edited, NOW);
    expect(state).toMatchObject({ collected: ['weapon1:1'], seen: ['weapon1:1'] });
  });
});

describe('mergeTracking', () => {
  it('unites both records', () => {
    const a: TrackingState = {
      collected: ['helm:3'],
      seen: ['helm:3'],
      stats: stats([20, 10, 10, 10, 10, 10, 10, 10]),
      startedAt: new Date('2026-11-10'),
      completedAt: null,
    };
    const b: TrackingState = {
      collected: ['weapon1:1', 'helm:3'],
      seen: ['weapon1:1'],
      stats: stats([15, 12, 10, 10, 10, 10, 10, 10]),
      startedAt: new Date('2026-11-12'),
      completedAt: new Date('2026-11-14'),
    };
    expect(mergeTracking(a, b)).toEqual({
      collected: ['helm:3', 'weapon1:1'],
      seen: ['helm:3', 'weapon1:1'],
      stats: stats([20, 12, 10, 10, 10, 10, 10, 10]),
      startedAt: new Date('2026-11-10'),
      completedAt: new Date('2026-11-14'),
    });
  });
});

describe('daysBetween', () => {
  it('counts whole days', () => {
    expect(daysBetween(new Date('2026-11-04T10:00Z'), new Date('2026-11-16T09:00Z'))).toBe(12);
    expect(daysBetween(NOW, NOW)).toBe(0);
  });
});
