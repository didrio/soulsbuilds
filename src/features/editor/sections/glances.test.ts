import { describe, expect, it } from 'vitest';
import { makeStore } from '@/app/store';
import { arrows, spells, weapons } from '@/data';
import type { TrackingProgress } from '@/lib/tracking';
import { selectGearState } from '../store/derived';
import { updateArrow, updateWeapon } from '../store/equipment';
import { updateSpell } from '../store/spells';
import { commentsGlance, guideGlance, phoneGearSections, statsGlance } from './glances';

const byName = <T extends { name: string }>(items: T[], name: string) => {
  const item = items.find((entry) => entry.name === name);
  if (!item) throw new Error(`No "${name}" in the data`);
  return item;
};

describe('statsGlance', () => {
  it('gives the level and the three highest attributes, ties in the game order', () => {
    const stats = { vigor: 40, mind: 10, end: 25, str: 12, dex: 60, int: 9, fai: 9, arc: 40 };
    expect(statsGlance(stats, 150)).toEqual({
      level: 150,
      top: [
        { key: 'dex', short: 'Dex', value: 60 },
        { key: 'vigor', short: 'Vig', value: 40 },
        { key: 'arc', short: 'Arc', value: 40 },
      ],
    });
  });
});

describe('phoneGearSections', () => {
  const setup = () => {
    const store = makeStore();
    const sections = (editable: boolean) =>
      phoneGearSections(selectGearState(store.getState()), editable);
    return { store, sections };
  };

  it('viewing an empty build: Weapons, Armor, Talismans and the flask, all "None"', () => {
    const sections = setup().sections(false);
    expect(sections.map((section) => section.title)).toEqual([
      'Weapons',
      'Armor',
      'Talismans',
      'Tears, rune and ash',
    ]);
    expect(sections.every((section) => section.icons.length === 0)).toBe(true);
  });

  it('viewing: weapons then arrows in one unlabelled list, spells when there are some', () => {
    const { store, sections } = setup();
    store.dispatch(updateWeapon({ id: 'weapon4', item: byName(weapons, 'Dagger') }));
    store.dispatch(updateWeapon({ id: 'weapon1', item: byName(weapons, 'Uchigatana') }));
    store.dispatch(updateArrow({ id: 'arrow1', item: byName(arrows, 'Arrow') }));
    store.dispatch(updateSpell({ id: 'spell1', item: byName(spells, 'Glintstone Pebble') }));
    const [weaponSection, , , spellSection] = sections(false);
    expect(weaponSection!.icons.map((item) => item.name)).toEqual([
      'Uchigatana',
      'Dagger',
      'Arrow',
    ]);
    expect(weaponSection!.groups.map((group) => group.title)).toEqual(['']);
    expect(spellSection!.key).toBe('spells');
    expect(spellSection!.memory).toMatchObject({ used: 1 });
  });

  it('editing: every section, Weapons as each hand and the arrows', () => {
    const sections = setup().sections(true);
    expect(sections.map((section) => section.key)).toEqual([
      'weapons',
      'armor',
      'talismans',
      'spells',
      'flask',
      'items',
    ]);
    expect(sections[0]!.groups.map((group) => group.title)).toEqual([
      'Right hand',
      'Left hand',
      'Arrows and bolts',
    ]);
  });
});

describe('guideGlance and commentsGlance', () => {
  it('counts the items to find, or the ones found while tracking', () => {
    expect(guideGlance(14, null)).toBe('14 items to find');
    expect(guideGlance(1, null)).toBe('1 item to find');
    expect(guideGlance(0, null)).toBe('Nothing to find');
    const progress = { gear: { done: 3, total: 14 } } as TrackingProgress;
    expect(guideGlance(14, progress)).toBe('3 of 14 items');
  });

  it('gives the count and the start of the newest comment', () => {
    expect(commentsGlance(0, null)).toBe('No comments yet');
    expect(commentsGlance(1, null)).toBe('1 comment');
    expect(commentsGlance(3, 'Great with\n the Rivers')).toBe(
      '3 comments · “Great with the Rivers”',
    );
  });
});
