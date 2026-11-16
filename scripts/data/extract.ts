// Turns the exported params + text into the site's game data (src/data/schema.ts shapes). Pure: no
// file access, so the fixture tests cover it. Anything odd goes into `problems` (the build fails on
// them) or `notes` (printed, accepted); the build decides.
import type {
  Affinity,
  Armor,
  Arrow,
  AshOfWar,
  Goods,
  Skill,
  Spell,
  Talisman,
  Weapon,
  WeaponType,
} from '../../src/data/schema.ts';
import { AFFINITY_KEYS } from '../../src/data/schema.ts';
import {
  AFFINITY_NAMES,
  affinityOffset,
  ARMOR_SLOTS,
  EXCLUDED,
  GEM_MOUNT_ALLOW_CHANGE,
  GEM_MOUNT_FLAGS,
  GESTURE_SORT_GROUP,
  GOODS_TYPE,
  ODD_DEFAULT_ASHES,
  WEAPON_TYPES,
} from './constants.ts';
import { talismanModifiers } from './character.ts';
import { num, type Param, type Row, type TextEntry, type TextIndex } from './export.ts';
import { DLC_BOSSES, TAGS_2022 } from './tags.ts';

/** The params the pipeline reads, by CSV file name. */
export const PARAM_NAMES = [
  'EquipParamWeapon',
  'EquipParamGem',
  'SwordArtsParam',
  'EquipParamProtector',
  'EquipParamAccessory',
  'EquipParamGoods',
  'Magic',
  'SpEffectParam',
] as const;
export type ParamName = (typeof PARAM_NAMES)[number];

export interface ExportData {
  params: Record<ParamName, Param>;
  text: TextIndex;
}

export interface GameData {
  affinities: Affinity[];
  weaponTypes: WeaponType[];
  skills: Skill[];
  ashesOfWar: AshOfWar[];
  weapons: Weapon[];
  arrows: Arrow[];
  armor: Armor[];
  talismans: Talisman[];
  spells: Spell[];
  tears: Goods[];
  consumables: Goods[];
  greatRunes: Goods[];
  spiritAshes: Goods[];
  tags: Record<string, string[]>;
}

export interface Extraction {
  data: GameData;
  problems: string[];
  notes: string[];
}

const round = (value: number, digits = 1) => Number(value.toFixed(digits));

/** Weapon rows: +0 of each weapon is a multiple of 10000; +100…+1200 are its affinities. */
const isBaseWeaponRow = (id: number) => id % 10000 === 0;

export function extract({ params, text }: ExportData): Extraction {
  const problems: string[] = [];
  const notes: string[] = [];
  const fmg = (name: string) => text.get(name) ?? new Map<number, TextEntry>();
  const names = {
    weapon: fmg('WeaponName'),
    protector: fmg('ProtectorName'),
    accessory: fmg('AccessoryName'),
    accessoryInfo: fmg('AccessoryInfo'),
    goods: fmg('GoodsName'),
    goodsInfo: fmg('GoodsInfo'),
    gem: fmg('GemName'),
    arts: fmg('ArtsName'),
    npc: fmg('NpcName'),
    menu: fmg('GR_MenuText'),
  };
  for (const [key, entries] of Object.entries(names))
    if (!entries.size) problems.push(`text: no ${key} entries (is the text dump complete?)`);

  // Skills are collected as weapons and Ashes of War reference them.
  const skills = new Map<number, Skill>();
  const skillFor = (artsId: number, owner: string): number | null => {
    if (artsId <= 0) return null;
    if (skills.has(artsId)) return artsId;
    const row = params.SwordArtsParam.get(artsId);
    if (!row) {
      problems.push(`${owner}: skill ${artsId} is not in SwordArtsParam`);
      return null;
    }
    const textId = row.textId === undefined ? 0 : num(row, 'textId');
    const label = names.arts.get(artsId) ?? (textId > 0 ? names.arts.get(textId) : undefined);
    // "No Skill" is a real skill in the game (shields, staffs and seals come with it; an Ash of War
    // of that name removes a weapon's skill), so it's kept like any other.
    if (!label) {
      notes.push(`${owner}: skill ${artsId} has no name; treated as no skill`);
      return null;
    }
    const uses = ['useMagicPoint_L2', 'useMagicPoint_R2', 'useMagicPoint_R1', 'useMagicPoint_L1'];
    const fp = uses.map((column) => Math.max(0, num(row, column))).find((value) => value > 0) ?? 0;
    skills.set(artsId, { id: artsId, name: label.text, fp, dlc: label.dlc > 0 });
    return artsId;
  };

  const damageTypes = (row: Row) =>
    (
      [
        ['isNormalAttackType', 'standard'],
        ['isBlowAttackType', 'strike'],
        ['isSlashAttackType', 'slash'],
        ['isThrustAttackType', 'pierce'],
      ] as const
    )
      .filter(([column]) => num(row, column) === 1)
      .map(([, type]) => type);
  const attack = (row: Row) => ({
    physical: num(row, 'attackBasePhysics'),
    magic: num(row, 'attackBaseMagic'),
    fire: num(row, 'attackBaseFire'),
    lightning: num(row, 'attackBaseThunder'),
    holy: num(row, 'attackBaseDark'),
  });

  // Weapons and ammunition.
  const weaponTypes = new Map(WEAPON_TYPES.map((type) => [type.id, type]));
  const usedTypes = new Set<number>();
  const weapons: Weapon[] = [];
  const arrows: Arrow[] = [];
  for (const [id, row] of params.EquipParamWeapon) {
    if (!isBaseWeaponRow(id) || EXCLUDED.weapons.has(id)) continue;
    const label = names.weapon.get(id);
    if (!label) continue;
    const icon = num(row, 'iconId');
    const typeId = num(row, 'wepType');
    const type = weaponTypes.get(typeId);
    if (!type) {
      problems.push(`weapon ${id} "${label.text}": unknown weapon type ${typeId}`);
      continue;
    }
    if (icon <= 0) {
      notes.push(`weapon ${id} "${label.text}": no icon, skipped`);
      continue;
    }
    usedTypes.add(typeId);
    const base = { id, name: label.text, icon, dlc: label.dlc > 0 };
    if (type.group === 'ammo') {
      arrows.push({
        ...base,
        type: typeId,
        weight: round(num(row, 'weight'), 2),
        attack: attack(row),
        damageTypes: damageTypes(row),
      });
      continue;
    }
    weapons.push({
      ...base,
      type: typeId,
      weight: round(num(row, 'weight'), 2),
      attack: attack(row),
      scaling: {
        str: num(row, 'correctStrength'),
        dex: num(row, 'correctAgility'),
        int: num(row, 'correctMagic'),
        fai: num(row, 'correctFaith'),
        arc: num(row, 'correctLuck'),
      },
      requirements: {
        str: num(row, 'properStrength'),
        dex: num(row, 'properAgility'),
        int: num(row, 'properMagic'),
        fai: num(row, 'properFaith'),
        arc: num(row, 'properLuck'),
      },
      damageTypes: damageTypes(row),
      skill: skillFor(num(row, 'swordArtsParamId'), `weapon ${id} "${label.text}"`),
      ashesOfWar: num(row, 'gemMountType') === GEM_MOUNT_ALLOW_CHANGE,
      affinities: AFFINITY_KEYS.filter(
        (key) => key === 'standard' || params.EquipParamWeapon.has(id + affinityOffset(key)),
      ),
    });
  }

  // Ashes of War.
  const ashesOfWar: AshOfWar[] = [];
  for (const [id, row] of params.EquipParamGem) {
    const label = names.gem.get(id);
    const icon = num(row, 'iconId');
    if (!label || icon <= 0) continue;
    const owner = `ash of war ${id} "${label.text}"`;
    const types = Object.entries(GEM_MOUNT_FLAGS)
      .filter(([column, type]) => type !== null && num(row, column) === 1)
      .map(([, type]) => type as number)
      // Flags for types no weapon has (unused in ER) are dropped.
      .filter((type) => usedTypes.has(type));
    const affinities = AFFINITY_KEYS.filter(
      (_, index) => num(row, `configurableWepAttr${String(index).padStart(2, '0')}`) === 1,
    );
    const skill = skillFor(num(row, 'swordArtsParamId'), owner);
    if (!types.length || !affinities.length || skill === null) {
      notes.push(`${owner}: no weapon types, affinities or skill; skipped`);
      continue;
    }
    ashesOfWar.push({
      id,
      name: label.text,
      icon,
      dlc: label.dlc > 0,
      skill,
      weaponTypes: types,
      affinities: affinities.includes('standard') ? affinities : ['standard', ...affinities],
    });
  }

  // A weapon takes Ashes of War only if the game allows a change AND some Ash fits its type (staffs
  // and seals are marked changeable but no Ash fits them).
  const ashTypes = new Set(ashesOfWar.flatMap((ash) => ash.weaponTypes));
  for (const weapon of weapons) weapon.ashesOfWar &&= ashTypes.has(weapon.type);

  // Cross-check of GEM_MOUNT_FLAGS: a weapon that takes Ashes of War accepts its own default Ash.
  const ashesBySkill = new Map<number, AshOfWar[]>();
  for (const ash of ashesOfWar)
    ashesBySkill.set(ash.skill, [...(ashesBySkill.get(ash.skill) ?? []), ash]);
  for (const weapon of weapons) {
    // "No Skill" means no Ash is mounted, so there's no default Ash to check (staffs come with it and
    // take only Spinning Weapon, which the game does allow on them).
    if (
      !weapon.ashesOfWar ||
      weapon.skill === null ||
      skills.get(weapon.skill)?.name === 'No Skill'
    )
      continue;
    const defaults = ashesBySkill.get(weapon.skill) ?? [];
    const fits = !defaults.length || defaults.some((ash) => ash.weaponTypes.includes(weapon.type));
    if (ODD_DEFAULT_ASHES.has(weapon.id)) {
      if (fits)
        notes.push(`weapon ${weapon.id} "${weapon.name}" no longer needs ODD_DEFAULT_ASHES`);
    } else if (!fits)
      problems.push(
        `weapon ${weapon.id} "${weapon.name}": its default Ash (${defaults[0]!.name}) doesn't list type ${weapon.type}`,
      );
  }

  // Armor.
  const armor: Armor[] = [];
  for (const [id, row] of params.EquipParamProtector) {
    const label = names.protector.get(id);
    const slot = ARMOR_SLOTS[num(row, 'protectorCategory') as keyof typeof ARMOR_SLOTS];
    const icon = num(row, 'iconIdM');
    if (!label || !slot || icon <= 0 || EXCLUDED.armor.has(id)) continue;
    const negation = (column: string) => round((1 - num(row, column)) * 100);
    armor.push({
      id,
      name: label.text,
      icon,
      dlc: label.dlc > 0,
      slot,
      weight: round(num(row, 'weight'), 2),
      poise: round(num(row, 'toughnessCorrectRate') * 1000, 1),
      negation: {
        physical: negation('neutralDamageCutRate'),
        strike: negation('blowDamageCutRate'),
        slash: negation('slashDamageCutRate'),
        pierce: negation('thrustDamageCutRate'),
        magic: negation('magicDamageCutRate'),
        fire: negation('fireDamageCutRate'),
        lightning: negation('thunderDamageCutRate'),
        holy: negation('darkDamageCutRate'),
      },
      resistance: {
        immunity: num(row, 'resistPoison'),
        robustness: num(row, 'resistBlood'),
        focus: num(row, 'resistSleep'),
        vitality: num(row, 'resistCurse'),
      },
    });
  }

  // Talismans.
  const talismans: Talisman[] = [];
  for (const [id, row] of params.EquipParamAccessory) {
    const label = names.accessory.get(id);
    const icon = num(row, 'iconId');
    if (!label || icon <= 0) continue;
    const modifiers = talismanModifiers(params.SpEffectParam, num(row, 'refId'));
    talismans.push({
      id,
      name: label.text,
      icon,
      dlc: label.dlc > 0,
      weight: round(num(row, 'weight'), 2),
      effect: names.accessoryInfo.get(id)?.text ?? '',
      group: num(row, 'accessoryGroup'),
      ...(modifiers ? { modifiers } : {}),
    });
  }

  // Goods: spells, tears, great runes, spirit ashes, consumables. Upgraded copies of an item (spirit
  // ash +1…+10, flask +1…+12, empty flasks) are one item: the lowest ID, named without the "+N".
  // Gestures are goods too; they're dropped.
  const goodsByType = new Map<number, Goods[]>();
  const seenGoods = new Set<string>();
  for (const [id, row] of params.EquipParamGoods) {
    const label = names.goods.get(id);
    const icon = num(row, 'iconId');
    if (!label || icon <= 0 || num(row, 'sortGroupId') === GESTURE_SORT_GROUP) continue;
    const goodsType = num(row, 'goodsType');
    const baseName = label.text.replace(/ \+ ?\d+$/, ''); // "+1", and "+ 1" on some spirit ashes
    const key = `${goodsType}:${baseName}`;
    if (seenGoods.has(key)) continue;
    seenGoods.add(key);
    const goods = {
      id,
      name: baseName,
      icon,
      dlc: label.dlc > 0,
      effect: names.goodsInfo.get(id)?.text ?? '',
    };
    goodsByType.set(goodsType, [...(goodsByType.get(goodsType) ?? []), goods]);
  }
  const goodsOf = (...types: number[]) =>
    types.flatMap((type) => goodsByType.get(type) ?? []).sort((a, b) => a.id - b.id);

  const spells: Spell[] = [];
  const spellKinds = [
    ['sorcery', [GOODS_TYPE.sorcery, GOODS_TYPE.sorcerySelfBuff]],
    ['incantation', [GOODS_TYPE.incantation, GOODS_TYPE.incantationSelfBuff]],
  ] as const;
  for (const [kind, types] of spellKinds) {
    for (const goods of goodsOf(...types)) {
      const magic = params.Magic.get(goods.id);
      if (!magic) {
        problems.push(`spell ${goods.id} "${goods.name}": no Magic row`);
        continue;
      }
      spells.push({
        ...goods,
        kind,
        fp: Math.max(0, num(magic, 'mp')),
        stamina: Math.max(0, num(magic, 'stamina')),
        slots: num(magic, 'slotLength'),
        requirements: {
          int: num(magic, 'requirementIntellect'),
          fai: num(magic, 'requirementFaith'),
          arc: num(magic, 'requirementLuck'),
        },
      });
    }
  }

  // Tags: 2022 groups, plus the DLC weapon types and bosses.
  const tags = structuredClone(TAGS_2022);
  for (const type of WEAPON_TYPES)
    if (type.dlc && type.group === 'melee' && usedTypes.has(type.id))
      tags['Melee Weapons']!.push(type.name);
  const npcNames = [...names.npc.values()].map((entry) => entry.text);
  for (const boss of DLC_BOSSES) {
    if (!npcNames.some((npc) => npc.includes(boss)))
      problems.push(`tag "${boss}": no NPC name in the game's text contains it`);
    tags.Bosses!.push(boss);
  }

  const menuTexts = new Set([...names.menu.values()].map((entry) => entry.text));
  for (const type of WEAPON_TYPES)
    if (usedTypes.has(type.id) && !menuTexts.has(type.name))
      problems.push(`weapon type ${type.id} "${type.name}" isn't a name in the game's menu text`);

  const unusedTypes = WEAPON_TYPES.filter((type) => !usedTypes.has(type.id));
  if (unusedTypes.length)
    notes.push(`weapon types with no weapons: ${unusedTypes.map((t) => t.name).join(', ')}`);

  const byId = <T extends { id: number }>(items: T[]) => items.sort((a, b) => a.id - b.id);
  return {
    data: {
      affinities: AFFINITY_KEYS.map((key) => ({
        key,
        name: AFFINITY_NAMES[key],
        offset: affinityOffset(key),
      })),
      weaponTypes: WEAPON_TYPES.filter((type) => usedTypes.has(type.id)),
      skills: byId([...skills.values()]),
      ashesOfWar: byId(ashesOfWar),
      weapons: byId(weapons),
      arrows: byId(arrows),
      armor: byId(armor),
      talismans: byId(talismans),
      spells: byId(spells),
      tears: goodsOf(GOODS_TYPE.tear),
      consumables: goodsOf(GOODS_TYPE.normalItem, GOODS_TYPE.wondrousPhysick),
      greatRunes: goodsOf(GOODS_TYPE.greatRune),
      spiritAshes: goodsOf(GOODS_TYPE.spiritLesser, GOODS_TYPE.spiritGreater),
      tags,
    },
    problems,
    notes,
  };
}
