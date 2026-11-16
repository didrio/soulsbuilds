// Selectors over the editor state. The plural selectors map the slots to the arrays a build
// document stores (item IDs; see Equipment in src/lib/models.ts).
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import type { SlotItem } from '@/data';
import { compact } from '@/lib/array';
import {
  ARROW_SLOTS,
  CONSUMABLE_SLOTS,
  isSlot,
  SPELL_SLOTS,
  TALISMAN_SLOTS,
  TEAR_SLOTS,
  WEAPON_AFFINITY_SLOTS,
  WEAPON_SKILL_SLOTS,
  WEAPON_SLOTS,
} from '../slots';

export const selectEditAffinitySlot = (state: RootState) => state.app.editAffinitySlot;
export const selectEditSlot = (state: RootState) => state.app.editSlot;
export const selectEditSubSlot = (state: RootState) => state.app.editSubSlot;
export const selectSlotType = (state: RootState) => state.app.slotType;

export const selectEquipment = (state: RootState) => state.equipment;
export const selectSpellSlots = (state: RootState) => state.spells;
export const selectStats = (state: RootState) => state.stats;
export const selectStartingClass = (state: RootState) => state.startingClass;
export const selectTearSlots = (state: RootState) => state.tears;

export const selectHelm = (state: RootState) => state.equipment.helm;
export const selectLeg = (state: RootState) => state.equipment.leg;
export const selectChest = (state: RootState) => state.equipment.chest;
export const selectGauntlet = (state: RootState) => state.equipment.gauntlet;
export const selectGreatRune = (state: RootState) => state.equipment.greatRune;
export const selectSpiritAsh = (state: RootState) => state.equipment.spiritAsh;

/** Saved compacted: slot positions are lost. */
export const selectTears = createSelector(selectTearSlots, (tears) =>
  compact(TEAR_SLOTS.map((slot) => tears[slot]?.id ?? null)),
);

/** Saved compacted: slot positions are lost. */
export const selectSpells = createSelector(selectSpellSlots, (spells) =>
  compact(SPELL_SLOTS.map((slot) => spells[slot]?.id ?? null)),
);

/** Positional, null for empty slots. */
export const selectArrows = createSelector(selectEquipment, (equipment) =>
  ARROW_SLOTS.map((slot) => equipment[slot]?.id ?? null),
);

/** Saved compacted: slot positions are lost. */
export const selectCons = createSelector(selectEquipment, (equipment) =>
  compact(CONSUMABLE_SLOTS.map((slot) => equipment[slot]?.id ?? null)),
);

/** Saved compacted: slot positions are lost. */
export const selectTals = createSelector(selectEquipment, (equipment) =>
  compact(TALISMAN_SLOTS.map((slot) => equipment[slot]?.id ?? null)),
);

/** Positional, null for empty slots. */
export const selectWeapons = createSelector(selectEquipment, (equipment) =>
  WEAPON_SLOTS.map((slot) => equipment[slot]?.id ?? null),
);

/** Positional Ash of War IDs (null = the weapon's built-in skill). */
export const selectWeaponSkills = createSelector(selectEquipment, (equipment) =>
  WEAPON_SKILL_SLOTS.map((slot) => equipment[slot]?.id ?? null),
);

/** Positional affinity keys (null = Standard). */
export const selectWeaponAffinities = createSelector(selectEquipment, (equipment) =>
  WEAPON_AFFINITY_SLOTS.map((slot) => equipment[slot]),
);

/** The Ash of War in the slot the picker is editing. */
export const selectEditWeaponSkill = (state: RootState) =>
  state.app.editSubSlot ? state.equipment[state.app.editSubSlot] : null;

/** The affinity in the slot the picker is editing. */
export const selectEditWeaponAffinity = (state: RootState) =>
  state.app.editAffinitySlot ? state.equipment[state.app.editAffinitySlot] : null;

/** The item currently in the slot the picker is editing (null when empty or closed). */
export const selectEditedItem = (state: RootState): SlotItem | null => {
  const { editSlot, slotType } = state.app;
  const { equipment } = state;
  if (slotType === 'SLOT_TYPE_HELM') return equipment.helm;
  if (slotType === 'SLOT_TYPE_CHEST') return equipment.chest;
  if (slotType === 'SLOT_TYPE_GAUNTLET') return equipment.gauntlet;
  if (slotType === 'SLOT_TYPE_LEG') return equipment.leg;
  if (slotType === 'SLOT_TYPE_GREAT_RUNE') return equipment.greatRune;
  if (slotType === 'SLOT_TYPE_SPIRIT_ASH') return equipment.spiritAsh;
  if (isSlot(SPELL_SLOTS, editSlot)) return state.spells[editSlot];
  if (isSlot(TEAR_SLOTS, editSlot)) return state.tears[editSlot];
  if (isSlot(WEAPON_SLOTS, editSlot)) return equipment[editSlot];
  if (isSlot(ARROW_SLOTS, editSlot)) return equipment[editSlot];
  if (isSlot(TALISMAN_SLOTS, editSlot)) return equipment[editSlot];
  if (isSlot(CONSUMABLE_SLOTS, editSlot)) return equipment[editSlot];
  return null;
};
