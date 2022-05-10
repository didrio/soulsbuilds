/* eslint-disable prefer-destructuring */
import { createSelector } from '@reduxjs/toolkit';
import compact from 'lodash/compact';

export const selectEditAffinitySlot = (state) => state.app.editAffinitySlot;
export const selectEditSlot = (state) => state.app.editSlot;
export const selectEditSubSlot = (state) => state.app.editSubSlot;
export const selectSlotType = (state) => state.app.slotType;

export const selectTear1 = (state) => state.tears.tear1;
export const selectTear2 = (state) => state.tears.tear2;
export const selectTears = createSelector(
  selectTear1,
  selectTear2,
  (tear1, tear2) => (compact([
    tear1?.name ?? null,
    tear2?.name ?? null,
  ])),
);

export const selectSpell1 = (state) => state.spells.spell1;
export const selectSpell2 = (state) => state.spells.spell2;
export const selectSpell3 = (state) => state.spells.spell3;
export const selectSpell4 = (state) => state.spells.spell4;
export const selectSpell5 = (state) => state.spells.spell5;
export const selectSpell6 = (state) => state.spells.spell6;
export const selectSpell7 = (state) => state.spells.spell7;
export const selectSpell8 = (state) => state.spells.spell8;
export const selectSpell9 = (state) => state.spells.spell9;
export const selectSpell10 = (state) => state.spells.spell10;
export const selectSpells = createSelector(
  selectSpell1,
  selectSpell2,
  selectSpell3,
  selectSpell4,
  selectSpell5,
  selectSpell6,
  selectSpell7,
  selectSpell8,
  selectSpell9,
  selectSpell10,
  (spell1, spell2, spell3, spell4, spell5, spell6, spell7, spell8, spell9, spell10) => (compact([
    spell1?.name ?? null,
    spell2?.name ?? null,
    spell3?.name ?? null,
    spell4?.name ?? null,
    spell5?.name ?? null,
    spell6?.name ?? null,
    spell7?.name ?? null,
    spell8?.name ?? null,
    spell9?.name ?? null,
    spell10?.name ?? null,
  ])),
);

export const selectArc = (state) => state.stats.arc;
export const selectDex = (state) => state.stats.dex;
export const selectEnd = (state) => state.stats.end;
export const selectFai = (state) => state.stats.fai;
export const selectInt = (state) => state.stats.int;
export const selectMind = (state) => state.stats.mind;
export const selectStr = (state) => state.stats.str;
export const selectVigor = (state) => state.stats.vigor;

export const selectHelm = (state) => state.equipment.helm;
export const selectLeg = (state) => state.equipment.leg;
export const selectChest = (state) => state.equipment.chest;
export const selectGauntlet = (state) => state.equipment.gauntlet;

export const selectArrow1 = (state) => state.equipment.arrow1;
export const selectArrow2 = (state) => state.equipment.arrow2;
export const selectArrow3 = (state) => state.equipment.arrow3;
export const selectArrow4 = (state) => state.equipment.arrow4;
export const selectArrows = createSelector(
  selectArrow1,
  selectArrow2,
  selectArrow3,
  selectArrow4,
  (arrow1, arrow2, arrow3, arrow4) => ([
    arrow1?.name ?? null,
    arrow2?.name ?? null,
    arrow3?.name ?? null,
    arrow4?.name ?? null,
  ]),
);

export const selectCon1 = (state) => state.equipment.con1;
export const selectCon2 = (state) => state.equipment.con2;
export const selectCon3 = (state) => state.equipment.con3;
export const selectCon4 = (state) => state.equipment.con4;
export const selectCon5 = (state) => state.equipment.con5;
export const selectCon6 = (state) => state.equipment.con6;
export const selectCon7 = (state) => state.equipment.con7;
export const selectCon8 = (state) => state.equipment.con8;
export const selectCon9 = (state) => state.equipment.con9;
export const selectCon10 = (state) => state.equipment.con10;
export const selectCons = createSelector(
  selectCon1,
  selectCon2,
  selectCon3,
  selectCon4,
  selectCon5,
  selectCon6,
  selectCon7,
  selectCon8,
  selectCon9,
  selectCon10,
  (con1, con2, con3, con4, con5, con6, con7, con8, con9, con10) => (compact([
    con1?.name ?? null,
    con2?.name ?? null,
    con3?.name ?? null,
    con4?.name ?? null,
    con5?.name ?? null,
    con6?.name ?? null,
    con7?.name ?? null,
    con8?.name ?? null,
    con9?.name ?? null,
    con10?.name ?? null,
  ])),
);

export const selectTal1 = (state) => state.equipment.tal1;
export const selectTal2 = (state) => state.equipment.tal2;
export const selectTal3 = (state) => state.equipment.tal3;
export const selectTal4 = (state) => state.equipment.tal4;
export const selectTals = createSelector(
  selectTal1,
  selectTal2,
  selectTal3,
  selectTal4,
  (tal1, tal2, tal3, tal4) => (compact([
    tal1?.name ?? null,
    tal2?.name ?? null,
    tal3?.name ?? null,
    tal4?.name ?? null,
  ])),
);

export const selectWeapon1 = (state) => state.equipment.weapon1;
export const selectWeapon2 = (state) => state.equipment.weapon2;
export const selectWeapon3 = (state) => state.equipment.weapon3;
export const selectWeapon4 = (state) => state.equipment.weapon4;
export const selectWeapon5 = (state) => state.equipment.weapon5;
export const selectWeapon6 = (state) => state.equipment.weapon6;
export const selectWeapons = createSelector(
  selectWeapon1,
  selectWeapon2,
  selectWeapon3,
  selectWeapon4,
  selectWeapon5,
  selectWeapon6,
  (weapon1, weapon2, weapon3, weapon4, weapon5, weapon6) => ([
    weapon1?.name ?? null,
    weapon2?.name ?? null,
    weapon3?.name ?? null,
    weapon4?.name ?? null,
    weapon5?.name ?? null,
    weapon6?.name ?? null,
  ]),
);

export const selectWeaponSkill1 = (state) => state.equipment.weaponSkill1;
export const selectWeaponSkill2 = (state) => state.equipment.weaponSkill2;
export const selectWeaponSkill3 = (state) => state.equipment.weaponSkill3;
export const selectWeaponSkill4 = (state) => state.equipment.weaponSkill4;
export const selectWeaponSkill5 = (state) => state.equipment.weaponSkill5;
export const selectWeaponSkill6 = (state) => state.equipment.weaponSkill6;
export const selectWeaponSkills = createSelector(
  selectWeaponSkill1,
  selectWeaponSkill2,
  selectWeaponSkill3,
  selectWeaponSkill4,
  selectWeaponSkill5,
  selectWeaponSkill6,
  (weaponSkill1, weaponSkill2, weaponSkill3, weaponSkill4, weaponSkill5, weaponSkill6) => ([
    weaponSkill1,
    weaponSkill2,
    weaponSkill3,
    weaponSkill4,
    weaponSkill5,
    weaponSkill6,
  ]),
);

export const selectWeaponAffinity1 = (state) => state.equipment.weaponAffinity1;
export const selectWeaponAffinity2 = (state) => state.equipment.weaponAffinity2;
export const selectWeaponAffinity3 = (state) => state.equipment.weaponAffinity3;
export const selectWeaponAffinity4 = (state) => state.equipment.weaponAffinity4;
export const selectWeaponAffinity5 = (state) => state.equipment.weaponAffinity5;
export const selectWeaponAffinity6 = (state) => state.equipment.weaponAffinity6;
export const selectWeaponAffinities = createSelector(
  selectWeaponAffinity1,
  selectWeaponAffinity2,
  selectWeaponAffinity3,
  selectWeaponAffinity4,
  selectWeaponAffinity5,
  selectWeaponAffinity6,
  // eslint-disable-next-line max-len
  (weaponAffinity1, weaponAffinity2, weaponAffinity3, weaponAffinity4, weaponAffinity5, weaponAffinity6) => ([
    weaponAffinity1,
    weaponAffinity2,
    weaponAffinity3,
    weaponAffinity4,
    weaponAffinity5,
    weaponAffinity6,
  ]),
);

export const selectEditWeaponSkill = createSelector(
  selectEditSubSlot,
  selectWeaponSkills,
  (editSubSlot, weaponSkills) => {
    let skill = null;
    if (!editSubSlot) {
      return skill;
    }
    switch (editSubSlot) {
      case 'weaponSkill1':
        skill = weaponSkills[0];
        break;
      case 'weaponSkill2':
        skill = weaponSkills[1];
        break;
      case 'weaponSkill3':
        skill = weaponSkills[2];
        break;
      case 'weaponSkill4':
        skill = weaponSkills[3];
        break;
      case 'weaponSkill5':
        skill = weaponSkills[4];
        break;
      case 'weaponSkill6':
        skill = weaponSkills[5];
        break;
      default:
        break;
    }
    return skill;
  },
);

export const selectEditWeaponAffinity = createSelector(
  selectEditAffinitySlot,
  selectWeaponAffinities,
  (editAffinitySlot, weaponAffinities) => {
    let affinity = null;
    if (!editAffinitySlot) {
      return affinity;
    }
    switch (editAffinitySlot) {
      case 'weaponAffinity1':
        affinity = weaponAffinities[0];
        break;
      case 'weaponAffinity2':
        affinity = weaponAffinities[1];
        break;
      case 'weaponAffinity3':
        affinity = weaponAffinities[2];
        break;
      case 'weaponAffinity4':
        affinity = weaponAffinities[3];
        break;
      case 'weaponAffinity5':
        affinity = weaponAffinities[4];
        break;
      case 'weaponAffinity6':
        affinity = weaponAffinities[5];
        break;
      default:
        break;
    }
    return affinity;
  },
);
