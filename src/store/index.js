import { configureStore } from '@reduxjs/toolkit';
import appReducer from './app';
import equipmentReducer from './equipment';
import spellsReducer from './spells';
import statsReducer from './stats';
import tearsReducer from './tears';

const store = configureStore({
  reducer: {
    app: appReducer,
    equipment: equipmentReducer,
    spells: spellsReducer,
    stats: statsReducer,
    tears: tearsReducer,
  },
});

export default store;
