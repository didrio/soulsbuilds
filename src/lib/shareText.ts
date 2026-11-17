// A build as Reddit markdown (T54): what people paste into a post, ending with the link back. Pure (the
// build in, text out); item names come from the light game data, which every page already loads.
import {
  affinityName,
  getAsh,
  getCardArmor,
  getCardWeapon,
  getCardTalisman,
  getCardSpell,
  getCardTear,
  getCardGreatRune,
  getCardSpiritAsh,
  NO_SKILL_ID,
  weaponSkill,
} from '@/data/core';
import { STAT_KEYS, STAT_NAMES } from './buildMath';
import type { Build } from './models';
import { buildUrl } from './share';

/** The names of the items in `ids` that the data knows, in order. */
const names = (ids: readonly number[], get: (id: number) => { name: string } | undefined) =>
  ids.flatMap((id) => get(id)?.name ?? []);

/** "Moonveil (Standard, Transient Moonlight)": the weapon with its affinity and skill when it has any. */
function weaponLine(build: Build, index: number): string[] {
  const id = build.equipment.weapons[index];
  const weapon = getCardWeapon(id);
  if (!weapon) return [];
  const affinity = build.equipment.weaponAffinities[index];
  const ash = getAsh(build.equipment.weaponSkills[index]);
  const skill = weaponSkill(weapon, ash);
  const details = [
    affinity ? affinityName(affinity) : null,
    skill && skill.id !== NO_SKILL_ID ? skill.name : null,
  ].filter((part) => part !== null);
  return [details.length ? `${weapon.name} (${details.join(', ')})` : weapon.name];
}

/** One markdown bullet list under a bold heading, or nothing for an empty list. */
const section = (title: string, items: string[]) =>
  items.length ? [`**${title}**`, ...items.map((item) => `- ${item}`), ''] : [];

/**
 * The build as markdown for a Reddit post: name and level, attributes, weapons (affinity and skill),
 * armor, talismans, spells, flask tears, great rune and spirit ash, then the link. `author` is optional.
 */
export function redditText(build: Build, author?: string): string {
  const { equipment: gear } = build;
  const armor = (
    [
      [gear.helm, 'head'],
      [gear.chest, 'chest'],
      [gear.gauntlet, 'arms'],
      [gear.leg, 'legs'],
    ] as const
  ).flatMap(([id, slot]) => getCardArmor(id, slot)?.name ?? []);
  const flask = [
    ...names(gear.tears, getCardTear),
    ...(gear.greatRune ? names([gear.greatRune], getCardGreatRune) : []),
    ...(gear.spiritAsh ? names([gear.spiritAsh], getCardSpiritAsh) : []),
  ];
  const stats = STAT_KEYS.map((key) => `${STAT_NAMES[key]} ${build.stats[key]}`).join(' · ');
  const url = buildUrl(build.id, build.name);

  return [
    `# ${build.name}`,
    '',
    `Level ${build.level} Elden Ring build${author ? ` by ${author}` : ''}`,
    '',
    `**Attributes:** ${stats}`,
    '',
    ...section(
      'Weapons',
      build.equipment.weapons.flatMap((_, index) => weaponLine(build, index)),
    ),
    ...section('Armor', armor),
    ...section('Talismans', names(gear.talismans, getCardTalisman)),
    ...section('Spells', names(gear.spells, getCardSpell)),
    ...section('Flask tears, rune and ash', flask),
    `[Full build on Souls Builds](${url})`,
  ].join('\n');
}

/** The card image of a build's link preview (T37), same origin as the page. */
export const cardImageUrl = (id: string) => `/og/build/${id}.png`;
