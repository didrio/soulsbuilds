import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Spell } from '@/data';
import { SPELL_SLOTS, type SpellSlot } from '../slots';
import type { SlotUpdate } from './equipment';

export type SpellsState = Record<SpellSlot, Spell | null>;

const initialState = Object.fromEntries(SPELL_SLOTS.map((slot) => [slot, null])) as SpellsState;

const spells = createSlice({
  name: 'spells',
  initialState,
  reducers: {
    updateSpell: (state, action: PayloadAction<SlotUpdate<SpellSlot, Spell>>) => {
      state[action.payload.id] = action.payload.item;
    },
    clearSpells: () => initialState,
  },
});

export const { clearSpells, updateSpell } = spells.actions;

export default spells.reducer;
