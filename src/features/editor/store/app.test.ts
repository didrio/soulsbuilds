import { describe, expect, it } from 'vitest';
import type { Weapon } from '@/data';
import { makeStore } from '@/test/render';
import { clearApp, closePicker, openPicker } from './app';
import { updateWeapon, updateWeaponAffinity, updateWeaponSkill } from './equipment';

const openWeaponPicker = (store: ReturnType<typeof makeStore>) =>
  store.dispatch(
    openPicker({
      slotType: 'SLOT_TYPE_WEAPON',
      editSlot: 'weapon2',
      editAffinitySlot: 'weaponAffinity2',
      editSubSlot: 'weaponSkill2',
    }),
  );

describe('item picker state', () => {
  it('closing the picker without choosing a weapon drops the affinity and skill picked for it', () => {
    const store = makeStore();
    openWeaponPicker(store);
    store.dispatch(updateWeaponAffinity({ id: 'weaponAffinity2', item: 'Heavy' }));
    store.dispatch(updateWeaponSkill({ id: 'weaponSkill2', item: 'Lion’s Claw' }));
    store.dispatch(closePicker());
    const { equipment, app } = store.getState();
    expect(equipment.weaponAffinity2).toBeNull();
    expect(equipment.weaponSkill2).toBeNull();
    expect(app.slotType).toBeNull();
  });

  it('keeps the affinity and skill when a weapon was chosen', () => {
    const store = makeStore();
    openWeaponPicker(store);
    store.dispatch(updateWeaponAffinity({ id: 'weaponAffinity2', item: 'Heavy' }));
    store.dispatch(updateWeapon({ id: 'weapon2', item: { name: 'Claymore' } as Weapon }));
    store.dispatch(closePicker());
    expect(store.getState().equipment.weaponAffinity2).toBe('Heavy');
  });

  it('clearApp resets every picker field, including the affinity slot', () => {
    const store = makeStore();
    openWeaponPicker(store);
    store.dispatch(clearApp());
    expect(store.getState().app).toEqual({
      editAffinitySlot: null,
      editSlot: null,
      editSubSlot: null,
      slotType: null,
    });
  });
});
