// Item picker state: which slot the picker (ItemSelector) is editing. The picker is open while
// `slotType` is set.
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ItemSlot, SlotType, WeaponAffinitySlot, WeaponSkillSlot } from '../slots';

export interface AppState {
  editAffinitySlot: WeaponAffinitySlot | null;
  editSlot: ItemSlot | null;
  editSubSlot: WeaponSkillSlot | null;
  slotType: SlotType | null;
}

const initialState: AppState = {
  editAffinitySlot: null,
  editSlot: null,
  editSubSlot: null,
  slotType: null,
};

const app = createSlice({
  name: 'app',
  initialState,
  reducers: {
    /** Opens the picker for a slot (and, for weapons, its affinity and skill slots). */
    openPicker: (
      _state,
      action: PayloadAction<{
        slotType: SlotType;
        editSlot: ItemSlot | null;
        editAffinitySlot?: WeaponAffinitySlot | null;
        editSubSlot?: WeaponSkillSlot | null;
      }>,
    ) => ({
      slotType: action.payload.slotType,
      editSlot: action.payload.editSlot,
      editAffinitySlot: action.payload.editAffinitySlot ?? null,
      editSubSlot: action.payload.editSubSlot ?? null,
    }),
    clearApp: () => initialState,
  },
});

export const { clearApp, openPicker } = app.actions;

/** Closes the picker. (An Ash or affinity can't sit on an empty weapon slot: see ./equipment.) */
export const closePicker = clearApp;

export default app.reducer;
