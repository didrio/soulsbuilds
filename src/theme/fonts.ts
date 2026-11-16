// Font stacks, all self-hosted and OFL-licensed (@fontsource, imported in src/index.css). Three type
// tiers (redesign v2, T26; docs/architecture.md "Styling"):
//   Names and headings  FONT_DISPLAY (EB Garamond 600), title case, the text color (`displayText`).
//   Labels              Inter 11px/600, uppercase, tracked, muted: the only caps style (`Label`).
//   Values and body     FONT_UI (Inter), `font-variant-numeric: tabular-nums` on numbers.
// FONT_PROSE is the write-ups' body (EB Garamond 400); FONT_BRAND (Cinzel 700) is the wordmark only.
export const FONT_UI =
  "'Inter Variable', 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif";
export const FONT_DISPLAY = "'EB Garamond', Georgia, 'Times New Roman', serif";
export const FONT_PROSE = FONT_DISPLAY;
export const FONT_BRAND = "'Cinzel', 'Times New Roman', serif";
/** The weight of names and headings in FONT_DISPLAY. */
export const WEIGHT_DISPLAY = 600;

// Type scale (font sizes). Line heights: 1.5 for text, ~1.15 for display sizes.
/** Labels (the caps tier). */
export const TEXT_LABEL = '11px';
export const TEXT_XS = '12px';
export const TEXT_SM = '13px';
/** UI text: the page's base size. */
export const TEXT_MD = '14px';
export const TEXT_LG = '18px';
/** Section headings (`SectionHeading`). */
export const TEXT_XL = '22px';
/** Page titles. */
export const TEXT_XXL = '32px';
export const TEXT_DISPLAY = '40px';

/** Letter spacing of labels (uppercase Inter). */
export const TRACKING_LABEL = '0.08em';
