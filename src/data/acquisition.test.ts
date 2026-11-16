import { describe, expect, it } from 'vitest';
import { getGate, getLocation, getRegion, implied, keyItemName, sourcesOf } from './acquisition';

describe('acquisition accessors', () => {
  it('looks up an item’s sources and their places', () => {
    const [first] = sourcesOf('weapons', 9060000); // Moonveil
    expect(first).toMatchObject({ kind: 'boss', detail: 'Magma Wyrm' });
    expect(getLocation(first?.location)?.name).toBe('Gael Tunnel');
    expect(getRegion(first?.region)?.name).toBe('Caelid');
    expect(sourcesOf('weapons', 1)).toEqual([]);
    expect(getLocation(null)).toBeUndefined();
  });

  it('resolves gates, key items and implied gates', () => {
    const knife = getGate('whetstone-knife');
    expect(knife?.item?.file).toBe('keyItems');
    expect(keyItemName(knife!.item!.id)).toBe('Whetstone Knife');
    expect(implied.ashesOfWar).toBe('whetstone-knife');
    expect(implied.affinities.cold).toBe('glintstone-whetblade');
  });
});
