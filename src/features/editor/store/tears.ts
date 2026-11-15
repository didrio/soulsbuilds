import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Tear } from '@/data';
import type { TearSlot } from '../slots';
import type { SlotUpdate } from './equipment';

export type TearsState = Record<TearSlot, Tear | null>;

const initialState: TearsState = {
  tear1: null,
  tear2: null,
};

const tears = createSlice({
  name: 'tears',
  initialState,
  reducers: {
    updateTear: (state, action: PayloadAction<SlotUpdate<TearSlot, Tear>>) => {
      state[action.payload.id] = action.payload.item;
    },
    clearTears: () => initialState,
  },
});

export const { clearTears, updateTear } = tears.actions;

export default tears.reducer;
