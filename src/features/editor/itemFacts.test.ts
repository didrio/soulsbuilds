import { describe, expect, it } from 'vitest';
import {
  armor,
  arrows,
  getAsh,
  getWeapon,
  greatRunes,
  spells,
  spiritAshes,
  talismans,
  tears,
} from '@/data';
import { checkRequirements } from '@/lib/buildMath';
import { SEPPUKU_ASH, UCHIGATANA } from '@/test/fixtures';
import type { SlotEntry } from './gear';
import { factsLines, factsText, itemFacts } from './itemFacts';
import type { SlotType } from './slots';

const named = <T extends { name: string }>(items: T[], name: string) =>
  items.find((item) => item.name === name)!;
const entry = (type: SlotType, item: SlotEntry['item'], extra: Partial<SlotEntry> = {}) =>
  ({ id: 'weapon1', type, item, ...extra }) as SlotEntry;

const uchigatana = getWeapon(UCHIGATANA)!;
const STATS = { vigor: 10, mind: 10, end: 10, str: 8, dex: 20, int: 9, fai: 9, arc: 9 };

describe('itemFacts', () => {
  it('is null for an empty slot', () => {
    expect(itemFacts(entry('SLOT_TYPE_WEAPON', null))).toBeNull();
  });

  it("shows a weapon's type, skill FP, scaling for its affinity, requirements and weight", () => {
    const facts = itemFacts(
      entry('SLOT_TYPE_WEAPON', uchigatana, {
        affinity: 'blood',
        ash: getAsh(SEPPUKU_ASH)!,
        check: checkRequirements(uchigatana.requirements, STATS),
      }),
    )!;
    expect(facts.kind).toBe('Katana');
    expect(facts.subline).toMatch(/^Blood · Seppuku \(\d+ FP\)$/);
    expect(facts.rows).toEqual([
      {
        label: 'Scaling',
        parts: [{ text: 'Str D' }, { text: 'Dex D' }, { text: 'Arc D' }],
        short: 'Str D Dex D Arc D',
      },
      { label: 'Requires', parts: [{ text: 'Str 11', unmet: true }, { text: 'Dex 15' }] },
      { label: 'Weight', parts: [{ text: '5.5' }], short: '5.5 wt' },
    ]);
  });

  it('grades an infused weapon by its own scaling, not the Standard one', () => {
    const facts = itemFacts(entry('SLOT_TYPE_WEAPON', uchigatana, { affinity: 'heavy' }))!;
    expect(facts.rows[0]).toMatchObject({ label: 'Scaling', parts: [{ text: 'Str D' }] });
    const standard = itemFacts(entry('SLOT_TYPE_WEAPON', uchigatana))!;
    expect(standard.subline).toBe('Unsheathe (15 FP)');
    expect(standard.rows[0]).toMatchObject({ parts: [{ text: 'Str D' }, { text: 'Dex D' }] });
  });

  it('shows armor weight and poise', () => {
    const facts = itemFacts(entry('SLOT_TYPE_CHEST', named(armor, 'Kaiden Armor')))!;
    expect(facts.kind).toBe('Chest armor');
    expect(factsLines(facts)).toEqual(['8.8 wt · 18 poise']);
  });

  it("shows a talisman's effect and weight", () => {
    const facts = itemFacts(entry('SLOT_TYPE_TAL', named(talismans, 'Crimson Amber Medallion')))!;
    expect(facts).toMatchObject({ kind: 'Talisman', effect: 'Raises maximum HP' });
    expect(factsLines(facts)).toEqual(['Raises maximum HP', '0.3 wt']);
  });

  it("shows a spell's FP, slots, requirements and effect", () => {
    const pebble = named(spells, 'Glintstone Pebble');
    const facts = itemFacts(
      entry('SLOT_TYPE_SPELL', pebble, { check: checkRequirements(pebble.requirements, STATS) }),
    )!;
    expect(facts.kind).toBe('Sorcery');
    expect(facts.rows.map(({ label }) => label)).toEqual(['FP', 'Slots', 'Requires']);
    expect(facts.rows[2]?.parts).toEqual([{ text: 'Int 10', unmet: true }]);
    expect(factsLines(facts)).toEqual([pebble.effect, '7 FP · 1 slot']);
  });

  it('shows what a spirit ash costs to summon, in FP or HP', () => {
    const tiche = itemFacts(
      entry('SLOT_TYPE_SPIRIT_ASH', named(spiritAshes, 'Black Knife Tiche')),
    )!;
    expect(factsLines(tiche)).toEqual(['132 FP']);
    expect(tiche.effect).toBe('');
    const mimic = itemFacts(entry('SLOT_TYPE_SPIRIT_ASH', named(spiritAshes, 'Mimic Tear Ashes')))!;
    expect(factsLines(mimic)).toEqual(['660 HP']);
  });

  it('shows the effect of tears and great runes, and an arrow’s type and weight', () => {
    const tear = named(tears, 'Crimsonspill Crystal Tear');
    expect(itemFacts(entry('SLOT_TYPE_TEAR', tear))).toMatchObject({
      kind: 'Crystal Tear',
      effect: tear.effect,
    });
    expect(
      itemFacts(entry('SLOT_TYPE_GREAT_RUNE', named(greatRunes, "Godrick's Great Rune"))),
    ).toMatchObject({ kind: 'Great Rune', effect: 'Raises all attributes' });
    const arrow = itemFacts(entry('SLOT_TYPE_ARROW', arrows[0]!))!;
    expect(arrow.rows.map(({ label }) => label)).toEqual(['Weight']);
  });
});

describe('factsText', () => {
  it('reads the facts as sentences, saying which requirements are not met', () => {
    const facts = itemFacts(
      entry('SLOT_TYPE_WEAPON', uchigatana, {
        check: checkRequirements(uchigatana.requirements, STATS),
      }),
    )!;
    expect(factsText(facts)).toBe(
      'Katana. Unsheathe (15 FP). Scaling: Str D, Dex D. Requires: Str 11 (not met), Dex 15. Weight: 5.5.',
    );
  });
});
