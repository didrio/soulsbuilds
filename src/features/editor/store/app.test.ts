import { describe, expect, it } from 'vitest';
import { makeStore } from '@/test/render';
import { clearApp, openPicker } from './app';

describe('item picker state', () => {
  it('opens for a slot and clearApp resets every picker field', () => {
    const store = makeStore();
    store.dispatch(
      openPicker({
        slotType: 'SLOT_TYPE_WEAPON',
        editSlot: 'weapon2',
        editAffinitySlot: 'weaponAffinity2',
        editSubSlot: 'weaponSkill2',
      }),
    );
    expect(store.getState().app.slotType).toBe('SLOT_TYPE_WEAPON');
    store.dispatch(clearApp());
    expect(store.getState().app).toEqual({
      editAffinitySlot: null,
      editSlot: null,
      editSubSlot: null,
      slotType: null,
    });
  });
});
