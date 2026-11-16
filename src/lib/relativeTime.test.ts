import { describe, expect, it } from 'vitest';
import { relativeTime } from './relativeTime';

const now = new Date('2026-11-16T12:00:00Z');
const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000);
const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('relativeTime', () => {
  it.each([
    [0, 'just now'],
    [59, 'just now'],
    [-30, 'just now'], // a server clock slightly ahead
    [MINUTE, '1 minute ago'],
    [5 * MINUTE + 59, '5 minutes ago'],
    [HOUR, '1 hour ago'],
    [23 * HOUR, '23 hours ago'],
    [DAY, 'yesterday'],
    [3 * DAY, '3 days ago'],
    [7 * DAY, 'last week'],
    [20 * DAY, '2 weeks ago'],
    [30 * DAY, 'last month'],
    [75 * DAY, '2 months ago'],
    [365 * DAY, 'last year'],
    [800 * DAY, '2 years ago'],
  ])('%i seconds ago → %s', (seconds, expected) => {
    expect(relativeTime(ago(seconds), now)).toBe(expected);
  });
});
