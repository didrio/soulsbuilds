// What the phone sections' closed headers say (T49): the "glances", and the gear as phone sections.
// Pure: built from the editor state and the build, tested in glances.test.ts.
import type { SlotDisplayItem } from '@/data/core';
import type { Stats } from '@/lib/buildMath';
import type { TrackingProgress } from '@/lib/tracking';
import { gearGroups, type GearGroup, type GearState } from '../gear';
import { STATS } from './StatsCard';

/** The rune level and the three highest attributes (ties in the game's order), as short names. */
export function statsGlance(stats: Stats, level: number) {
  const top = STATS.map(([key, , short]) => ({ key, short, value: stats[key] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
  return { level, top };
}

export type PhoneGearKey = 'weapons' | 'armor' | 'talismans' | 'spells' | 'flask' | 'items';

export interface PhoneGearSection {
  key: PhoneGearKey;
  title: string;
  /** The rows, as labelled lists: one unlabelled list, or (editing Weapons) each hand and the arrows. */
  groups: GearGroup[];
  /** The items the closed header shows, in order. Empty: the header says "None" and doesn't open. */
  icons: SlotDisplayItem[];
  /** Spells: the memory slots they take. */
  memory?: { used: number; available: number };
}

const SECTIONS: { key: PhoneGearKey; title: string; from: GearGroup['key'][]; always: boolean }[] =
  [
    {
      key: 'weapons',
      title: 'Weapons',
      from: ['armaments', 'rightHand', 'leftHand', 'arrows'],
      always: true,
    },
    { key: 'armor', title: 'Armor', from: ['armor'], always: true },
    { key: 'talismans', title: 'Talismans', from: ['talismans'], always: true },
    { key: 'spells', title: 'Spells', from: ['spells'], always: false },
    { key: 'flask', title: 'Tears, rune and ash', from: ['flask'], always: true },
    { key: 'items', title: 'Items', from: ['items'], always: false },
  ];

/**
 * The gear as the phone's sections, in the owner's order: Weapons (with arrows), Armor, Talismans,
 * Spells, Tears rune and ash, Items. Viewing: Spells and Items only when the build has some; the rest
 * always, empty ones with no icons ("None"). Editing: every section, each slot a row to choose
 * (`gearGroups`), Weapons as the right hand, the left hand and the arrows.
 */
export function phoneGearSections(state: GearState, editable: boolean): PhoneGearSection[] {
  const groups = gearGroups(state, editable);
  return SECTIONS.flatMap(({ key, title, from, always }) => {
    const own = groups.filter((group) => from.includes(group.key));
    const icons = own.flatMap((group) =>
      group.entries.flatMap((entry) => (entry.item ? [entry.item] : [])),
    );
    if (!editable && !always && !icons.length) return [];
    // Viewing, one list needs no label of its own: the section's title names it.
    const lists = editable && own.length > 1 ? own : own.map((group) => ({ ...group, title: '' }));
    const memory = own.find((group) => group.memory)?.memory;
    return [{ key, title, groups: lists, icons, ...(memory ? { memory } : {}) }];
  });
}

/** The Guide's glance: "14 items to find", or while tracking "3 of 14 items". */
export function guideGlance(itemCount: number, progress: TrackingProgress | null) {
  if (progress) return `${progress.gear.done} of ${progress.gear.total} items`;
  if (!itemCount) return 'Nothing to find';
  return `${itemCount} ${itemCount === 1 ? 'item' : 'items'} to find`;
}

/** The Comments glance: the count, then the start of the newest comment (cut off by CSS). */
export function commentsGlance(count: number, latest: string | null) {
  if (!count) return 'No comments yet';
  const label = `${count} ${count === 1 ? 'comment' : 'comments'}`;
  return latest ? `${label} · “${latest.replace(/\s+/g, ' ').trim()}”` : label;
}
