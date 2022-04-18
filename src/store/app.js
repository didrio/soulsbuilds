/* eslint-disable no-param-reassign */
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  editSlot: null,
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
  },
});

export const { updateEditSlot, updateSlotType } = app.actions;

export default app.reducer;
