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

/** The 8 attributes of a character, in the game's order (same keys as Stats in src/lib/buildMath.ts). */
export const STAT_KEYS = ['vigor', 'mind', 'end', 'str', 'dex', 'int', 'fai', 'arc'] as const;
const statKey = z.enum(STAT_KEYS);

/**
 * What a talisman changes for the build math (T8), from its SpEffectParam row; only the values that
 * differ from neutral are present. Rates multiply (1.15 = +15%); `poiseDamage` multiplies the poise
 * damage taken (Bull-Goat's 0.75, which the game shows as poise ÷ 0.75).
 */
export const talismanModifiersSchema = z.strictObject({
  stats: z.partialRecord(statKey, z.number().int()).optional(),
  hp: z.number().positive().optional(),
  fp: z.number().positive().optional(),
  stamina: z.number().positive().optional(),
  equipLoad: z.number().positive().optional(),
  poiseDamage: z.number().positive().optional(),
  memorySlots: z.number().int().optional(),
});

export const talismanSchema = z.strictObject({
  ...item,
  weight: amount,
  effect,
  /** Talismans that share a group can't be worn together (the game's accessoryGroup). */
  group: z.number().int(),
  modifiers: talismanModifiersSchema.optional(),
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

/**
 * A CalcCorrectGraph row: `stages` are stat breakpoints, `values` the result at each, and `exponents`
 * shape the curve between breakpoint i and i+1 (src/lib/buildMath.ts curveValue).
 */
export const statCurveSchema = z.strictObject({
  stages: z.array(z.number()).length(5),
  values: z.array(z.number()).length(5),
  exponents: z.array(z.number()).length(5),
});

export const startingClassSchema = z.strictObject({
  /** CharaInitParam row ID (3000 Vagabond … 3009 Wretch); builds store it as `startingClass`. */
  id,
  name,
  level: z.number().int().positive(),
  stats: z.record(statKey, z.number().int().min(1).max(99)),
});

/** character.json (T8): the starting classes and the stat curves behind HP, FP, stamina and equip load. */
export const characterSchema = z.strictObject({
  classes: z.array(startingClassSchema).length(10),
  curves: z.strictObject({
    hp: statCurveSchema,
    fp: statCurveSchema,
    stamina: statCurveSchema,
    equipLoad: statCurveSchema,
  }),
});

/** Crystal tears, consumables, great runes and spirit ashes. */
export const goodsSchema = z.strictObject({ ...item, effect });

/** Tag group ("Bosses", "Melee Weapons", …) → tag names. Tags are plain strings on builds. */
/**
 * The small subset of the items a build card or a slot needs to show one (name, icon, skill badge).
 * `cards.json` is derived from the full files by the pipeline, so the landing page doesn't download the
 * full ~1 MB of stats (T11). Weapons and armor for the slot strips; talismans, spells, tears, great runes
 * and spirit ashes as name and icon for a build image (T40). No arrows or consumables (not choosable).
 */
export const cardWeaponSchema = weaponSchema.pick({
  id: true,
  name: true,
  icon: true,
  skill: true,
  ashesOfWar: true,
});
export const cardArmorSchema = armorSchema.pick({ id: true, name: true, icon: true, slot: true });
export const cardItemSchema = z.strictObject({ id, name, icon });
export const cardsSchema = z.strictObject({
  weapons: z.array(cardWeaponSchema),
  armor: z.array(cardArmorSchema),
  talismans: z.array(cardItemSchema),
  spells: z.array(cardItemSchema),
  tears: z.array(cardItemSchema),
  greatRunes: z.array(cardItemSchema),
  spiritAshes: z.array(cardItemSchema),
});

type Named = { id: number; name: string; icon: number };
const cardItem = ({ id, name, icon }: Named) => ({ id, name, icon });

/** The full item lists → cards.json. */
export function makeCards(data: {
  weapons: z.infer<typeof weaponSchema>[];
  armor: z.infer<typeof armorSchema>[];
  talismans: Named[];
  spells: Named[];
  tears: Named[];
  greatRunes: Named[];
  spiritAshes: Named[];
}): z.infer<typeof cardsSchema> {
  return {
    weapons: data.weapons.map(({ id, name, icon, skill, ashesOfWar }) => ({
      id,
      name,
      icon,
      skill,
      ashesOfWar,
    })),
    armor: data.armor.map(({ id, name, icon, slot }) => ({ id, name, icon, slot })),
    talismans: data.talismans.map(cardItem),
    spells: data.spells.map(cardItem),
    tears: data.tears.map(cardItem),
    greatRunes: data.greatRunes.map(cardItem),
    spiritAshes: data.spiritAshes.map(cardItem),
  };
}

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
export type TalismanModifiers = z.infer<typeof talismanModifiersSchema>;
export type StatCurve = z.infer<typeof statCurveSchema>;
export type StartingClass = z.infer<typeof startingClassSchema>;
export type Character = z.infer<typeof characterSchema>;
export type Spell = z.infer<typeof spellSchema>;
export type Goods = z.infer<typeof goodsSchema>;
export type Tags = z.infer<typeof tagsSchema>;
export type CardWeapon = z.infer<typeof cardWeaponSchema>;
export type CardArmor = z.infer<typeof cardArmorSchema>;
export type CardItem = z.infer<typeof cardItemSchema>;
export type Cards = z.infer<typeof cardsSchema>;

// --- Acquisition (T14): where every item comes from, for "How to get this build" (T15). ---------------
// Written by scripts/data/acquisition.ts from the item lots, shops, recipes, starting classes and graces,
// plus hand-written facts in scripts/data/{progression,places,events}.ts. docs/data.md "Acquisition".

/** The item files a source can point at; `keyItems` are the gate and prerequisite items below. */
export const ACQUISITION_FILES = [
  'weapons',
  'arrows',
  'armor',
  'talismans',
  'ashesOfWar',
  'spells',
  'tears',
  'consumables',
  'greatRunes',
  'spiritAshes',
  'keyItems',
] as const;
export const acquisitionFileSchema = z.enum(ACQUISITION_FILES);

export const SOURCE_KINDS = [
  'pickup',
  'boss',
  'enemy',
  'shop',
  'remembrance',
  'quest',
  'start',
  'alteration',
  'craft',
] as const;

const gateId = z.string().regex(/^[a-z0-9-]+$/);
const itemRef = z.strictObject({ file: acquisitionFileSchema, id });

export const sourceSchema = z.strictObject({
  kind: z.enum(SOURCE_KINDS),
  /** Site of Grace nearest to it (locations[].id), null when only the region is known or it's anywhere. */
  location: id.nullable(),
  /** Region (regions[].id); set whenever `location` is, and alone for e.g. "a scarab in Liurnia". */
  region: id.nullable(),
  /** Who or what: the boss, merchant, enemy, NPC, starting class, cookbook… ('' for a plain pickup). */
  detail: z.string(),
  cost: z.strictObject({ amount, currency: z.enum(['runes', 'dragon-hearts']) }).optional(),
  /** Needed first: the remembrance to trade, the cookbook to craft, the armor to alter. */
  item: itemRef.optional(),
  /** Gates this source needs beyond its location's. */
  requires: z.array(gateId).optional(),
});

export const regionSchema = z.strictObject({
  /** The game's travel-menu sub-category (BonfireWarpSubCategoryParam row ID). */
  id,
  name,
  dlc: z.boolean(),
  requires: z.array(gateId),
  /** Canonical route order (1 = first); the solver's tie-breaker. */
  order: z.number().int().positive(),
});

export const locationSchema = z.strictObject({
  /** BonfireWarpParam row ID of the Site of Grace. */
  id,
  name,
  region: id,
  /** The region's gates plus any of its own. */
  requires: z.array(gateId),
  order: z.number().int().positive(),
});

export const gateSchema = z.strictObject({
  id: gateId,
  /** What to do, imperative: "Defeat Margit, the Fell Omen". */
  label: name,
  requires: z.array(gateId),
  /** Where it happens (a boss's grace). */
  at: id.optional(),
  /** Obtained with this item (usually a key item; its sources say where). */
  item: itemRef.optional(),
  /** Met by any `count` of these gates (e.g. two great runes). */
  anyOf: z
    .strictObject({ count: z.number().int().positive(), gates: z.array(gateId).min(1) })
    .optional(),
  /** Why it's on the route (T35): "Main-path boss: …", "Lets you put Ashes of War on weapons". */
  reason: z.string().optional(),
});

export const acquisitionSchema = z.strictObject({
  regions: z.array(regionSchema),
  locations: z.array(locationSchema),
  gates: z.array(gateSchema),
  /** Whetblades, cookbooks, remembrances, unrestored Great Runes…; `icon` as items' (T35). */
  keyItems: z.array(z.strictObject({ id, name, icon: id })),
  /** Gates an item implies by what it is: an Ash of War needs the Whetstone Knife, and so on. */
  implied: z.strictObject({
    ashesOfWar: gateId,
    spiritAshes: gateId,
    tears: gateId,
    affinities: z.record(affinityKeySchema, gateId.nullable()),
  }),
  /** File → item ID → its sources, best first (earliest location). */
  items: z.record(
    acquisitionFileSchema,
    z.record(z.string().regex(/^\d+$/), z.array(sourceSchema)),
  ),
});

export type AcquisitionFile = z.infer<typeof acquisitionFileSchema>;
export type SourceKind = (typeof SOURCE_KINDS)[number];
export type Source = z.infer<typeof sourceSchema>;
export type Region = z.infer<typeof regionSchema>;
export type Location = z.infer<typeof locationSchema>;
export type Gate = z.infer<typeof gateSchema>;
export type Acquisition = z.infer<typeof acquisitionSchema>;

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
