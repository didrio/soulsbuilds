import { describe, expect, it } from 'vitest';
import { iconUrl } from '@/data/core';
import { placeholderUrl } from './slots';

describe('placeholderUrl', () => {
  it('uses the 2022 menu icon, or a game icon when given one', () => {
    expect(placeholderUrl('weapon')).toBe('/assets/menu/weapon.png');
    expect(placeholderUrl('', 3201)).toBe(iconUrl(3201));
  });

  it('is null for slots without a placeholder (no request for /assets/menu/.png)', () => {
    expect(placeholderUrl('')).toBeNull();
    expect(placeholderUrl(undefined)).toBeNull();
  });
});
