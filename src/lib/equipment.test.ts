import { describe, expect, it } from 'vitest';
import { buildImage, imageChoices, mainWeaponId } from './equipment';
import type { Equipment } from './models';

describe('mainWeaponId', () => {
  it('takes the first filled main-hand slot', () => {
    expect(mainWeaponId({ weapons: [null, 12, 13, 1, null, null] })).toBe(12);
  });

  it('falls back to the off hand when the main hand is empty', () => {
    expect(mainWeaponId({ weapons: [null, null, null, null, 7, 8] })).toBe(7);
  });

  it('is null without weapons', () => {
    expect(mainWeaponId({ weapons: [null, null, null, null, null, null] })).toBeNull();
    expect(mainWeaponId({ weapons: [] })).toBeNull();
  });
});

const equipment = (overrides: Partial<Equipment> = {}): Equipment => ({
  weapons: [9000000, null, null, 30000000, null, null], // Uchigatana, Buckler
  weaponAffinities: [null, null, null, null, null, null],
  weaponSkills: [null, null, null, null, null, null],
  arrows: [50000000, null, null, null],
  talismans: [2160, 1040],
  spells: [4000],
  tears: [11011],
  consumables: [1],
  helm: 680000,
  chest: null,
  gauntlet: null,
  leg: 580300,
  greatRune: 191,
  spiritAsh: 207000,
  ...overrides,
});

describe('buildImage', () => {
  it("shows the author's pick while it's on the build", () => {
    const image = { kind: 'talisman', id: 2160 } as const;
    expect(buildImage({ image, equipment: equipment() })).toEqual(image);
    expect(buildImage({ image: { kind: 'leg', id: 580300 }, equipment: equipment() })).toEqual({
      kind: 'leg',
      id: 580300,
    });
    expect(buildImage({ image: { kind: 'weapon', id: 30000000 }, equipment: equipment() })).toEqual(
      { kind: 'weapon', id: 30000000 },
    );
  });

  it('falls back to the main weapon without a pick', () => {
    expect(buildImage({ image: null, equipment: equipment() })).toEqual({
      kind: 'weapon',
      id: 9000000,
    });
  });

  it('falls back to the main weapon when the pick was removed or swapped', () => {
    const image = { kind: 'talisman', id: 2160 } as const;
    expect(buildImage({ image, equipment: equipment({ talismans: [] }) })).toEqual({
      kind: 'weapon',
      id: 9000000,
    });
    expect(buildImage({ image, equipment: equipment({ talismans: [1040, 1000] }) })).toEqual({
      kind: 'weapon',
      id: 9000000,
    });
    // The same ID in another kind's slot isn't the picked item.
    expect(buildImage({ image: { kind: 'chest', id: 680000 }, equipment: equipment() })).toEqual({
      kind: 'weapon',
      id: 9000000,
    });
  });

  it('is null with no pick on the build and no weapons', () => {
    const weapons = [null, null, null, null, null, null];
    expect(buildImage({ image: null, equipment: equipment({ weapons }) })).toBeNull();
    expect(
      buildImage({ image: { kind: 'spell', id: 9999 }, equipment: equipment({ weapons }) }),
    ).toBeNull();
  });
});

describe('imageChoices', () => {
  it('lists the gear in Loadout order, without arrows or consumables', () => {
    expect(imageChoices(equipment())).toEqual([
      { kind: 'weapon', id: 9000000 },
      { kind: 'weapon', id: 30000000 },
      { kind: 'helm', id: 680000 },
      { kind: 'leg', id: 580300 },
      { kind: 'talisman', id: 2160 },
      { kind: 'talisman', id: 1040 },
      { kind: 'tear', id: 11011 },
      { kind: 'greatRune', id: 191 },
      { kind: 'spiritAsh', id: 207000 },
      { kind: 'spell', id: 4000 },
    ]);
  });

  it('lists an item once even when the build carries it twice', () => {
    const choices = imageChoices(
      equipment({ weapons: [9000000, null, null, 9000000, null, null], spells: [4000, 4000] }),
    );
    expect(choices.filter((c) => c.kind === 'weapon')).toEqual([{ kind: 'weapon', id: 9000000 }]);
    expect(choices.filter((c) => c.kind === 'spell')).toHaveLength(1);
  });
});
