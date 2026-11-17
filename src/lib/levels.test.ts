import { describe, expect, it } from 'vitest';
import { MAX_LEVEL } from './buildMath';
import { LEVEL_BANDS, levelBand } from './levels';

describe('level bands (T79)', () => {
  it('cover every level from 1 to the cap, without gaps or overlaps', () => {
    expect(LEVEL_BANDS[0]!.minLevel).toBe(1);
    expect(LEVEL_BANDS.at(-1)!.maxLevel).toBe(MAX_LEVEL);
    LEVEL_BANDS.slice(1).forEach((band, i) => {
      expect(band.minLevel).toBe(LEVEL_BANDS[i]!.maxLevel + 1);
    });
  });

  it('puts a level in its band, edges included', () => {
    expect(levelBand(1).key).toBe('early');
    expect(levelBand(50).key).toBe('early');
    expect(levelBand(51).key).toBe('mid');
    expect(levelBand(124).key).toBe('late');
    expect(levelBand(125).key).toBe('pvp');
    expect(levelBand(150).key).toBe('pvp');
    expect(levelBand(151).key).toBe('end');
    expect(levelBand(MAX_LEVEL).key).toBe('end');
    expect(levelBand(MAX_LEVEL + 5).key).toBe('end');
  });
});
