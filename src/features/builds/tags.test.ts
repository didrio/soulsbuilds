import { describe, expect, it } from 'vitest';
import { fitCount } from './tags';

describe('fitCount', () => {
  it('shows every chip when they all fit, with no room kept for "+N"', () => {
    // 50 + 6 + 60 + 6 + 40 = 162
    expect(fitCount([50, 60, 40], 162, 6, 30)).toBe(3);
  });

  it('keeps room for the "+N" chip when some are left over', () => {
    // 30 (+N) + 50 + 6 + 60 + 6 = 152 fits in 160; a third chip would not.
    expect(fitCount([50, 60, 40], 160, 6, 30)).toBe(2);
  });

  it('can show none, only "+N"', () => {
    expect(fitCount([200, 10], 100, 6, 30)).toBe(0);
  });

  it('shows all of them before layout (no width yet)', () => {
    expect(fitCount([50, 60], 0, 6, 30)).toBe(2);
  });

  it('handles no tags', () => {
    expect(fitCount([], 100, 6, 30)).toBe(0);
  });
});
