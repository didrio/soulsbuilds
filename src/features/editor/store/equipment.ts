// Equipment of the build being edited. Items are full data objects (src/data), a weapon's Ash of
// War too; its affinity is a key, null for Standard. The weapon reducers keep each weapon's Ash and
// affinity valid for it (src/data/rules.ts), so a loaded or edited build can't hold a combination
// the game doesn't allow.
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  fitAffinity,
  fitAsh,
  type AffinityKey,
  type Armor,
  type Arrow,
  type AshOfWar,
  type Goods,
  type Talisman,
  type Weapon,
} from '@/data';
import {
  ARROW_SLOTS,
  CONSUMABLE_SLOTS,
  TALISMAN_SLOTS,
  WEAPON_AFFINITY_SLOTS,
  WEAPON_SKILL_SLOTS,
  WEAPON_SLOTS,
  weaponSlotOf,
  weaponSubSlots,
  type ArrowSlot,
  type ConsumableSlot,
  type TalismanSlot,
  type WeaponAffinitySlot,
  type WeaponSkillSlot,
  type WeaponSlot,
} from '../slots';

/** Payload of the per-slot update actions: which slot, and what goes in it (null empties it). */
export interface SlotUpdate<Id extends string, Item> {
  id: Id;
  item: Item | null;
}

export type EquipmentState = {
  helm: Armor | null;
  chest: Armor | null;
  gauntlet: Armor | null;
  leg: Armor | null;
  greatRune: Goods | null;
  spiritAsh: Goods | null;
} & Record<ArrowSlot, Arrow | null> &
  Record<ConsumableSlot, Goods | null> &
  Record<TalismanSlot, Talisman | null> &
  Record<WeaponSlot, Weapon | null> &
  Record<WeaponSkillSlot, AshOfWar | null> &
  Record<WeaponAffinitySlot, AffinityKey | null>;

const emptySlots = <S extends string>(slots: readonly S[]) =>
  Object.fromEntries(slots.map((slot) => [slot, null])) as Record<S, null>;

const initialState: EquipmentState = {
  helm: null,
  leg: null,
  chest: null,
  gauntlet: null,
  greatRune: null,
  spiritAsh: null,
  ...emptySlots(ARROW_SLOTS),
  ...emptySlots(CONSUMABLE_SLOTS),
  ...emptySlots(TALISMAN_SLOTS),
  ...emptySlots(WEAPON_SLOTS),
  ...emptySlots(WEAPON_SKILL_SLOTS),
  ...emptySlots(WEAPON_AFFINITY_SLOTS),
};

/** Sets weapon slot `id`'s Ash and affinity, keeping only what its weapon allows. */
function fitWeaponSlot(
  state: EquipmentState,
  id: WeaponSlot,
  ash: AshOfWar | null,
  affinity: AffinityKey | null,
) {
  const weapon = state[id];
  const sub = weaponSubSlots(id);
  const fittedAsh = weapon ? fitAsh(weapon, ash) : null;
  state[sub.skill] = fittedAsh;
  state[sub.affinity] = weapon ? fitAffinity(weapon, fittedAsh, affinity) : null;
}

const equipment = createSlice({
  name: 'equipment',
  initialState,
  reducers: {
    updateHelm: (state, action: PayloadAction<Armor | null>) => {
      state.helm = action.payload;
    },
    updateLeg: (state, action: PayloadAction<Armor | null>) => {
      state.leg = action.payload;
    },
    updateChest: (state, action: PayloadAction<Armor | null>) => {
      state.chest = action.payload;
    },
    updateGauntlet: (state, action: PayloadAction<Armor | null>) => {
      state.gauntlet = action.payload;
    },
    updateGreatRune: (state, action: PayloadAction<Goods | null>) => {
      state.greatRune = action.payload;
    },
    updateSpiritAsh: (state, action: PayloadAction<Goods | null>) => {
      state.spiritAsh = action.payload;
    },
    updateArrow: (state, action: PayloadAction<SlotUpdate<ArrowSlot, Arrow>>) => {
      state[action.payload.id] = action.payload.item;
    },
    updateCon: (state, action: PayloadAction<SlotUpdate<ConsumableSlot, Goods>>) => {
      state[action.payload.id] = action.payload.item;
    },
    updateTal: (state, action: PayloadAction<SlotUpdate<TalismanSlot, Talisman>>) => {
      state[action.payload.id] = action.payload.item;
    },
    /** A new weapon keeps the slot's Ash and affinity only if it allows them. */
    updateWeapon: (state, action: PayloadAction<SlotUpdate<WeaponSlot, Weapon>>) => {
      const { id, item } = action.payload;
      state[id] = item;
      const sub = weaponSubSlots(id);
      fitWeaponSlot(state, id, state[sub.skill], state[sub.affinity]);
    },
    /** The Ash of War for a weapon slot (null = the weapon's built-in skill). */
    updateWeaponSkill: (state, action: PayloadAction<SlotUpdate<WeaponSkillSlot, AshOfWar>>) => {
      const id = weaponSlotOf(action.payload.id);
      fitWeaponSlot(state, id, action.payload.item, state[weaponSubSlots(id).affinity]);
    },
    /** The affinity for a weapon slot (null or 'standard' = Standard). */
    updateWeaponAffinity: (
      state,
      action: PayloadAction<SlotUpdate<WeaponAffinitySlot, AffinityKey>>,
    ) => {
      const id = weaponSlotOf(action.payload.id);
      fitWeaponSlot(state, id, state[weaponSubSlots(id).skill], action.payload.item);
    },
    clearEquipment: () => initialState,
  },
});

export const {
  clearEquipment,
  updateHelm,
  updateLeg,
  updateChest,
  updateGauntlet,
  updateGreatRune,
  updateSpiritAsh,
  updateArrow,
  updateCon,
  updateTal,
  updateWeapon,
  updateWeaponAffinity,
  updateWeaponSkill,
} = equipment.actions;

export default equipment.reducer;
