// Shapes of the 2022 game data in src/data/*.json (see docs/data.md). Numbers are stored as strings
// ("10", "") because the data was scraped; T7 replaces this data with typed, validated v2 data.

export interface GameItem {
  name: string;
  imageUrl: string;
}

export interface Weapon extends GameItem {
  type: string;
  damageType: string;
  tier: string;
  passive: string;
  /** Name of the built-in skill (Ash of War). Not always in skillsIndexed.json (T7). */
  skill: string;
  weight: string;
  physical: string;
  magic: string;
  fire: string;
  light: string;
  holy: string;
  str: string;
  dex: string;
  int: string;
  fai: string;
  arc: string;
  // Missing on 3 of 374 weapons.
  strReq?: string;
  dexReq?: string;
  intReq?: string;
  faiReq?: string;
  arcReq?: string;
}

export interface Armor extends GameItem {
  type: string;
  tier: string;
  passive: string;
  set: string;
  weight: string;
  weightType: string;
  physical: string;
  slash: string;
  strike: string;
  pierce: string;
  magic: string;
  fire: string;
  light: string;
  holy: string;
}

export type ArmorKind = 'helms' | 'chests' | 'gauntlets' | 'legs';

export interface Spell extends GameItem {
  type: string;
  subType: string;
  tier: string;
  fp: string;
  /** Memory slots the spell takes ("1", "2", "3"). */
  slot: string;
  int: string;
  fai: string;
  arc: string;
  effect: string;
}

export interface Talisman extends GameItem {
  tier: string;
  effect: string;
}

/** Crystal tears, arrows/bolts and consumables share this shape. */
export interface EffectItem extends GameItem {
  effect: string;
}

export type Tear = EffectItem;
export type Arrow = EffectItem;
export type Consumable = EffectItem;

export interface Skill {
  name: string;
  type: string;
  tier: string;
  fp: string;
  effect: string;
}

/** Anything that can sit in an editor slot (what `Slot` renders). */
export type SlotItem = Weapon | Armor | Spell | Talisman | EffectItem;
