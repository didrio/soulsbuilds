// Equipment of the build being edited. Items are full data objects; weapon skills and affinities
// are names.
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Armor, Arrow, Consumable, Talisman, Weapon } from '@/data';
import {
  ARROW_SLOTS,
  CONSUMABLE_SLOTS,
  TALISMAN_SLOTS,
  WEAPON_AFFINITY_SLOTS,
  WEAPON_SKILL_SLOTS,
  WEAPON_SLOTS,
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
} & Record<ArrowSlot, Arrow | null> &
  Record<ConsumableSlot, Consumable | null> &
  Record<TalismanSlot, Talisman | null> &
  Record<WeaponSlot, Weapon | null> &
  Record<WeaponSkillSlot, string | null> &
  Record<WeaponAffinitySlot, string | null>;

const emptySlots = <S extends string>(slots: readonly S[]) =>
  Object.fromEntries(slots.map((slot) => [slot, null])) as Record<S, null>;

const initialState: EquipmentState = {
  helm: null,
  leg: null,
  chest: null,
  gauntlet: null,
  ...emptySlots(ARROW_SLOTS),
  ...emptySlots(CONSUMABLE_SLOTS),
  ...emptySlots(TALISMAN_SLOTS),
  ...emptySlots(WEAPON_SLOTS),
  ...emptySlots(WEAPON_SKILL_SLOTS),
  ...emptySlots(WEAPON_AFFINITY_SLOTS),
};

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
    updateArrow: (state, action: PayloadAction<SlotUpdate<ArrowSlot, Arrow>>) => {
      state[action.payload.id] = action.payload.item;
    },
    updateCon: (state, action: PayloadAction<SlotUpdate<ConsumableSlot, Consumable>>) => {
      state[action.payload.id] = action.payload.item;
    },
    updateTal: (state, action: PayloadAction<SlotUpdate<TalismanSlot, Talisman>>) => {
      state[action.payload.id] = action.payload.item;
    },
    updateWeapon: (state, action: PayloadAction<SlotUpdate<WeaponSlot, Weapon>>) => {
      state[action.payload.id] = action.payload.item;
    },
    updateWeaponSkill: (state, action: PayloadAction<SlotUpdate<WeaponSkillSlot, string>>) => {
      state[action.payload.id] = action.payload.item;
    },
    updateWeaponAffinity: (
      state,
      action: PayloadAction<SlotUpdate<WeaponAffinitySlot, string>>,
    ) => {
      state[action.payload.id] = action.payload.item;
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
  updateArrow,
  updateCon,
  updateTal,
  updateWeapon,
  updateWeaponAffinity,
  updateWeaponSkill,
} = equipment.actions;

export default equipment.reducer;
