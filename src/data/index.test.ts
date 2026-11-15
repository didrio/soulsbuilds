import { describe, expect, it } from 'vitest';
import {
  affinities,
  armorList,
  getArmor,
  getArrow,
  getSkill,
  getSpell,
  getTalisman,
  getTear,
  getWeapon,
  skillNames,
  tagGroups,
  weapons,
} from '.';

describe('game data accessors', () => {
  it('look items up by exact name', () => {
    expect(getWeapon('Rivers of Blood')?.type).toBe('Katana');
    expect(getArmor('helms', 'White Mask')?.name).toBe('White Mask');
    expect(getSpell('Rock Sling')?.slot).toBe('1');
    expect(getTalisman("Millicent's Prosthesis")?.name).toBe("Millicent's Prosthesis");
    expect(getTear('Crimson Crystal Tear')?.name).toBe('Crimson Crystal Tear');
    expect(getArrow('Arrow')?.name).toBe('Arrow');
    expect(getSkill('Corpse Piler')?.name).toBe('Corpse Piler');
  });

  it('return undefined for unknown, null or missing names', () => {
    expect(getWeapon('Not A Sword')).toBeUndefined();
    expect(getWeapon(null)).toBeUndefined();
    expect(getArmor('legs', undefined)).toBeUndefined();
    expect(getSkill(null)).toBeUndefined();
  });

  it('lists every item of a kind', () => {
    expect(weapons).toHaveLength(374);
    expect(armorList('helms')).toHaveLength(157);
    expect(armorList('helms').every((helm) => helm.type === 'Helm')).toBe(true);
    expect(affinities).toContain('Blood');
    expect(Object.keys(tagGroups)).toContain('Bosses');
    expect(skillNames).toEqual([...skillNames].sort());
  });
});
