/* eslint-disable no-param-reassign */
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  tear1: null,
  tear2: null,
};

const tears = createSlice({
  name: 'tears',
  initialState,
  reducers: {
    updateTear: (state, action) => {
      switch (action.payload.id) {
        case 'tear1':
          state.tear1 = action.payload.item;
          break;
        case 'tear2':
          state.tear2 = action.payload.item;
          break;
        default:
          break;
      }
    },
    clearTears: (state) => {
      state.tear1 = null;
      state.tear2 = null;
    },
  },
});

export const {
  clearTears,
  updateTear,
} = tears.actions;

export default tears.reducer;
