// What an item row shows under the item's name: a weapon's affinity and skill, a spell's memory slots,
// and (T8) a warning when its requirements aren't met or a spell doesn't fit in the memory slots.
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
import type { RequirementCheck, RequirementStat } from '@/lib/buildMath';

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

/** How the game abbreviates the scaling and requirement stats. */
export const STAT_ABBREVIATIONS: Record<RequirementStat, string> = {
  str: 'Str',
  dex: 'Dex',
  int: 'Int',
  fai: 'Fai',
  arc: 'Arc',
};

/** A line under an item that needs attention: `warning` can't be used as built, `note` with a caveat. */
export interface ItemWarning {
  text: string;
  severity: 'warning' | 'note';
}

/**
 * The warning for a weapon or spell ('Needs 18 Str, 12 Dex', 'Two-handed only (18 Str)', 'Over the
 * memory slots'), or null when it's usable as built.
 */
export function itemWarning(
  check: RequirementCheck | undefined,
  overMemorySlots = false,
): ItemWarning | null {
  const needs = (check?.missing ?? [])
    .map(({ stat, required }) => `${required} ${STAT_ABBREVIATIONS[stat]}`)
    .join(', ');
  if (check?.status === 'unmet') return { text: `Needs ${needs}`, severity: 'warning' };
  if (overMemorySlots) return { text: 'Over the memory slots', severity: 'warning' };
  if (check?.status === 'two-handed')
    return { text: `Two-handed only (${needs})`, severity: 'note' };
  return null;
}
