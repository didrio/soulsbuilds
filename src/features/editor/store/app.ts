// Item picker state: which slot the picker (ItemSelector) is editing. The picker is open while
// `slotType` is set.
import {
  createSlice,
  type PayloadAction,
  type ThunkAction,
  type UnknownAction,
} from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import {
  isSlot,
  WEAPON_SLOTS,
  type ItemSlot,
  type SlotType,
  type WeaponAffinitySlot,
  type WeaponSkillSlot,
} from '../slots';
import { updateWeaponAffinity, updateWeaponSkill } from './equipment';

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

/**
 * Closes the picker. If it was open for an empty weapon slot (no weapon chosen), the affinity and
 * skill picked for that slot are dropped, so they never sit on an empty slot.
 */
export const closePicker =
  (): ThunkAction<void, RootState, unknown, UnknownAction> => (dispatch, getState) => {
    const { app: picker, equipment } = getState();
    if (isSlot(WEAPON_SLOTS, picker.editSlot) && equipment[picker.editSlot] === null) {
      if (picker.editAffinitySlot)
        dispatch(updateWeaponAffinity({ id: picker.editAffinitySlot, item: null }));
      if (picker.editSubSlot) dispatch(updateWeaponSkill({ id: picker.editSubSlot, item: null }));
    }
    dispatch(clearApp());
  };

export default app.reducer;
