// The Redux store holds ONLY the build being edited (see AGENTS.md conventions).
import { configureStore } from '@reduxjs/toolkit';
import appReducer from '@/features/editor/store/app';
import equipmentReducer from '@/features/editor/store/equipment';
import spellsReducer from '@/features/editor/store/spells';
import startingClassReducer from '@/features/editor/store/startingClass';
import statsReducer from '@/features/editor/store/stats';
import tearsReducer from '@/features/editor/store/tears';

/** A fresh store (the app uses one; each test makes its own). */
export const makeStore = () =>
  configureStore({
    reducer: {
      app: appReducer,
      equipment: equipmentReducer,
      spells: spellsReducer,
      startingClass: startingClassReducer,
      stats: statsReducer,
      tears: tearsReducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

const store = makeStore();

export default store;
