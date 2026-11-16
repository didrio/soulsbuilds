import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { StartingClass } from '@/data/core';

/** The build's starting class (the full entry, so the store needs no data import), or null for none. */
export type StartingClassState = StartingClass | null;

const initialState = null as StartingClassState;

/** Choosing a class also raises any stat below its base (stats.ts listens for setStartingClass). */
const startingClass = createSlice({
  name: 'startingClass',
  initialState,
  reducers: {
    setStartingClass: (_state, action: PayloadAction<StartingClass | null>) => action.payload,
    clearStartingClass: () => initialState,
  },
});

export const { clearStartingClass, setStartingClass } = startingClass.actions;

export default startingClass.reducer;
