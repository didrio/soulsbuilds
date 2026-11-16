import { describe, expect, it } from 'vitest';
import {
  affinityName,
  armorList,
  ashLabel,
  getArmor,
  getAsh,
  getCardItem,
  getGreatRune,
  getSkill,
  getSpell,
  getSpiritAsh,
  getTalisman,
  getTear,
  getWeapon,
  iconUrl,
  NO_SKILL_ID,
  tagGroups,
  weapons,
  weaponSkill,
} from '.';

describe('getCardItem (T40: a build image from the light data)', () => {
  it.each([
    ['weapon', 9000000, getWeapon(9000000)],
    ['helm', 680000, getArmor(680000, 'head')],
    ['chest', 580100, getArmor(580100, 'chest')],
    ['gauntlet', 580200, getArmor(580200, 'arms')],
    ['leg', 580300, getArmor(580300, 'legs')],
    ['talisman', 2160, getTalisman(2160)],
    ['spell', 4000, getSpell(4000)],
    ['tear', 11011, getTear(11011)],
    ['greatRune', 191, getGreatRune(191)],
    ['spiritAsh', 207000, getSpiritAsh(207000)],
  ] as const)('shows a %s with the name and icon of the full data', (kind, id, full) => {
    expect(full).toBeDefined();
    expect(getCardItem({ kind, id })).toMatchObject({ id, name: full?.name, icon: full?.icon });
  });

  it('is undefined for no image, an unknown ID, or armor of another slot', () => {
    expect(getCardItem(null)).toBeUndefined();
    expect(getCardItem({ kind: 'talisman', id: 123 })).toBeUndefined();
    expect(getCardItem({ kind: 'chest', id: 680000 })).toBeUndefined();
  });
});

describe('game data accessors', () => {
  it('look items up by game ID', () => {
    expect(getWeapon(1000000)?.name).toBe('Dagger');
    expect(getWeapon(9000000)?.name).toBe('Uchigatana');
    expect(getSpell(4000)?.kind).toBe('sorcery');
    expect(getTalisman(1040)?.name).toBe("Erdtree's Favor");
  });

  it('return undefined for null, unknown IDs, and armor in the wrong slot', () => {
    expect(getWeapon(null)).toBeUndefined();
    expect(getWeapon(undefined)).toBeUndefined();
    expect(getWeapon(123)).toBeUndefined();
    const whiteMask = armorList('head').find((piece) => piece.name === 'White Mask')!;
    expect(getArmor(whiteMask.id, 'head')).toBe(whiteMask);
    expect(getArmor(whiteMask.id, 'chest')).toBeUndefined();
  });

  it('lists armor per slot and knows the tags', () => {
    expect(armorList('legs').length).toBeGreaterThan(100);
    expect(armorList('legs').every((piece) => piece.slot === 'legs')).toBe(true);
    expect(weapons.length).toBe(487);
    expect(Object.keys(tagGroups)).toContain('Bosses');
  });

  it('names skills, Ashes and affinities as the game does', () => {
    expect(getSkill(NO_SKILL_ID)?.name).toBe('No Skill');
    const uchigatana = getWeapon(9000000)!;
    expect(weaponSkill(uchigatana, null)?.name).toBe('Unsheathe');
    const seppuku = getAsh(60600)!;
    expect(ashLabel(seppuku)).toBe('Seppuku');
    expect(weaponSkill(uchigatana, seppuku)?.name).toBe('Seppuku');
    expect(affinityName('flame-art')).toBe('Flame Art');
    expect(iconUrl(10320)).toBe('/assets/icons/10320.webp');
  });
});
