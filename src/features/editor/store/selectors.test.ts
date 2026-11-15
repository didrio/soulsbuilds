import { describe, expect, it } from 'vitest';
import type { Talisman, Weapon } from '@/data';
import { makeStore } from '@/test/render';
import { updateTal, updateWeapon } from './equipment';
import { selectTals, selectWeapons } from './selectors';

describe('build selectors (what gets saved to Firestore)', () => {
  it('keeps weapon slot positions, with null for empty slots', () => {
    const store = makeStore();
    store.dispatch(updateWeapon({ id: 'weapon1', item: { name: 'Moonveil' } as Weapon }));
    store.dispatch(updateWeapon({ id: 'weapon4', item: { name: 'Brass Shield' } as Weapon }));
    expect(selectWeapons(store.getState())).toEqual([
      'Moonveil',
      null,
      null,
      'Brass Shield',
      null,
      null,
    ]);
  });

  it('compacts talismans, so their slot positions are not saved', () => {
    const store = makeStore();
    store.dispatch(updateTal({ id: 'tal2', item: { name: 'Shard of Alexander' } as Talisman }));
    store.dispatch(updateTal({ id: 'tal4', item: { name: 'Godfrey Icon' } as Talisman }));
    expect(selectTals(store.getState())).toEqual(['Shard of Alexander', 'Godfrey Icon']);
  });
});
