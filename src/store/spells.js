/* eslint-disable no-param-reassign */
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  spell1: null,
  spell2: null,
  spell3: null,
  spell4: null,
  spell5: null,
  spell6: null,
  spell7: null,
  spell8: null,
  spell9: null,
  spell10: null,
};

const spells = createSlice({
  name: 'spells',
  initialState,
  reducers: {
    updateSpell: (state, action) => {
      switch (action.payload.id) {
        case 'spell1':
          state.spell1 = action.payload.item;
          break;
        case 'spell2':
          state.spell2 = action.payload.item;
          break;
        case 'spell3':
          state.spell3 = action.payload.item;
          break;
        case 'spell4':
          state.spell4 = action.payload.item;
          break;
        case 'spell5':
          state.spell5 = action.payload.item;
          break;
        case 'spell6':
          state.spell6 = action.payload.item;
          break;
        case 'spell7':
          state.spell7 = action.payload.item;
          break;
        case 'spell8':
          state.spell8 = action.payload.item;
          break;
        case 'spell9':
          state.spell9 = action.payload.item;
          break;
        case 'spell10':
          state.spell10 = action.payload.item;
          break;
        default:
          break;
      }
    },
    clearSpells: (state) => {
      state.spell1 = null;
      state.spell2 = null;
      state.spell3 = null;
      state.spell4 = null;
      state.spell5 = null;
      state.spell6 = null;
      state.spell7 = null;
      state.spell8 = null;
      state.spell9 = null;
      state.spell10 = null;
    },
  },
});

export const {
  clearSpells,
  updateSpell,
} = spells.actions;

export default spells.reducer;
