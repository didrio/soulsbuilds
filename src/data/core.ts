// The light half of the game data (T11): everything a page needs to show a build card or a slot, in
// well under 150 KB, so the landing page doesn't download the ~1 MB of weapon, armor and spell stats.
// './index' re-exports this and adds the full lists; editor-only code imports those from '@/data'.
// Nothing that runs on every page (cards, Slot, the Redux store) may import './index'.
import affinitiesJson from './er/affinities.json';
import ashesOfWarJson from './er/ashesOfWar.json';
import cardsJson from './er/cards.json';
import skillsJson from './er/skills.json';
import tagsJson from './er/tags.json';
import * as rules from './rules';
import type { BuildImage } from '@/lib/models';
import type {
  Affinity,
  AffinityKey,
  AshOfWar,
  Armor,
  Cards,
  CardArmor,
  CardItem,
  CardWeapon,
  Skill,
  Tags,
  Weapon,
} from './schema';

export type * from './schema';

/** The skill most shields, staffs and seals come with ("No Skill" is a real skill in the game). */
export const NO_SKILL_ID = 10;

export const ashesOfWar = ashesOfWarJson as AshOfWar[];
export const skills = skillsJson as Skill[];
/** The 13 affinities in the game's order, Standard first. */
export const affinities = affinitiesJson as Affinity[];
/** Tag groups for the tag picker ("Bosses", "Melee Weapons", …) → tag names. */
export const tagGroups = tagsJson as Tags;
const cards = cardsJson as Cards;

/** A lookup by ID over `items`; `undefined` for null or an ID that isn't in the data. */
export function lookup<T extends { id: number }>(items: readonly T[]) {
  const byId = new Map(items.map((item) => [item.id, item]));
  return (id: number | null | undefined): T | undefined => (id == null ? undefined : byId.get(id));
}

export const getAsh = lookup(ashesOfWar);
export const getSkill = lookup(skills);

/** A weapon as a card or slot shows it: name, icon and skill, none of the stats. */
export const getCardWeapon = lookup<CardWeapon>(cards.weapons);
const cardArmorById = lookup<CardArmor>(cards.armor);
/** An armor piece as a card shows it, only if it goes in `slot`. */
export const getCardArmor = (
  id: number | null | undefined,
  slot: Armor['slot'],
): CardArmor | undefined => {
  const piece = cardArmorById(id);
  return piece?.slot === slot ? piece : undefined;
};

/** What a slot needs to show any item: its name and icon (every item in the data has both). */
export type SlotDisplayItem = { id: number; name: string; icon: number };

const getCardTalisman = lookup<CardItem>(cards.talismans);
const getCardSpell = lookup<CardItem>(cards.spells);
const getCardTear = lookup<CardItem>(cards.tears);
const getCardGreatRune = lookup<CardItem>(cards.greatRunes);
const getCardSpiritAsh = lookup<CardItem>(cards.spiritAshes);

/**
 * A build image's item as a card shows it (T40; `buildImage` in @/lib/equipment picks which), or
 * undefined for none or an ID that isn't in the data.
 */
export function getCardItem(image: BuildImage | null): SlotDisplayItem | undefined {
  if (!image) return undefined;
  const { id } = image;
  switch (image.kind) {
    case 'weapon':
      return getCardWeapon(id);
    case 'helm':
      return getCardArmor(id, 'head');
    case 'chest':
      return getCardArmor(id, 'chest');
    case 'gauntlet':
      return getCardArmor(id, 'arms');
    case 'leg':
      return getCardArmor(id, 'legs');
    case 'talisman':
      return getCardTalisman(id);
    case 'spell':
      return getCardSpell(id);
    case 'tear':
      return getCardTear(id);
    case 'greatRune':
      return getCardGreatRune(id);
    case 'spiritAsh':
      return getCardSpiritAsh(id);
  }
}

/** The image of an item's `icon`. */
export const iconUrl = (icon: number) => `/assets/icons/${icon}.webp`;

const affinityNames = new Map(affinities.map(({ key, name }) => [key, name]));
/** Display name of an affinity key ('flame-art' → "Flame Art"). */
export const affinityName = (key: AffinityKey) => affinityNames.get(key) ?? key;

/** What the player sees for an Ash of War: the skill it grants ("Seppuku"). */
export const ashLabel = (ash: AshOfWar) =>
  getSkill(ash.skill)?.name ?? ash.name.replace(/^Ash of War: /, '');

/** The skill a weapon has: the Ash's if one is applied, else its built-in one. */
export const weaponSkill = (weapon: Pick<Weapon, 'skill'>, ash: AshOfWar | null | undefined) =>
  getSkill(ash ? ash.skill : weapon.skill);

// The rules in ./rules, bound to the data.
export const ashChoices = (weapon: Weapon) => rules.ashChoices(weapon, ashesOfWar);
export const fitAsh = (weapon: Weapon, ash: AshOfWar | null | undefined) =>
  rules.fitAsh(weapon, ash, ashesOfWar);
export const allowedAffinities = (weapon: Weapon, ash: AshOfWar | null) =>
  rules.allowedAffinities(weapon, ash, ashesOfWar);
export const fitAffinity = (
  weapon: Weapon,
  ash: AshOfWar | null,
  affinity: AffinityKey | null | undefined,
) => rules.fitAffinity(weapon, ash, affinity, ashesOfWar);
export const { talismanConflict, scalingGrade } = rules;
export type { ScalingGrade } from './rules';
