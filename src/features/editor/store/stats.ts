import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { clampStat, DEFAULT_STAT, STAT_KEYS, type StatKey, type Stats } from '@/lib/buildMath';

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

/** Stats are always whole numbers from 1 to 99: every update is clamped into range. */
const stats = createSlice({
  name: 'stats',
  initialState,
  reducers: {
    updateStat: (state, action: PayloadAction<{ key: StatKey; value: number }>) => {
      state[action.payload.key] = clampStat(action.payload.value);
    },
    setStats: (_state, action: PayloadAction<Stats>) =>
      Object.fromEntries(STAT_KEYS.map((key) => [key, clampStat(action.payload[key])])) as Stats,
    clearStats: () => initialState,
  },
});

export const { clearStats, setStats, updateStat } = stats.actions;

export default stats.reducer;
