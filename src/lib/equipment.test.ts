import { describe, expect, it } from 'vitest';
import { mainWeaponId } from './equipment';

describe('mainWeaponId', () => {
  it('takes the first filled main-hand slot', () => {
    expect(mainWeaponId({ weapons: [null, 12, 13, 1, null, null] })).toBe(12);
  });

  it('falls back to the off hand when the main hand is empty', () => {
    expect(mainWeaponId({ weapons: [null, null, null, null, 7, 8] })).toBe(7);
  });

  it('is null without weapons', () => {
    expect(mainWeaponId({ weapons: [null, null, null, null, null, null] })).toBeNull();
    expect(mainWeaponId({ weapons: [] })).toBeNull();
  });
});
