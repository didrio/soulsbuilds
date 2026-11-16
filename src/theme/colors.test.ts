import { describe, expect, it } from 'vitest';
import {
  COLOR_BG,
  COLOR_DANGER,
  COLOR_INSET,
  COLOR_LINE_STRONG,
  COLOR_PLACEHOLDER,
  COLOR_SUCCESS,
  COLOR_SURFACE,
  COLOR_SURFACE_RAISED,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  COLOR_TILE_BOTTOM,
} from './colors';
import { SKINS } from './skins';

// WCAG 2.x relative luminance and contrast ratio, for #rrggbb colors.
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
};

const BACKGROUNDS = {
  COLOR_BG,
  COLOR_SURFACE,
  COLOR_SURFACE_RAISED,
  COLOR_INSET,
  COLOR_TILE_BOTTOM,
};
const TEXT = { COLOR_TEXT, COLOR_TEXT_MUTED, COLOR_DANGER, COLOR_SUCCESS };

describe('contrast (WCAG AA)', () => {
  it('helper matches known values', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contrast('#777777', '#ffffff')).toBeCloseTo(4.48, 1);
  });

  for (const [textName, text] of Object.entries(TEXT)) {
    for (const [bgName, bg] of Object.entries(BACKGROUNDS)) {
      it(`${textName} on ${bgName} ≥ 4.5`, () => {
        expect(contrast(text, bg)).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  it('placeholder text on fields ≥ 4.5', () => {
    expect(contrast(COLOR_PLACEHOLDER, COLOR_INSET)).toBeGreaterThanOrEqual(4.5);
  });

  for (const [bgName, bg] of Object.entries({ COLOR_INSET, COLOR_SURFACE, COLOR_SURFACE_RAISED })) {
    it(`control borders on ${bgName} ≥ 3`, () => {
      expect(contrast(COLOR_LINE_STRONG, bg)).toBeGreaterThanOrEqual(3);
    });
  }

  for (const [game, skin] of Object.entries(SKINS)) {
    describe(`${game} skin`, () => {
      for (const [bgName, bg] of Object.entries(BACKGROUNDS)) {
        it(`accent and accent-strong as text on ${bgName} ≥ 4.5`, () => {
          expect(contrast(skin.accent, bg)).toBeGreaterThanOrEqual(4.5);
          expect(contrast(skin.accentStrong, bg)).toBeGreaterThanOrEqual(4.5);
        });
      }
      it('text on the primary button (accent-strong → accent) ≥ 4.5', () => {
        expect(contrast(skin.onAccent, skin.accent)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(skin.onAccent, skin.accentStrong)).toBeGreaterThanOrEqual(4.5);
      });
      it('focus ring (accent-strong) on the page ≥ 3', () => {
        expect(contrast(skin.accentStrong, COLOR_BG)).toBeGreaterThanOrEqual(3);
      });
    });
  }
});
