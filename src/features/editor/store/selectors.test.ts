import { describe, expect, it } from 'vitest';
import { getTalisman, getWeapon } from '@/data';
import { MOONVEIL } from '@/test/fixtures';
import { makeStore } from '@/test/render';
import { updateTal, updateWeapon } from './equipment';
import { selectTals, selectWeapons } from './selectors';

const BRASS_SHIELD = 31130000;

describe('build selectors (what gets saved to Firestore)', () => {
  it('keeps weapon slot positions, with null for empty slots', () => {
    const store = makeStore();
    store.dispatch(updateWeapon({ id: 'weapon1', item: getWeapon(MOONVEIL)! }));
    store.dispatch(updateWeapon({ id: 'weapon4', item: getWeapon(BRASS_SHIELD)! }));
    expect(selectWeapons(store.getState())).toEqual([
      MOONVEIL,
      null,
      null,
      BRASS_SHIELD,
      null,
      null,
    ]);
  });

  it('compacts talismans, so their slot positions are not saved', () => {
    const store = makeStore();
    store.dispatch(updateTal({ id: 'tal2', item: getTalisman(1231)! }));
    store.dispatch(updateTal({ id: 'tal4', item: getTalisman(3090)! }));
    expect(selectTals(store.getState())).toEqual([1231, 3090]);
  });
});
