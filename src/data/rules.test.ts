// The equipment rules against the real game data (known in-game behavior).
import { describe, expect, it } from 'vitest';
import {
  allowedAffinities,
  ashChoices,
  ashesOfWar,
  fitAffinity,
  fitAsh,
  talismans,
  talismanConflict,
  weapons,
  type AshOfWar,
  type Talisman,
  type Weapon,
} from '.';

const weapon = (name: string): Weapon => weapons.find((w) => w.name === name)!;
const ash = (skill: string): AshOfWar => ashesOfWar.find((a) => a.name === `Ash of War: ${skill}`)!;
const talisman = (name: string): Talisman => talismans.find((t) => t.name === name)!;
const names = (ashes: AshOfWar[]) => ashes.map((a) => a.name.replace('Ash of War: ', ''));

describe('Ashes of War', () => {
  it('offers the Ashes that fit the weapon type, minus the one granting its built-in skill', () => {
    const choices = names(ashChoices(weapon('Uchigatana')));
    expect(choices).toContain('Seppuku');
    expect(choices).not.toContain('Unsheathe'); // its built-in skill
    expect(choices).not.toContain('Shield Bash'); // shields only
  });

  it('offers nothing for weapons with a fixed skill (unique weapons, seals)', () => {
    expect(ashChoices(weapon('Moonveil'))).toEqual([]);
    expect(ashChoices(weapon('Finger Seal'))).toEqual([]);
  });

  it('lets staffs take only Spinning Weapon, and shields remove "No Skill" only by keeping it', () => {
    expect(names(ashChoices(weapon('Glintstone Staff')))).toEqual(['Spinning Weapon']);
    const shield = names(ashChoices(weapon('Brass Shield')));
    expect(shield).toContain('Parry');
    expect(shield).not.toContain('No Skill'); // the shield's built-in skill already
  });

  it('keeps a chosen Ash only if the weapon can take it; the built-in one becomes null', () => {
    expect(fitAsh(weapon('Uchigatana'), ash('Seppuku'))?.name).toBe('Ash of War: Seppuku');
    expect(fitAsh(weapon('Uchigatana'), ash('Unsheathe'))).toBeNull();
    expect(fitAsh(weapon('Uchigatana'), ash('Shield Bash'))).toBeNull();
    expect(fitAsh(weapon('Moonveil'), ash('Seppuku'))).toBeNull();
    expect(fitAsh(weapon('Uchigatana'), null)).toBeNull();
  });
});

describe('affinities', () => {
  it("are the weapon's own ∩ the chosen Ash's", () => {
    const withSeppuku = allowedAffinities(weapon('Uchigatana'), ash('Seppuku'));
    expect(withSeppuku).toEqual([
      'standard',
      'heavy',
      'keen',
      'quality',
      'poison',
      'blood',
      'occult',
    ]);
    expect(allowedAffinities(weapon('Glintstone Staff'), ash('Spinning Weapon'))).toEqual([
      'standard',
    ]);
  });

  it('follow the built-in skill when no Ash is chosen', () => {
    expect(allowedAffinities(weapon('Uchigatana'), null)).toHaveLength(13); // Unsheathe allows all
    expect(allowedAffinities(weapon('Flail'), null)).toHaveLength(13); // unique Spinning Chain
    expect(allowedAffinities(weapon('Katar'), null)).toEqual(
      allowedAffinities(weapon('Katar'), ash('Impaling Thrust')),
    );
  });

  it('are standard only for weapons that cannot take Ashes', () => {
    expect(allowedAffinities(weapon('Moonveil'), null)).toEqual(['standard']);
    // These have affinity rows in the game files, but no Ash can be applied to them.
    expect(allowedAffinities(weapon('Great Club'), null)).toEqual(['standard']);
  });

  it('keep an allowed affinity and store Standard (or a disallowed one) as null', () => {
    expect(fitAffinity(weapon('Uchigatana'), ash('Seppuku'), 'blood')).toBe('blood');
    expect(fitAffinity(weapon('Uchigatana'), ash('Seppuku'), 'fire')).toBeNull();
    expect(fitAffinity(weapon('Uchigatana'), null, 'standard')).toBeNull();
    expect(fitAffinity(weapon('Moonveil'), null, 'cold')).toBeNull();
  });
});

describe('talismans', () => {
  it('rule out a talisman whose group is already worn', () => {
    const favor = talisman("Erdtree's Favor");
    expect(talismanConflict(talisman("Erdtree's Favor +1"), [null, favor])).toBe(favor);
    expect(talismanConflict(favor, [favor])).toBe(favor); // the same one twice
    expect(talismanConflict(talisman('Godfrey Icon'), [favor, null])).toBeUndefined();
  });
});
