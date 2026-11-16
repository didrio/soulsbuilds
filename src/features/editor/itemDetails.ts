// What an item row shows under the item's name: a weapon's affinity and skill, a spell's memory slots.
import {
  affinityName,
  NO_SKILL_ID,
  weaponSkill,
  type AffinityKey,
  type AshOfWar,
  type Skill,
  type SlotDisplayItem,
  type Spell,
  type Weapon,
} from '@/data/core';

export interface WeaponDetails {
  /** The affinity's name, or null for Standard. */
  affinity: string | null;
  /** The skill it has (its Ash's, else the built-in one), or null for none / "No Skill". */
  skill: Skill | null;
  /** The skill comes from an Ash of War rather than the weapon. */
  fromAsh: boolean;
}

/** A weapon's affinity and skill as the build has them. */
export function weaponDetails(
  weapon: Pick<Weapon, 'skill'>,
  ash: AshOfWar | null,
  affinity: AffinityKey | null,
): WeaponDetails {
  const skill = weaponSkill(weapon, ash);
  return {
    affinity: affinity && affinity !== 'standard' ? affinityName(affinity) : null,
    skill: skill && skill.id !== NO_SKILL_ID ? skill : null,
    fromAsh: Boolean(ash),
  };
}

/** The detail parts in a slot's accessible name: "Blood affinity", "Seppuku skill". */
export const weaponDetailLabels = ({ affinity, skill }: WeaponDetails) =>
  [affinity ? `${affinity} affinity` : null, skill ? `${skill.name} skill` : null].filter(
    (part): part is string => part !== null,
  );

const isSpell = (item: SlotDisplayItem): item is Spell => 'slots' in item && 'kind' in item;

/** The muted line under an item's name ('' for none): "Blood · Seppuku", "2 slots". */
export function itemSubline(item: SlotDisplayItem, weapon: WeaponDetails | null): string {
  if (weapon) return [weapon.affinity, weapon.skill?.name].filter(Boolean).join(' · ');
  if (isSpell(item)) return `${item.slots} ${item.slots === 1 ? 'slot' : 'slots'}`;
  return '';
}
