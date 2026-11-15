import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Stats, StatValue } from '@/lib/buildMath';

export type StatsState = Stats;

const initialState: StatsState = {
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
    updateArc: (state, action: PayloadAction<StatValue>) => {
      state.arc = action.payload;
    },
    updateDex: (state, action: PayloadAction<StatValue>) => {
      state.dex = action.payload;
    },
    updateEnd: (state, action: PayloadAction<StatValue>) => {
      state.end = action.payload;
    },
    updateFai: (state, action: PayloadAction<StatValue>) => {
      state.fai = action.payload;
    },
    updateInt: (state, action: PayloadAction<StatValue>) => {
      state.int = action.payload;
    },
    updateMind: (state, action: PayloadAction<StatValue>) => {
      state.mind = action.payload;
    },
    updateStr: (state, action: PayloadAction<StatValue>) => {
      state.str = action.payload;
    },
    updateVigor: (state, action: PayloadAction<StatValue>) => {
      state.vigor = action.payload;
    },
    clearStats: () => initialState,
  },
});

export const {
  clearStats,
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
