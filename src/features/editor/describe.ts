// The description a build gets when its author wrote none (T47): a few plain sentences from the build
// itself, "just the basics and anything to note". Pure: `selectDescriptionFacts` (store/derived.ts)
// gathers the facts from the editor state, `describeBuild` turns them into markdown. Rendered at view
// time and never stored, so it follows edits.
import type { RollType, StatKey } from '@/lib/buildMath';

export interface WeaponFact {
  name: string;
  /** Affinity and skill names, in that order, for the ones the weapon has. */
  details: string[];
}

export interface DescriptionFacts {
  level: number;
  /** The starting class's name, or null for none. */
  className: string | null;
  /** How many things are chosen anywhere (weapons, armor, talismans, spells, …): 0 is "no gear". */
  gearCount: number;
  /** The main weapon first, then the other hand's (0–2). */
  weapons: WeaponFact[];
  /** Effective attributes (with talisman bonuses). */
  stats: Record<StatKey, number>;
  /** Equipped weight and the maximum, or null while nothing counts. */
  load: { weight: number; max: number; roll: RollType } | null;
  poise: number;
  talismans: string[];
  spiritAsh: string | null;
  spells: { incantations: number; sorceries: number; used: number; available: number };
  /** Weapons and spells that can't be used as built: unmet requirements, two-handed only, over slots. */
  warnings: { name: string; text: string }[];
  /** Names of everything from Shadow of the Erdtree. */
  dlcItems: string[];
}

/** The attributes' names, in the game's order (also the function's plain page, T50). */
export const STAT_NAMES: Record<StatKey, string> = {
  vigor: 'Vigor',
  mind: 'Mind',
  end: 'Endurance',
  str: 'Strength',
  dex: 'Dexterity',
  int: 'Intelligence',
  fai: 'Faith',
  arc: 'Arcane',
};

/** The generated text's footnote, shown under it by the page (not part of the markdown). */
export const GENERATED_NOTE = 'This description was automatically generated.';

/** "A", "A and B", "A, B and C". */
function list(items: readonly string[]): string {
  if (items.length < 2) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;
const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const weaponLabel = ({ name, details }: WeaponFact) =>
  details.length ? `${name} (${details.join(', ')})` : name;

/** The three highest attributes, or null when they are all the same (a fresh build says nothing). */
function highestStats(stats: Record<StatKey, number>): string | null {
  const entries = (Object.keys(STAT_NAMES) as StatKey[]).map((key) => ({
    name: STAT_NAMES[key],
    value: stats[key],
  }));
  if (entries.every(({ value }) => value === entries[0]!.value)) return null;
  // Array.sort is stable: ties keep the attributes' usual order (Vigor … Arcane).
  const top = [...entries].sort((a, b) => b.value - a.value).slice(0, 3);
  return list(top.map(({ name, value }) => `${name} ${value}`));
}

/** The build described in short markdown (no headings, so the page shows no "Jump to" row). */
export function describeBuild(facts: DescriptionFacts): string {
  const subject = `level ${facts.level}${facts.className ? ` ${facts.className}` : ''} build`;
  if (facts.gearCount === 0) return `A ${subject} with no gear chosen yet.`;

  const summary: string[] = [];
  const weapons = list(facts.weapons.map(weaponLabel));
  summary.push(`A ${subject}${weapons ? ` around ${weapons}` : ''}.`);
  const highest = highestStats(facts.stats);
  if (highest) summary.push(`Its highest attributes are ${highest}.`);
  const load = [
    facts.load
      ? `${capitalize(facts.load.roll)}${facts.load.roll === 'overloaded' ? '' : ' load'} (${facts.load.weight.toFixed(1)} of ${facts.load.max.toFixed(1)})`
      : null,
    facts.poise > 0 ? `${facts.poise} poise` : null,
  ].filter((part): part is string => part !== null);
  if (load.length) summary.push(`${load.join(', ')}.`);

  const gear: string[] = [];
  if (facts.talismans.length) gear.push(`Talismans: ${list(facts.talismans)}.`);
  const { incantations, sorceries, used, available } = facts.spells;
  const spellCounts = [
    incantations ? plural(incantations, 'incantation') : null,
    sorceries ? (sorceries === 1 ? '1 sorcery' : `${sorceries} sorceries`) : null,
  ].filter((part): part is string => part !== null);
  if (spellCounts.length) {
    gear.push(`Spells: ${spellCounts.join(', ')}, ${used} of ${available} memory slots.`);
  }
  if (facts.spiritAsh) gear.push(`Spirit Ash: ${facts.spiritAsh}.`);

  const paragraphs = [summary.join(' ')];
  if (gear.length) paragraphs.push(gear.join(' '));

  const notes = [
    ...facts.warnings.map(({ name, text }) => `${name}: ${lowerFirst(text)}`),
    ...(facts.dlcItems.length ? [`Needs Shadow of the Erdtree: ${list(facts.dlcItems)}`] : []),
  ];
  if (notes.length)
    paragraphs.push(`**Worth knowing**\n\n${notes.map((n) => `- ${n}`).join('\n')}`);

  return paragraphs.join('\n\n');
}
