// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { validate } from './build.ts';
import { extract } from './extract.ts';
import { csv, fixtureExport } from './test-fixtures.ts';
import { parseParamCsv } from './export.ts';

describe('extract', () => {
  const { data, problems } = extract(fixtureExport());

  it('reports no problems on a consistent export, and the result validates', () => {
    expect(problems).toEqual([]);
    expect(validate(data)).toEqual([]);
  });

  it('keeps +0 weapon rows that have a name, with the affinities the game has rows for', () => {
    expect(data.weapons.map((w) => w.name)).toEqual([
      'Dagger',
      'Moonveil',
      'Milady',
      'Glintstone Staff',
    ]);
    expect(data.weapons[0]).toMatchObject({
      id: 1000000,
      type: 1,
      weight: 1.5,
      skill: 100,
      ashesOfWar: true,
      affinities: ['standard', 'heavy', 'flame-art', 'cold'],
      damageTypes: ['slash', 'pierce'],
      attack: { physical: 75, magic: 0, fire: 0, lightning: 0, holy: 0 },
      scaling: { str: 35, dex: 55, int: 0, fai: 0, arc: 0 },
      requirements: { str: 5, dex: 9, int: 0, fai: 0, arc: 0 },
      dlc: false,
    });
  });

  it('marks unique weapons (fixed skill, standard only) and DLC weapons', () => {
    const moonveil = data.weapons.find((w) => w.name === 'Moonveil');
    expect(moonveil).toMatchObject({ ashesOfWar: false, affinities: ['standard'], skill: 300 });
    expect(data.weapons.find((w) => w.name === 'Milady')).toMatchObject({ dlc: true, type: 93 });
  });

  it('puts ammunition in arrows and lists only weapon types that have items', () => {
    expect(data.arrows).toMatchObject([{ id: 50000000, name: 'Arrow', type: 81 }]);
    expect(data.weaponTypes.map((t) => t.name)).toEqual([
      'Dagger',
      'Katana',
      'Glintstone Staff',
      'Arrow',
      'Light Greatsword',
    ]);
  });

  it('collects the skills weapons and Ashes use, with their FP', () => {
    expect(data.skills).toEqual([
      { id: 10, name: 'No Skill', fp: 0, dlc: false },
      { id: 100, name: 'Quickstep', fp: 3, dlc: false },
      { id: 110, name: 'Unending Dance', fp: 12, dlc: true },
      { id: 120, name: 'Bloody Slash', fp: 9, dlc: false },
      { id: 300, name: 'Transient Moonlight', fp: 18, dlc: false },
    ]);
  });

  it('reads Ashes of War: weapon types from the mount flags, affinities incl. standard', () => {
    expect(data.ashesOfWar.map((a) => a.name)).toEqual([
      'Ash of War: Quickstep',
      'Ash of War: Bloody Slash',
    ]);
    expect(data.ashesOfWar[0]).toEqual({
      id: 10000,
      name: 'Ash of War: Quickstep',
      icon: 10,
      dlc: false,
      skill: 100,
      weaponTypes: [1, 93],
      affinities: ['standard', 'heavy', 'flame-art', 'cold'],
    });
    expect(data.ashesOfWar[1]).toMatchObject({
      weaponTypes: [1, 13],
      affinities: ['standard', 'blood'],
    });
  });

  it('reads armor slots, poise, negation in percent and resistances; skips hair', () => {
    expect(data.armor.map((a) => [a.name, a.slot])).toEqual([
      ['Iron Helmet', 'head'],
      ['Iron Armor', 'chest'],
    ]);
    expect(data.armor[0]).toMatchObject({
      poise: 4,
      negation: { physical: 5, holy: 5 },
      resistance: { immunity: 20, robustness: 21, focus: 22, vitality: 23 },
    });
  });

  it('sorts goods into spells, tears, great runes, spirit ashes and consumables', () => {
    expect(data.spells).toMatchObject([
      {
        name: 'Glintstone Pebble',
        kind: 'sorcery',
        fp: 7,
        slots: 1,
        effect: 'Fires a glintstone pebble',
      },
      { name: 'Heal', kind: 'incantation', fp: 25, requirements: { fai: 12 } },
    ]);
    expect(data.tears.map((g) => g.name)).toEqual(['Crimsonspill Crystal Tear']);
    expect(data.greatRunes.map((g) => g.name)).toEqual(["Godrick's Great Rune"]);
    expect(data.spiritAshes).toMatchObject([{ id: 200000, name: 'Black Knife Tiche' }]);
    expect(data.consumables.map((g) => g.name)).toEqual([
      'Flask of Wondrous Physick',
      'Throwing Dagger',
    ]);
    expect(data.talismans).toMatchObject([
      { name: 'Crimson Amber Medallion', group: 100, modifiers: { hp: 1.06 } },
    ]);
  });

  it('drops Unarmed, gestures and "+N" copies', () => {
    expect(data.weapons.some((w) => w.name === 'Unarmed')).toBe(false);
    expect(data.consumables.some((g) => g.name === 'Bow')).toBe(false);
    expect(data.spiritAshes.map((g) => g.name)).toEqual(['Black Knife Tiche']);
  });

  it('keeps "No Skill" as a skill; staffs take no Ashes though the game marks them changeable', () => {
    expect(data.skills.find((s) => s.id === 10)).toMatchObject({ name: 'No Skill' });
    expect(data.weapons.find((w) => w.name === 'Glintstone Staff')).toMatchObject({
      skill: 10,
      ashesOfWar: false,
      affinities: ['standard'],
    });
  });

  it("reports a weapon type whose name isn't in the game's menu text", () => {
    const exported = fixtureExport();
    exported.text.set('GR_MenuText', new Map());
    expect(extract(exported).problems).toContain(
      `weapon type 1 "Dagger" isn't a name in the game's menu text`,
    );
  });

  it('adds the DLC weapon types and bosses to the 2022 tags', () => {
    expect(data.tags['Melee Weapons']).toContain('Light Greatsword');
    expect(data.tags['Melee Weapons']).toContain('Dagger');
    expect(data.tags.Bosses).toContain('Malenia');
    expect(data.tags.Bosses).toContain('Messmer');
  });

  it('reports an unknown weapon type, a spell without a Magic row and an unknown boss', () => {
    const exported = fixtureExport();
    exported.params.EquipParamWeapon.get(1000000)!.wepType = '99';
    exported.params.Magic = parseParamCsv(csv(['mp'], []));
    exported.text.set('NpcName', new Map());
    const result = extract(exported);
    expect(result.problems).toContain('weapon 1000000 "Dagger": unknown weapon type 99');
    expect(result.problems).toContain('spell 4000 "Glintstone Pebble": no Magic row');
    expect(result.problems).toContain('tag "Messmer": no NPC name in the game\'s text contains it');
  });

  it("reports a weapon whose default Ash doesn't list its type (checks the mount flag table)", () => {
    const exported = fixtureExport();
    exported.params.EquipParamGem.get(10000)!.canMountWep_Dagger = '0';
    expect(extract(exported).problems).toContain(
      'weapon 1000000 "Dagger": its default Ash (Ash of War: Quickstep) doesn\'t list type 1',
    );
  });

  it('fails loudly when a column it reads is missing', () => {
    const exported = fixtureExport();
    delete exported.params.EquipParamWeapon.get(1000000)!.weight;
    expect(() => extract(exported)).toThrow('Column weight missing (row 1000000)');
  });
});
