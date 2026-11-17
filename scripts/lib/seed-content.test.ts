// @vitest-environment node
// Seeded builds (T52): the checks that stand in for firestore.rules (the Admin SDK skips them), the credit
// line, and every seed in content/builds/er/ passing them.
import { describe, expect, it } from 'vitest';
import { loadItemData } from './build-from-names.mjs';
import { checkSeed, checkSeeds, creditLine, readSeeds } from './seed-content.mjs';

const data = loadItemData();
const items = (file: string) => data[file] ?? [];
const idOf = (file: string, name: string): number | undefined =>
  items(file).find((item) => item.name === name)?.id;

const source = {
  author: 'Fextralife',
  site: 'the Fextralife wiki',
  title: 'Sanguine Samurai',
  url: 'https://eldenring.wiki.fextralife.com/Sanguine_Samurai_Build',
};

/** A valid level-150 bleed build; each test breaks one thing. */
const seed = (overrides: Record<string, unknown> = {}) => ({
  id: 'TESTSEED0001',
  name: 'Test Bleed',
  level: 150,
  startingClass: 'Samurai',
  stats: { vigor: 58, mind: 30, end: 18, str: 16, dex: 38, int: 9, fai: 15, arc: 45 },
  rightHand: [{ weapon: 'Rivers of Blood' }],
  leftHand: [{ weapon: 'Sacrificial Axe' }, { weapon: 'Dragon Communion Seal' }],
  talismans: ["Lord of Blood's Exultation", 'Shard of Alexander'],
  spells: ['Flame, Grant Me Strength'],
  armor: { helm: 'White Mask' },
  tags: ['Arcane', 'Bleed (Hemorrhage)'],
  image: { kind: 'weapon', name: 'Rivers of Blood' },
  source,
  ...overrides,
});

const check = (overrides: Record<string, unknown> = {}, writeUp: string | null = 'Bleed.') =>
  checkSeed({ file: 'test', seed: seed(overrides), writeUp }, data);

describe('checkSeed', () => {
  it('turns a valid seed into build content with game IDs and the credit line', () => {
    const { errors, content, summary } = check();
    expect(errors).toEqual([]);
    expect(content).toMatchObject({
      name: 'Test Bleed',
      nameLower: 'test bleed',
      level: 150,
      startingClass: 3007,
      image: { kind: 'weapon', id: idOf('weapons', 'Rivers of Blood') },
      tags: ['Arcane', 'Bleed (Hemorrhage)'],
    });
    expect(content?.equipment.weapons).toEqual([
      idOf('weapons', 'Rivers of Blood'),
      null,
      null,
      idOf('weapons', 'Sacrificial Axe'),
      idOf('weapons', 'Dragon Communion Seal'),
      null,
    ]);
    expect(content?.equipment.weaponAffinities).toEqual([null, null, null, null, null, null]);
    expect(content?.description).toBe(
      "Bleed.\n\n---\n\n_Loadout from Fextralife's Sanguine Samurai build on the Fextralife wiki ([original](https://eldenring.wiki.fextralife.com/Sanguine_Samurai_Build)). Write-up by Souls Builds._",
    );
    expect(summary?.roll).toBe('light');
  });

  it('reads affinities and Ashes of War by their names in the game', () => {
    const { errors, content } = check({
      rightHand: [{ weapon: 'Uchigatana', affinity: 'Blood', ash: 'Seppuku' }],
      image: { kind: 'weapon', name: 'Uchigatana' },
    });
    expect(errors).toEqual([]);
    expect(content?.equipment.weaponAffinities[0]).toBe('blood');
    expect(content?.equipment.weaponSkills[0]).not.toBeNull();
  });

  it.each<[string, Record<string, unknown>, string | null, RegExp]>([
    [
      'a level that does not match',
      { level: 149 },
      'x',
      /level 149 doesn't match the stats \(150\)/,
    ],
    [
      'stats below the class base',
      {
        startingClass: 'Astrologer',
        stats: { vigor: 58, mind: 30, end: 18, str: 16, dex: 38, int: 9, fai: 15, arc: 45 },
      },
      'x',
      /below the Astrologer's base: int 16/,
    ],
    [
      'an unknown item',
      { talismans: ['Shard of Alexandr'] },
      'x',
      /no talismans item "Shard of Alexandr"/,
    ],
    ['an unknown class', { startingClass: 'Paladin' }, 'x', /no starting class "Paladin"/],
    [
      "an Ash of War the weapon can't take",
      { rightHand: [{ weapon: 'Rivers of Blood', ash: 'Seppuku' }] },
      'x',
      /Rivers of Blood can't take the Ash of War "Seppuku"/,
    ],
    [
      "the weapon's own skill as an Ash",
      { rightHand: [{ weapon: 'Uchigatana', ash: 'Unsheathe' }] },
      'x',
      /Unsheathe is the Uchigatana's own skill/,
    ],
    [
      "an affinity the weapon can't have",
      { rightHand: [{ weapon: 'Rivers of Blood', affinity: 'Keen' }] },
      'x',
      /Rivers of Blood can't have the affinity "keen"/,
    ],
    [
      'an affinity name not in the game',
      { rightHand: [{ weapon: 'Uchigatana', affinity: 'Bleed' }] },
      'x',
      /no affinity "Bleed"/,
    ],
    [
      'talismans that cannot be worn together',
      { talismans: ["Erdtree's Favor", "Erdtree's Favor +1"] },
      'x',
      /"Erdtree's Favor \+1" can't be worn with "Erdtree's Favor"/,
    ],
    [
      'armor in the wrong slot',
      { armor: { chest: 'White Mask' } },
      'x',
      /no armor item "White Mask"/,
    ],
    ['an unknown tag', { tags: ['Bleed'] }, 'x', /unknown tags: Bleed/],
    ['too many talismans', { talismans: ['A', 'B', 'C', 'D', 'E'] }, 'x', /talismans: at most 4/],
    [
      'a duplicate spell',
      { spells: ['Flame, Grant Me Strength', 'Flame, Grant Me Strength'] },
      'x',
      /spells: no duplicates/,
    ],
    [
      'an image not on the build',
      { image: { kind: 'weapon', name: 'Moonveil' } },
      'x',
      /image: Moonveil isn't on the build/,
    ],
    ['an unknown field', { level: 150, rune: 'Mohg' }, 'x', /unknown field "rune"/],
    ['no write-up file', {}, null, /no write-up: add test.md/],
    [
      'a source without a link',
      { source: { ...source, url: 'eldenring.wiki' } },
      'x',
      /source.url/,
    ],
  ])('rejects %s', (_label, overrides, writeUp, message) => {
    const { errors, content } = check(overrides, writeUp);
    expect(errors.join('\n')).toMatch(message);
    expect(content).toBeNull();
  });

  it("rejects gear the stats can't use, unless the seed allows it", () => {
    const weak = {
      stats: { vigor: 60, mind: 30, end: 18, str: 16, dex: 38, int: 9, fai: 12, arc: 46 },
    };
    expect(check(weak).errors).toEqual(["Flame, Grant Me Strength: the stats don't meet fai 15"]);
    const allowed = check({ ...weak, allowUnmet: ['Flame, Grant Me Strength'] });
    expect(allowed.errors).toEqual([]);
    expect(allowed.notes).toContain(
      'Flame, Grant Me Strength: requirements unmet (fai 15), allowed by allowUnmet',
    );
  });

  it('notes a weapon that only works two-handed', () => {
    const { errors, notes } = check({
      startingClass: null,
      stats: { vigor: 58, mind: 30, end: 18, str: 11, dex: 38, int: 9, fai: 15, arc: 50 },
      leftHand: [],
      rightHand: [{ weapon: 'Rivers of Blood' }, { weapon: 'Dragon Communion Seal' }],
    });
    expect(errors).toEqual([]);
    expect(notes).toContain('Rivers of Blood: two-handed (needs str 12)');
  });

  it("rejects spells that don't fit the memory slots", () => {
    const spells = items('spells')
      .filter((spell) => spell.slots === 2)
      .slice(0, 6);
    const { errors } = check({
      stats: { vigor: 20, mind: 30, end: 18, str: 16, dex: 38, int: 80, fai: 80, arc: 45 },
      spells: spells.map((spell) => spell.name),
      allowUnmet: [],
    });
    expect(errors.join('\n')).toMatch(/spells need 12 memory slots, the build has 10/);
  });
});

describe('creditLine', () => {
  it('says what Souls Builds filled in where the source left gaps', () => {
    expect(creditLine({ ...source, filled: ['stats', 'armor'] })).toBe(
      "Loadout from Fextralife's Sanguine Samurai build on the Fextralife wiki ([original](https://eldenring.wiki.fextralife.com/Sanguine_Samurai_Build)); stats and armor filled in by Souls Builds. Write-up by Souls Builds.",
    );
  });

  it("drops a trailing 'build' from the title and works without an author", () => {
    expect(
      creditLine({ site: 'Steam', title: 'Moon Knight Build', url: 'https://example.com/b' }),
    ).toBe(
      'Loadout from the Moon Knight build on Steam ([original](https://example.com/b)). Write-up by Souls Builds.',
    );
  });

  it("credits the author's own text when they gave permission", () => {
    expect(
      creditLine({
        ...source,
        author: 'u/someone',
        site: 'Reddit',
        permission: 'Reddit DM, 2026-11-20',
      }),
    ).toBe(
      'Build and write-up by u/someone on Reddit ([original](https://eldenring.wiki.fextralife.com/Sanguine_Samurai_Build)), shared with their permission.',
    );
  });
});

describe('content/builds/er', () => {
  const checked = checkSeeds(readSeeds(), data);

  it('has seeds', () => {
    expect(checked.length).toBeGreaterThan(0);
  });

  it.each(checked.map((entry) => [entry.file, entry] as const))(
    '%s passes every check',
    (_file, entry) => {
      expect(entry.errors).toEqual([]);
    },
  );

  it('uses each build ID once', () => {
    const ids = checked.map(({ seed }) => seed.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
