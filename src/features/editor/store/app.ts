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
    updateEditAffinitySlot: (state, action: PayloadAction<WeaponAffinitySlot | null>) => {
      state.editAffinitySlot = action.payload;
    },
    updateEditSlot: (state, action: PayloadAction<ItemSlot | null>) => {
      state.editSlot = action.payload;
    },
    updateSlotType: (state, action: PayloadAction<SlotType | null>) => {
      state.slotType = action.payload;
    },
    updateEditSubSlot: (state, action: PayloadAction<WeaponSkillSlot | null>) => {
      state.editSubSlot = action.payload;
    },
    // Doesn't reset editAffinitySlot (T5).
    clearApp: (state) => {
      state.editSlot = null;
      state.editSubSlot = null;
      state.slotType = null;
    },
  },
});

export const {
  clearApp,
  updateEditSlot,
  updateSlotType,
  updateEditAffinitySlot,
  updateEditSubSlot,
} = app.actions;

export default app.reducer;
