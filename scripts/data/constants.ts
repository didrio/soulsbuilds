// Enum values of the Elden Ring params the pipeline reads. Source: Paramdex's ER definitions as shipped
// in Smithbox 2.2.6 (src/Smithbox.Data/Assets/PARAM/ER/: "Param Enums/WEP_TYPE.json", GOODS_TYPE,
// PROTECTOR_CATEGORY, GEM_MOUNT_TYPE, GEM_WEP_ATTR, and Defs/EquipParamGem.xml for the mount flags).
// Display names are the in-game ones (Paramdex's labels differ, e.g. "Reverse-hand Blade"); the build
// checks every weapon type name against the game's menu text (GR_MenuText).
import type { AffinityKey, WeaponType } from '../../src/data/schema.ts';
import { AFFINITY_KEYS } from '../../src/data/schema.ts';

/** In-game affinity names, by key. Row ID offset = index in AFFINITY_KEYS × 100. */
export const AFFINITY_NAMES: Record<AffinityKey, string> = {
  standard: 'Standard',
  heavy: 'Heavy',
  keen: 'Keen',
  quality: 'Quality',
  fire: 'Fire',
  'flame-art': 'Flame Art',
  lightning: 'Lightning',
  sacred: 'Sacred',
  magic: 'Magic',
  cold: 'Cold',
  poison: 'Poison',
  blood: 'Blood',
  occult: 'Occult',
};

export const affinityOffset = (key: AffinityKey) => AFFINITY_KEYS.indexOf(key) * 100;

/** wepType → in-game weapon type. Any named weapon with a type missing here fails the build. */
export const WEAPON_TYPES: readonly WeaponType[] = [
  { id: 1, name: 'Dagger', group: 'melee', dlc: false },
  { id: 3, name: 'Straight Sword', group: 'melee', dlc: false },
  { id: 5, name: 'Greatsword', group: 'melee', dlc: false },
  { id: 7, name: 'Colossal Sword', group: 'melee', dlc: false },
  { id: 9, name: 'Curved Sword', group: 'melee', dlc: false },
  { id: 11, name: 'Curved Greatsword', group: 'melee', dlc: false },
  { id: 13, name: 'Katana', group: 'melee', dlc: false },
  { id: 14, name: 'Twinblade', group: 'melee', dlc: false },
  { id: 15, name: 'Thrusting Sword', group: 'melee', dlc: false },
  { id: 16, name: 'Heavy Thrusting Sword', group: 'melee', dlc: false },
  { id: 17, name: 'Axe', group: 'melee', dlc: false },
  { id: 19, name: 'Greataxe', group: 'melee', dlc: false },
  { id: 21, name: 'Hammer', group: 'melee', dlc: false },
  { id: 23, name: 'Great Hammer', group: 'melee', dlc: false },
  { id: 24, name: 'Flail', group: 'melee', dlc: false },
  { id: 25, name: 'Spear', group: 'melee', dlc: false },
  { id: 28, name: 'Great Spear', group: 'melee', dlc: false },
  { id: 29, name: 'Halberd', group: 'melee', dlc: false },
  { id: 31, name: 'Reaper', group: 'melee', dlc: false },
  { id: 35, name: 'Fist', group: 'melee', dlc: false },
  { id: 37, name: 'Claw', group: 'melee', dlc: false },
  { id: 39, name: 'Whip', group: 'melee', dlc: false },
  { id: 41, name: 'Colossal Weapon', group: 'melee', dlc: false },
  { id: 50, name: 'Light Bow', group: 'ranged', dlc: false },
  { id: 51, name: 'Bow', group: 'ranged', dlc: false },
  { id: 53, name: 'Greatbow', group: 'ranged', dlc: false },
  { id: 55, name: 'Crossbow', group: 'ranged', dlc: false },
  { id: 56, name: 'Ballista', group: 'ranged', dlc: false },
  { id: 57, name: 'Glintstone Staff', group: 'catalyst', dlc: false },
  { id: 61, name: 'Sacred Seal', group: 'catalyst', dlc: false },
  { id: 65, name: 'Small Shield', group: 'shield', dlc: false },
  { id: 67, name: 'Medium Shield', group: 'shield', dlc: false },
  { id: 69, name: 'Greatshield', group: 'shield', dlc: false },
  { id: 81, name: 'Arrow', group: 'ammo', dlc: false },
  { id: 83, name: 'Greatarrow', group: 'ammo', dlc: false },
  { id: 85, name: 'Bolt', group: 'ammo', dlc: false },
  { id: 86, name: 'Greatbolt', group: 'ammo', dlc: false },
  { id: 87, name: 'Torch', group: 'melee', dlc: false },
  { id: 88, name: 'Hand-to-Hand', group: 'melee', dlc: true },
  { id: 89, name: 'Perfume Bottle', group: 'melee', dlc: true },
  { id: 90, name: 'Thrusting Shield', group: 'shield', dlc: true },
  { id: 91, name: 'Throwing Blade', group: 'melee', dlc: true },
  { id: 92, name: 'Backhand Blade', group: 'melee', dlc: true },
  { id: 93, name: 'Light Greatsword', group: 'melee', dlc: true },
  { id: 94, name: 'Great Katana', group: 'melee', dlc: true },
  { id: 95, name: 'Beast Claw', group: 'melee', dlc: true },
];

/**
 * EquipParamGem `canMountWep_*` flag → wepType. The Japanese field names in the paramdef give the
 * meaning (槍 spear 25, 長槍 "long spear" has no weapons in ER, 大槍 great spear 28, 斧槍 halberd 29).
 * The build cross-checks this: every weapon that takes Ashes of War must accept its own default Ash.
 */
export const GEM_MOUNT_FLAGS: Record<string, number | null> = {
  canMountWep_Dagger: 1,
  canMountWep_SwordNormal: 3,
  canMountWep_SwordLarge: 5,
  canMountWep_SwordGigantic: 7,
  canMountWep_SaberNormal: 9,
  canMountWep_SaberLarge: 11,
  canMountWep_katana: 13,
  canMountWep_SwordDoubleEdge: 14,
  canMountWep_SwordPierce: 15,
  canMountWep_RapierHeavy: 16,
  canMountWep_AxeNormal: 17,
  canMountWep_AxeLarge: 19,
  canMountWep_HammerNormal: 21,
  canMountWep_HammerLarge: 23,
  canMountWep_Flail: 24,
  canMountWep_SpearNormal: 25,
  canMountWep_SpearLarge: null,
  canMountWep_SpearHeavy: 28,
  canMountWep_SpearAxe: 29,
  canMountWep_Sickle: 31,
  canMountWep_Knuckle: 35,
  canMountWep_Claw: 37,
  canMountWep_Whip: 39,
  canMountWep_AxhammerLarge: 41,
  canMountWep_BowSmall: 50,
  canMountWep_BowNormal: 51,
  canMountWep_BowLarge: 53,
  canMountWep_ClossBow: 55,
  canMountWep_Ballista: 56,
  canMountWep_Staff: 57,
  canMountWep_Sorcery: null,
  canMountWep_Talisman: 61,
  canMountWep_ShieldSmall: 65,
  canMountWep_ShieldNormal: 67,
  canMountWep_ShieldLarge: 69,
  canMountWep_Torch: 87,
  canMountWep_HandToHand: 88,
  canMountWep_PerfumeBottle: 89,
  canMountWep_ThrustingShield: 90,
  canMountWep_ThrowingWeapon: 91,
  canMountWep_ReverseHandSword: 92,
  canMountWep_LightGreatsword: 93,
  canMountWep_GreatKatana: 94,
  canMountWep_BeastClaw: 95,
};

/** GEM_MOUNT_TYPE: 2 = the weapon's Ash of War (and affinity) can be changed. */
export const GEM_MOUNT_ALLOW_CHANGE = 2;

/** GOODS_TYPE values the site uses. */
export const GOODS_TYPE = {
  normalItem: 0,
  keyItem: 1,
  sorcery: 5,
  spiritLesser: 7,
  spiritGreater: 8,
  wondrousPhysick: 9,
  tear: 10,
  greatRune: 15,
  incantation: 16,
  sorcerySelfBuff: 17,
  incantationSelfBuff: 18,
} as const;

/** PROTECTOR_CATEGORY → armor slot (4 = hair, not armor). */
export const ARMOR_SLOTS = { 0: 'head', 1: 'chest', 2: 'arms', 3: 'legs' } as const;

/** EquipParamGoods sortGroupId of gestures (goodsType 0, but not items). */
export const GESTURE_SORT_GROUP = 250;

/** Rows the game names but that aren't items a build can hold. */
export const EXCLUDED = {
  weapons: new Set([110000]), // "Unarmed": bare hands
  armor: new Set([10000, 10100, 10200, 10300]), // "Head", "Body", "Arms", "Legs": nothing worn
};

/**
 * Weapons whose built-in skill comes from an Ash of War their type can't otherwise take (verified on
 * regulation 1.17.3). The default-Ash cross-check skips them.
 */
export const ODD_DEFAULT_ASHES = new Set([
  21100000, // Katar: Impaling Thrust on a fist
  21510000, // Pata: Impaling Thrust on a fist
  23120000, // Golem's Halberd: Charge Forth on a colossal weapon
]);
