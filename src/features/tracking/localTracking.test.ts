import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TrackingState } from '@/lib/tracking';
import {
  keepProgressLater,
  readAllLocal,
  readLocal,
  removeLocal,
  setKeepProgressLater,
  writeLocal,
} from './localTracking';

const state: TrackingState = {
  collected: ['helm:680000'],
  seen: ['helm:680000', 'spell:4000'],
  stats: { vigor: 20, mind: 10, end: 10, str: 10, dex: 10, int: 10, fai: 10, arc: 10 },
  startedAt: new Date('2026-11-10T12:00:00Z'),
  completedAt: null,
};

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe('localTracking', () => {
  it('writes, reads back and removes progress per build', () => {
    expect(readLocal('B1')).toBeNull();
    writeLocal('B1', state);
    writeLocal('B2', { ...state, completedAt: new Date('2026-11-16T12:00:00Z') });
    expect(readLocal('B1')).toEqual(state);
    expect(Object.keys(readAllLocal())).toEqual(['B1', 'B2']);
    removeLocal('B1');
    removeLocal('B2');
    expect(readAllLocal()).toEqual({});
    expect(localStorage.getItem('soulsbuilds.tracking.v1')).toBeNull();
  });

  it('ignores corrupt storage and entries of the wrong shape', () => {
    localStorage.setItem('soulsbuilds.tracking.v1', '{not json');
    expect(readAllLocal()).toEqual({});
    localStorage.setItem(
      'soulsbuilds.tracking.v1',
      JSON.stringify({ B1: { collected: 'x' }, B2: { ...state, startedAt: 'never' } }),
    );
    expect(readAllLocal()).toEqual({});
    expect(readLocal('B1')).toBeNull();
  });

  it('works without storage (blocked or full)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => writeLocal('B1', state)).not.toThrow();
    expect(readLocal('B1')).toBeNull();
    expect(keepProgressLater()).toBe(false);
    expect(() => setKeepProgressLater()).not.toThrow();
  });

  it('remembers "Later" for the session', () => {
    expect(keepProgressLater()).toBe(false);
    setKeepProgressLater();
    expect(keepProgressLater()).toBe(true);
  });
});
