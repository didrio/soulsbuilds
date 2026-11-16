import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  applyClassMinimums,
  clampStat,
  DEFAULT_STAT,
  STAT_KEYS,
  type StatKey,
  type Stats,
} from '@/lib/buildMath';
import { setStartingClass } from './startingClass';

export type StatsState = Stats;

const initialState: StatsState = {
  arc: DEFAULT_STAT,
  dex: DEFAULT_STAT,
  end: DEFAULT_STAT,
  fai: DEFAULT_STAT,
  int: DEFAULT_STAT,
  mind: DEFAULT_STAT,
  str: DEFAULT_STAT,
  vigor: DEFAULT_STAT,
};

/**
 * Stats are always whole numbers from 1 to 99: every update is clamped into range (from `min`, the
 * starting class's base, when the editor passes one). Choosing a starting class raises the stats
 * below its base.
 */
const stats = createSlice({
  name: 'stats',
  initialState,
  reducers: {
    updateStat: (state, action: PayloadAction<{ key: StatKey; value: number; min?: number }>) => {
      state[action.payload.key] = clampStat(action.payload.value, action.payload.min);
    },
    setStats: (_state, action: PayloadAction<Stats>) =>
      Object.fromEntries(STAT_KEYS.map((key) => [key, clampStat(action.payload[key])])) as Stats,
    clearStats: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(setStartingClass, (state, action) =>
      action.payload ? applyClassMinimums(state, action.payload.stats) : state,
    );
  },
});

export const { clearStats, setStats, updateStat } = stats.actions;

export default stats.reducer;
