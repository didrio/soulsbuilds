// Selectors over the editor state. The plural selectors map the slots to the arrays a v1 build
// document stores (item names; see BuildDoc in src/lib/models.ts).
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import { compact } from '@/lib/array';
import {
  ARROW_SLOTS,
  CONSUMABLE_SLOTS,
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
export const selectTearSlots = (state: RootState) => state.tears;

export const selectHelm = (state: RootState) => state.equipment.helm;
export const selectLeg = (state: RootState) => state.equipment.leg;
export const selectChest = (state: RootState) => state.equipment.chest;
export const selectGauntlet = (state: RootState) => state.equipment.gauntlet;

/** Saved compacted: slot positions are lost. */
export const selectTears = createSelector(selectTearSlots, (tears) =>
  compact(TEAR_SLOTS.map((slot) => tears[slot]?.name ?? null)),
);

/** Saved compacted: slot positions are lost. */
export const selectSpells = createSelector(selectSpellSlots, (spells) =>
  compact(SPELL_SLOTS.map((slot) => spells[slot]?.name ?? null)),
);

/** Positional, null for empty slots. */
export const selectArrows = createSelector(selectEquipment, (equipment) =>
  ARROW_SLOTS.map((slot) => equipment[slot]?.name ?? null),
);

/** Saved compacted: slot positions are lost. */
export const selectCons = createSelector(selectEquipment, (equipment) =>
  compact(CONSUMABLE_SLOTS.map((slot) => equipment[slot]?.name ?? null)),
);

/** Saved compacted: slot positions are lost. */
export const selectTals = createSelector(selectEquipment, (equipment) =>
  compact(TALISMAN_SLOTS.map((slot) => equipment[slot]?.name ?? null)),
);

/** Positional, null for empty slots. */
export const selectWeapons = createSelector(selectEquipment, (equipment) =>
  WEAPON_SLOTS.map((slot) => equipment[slot]?.name ?? null),
);

/** Positional skill names. */
export const selectWeaponSkills = createSelector(selectEquipment, (equipment) =>
  WEAPON_SKILL_SLOTS.map((slot) => equipment[slot]),
);

/** Positional affinity names. */
export const selectWeaponAffinities = createSelector(selectEquipment, (equipment) =>
  WEAPON_AFFINITY_SLOTS.map((slot) => equipment[slot]),
);

/** The skill in the slot the picker is editing. */
export const selectEditWeaponSkill = (state: RootState) =>
  state.app.editSubSlot ? state.equipment[state.app.editSubSlot] : null;

/** The affinity in the slot the picker is editing. */
export const selectEditWeaponAffinity = (state: RootState) =>
  state.app.editAffinitySlot ? state.equipment[state.app.editAffinitySlot] : null;
