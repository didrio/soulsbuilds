import { describe, expect, it } from 'vitest';
import {
  emptyEquipment,
  GODRICKS_GREAT_RUNE,
  makeBuild,
  MOONVEIL,
  SEPPUKU_ASH,
  UCHIGATANA,
  WHITE_MASK,
} from '@/test/fixtures';
import { cardImageUrl, redditText } from './shareText';

describe('redditText', () => {
  it('starts with the name and level, then the attributes', () => {
    const text = redditText(makeBuild(), 'Ranni Fan');
    expect(text).toContain('# Carian Moon Knight');
    expect(text).toContain('Level 132 Elden Ring build by Ranni Fan');
    expect(text).toContain(
      '**Attributes:** Vigor 40 · Mind 30 · Endurance 15 · Strength 12 · Dexterity 18 · Intelligence 80 · Faith 7 · Arcane 9',
    );
  });

  it('leaves the author out when unknown and ends with the canonical link', () => {
    const text = redditText(makeBuild());
    expect(text).toContain('Level 132 Elden Ring build\n');
    expect(text.endsWith('(https://soulsbuilds.com/build/SEEDMOON0001/carian-moon-knight)')).toBe(
      true,
    );
  });

  it('lists weapons with their affinity and skill, and skips empty slots', () => {
    const equipment = {
      ...emptyEquipment(),
      weapons: [MOONVEIL, null, UCHIGATANA, null, null, null],
      weaponAffinities: [null, null, 'keen' as const, null, null, null],
      weaponSkills: [null, null, SEPPUKU_ASH, null, null, null],
    };
    const text = redditText(makeBuild({ equipment }));
    const weapons = text.split('**Weapons**\n')[1]!.split('\n\n')[0]!.split('\n');
    expect(weapons).toHaveLength(2);
    expect(weapons[0]).toMatch(/^- Moonveil/);
    expect(weapons[1]).toMatch(/^- Uchigatana \(Keen, Seppuku\)$/);
  });

  it('names armor and the great rune, and leaves out sections with nothing in them', () => {
    const equipment = {
      ...emptyEquipment(),
      weapons: [MOONVEIL, null, null, null, null, null],
      helm: WHITE_MASK,
      greatRune: GODRICKS_GREAT_RUNE,
    };
    const text = redditText(makeBuild({ equipment }));
    expect(text).toContain('**Armor**\n- White Mask');
    expect(text).toContain("- Godrick's Great Rune");
    expect(text).not.toContain('**Talismans**');
    expect(text).not.toContain('**Spells**');
  });
});

describe('cardImageUrl', () => {
  it('is the link-preview card of the build', () => {
    expect(cardImageUrl('ABC123')).toBe('/og/build/ABC123.png');
  });
});
