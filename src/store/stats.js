/* eslint-disable no-param-reassign */
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  arc: 10,
  dex: 10,
  end: 10,
  fai: 10,
  int: 10,
  mind: 10,
  str: 10,
  vigor: 10,
};

const stats = createSlice({
  name: 'stats',
  initialState,
  reducers: {
    updateArc: (state, action) => {
      state.arc = action.payload;
    },
    updateDex: (state, action) => {
      state.dex = action.payload;
    },
    updateEnd: (state, action) => {
      state.end = action.payload;
    },
    updateFai: (state, action) => {
      state.fai = action.payload;
    },
    updateInt: (state, action) => {
      state.int = action.payload;
    },
    updateMind: (state, action) => {
      state.mind = action.payload;
    },
    updateStr: (state, action) => {
      state.str = action.payload;
    },
    updateVigor: (state, action) => {
      state.vigor = action.payload;
    },
  },
});

export const {
  updateArc,
  updateDex,
  updateEnd,
  updateFai,
  updateInt,
  updateMind,
  updateStr,
  updateVigor,
} = stats.actions;

export default stats.reducer;
