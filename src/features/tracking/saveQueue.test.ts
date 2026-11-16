import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TrackingState } from '@/lib/tracking';
import { deleteNow, flushSaves, noteLoaded, scheduleSave } from './saveQueue';

const firebase = vi.hoisted(() => ({
  saveTracking: vi.fn(),
  deleteTracking: vi.fn(),
}));
vi.mock('@/lib/firebase', () => firebase);

const STATS = { vigor: 10, mind: 10, end: 10, str: 10, dex: 10, int: 10, fai: 10, arc: 10 };
const playing: TrackingState = {
  collected: [],
  seen: [],
  marked: [],
  stats: STATS,
  startedAt: new Date('2026-11-10'),
  completedAt: null,
};
const finished: TrackingState = { ...playing, completedAt: new Date('2026-11-16') };

let buildId = '';
let next = 0;
const save = (state: TrackingState, onError = vi.fn()) => {
  scheduleSave('u', buildId, state, onError, 0);
  flushSaves();
  return onError;
};
const lastFrom = () => firebase.saveTracking.mock.lastCall?.[3] as string;

beforeEach(() => {
  // A fresh record per test: the queue remembers statuses per user and build.
  buildId = `B${(next += 1)}`;
  firebase.saveTracking.mockResolvedValue(undefined);
  firebase.deleteTracking.mockResolvedValue(undefined);
});
afterEach(() => vi.clearAllMocks());

describe('saveQueue: the database status behind each write (T36 counters)', () => {
  it('sends the status the database has, and remembers what it wrote', () => {
    noteLoaded('u', buildId, null);
    save(playing);
    expect(lastFrom()).toBe('none');
    save(playing);
    expect(lastFrom()).toBe('playing');
    save(finished);
    expect(lastFrom()).toBe('playing');
    save(playing);
    expect(lastFrom()).toBe('finished');
  });

  it('starts from what was read', () => {
    noteLoaded('u', buildId, finished);
    save(finished);
    expect(lastFrom()).toBe('finished');
  });

  it('forgets the status after a failed write (the refetch seeds it again)', async () => {
    noteLoaded('u', buildId, playing);
    firebase.saveTracking.mockRejectedValueOnce(new Error('denied'));
    const onError = save(finished);
    await vi.waitFor(() => expect(onError).toHaveBeenCalled());
    save(finished);
    expect(lastFrom()).toBe('none');
  });

  it('deletes with the stored status, and only what was written', async () => {
    noteLoaded('u', buildId, null);
    // Started and stopped before the first write went out: nothing to delete.
    scheduleSave('u', buildId, playing, vi.fn(), 1000);
    await deleteNow('u', buildId);
    expect(firebase.saveTracking).not.toHaveBeenCalled();
    expect(firebase.deleteTracking).not.toHaveBeenCalled();

    save(finished);
    await deleteNow('u', buildId);
    expect(firebase.deleteTracking).toHaveBeenCalledWith('u', buildId, 'finished');
    save(playing);
    expect(lastFrom()).toBe('none');
  });
});
