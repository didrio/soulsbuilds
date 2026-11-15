// Editor slot ids and types. Every slot in the editor has an id (the Redux key it writes to) and a
// type (which item list the picker shows).

export const SLOT_TYPE_ARROW = 'SLOT_TYPE_ARROW';
export const SLOT_TYPE_CHEST = 'SLOT_TYPE_CHEST';
export const SLOT_TYPE_CON = 'SLOT_TYPE_CON';
export const SLOT_TYPE_GAUNTLET = 'SLOT_TYPE_GAUNTLET';
export const SLOT_TYPE_GREAT_RUNE = 'SLOT_TYPE_GREAT_RUNE';
export const SLOT_TYPE_HELM = 'SLOT_TYPE_HELM';
export const SLOT_TYPE_LEG = 'SLOT_TYPE_LEG';
export const SLOT_TYPE_SPELL = 'SLOT_TYPE_SPELL';
export const SLOT_TYPE_SPIRIT_ASH = 'SLOT_TYPE_SPIRIT_ASH';
export const SLOT_TYPE_TAL = 'SLOT_TYPE_TAL';
export const SLOT_TYPE_TEAR = 'SLOT_TYPE_TEAR';
export const SLOT_TYPE_WEAPON = 'SLOT_TYPE_WEAPON';

export type SlotType =
  | typeof SLOT_TYPE_ARROW
  | typeof SLOT_TYPE_CHEST
  | typeof SLOT_TYPE_CON
  | typeof SLOT_TYPE_GAUNTLET
  | typeof SLOT_TYPE_GREAT_RUNE
  | typeof SLOT_TYPE_HELM
  | typeof SLOT_TYPE_LEG
  | typeof SLOT_TYPE_SPELL
  | typeof SLOT_TYPE_SPIRIT_ASH
  | typeof SLOT_TYPE_TAL
  | typeof SLOT_TYPE_TEAR
  | typeof SLOT_TYPE_WEAPON;

export const WEAPON_SLOTS = [
  'weapon1',
  'weapon2',
  'weapon3',
  'weapon4',
  'weapon5',
  'weapon6',
] as const;
export const WEAPON_SKILL_SLOTS = [
  'weaponSkill1',
  'weaponSkill2',
  'weaponSkill3',
  'weaponSkill4',
  'weaponSkill5',
  'weaponSkill6',
] as const;
export const WEAPON_AFFINITY_SLOTS = [
  'weaponAffinity1',
  'weaponAffinity2',
  'weaponAffinity3',
  'weaponAffinity4',
  'weaponAffinity5',
  'weaponAffinity6',
] as const;
export const ARROW_SLOTS = ['arrow1', 'arrow2', 'arrow3', 'arrow4'] as const;
export const TALISMAN_SLOTS = ['tal1', 'tal2', 'tal3', 'tal4'] as const;
export const CONSUMABLE_SLOTS = [
  'con1',
  'con2',
  'con3',
  'con4',
  'con5',
  'con6',
  'con7',
  'con8',
  'con9',
  'con10',
] as const;
export const SPELL_SLOTS = [
  'spell1',
  'spell2',
  'spell3',
  'spell4',
  'spell5',
  'spell6',
  'spell7',
  'spell8',
  'spell9',
  'spell10',
] as const;
export const TEAR_SLOTS = ['tear1', 'tear2'] as const;
export const ARMOR_SLOTS = ['helm', 'chest', 'gauntlet', 'leg'] as const;
/** Slots that hold one item: the armor, the great rune and the spirit ash. */
export const SINGLE_SLOTS = [...ARMOR_SLOTS, 'greatRune', 'spiritAsh'] as const;

export type WeaponSlot = (typeof WEAPON_SLOTS)[number];
export type WeaponSkillSlot = (typeof WEAPON_SKILL_SLOTS)[number];
export type WeaponAffinitySlot = (typeof WEAPON_AFFINITY_SLOTS)[number];
export type ArrowSlot = (typeof ARROW_SLOTS)[number];
export type TalismanSlot = (typeof TALISMAN_SLOTS)[number];
export type ConsumableSlot = (typeof CONSUMABLE_SLOTS)[number];
export type SpellSlot = (typeof SPELL_SLOTS)[number];
export type TearSlot = (typeof TEAR_SLOTS)[number];
export type ArmorSlot = (typeof ARMOR_SLOTS)[number];
export type SingleSlot = (typeof SINGLE_SLOTS)[number];

/** Any slot the item picker can be opened for. */
export type ItemSlot =
  WeaponSlot | ArrowSlot | TalismanSlot | ConsumableSlot | SpellSlot | TearSlot | SingleSlot;

/** The affinity and Ash of War slots that belong to weapon slot `id`. */
export function weaponSubSlots(id: WeaponSlot) {
  const index = WEAPON_SLOTS.indexOf(id);
  return { affinity: WEAPON_AFFINITY_SLOTS[index]!, skill: WEAPON_SKILL_SLOTS[index]! };
}

/** The weapon slot an affinity or Ash of War slot belongs to. */
export const weaponSlotOf = (id: WeaponAffinitySlot | WeaponSkillSlot): WeaponSlot =>
  `weapon${id.slice(-1)}` as WeaponSlot;

/** Type guard: is `id` one of `slots`? */
export const isSlot = <S extends string>(slots: readonly S[], id: string | null): id is S =>
  id !== null && (slots as readonly string[]).includes(id);
