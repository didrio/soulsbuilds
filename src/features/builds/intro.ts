// The home page's intro (T69; since T79 for everyone, its panels dismissible): what Souls Builds is and the three things you can do.
// Pure, so the component, the static copy in index.html (what crawlers read on `/`) and the tests agree.
import { getCardSpell, getCardTalisman, getCardWeapon, type SlotDisplayItem } from '@/data/core';
import { tabPath } from '@/features/editor/tabs';
import type { UsageEvent } from '@/lib/usage';

export const introTitle = (gameName: string) => `Plan, share and follow ${gameName} builds`;

export const INTRO_LEAD =
  'A free build planner: put a build together with live stats, follow a step-by-step route to every item in it, and share it with one link. No account needed to start.';

/**
 * The example for "Follow it in your run": a seeded build (content/builds/er/moonveil-early.json) with a
 * strong early route. Its id is fixed, so it's the same in production and in the emulator once
 * `node scripts/seed-builds.mjs --write` has run.
 */
export const EXAMPLE_BUILD = {
  id: 'IAumzY2DNj2NHObXD0QB',
  name: 'Moonveil Early Game Spellblade',
} as const;

export const EXAMPLE_GUIDE_PATH = tabPath(EXAMPLE_BUILD.id, 'guide', EXAMPLE_BUILD.name);

export type IntroIcon = { kind: 'weapon' | 'talisman' | 'spell'; id: number };

export interface IntroPanel {
  key: 'plan' | 'follow' | 'share';
  title: string;
  text: string;
  action: string;
  to: string;
  event: UsageEvent;
  /** Decorative item icons, by game ID. */
  icons: IntroIcon[];
}

export const INTRO_PANELS: IntroPanel[] = [
  {
    key: 'plan',
    title: 'Plan a build',
    text: 'Pick weapons, armor, talismans and spells. Stats, HP, equip load and poise update as you choose.',
    action: 'Start planning',
    to: '/build/new',
    event: 'intro-plan',
    // Blasphemous Blade, Radagon's Soreseal, Erdtree's Favor.
    icons: [
      { kind: 'weapon', id: 3140000 },
      { kind: 'talisman', id: 1051 },
      { kind: 'talisman', id: 1040 },
    ],
  },
  {
    key: 'follow',
    title: 'Follow it in your run',
    text: 'The Guide shows where every item is, in the order you’ll reach it. Check them off as you go.',
    action: 'See an example route',
    to: EXAMPLE_GUIDE_PATH,
    event: 'intro-example',
    // The example build's Moonveil, Glintstone Staff and Loretta's Greatbow.
    icons: [
      { kind: 'weapon', id: 9060000 },
      { kind: 'weapon', id: 33000000 },
      { kind: 'spell', id: 4380 },
    ],
  },
  {
    key: 'share',
    title: 'Share and discover',
    text: 'One link shows the whole build. Browse what other players run, and like the ones you’d try.',
    action: 'Browse builds',
    to: '/builds',
    event: 'intro-browse',
    // Rivers of Blood, Bloodhound's Fang, Black Knife.
    icons: [
      { kind: 'weapon', id: 9040000 },
      { kind: 'weapon', id: 8030000 },
      { kind: 'weapon', id: 1010000 },
    ],
  },
];

const LOOKUPS = { weapon: getCardWeapon, talisman: getCardTalisman, spell: getCardSpell };

/** An intro icon's item (name and icon), or undefined if the game data no longer has it. */
export const introItem = ({ kind, id }: IntroIcon): SlotDisplayItem | undefined =>
  LOOKUPS[kind](id);
