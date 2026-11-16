import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TrackingState } from '@/lib/tracking';
import { readAllLocal, readLocal, writeLocal } from './localTracking';
import { moveLocalTracking } from './useSyncLocalTracking';

const firebase = vi.hoisted(() => ({ getTracking: vi.fn(), saveTracking: vi.fn() }));
vi.mock('@/lib/firebase', () => firebase);

const stats = { vigor: 20, mind: 10, end: 10, str: 10, dex: 10, int: 10, fai: 10, arc: 10 };
const local: TrackingState = {
  collected: ['helm:1'],
  seen: ['helm:1', 'spell:2'],
  stats,
  startedAt: new Date('2026-11-10T12:00:00Z'),
  completedAt: null,
};

beforeEach(() => {
  vi.resetAllMocks();
  firebase.saveTracking.mockResolvedValue(undefined);
});
afterEach(() => localStorage.clear());

describe('moveLocalTracking', () => {
  it('moves this device’s progress into the account, merged with what’s there', async () => {
    writeLocal('B1', local);
    writeLocal('B2', local);
    firebase.getTracking.mockImplementation(async (_uid: string, buildId: string) =>
      buildId === 'B1'
        ? {
            ...local,
            collected: ['spell:2'],
            stats: { ...stats, vigor: 15, mind: 30 },
            startedAt: new Date('2026-11-01T12:00:00Z'),
          }
        : null,
    );
    const onMoved = vi.fn();
    expect(await moveLocalTracking('alice', onMoved)).toEqual(['B1', 'B2']);

    expect(firebase.saveTracking).toHaveBeenCalledWith('alice', 'B1', {
      ...local,
      collected: ['spell:2', 'helm:1'],
      stats: { ...stats, mind: 30 },
      startedAt: new Date('2026-11-01T12:00:00Z'),
    });
    expect(firebase.saveTracking).toHaveBeenCalledWith('alice', 'B2', local);
    expect(onMoved).toHaveBeenCalledTimes(2);
    expect(readAllLocal()).toEqual({});
  });

  it('keeps a build on this device when its save fails, to try again next time', async () => {
    writeLocal('B1', local);
    firebase.getTracking.mockResolvedValue(null);
    firebase.saveTracking.mockRejectedValue(new Error('offline'));
    expect(await moveLocalTracking('alice')).toEqual([]);
    expect(readLocal('B1')).toEqual(local);
  });
});
