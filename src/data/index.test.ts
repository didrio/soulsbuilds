import { describe, expect, it } from 'vitest';
import {
  affinityName,
  armorList,
  ashLabel,
  getArmor,
  getAsh,
  getSkill,
  getSpell,
  getTalisman,
  getWeapon,
  iconUrl,
  NO_SKILL_ID,
  tagGroups,
  weapons,
  weaponSkill,
} from '.';

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
