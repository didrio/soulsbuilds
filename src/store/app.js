/* eslint-disable no-param-reassign */
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  editSlot: null,
  editSubSlot: null,
  slotType: null,
};

const app = createSlice({
  name: 'app',
  initialState,
  reducers: {
    updateEditSlot: (state, action) => {
      state.editSlot = action.payload;
    },
    updateSlotType: (state, action) => {
      state.slotType = action.payload;
    },
    updateEditSubSlot: (state, action) => {
      state.editSubSlot = action.payload;
    },
  },
});

export const {
  updateEditSlot,
  updateSlotType,
  updateEditSubSlot,
} = app.actions;

export default app.reducer;
