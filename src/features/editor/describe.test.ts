import { describe, expect, it } from 'vitest';
import { describeBuild, type DescriptionFacts } from './describe';

const stats = { vigor: 50, mind: 10, end: 20, str: 12, dex: 40, int: 9, fai: 8, arc: 45 };

const base: DescriptionFacts = {
  level: 131,
  className: 'Samurai',
  gearCount: 7,
  weapons: [],
  stats,
  load: null,
  poise: 0,
  talismans: [],
  spiritAsh: null,
  spells: { incantations: 0, sorceries: 0, used: 0, available: 10 },
  warnings: [],
  dlcItems: [],
};

describe('describeBuild', () => {
  it('says a build with no gear has none yet, in one line', () => {
    expect(describeBuild({ ...base, level: 9, className: null, gearCount: 0 })).toBe(
      'A level 9 build with no gear chosen yet.',
    );
    expect(describeBuild({ ...base, level: 9, gearCount: 0 })).toBe(
      'A level 9 Samurai build with no gear chosen yet.',
    );
  });

  it('names the weapons with affinity and skill, and the three highest attributes', () => {
    const text = describeBuild({
      ...base,
      weapons: [
        { name: 'Rivers of Blood', details: ['Corpse Piler'] },
        { name: 'Uchigatana', details: ['Blood', 'Seppuku'] },
      ],
    });
    expect(text).toBe(
      'A level 131 Samurai build around Rivers of Blood (Corpse Piler) and Uchigatana (Blood, Seppuku). Its highest attributes are Vigor 50, Arcane 45 and Dexterity 40.',
    );
  });

  it('leaves out "around" without weapons and the attributes when they are all equal', () => {
    const flat = { vigor: 10, mind: 10, end: 10, str: 10, dex: 10, int: 10, fai: 10, arc: 10 };
    expect(describeBuild({ ...base, stats: flat, talismans: ['Arsenal Charm'] })).toBe(
      'A level 131 Samurai build.\n\nTalismans: Arsenal Charm.',
    );
  });

  it('breaks ties in the usual attribute order', () => {
    const tied = { ...stats, vigor: 20, mind: 20, end: 20, str: 20 };
    expect(describeBuild(base)).toContain('Vigor 50, Arcane 45 and Dexterity 40');
    expect(describeBuild({ ...base, stats: tied, gearCount: 1 })).toContain(
      'Arcane 45, Dexterity 40 and Vigor 20',
    );
  });

  it('gives the load and poise, each only when there is something to say', () => {
    const load = { weight: 39.8, max: 72, roll: 'medium' as const };
    expect(describeBuild({ ...base, load, poise: 42 })).toContain(
      'Medium load (39.8 of 72.0), 42 poise.',
    );
    expect(describeBuild({ ...base, load })).toContain(' Medium load (39.8 of 72.0).');
    expect(describeBuild({ ...base, poise: 12 })).toContain(' 12 poise.');
    expect(describeBuild({ ...base, load: { ...load, roll: 'overloaded' } })).toContain(
      'Overloaded (39.8 of 72.0).',
    );
    expect(describeBuild(base)).not.toMatch(/load|poise/);
  });

  it('lists talismans, spirit ash and spells', () => {
    const text = describeBuild({
      ...base,
      talismans: ['A', 'B', 'C', 'D'],
      spiritAsh: 'Mimic Tear Ashes',
      spells: { incantations: 3, sorceries: 1, used: 5, available: 10 },
    });
    expect(text).toContain(
      'Talismans: A, B, C and D. Spells: 3 incantations, 1 sorcery, 5 of 10 memory slots. Spirit Ash: Mimic Tear Ashes.',
    );
    const two = describeBuild({
      ...base,
      spells: { incantations: 1, sorceries: 2, used: 3, available: 10 },
    });
    expect(two).toContain('Spells: 1 incantation, 2 sorceries, 3 of 10');
    expect(describeBuild(base)).not.toMatch(/Spells|Talismans|Spirit/);
  });

  it('adds a "Worth knowing" list only for what applies', () => {
    expect(describeBuild(base)).not.toContain('Worth knowing');
    const text = describeBuild({
      ...base,
      warnings: [
        { name: 'Rivers of Blood', text: 'Needs 18 Str, 12 Dex' },
        { name: 'Greatsword', text: 'Two-handed only (18 Str)' },
        { name: 'Comet Azur', text: 'Over the memory slots' },
      ],
      dlcItems: ['Dancing Blade', 'Moonveil'],
    });
    expect(text).toContain(
      [
        '**Worth knowing**',
        '',
        '- Rivers of Blood: needs 18 Str, 12 Dex',
        '- Greatsword: two-handed only (18 Str)',
        '- Comet Azur: over the memory slots',
        '- Needs Shadow of the Erdtree: Dancing Blade and Moonveil',
      ].join('\n'),
    );
  });
});
