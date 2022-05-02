/* eslint-disable no-param-reassign */
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  helm: null,
  leg: null,
  chest: null,
  gauntlet: null,
  arrow1: null,
  arrow2: null,
  arrow3: null,
  arrow4: null,
  con1: null,
  con2: null,
  con3: null,
  con4: null,
  con5: null,
  con6: null,
  con7: null,
  con8: null,
  con9: null,
  con10: null,
  tal1: null,
  tal2: null,
  tal3: null,
  tal4: null,
  weapon1: null,
  weapon2: null,
  weapon3: null,
  weapon4: null,
  weapon5: null,
  weapon6: null,
  weaponSkill1: null,
  weaponSkill2: null,
  weaponSkill3: null,
  weaponSkill4: null,
  weaponSkill5: null,
  weaponSkill6: null,
};

const equipment = createSlice({
  name: 'equipment',
  initialState,
  reducers: {
    updateHelm: (state, action) => {
      state.helm = action.payload;
    },
    updateLeg: (state, action) => {
      state.leg = action.payload;
    },
    updateChest: (state, action) => {
      state.chest = action.payload;
    },
    updateGauntlet: (state, action) => {
      state.gauntlet = action.payload;
    },
    updateArrow: (state, action) => {
      switch (action.payload.id) {
        case 'arrow1':
          state.arrow1 = action.payload.item;
          break;
        case 'arrow2':
          state.arrow2 = action.payload.item;
          break;
        case 'arrow3':
          state.arrow3 = action.payload.item;
          break;
        case 'arrow4':
          state.arrow4 = action.payload.item;
          break;
        default:
          break;
      }
    },
    updateCon: (state, action) => {
      switch (action.payload.id) {
        case 'con1':
          state.con1 = action.payload.item;
          break;
        case 'con2':
          state.con2 = action.payload.item;
          break;
        case 'con3':
          state.con3 = action.payload.item;
          break;
        case 'con4':
          state.con4 = action.payload.item;
          break;
        case 'con5':
          state.con5 = action.payload.item;
          break;
        case 'con6':
          state.con6 = action.payload.item;
          break;
        case 'con7':
          state.con7 = action.payload.item;
          break;
        case 'con8':
          state.con8 = action.payload.item;
          break;
        case 'con9':
          state.con9 = action.payload.item;
          break;
        case 'con10':
          state.con10 = action.payload.item;
          break;
        default:
          break;
      }
    },
    updateTal: (state, action) => {
      switch (action.payload.id) {
        case 'tal1':
          state.tal1 = action.payload.item;
          break;
        case 'tal2':
          state.tal2 = action.payload.item;
          break;
        case 'tal3':
          state.tal3 = action.payload.item;
          break;
        case 'tal4':
          state.tal4 = action.payload.item;
          break;
        default:
          break;
      }
    },
    updateWeapon: (state, action) => {
      switch (action.payload.id) {
        case 'weapon1':
          state.weapon1 = action.payload.item;
          break;
        case 'weapon2':
          state.weapon2 = action.payload.item;
          break;
        case 'weapon3':
          state.weapon3 = action.payload.item;
          break;
        case 'weapon4':
          state.weapon4 = action.payload.item;
          break;
        case 'weapon5':
          state.weapon5 = action.payload.item;
          break;
        case 'weapon6':
          state.weapon6 = action.payload.item;
          break;
        default:
          break;
      }
    },
    updateWeaponSkill: (state, action) => {
      switch (action.payload.id) {
        case 'weaponSkill1':
          state.weaponSkill1 = action.payload.item;
          break;
        case 'weaponSkill2':
          state.weaponSkill2 = action.payload.item;
          break;
        case 'weaponSkill3':
          state.weaponSkill3 = action.payload.item;
          break;
        case 'weaponSkill4':
          state.weaponSkill4 = action.payload.item;
          break;
        case 'weaponSkill5':
          state.weaponSkill5 = action.payload.item;
          break;
        case 'weaponSkill6':
          state.weaponSkill6 = action.payload.item;
          break;
        default:
          break;
      }
    },
  },
});

export const {
  updateHelm,
  updateLeg,
  updateChest,
  updateGauntlet,
  updateArrow,
  updateCon,
  updateTal,
  updateWeapon,
  updateWeaponSkill,
} = equipment.actions;

export default equipment.reducer;
