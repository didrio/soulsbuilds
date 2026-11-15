// The game's equipment rules, shared by the app (through '@/data') and the Node scripts (seed,
// migration), which import this file directly (Node 24 strips the types). Pure functions over the
// data passed in, with type-only imports, so nothing here pulls data or zod into the bundle.
// Rules learned from the game files: docs/data.md, "What the game data taught us".
import type { AffinityKey, AshOfWar, Talisman, Weapon } from './schema';

/** The Ashes of War a weapon can take: none for weapons with a fixed skill, else those listing its type. */
export function ashesFor(weapon: Weapon, ashes: readonly AshOfWar[]): AshOfWar[] {
  if (!weapon.ashesOfWar) return [];
  return ashes.filter((ash) => ash.weaponTypes.includes(weapon.type));
}

/**
 * The Ash that grants the weapon's built-in skill (Uchigatana: Unsheathe). Undefined for unique
 * skills (flails' Spinning Chain, Buckler Parry, Moonveil's Transient Moonlight).
 */
export const builtInAsh = (weapon: Weapon, ashes: readonly AshOfWar[]): AshOfWar | undefined =>
  ashes.find((ash) => ash.skill === weapon.skill);

/**
 * The Ashes a player can choose for the weapon, besides keeping its built-in skill: those it can
 * take, minus the one that grants the built-in skill (choosing it changes nothing).
 */
export const ashChoices = (weapon: Weapon, ashes: readonly AshOfWar[]): AshOfWar[] =>
  ashesFor(weapon, ashes).filter((ash) => ash.skill !== weapon.skill);

/**
 * The Ash a weapon slot keeps: `ash` if it is one of the weapon's choices, else null (the built-in
 * skill), which also covers an Ash that grants the built-in skill.
 */
export function fitAsh(
  weapon: Weapon,
  ash: AshOfWar | null | undefined,
  ashes: readonly AshOfWar[],
): AshOfWar | null {
  if (!ash) return null;
  return ashChoices(weapon, ashes).some(({ id }) => id === ash.id) ? ash : null;
}

/**
 * Affinities the weapon can have with `ash` applied (null: its built-in skill). Weapons that can't
 * take Ashes are standard only; otherwise the weapon's own ∩ the Ash's. A unique built-in skill has
 * no Ash to limit it, so the weapon's own apply. Always includes 'standard'.
 */
export function allowedAffinities(
  weapon: Weapon,
  ash: AshOfWar | null,
  ashes: readonly AshOfWar[],
): AffinityKey[] {
  if (!weapon.ashesOfWar) return ['standard'];
  const limit = ash ?? builtInAsh(weapon, ashes);
  return limit
    ? weapon.affinities.filter((key) => limit.affinities.includes(key))
    : weapon.affinities;
}

/**
 * The affinity a weapon slot keeps, null for Standard (builds store Standard as null): `affinity`
 * if the weapon allows it with `ash`, else null.
 */
export function fitAffinity(
  weapon: Weapon,
  ash: AshOfWar | null,
  affinity: AffinityKey | null | undefined,
  ashes: readonly AshOfWar[],
): AffinityKey | null {
  if (!affinity || affinity === 'standard') return null;
  return allowedAffinities(weapon, ash, ashes).includes(affinity) ? affinity : null;
}

/**
 * The worn talisman that rules `talisman` out (the same talisman, or one of its group: Erdtree's
 * Favor and +1), if any. `worn` = the other slots, without the one being changed.
 */
export const talismanConflict = (
  talisman: Talisman,
  worn: readonly (Talisman | null | undefined)[],
): Talisman | undefined =>
  worn.find((other): other is Talisman => other != null && other.group === talisman.group);
