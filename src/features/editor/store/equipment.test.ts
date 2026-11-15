// The weapon reducers keep each weapon's Ash of War and affinity valid (src/data/rules.ts).
import { describe, expect, it } from 'vitest';
import { getAsh, getWeapon } from '@/data';
import { MOONVEIL, SEPPUKU_ASH, UCHIGATANA } from '@/test/fixtures';
import { makeStore } from '@/test/render';
import { updateWeapon, updateWeaponAffinity, updateWeaponSkill } from './equipment';

const CLAYMORE = 3180000;
const LIONS_CLAW_ASH = 10000;
const SPINNING_SLASH_ASH = 10300;
const SHIELD_BASH_ASH = 30000;

const slot2 = (store: ReturnType<typeof makeStore>) => {
  const { weapon2, weaponSkill2, weaponAffinity2 } = store.getState().equipment;
  return {
    weapon: weapon2?.name ?? null,
    ash: weaponSkill2?.id ?? null,
    affinity: weaponAffinity2,
  };
};

describe('weapon slots', () => {
  it('take an Ash of War and affinity only once the slot holds a weapon', () => {
    const store = makeStore();
    store.dispatch(updateWeaponSkill({ id: 'weaponSkill2', item: getAsh(SEPPUKU_ASH)! }));
    store.dispatch(updateWeaponAffinity({ id: 'weaponAffinity2', item: 'blood' }));
    expect(slot2(store)).toEqual({ weapon: null, ash: null, affinity: null });

    store.dispatch(updateWeapon({ id: 'weapon2', item: getWeapon(UCHIGATANA)! }));
    store.dispatch(updateWeaponSkill({ id: 'weaponSkill2', item: getAsh(SEPPUKU_ASH)! }));
    store.dispatch(updateWeaponAffinity({ id: 'weaponAffinity2', item: 'blood' }));
    expect(slot2(store)).toEqual({ weapon: 'Uchigatana', ash: SEPPUKU_ASH, affinity: 'blood' });
  });

  it("refuse an Ash the weapon can't take and an affinity it can't have", () => {
    const store = makeStore();
    store.dispatch(updateWeapon({ id: 'weapon2', item: getWeapon(UCHIGATANA)! }));
    store.dispatch(updateWeaponSkill({ id: 'weaponSkill2', item: getAsh(SHIELD_BASH_ASH)! }));
    expect(slot2(store).ash).toBeNull();
    store.dispatch(updateWeaponSkill({ id: 'weaponSkill2', item: getAsh(SEPPUKU_ASH)! }));
    store.dispatch(updateWeaponAffinity({ id: 'weaponAffinity2', item: 'fire' }));
    expect(slot2(store).affinity).toBeNull();
    store.dispatch(updateWeaponAffinity({ id: 'weaponAffinity2', item: 'standard' }));
    expect(slot2(store).affinity).toBeNull(); // Standard is stored as null
  });

  it('drop the affinity when a new Ash rules it out', () => {
    const store = makeStore();
    store.dispatch(updateWeapon({ id: 'weapon2', item: getWeapon(UCHIGATANA)! }));
    store.dispatch(updateWeaponAffinity({ id: 'weaponAffinity2', item: 'fire' }));
    expect(slot2(store).affinity).toBe('fire'); // the built-in Unsheathe allows it
    store.dispatch(updateWeaponSkill({ id: 'weaponSkill2', item: getAsh(SEPPUKU_ASH)! }));
    expect(slot2(store)).toMatchObject({ ash: SEPPUKU_ASH, affinity: null });
  });

  it("keep what a new weapon allows and drop what it doesn't", () => {
    const store = makeStore();
    store.dispatch(updateWeapon({ id: 'weapon2', item: getWeapon(UCHIGATANA)! }));
    store.dispatch(updateWeaponSkill({ id: 'weaponSkill2', item: getAsh(SPINNING_SLASH_ASH)! }));
    store.dispatch(updateWeaponAffinity({ id: 'weaponAffinity2', item: 'heavy' }));
    store.dispatch(updateWeapon({ id: 'weapon2', item: getWeapon(CLAYMORE)! }));
    expect(slot2(store)).toEqual({
      weapon: 'Claymore',
      ash: SPINNING_SLASH_ASH,
      affinity: 'heavy',
    });

    // Lion's Claw is the Claymore's own skill: choosing it means "built-in" (null).
    store.dispatch(updateWeaponSkill({ id: 'weaponSkill2', item: getAsh(LIONS_CLAW_ASH)! }));
    expect(slot2(store)).toEqual({ weapon: 'Claymore', ash: null, affinity: 'heavy' });

    store.dispatch(updateWeapon({ id: 'weapon2', item: getWeapon(MOONVEIL)! }));
    expect(slot2(store)).toEqual({ weapon: 'Moonveil', ash: null, affinity: null });
  });

  it('clear the Ash and affinity with the weapon', () => {
    const store = makeStore();
    store.dispatch(updateWeapon({ id: 'weapon2', item: getWeapon(UCHIGATANA)! }));
    store.dispatch(updateWeaponSkill({ id: 'weaponSkill2', item: getAsh(SEPPUKU_ASH)! }));
    store.dispatch(updateWeaponAffinity({ id: 'weaponAffinity2', item: 'blood' }));
    store.dispatch(updateWeapon({ id: 'weapon2', item: null }));
    expect(slot2(store)).toEqual({ weapon: null, ash: null, affinity: null });
  });
});
