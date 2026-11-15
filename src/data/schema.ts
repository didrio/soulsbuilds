// Game data v2 (T7): the shapes of src/data/er/*.json, written by scripts/data/build.ts from the
// owner's export of the game files (docs/data.md). The pipeline validates its output with these
// schemas and src/data/data.test.ts re-checks the committed files.
//
// App code imports TYPES only (`import type { Weapon } from '@/data/schema'`), so zod stays out of
// the bundle. IDs are the game's own param row IDs: stable across patches, unique within a table.
import { z } from 'zod';

/** The 13 weapon affinities, in the game's order (GEM_WEP_ATTR 0–12; row ID offset = index × 100). */
export const AFFINITY_KEYS = [
  'standard',
  'heavy',
  'keen',
  'quality',
  'fire',
  'flame-art',
  'lightning',
  'sacred',
  'magic',
  'cold',
  'poison',
  'blood',
  'occult',
] as const;

const id = z.number().int().nonnegative();
const name = z.string().min(1);
/** Icon ID: the image is /assets/icons/<icon>.webp. */
const icon = z.number().int().positive();
const amount = z.number().nonnegative();
/** Short description from the game's *Info text ('' when the game has none). */
const effect = z.string();

const item = {
  id,
  name,
  icon,
  /** From Shadow of the Erdtree. */
  dlc: z.boolean(),
};

const stats = z.strictObject({
  str: amount,
  dex: amount,
  int: amount,
  fai: amount,
  arc: amount,
});
const damage = z.strictObject({
  physical: amount,
  magic: amount,
  fire: amount,
  lightning: amount,
  holy: amount,
});

export const affinityKeySchema = z.enum(AFFINITY_KEYS);

export const affinitySchema = z.strictObject({
  key: affinityKeySchema,
  name,
  /** Added to a weapon's row ID for its infused version (Heavy = +100 … Occult = +1200). */
  offset: z.number().int().nonnegative(),
});

export const weaponTypeSchema = z.strictObject({
  /** The game's weapon type code (`wepType`). */
  id,
  name,
  group: z.enum(['melee', 'ranged', 'catalyst', 'shield', 'ammo']),
  dlc: z.boolean(),
});

export const skillSchema = z.strictObject({
  /** SwordArtsParam row ID. */
  id,
  name,
  /** FP cost of the main use (0 for skills that cost none). */
  fp: amount,
  dlc: z.boolean(),
});

export const ashOfWarSchema = z.strictObject({
  ...item,
  /** EquipParamGem row ID is `id`; this is the skill it grants. */
  skill: id,
  /** Weapon type IDs it can be applied to. */
  weaponTypes: z.array(id).min(1),
  /** Affinities a weapon may have with this Ash applied. */
  affinities: z.array(affinityKeySchema).min(1),
});

export const weaponSchema = z.strictObject({
  ...item,
  /** Weapon type ID (weaponTypes.json). */
  type: id,
  weight: amount,
  /** Base attack at +0, standard affinity. */
  attack: damage,
  /** Base scaling at +0 (the game's raw correction values, not letter grades). */
  scaling: stats,
  requirements: stats,
  damageTypes: z.array(z.enum(['standard', 'strike', 'slash', 'pierce'])),
  /** Built-in skill (skills.json), null when the weapon has none. */
  skill: id.nullable(),
  /** Can take an Ash of War (and with it, an affinity). */
  ashesOfWar: z.boolean(),
  /** Affinities the game has for this weapon; always starts with 'standard'. */
  affinities: z.array(affinityKeySchema).min(1),
});

export const arrowSchema = z.strictObject({
  ...item,
  type: id,
  weight: amount,
  attack: damage,
  damageTypes: z.array(z.enum(['standard', 'strike', 'slash', 'pierce'])),
});

export const armorSchema = z.strictObject({
  ...item,
  slot: z.enum(['head', 'chest', 'arms', 'legs']),
  weight: amount,
  poise: amount,
  /** Damage negation in percent. */
  negation: z.strictObject({
    physical: z.number(),
    strike: z.number(),
    slash: z.number(),
    pierce: z.number(),
    magic: z.number(),
    fire: z.number(),
    lightning: z.number(),
    holy: z.number(),
  }),
  resistance: z.strictObject({
    immunity: amount,
    robustness: amount,
    focus: amount,
    vitality: amount,
  }),
});

export const talismanSchema = z.strictObject({
  ...item,
  weight: amount,
  effect,
  /** Talismans that share a group can't be worn together (the game's accessoryGroup). */
  group: z.number().int(),
});

export const spellSchema = z.strictObject({
  ...item,
  kind: z.enum(['sorcery', 'incantation']),
  fp: amount,
  stamina: amount,
  slots: z.number().int().nonnegative(),
  requirements: z.strictObject({ int: amount, fai: amount, arc: amount }),
  effect,
});

/** Crystal tears, consumables, great runes and spirit ashes. */
export const goodsSchema = z.strictObject({ ...item, effect });

/** Tag group ("Bosses", "Melee Weapons", …) → tag names. Tags are plain strings on builds. */
export const tagsSchema = z.record(name, z.array(name).min(1));

export type AffinityKey = z.infer<typeof affinityKeySchema>;
export type Affinity = z.infer<typeof affinitySchema>;
export type WeaponType = z.infer<typeof weaponTypeSchema>;
export type Skill = z.infer<typeof skillSchema>;
export type AshOfWar = z.infer<typeof ashOfWarSchema>;
export type Weapon = z.infer<typeof weaponSchema>;
export type Arrow = z.infer<typeof arrowSchema>;
export type Armor = z.infer<typeof armorSchema>;
export type Talisman = z.infer<typeof talismanSchema>;
export type Spell = z.infer<typeof spellSchema>;
export type Goods = z.infer<typeof goodsSchema>;
export type Tags = z.infer<typeof tagsSchema>;

/** Every file in src/data/er/ and the schema of one entry (tags.json is a single object). */
export const DATA_FILES = {
  'affinities.json': affinitySchema,
  'weaponTypes.json': weaponTypeSchema,
  'skills.json': skillSchema,
  'ashesOfWar.json': ashOfWarSchema,
  'weapons.json': weaponSchema,
  'arrows.json': arrowSchema,
  'armor.json': armorSchema,
  'talismans.json': talismanSchema,
  'spells.json': spellSchema,
  'tears.json': goodsSchema,
  'consumables.json': goodsSchema,
  'greatRunes.json': goodsSchema,
  'spiritAshes.json': goodsSchema,
} as const;
