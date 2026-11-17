// Font stacks, all self-hosted and OFL-licensed (@fontsource, imported in src/index.css). Three type
// tiers (redesign v2, T26; readability pass, T67; docs/architecture.md "Styling"):
//   Names and headings  FONT_DISPLAY (EB Garamond 600), title case, the text color (`displayText`), never
//                       below TEXT_NAME (22px): its short letters read about 3/4 of their size.
//   Labels              Inter 12px/600, uppercase, tracked, muted: the only caps style (`Label`).
//   Values and body     FONT_UI (Inter), `font-variant-numeric: tabular-nums` on numbers. Write-ups and
//                       comments too (T67: the serif was hard to read as running text).
// FONT_BRAND (Cinzel 700) is the wordmark only.
export const FONT_UI =
  "'Inter Variable', 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif";
export const FONT_DISPLAY = "'EB Garamond', Georgia, 'Times New Roman', serif";
export const FONT_BRAND = "'Cinzel', 'Times New Roman', serif";
/** The weight of names and headings in FONT_DISPLAY. */
export const WEIGHT_DISPLAY = 600;

// Type scale (font sizes) in rem, so a browser's default font size applies (T67; 1rem = 16px by
// default, px in the comments). Line heights: 1.5 for text, ~1.15 for display sizes.
/** Labels (the caps tier), 12px. */
export const TEXT_LABEL = '0.75rem';
/** Small print: timestamps, captions, 13px. */
export const TEXT_XS = '0.8125rem';
/** Secondary text: meta lines, chips, 14px. */
export const TEXT_SM = '0.875rem';
/** UI text: the page's base size, 15px. */
export const TEXT_MD = '0.9375rem';
/** Running text (write-ups), form fields (iOS zooms into fields under 16px), stand-out values, 16px. */
export const TEXT_BODY = '1rem';
/** Taglines, row figures, 19px. */
export const TEXT_LG = '1.1875rem';
/** The smallest serif: build names in lists, phone section headers, 22px. */
export const TEXT_NAME = '1.375rem';
/** Section headings (`SectionHeading`), dialog titles, 24px. */
export const TEXT_XL = '1.5rem';
/** Page titles, 32px. */
export const TEXT_XXL = '2rem';
export const TEXT_DISPLAY = '2.5rem';

/** Letter spacing of labels (uppercase Inter). */
export const TRACKING_LABEL = '0.06em';

/**
 * Max width of running text (write-ups, comments, taglines, legal pages): about 72 characters of Inter
 * (T67). In em, not ch: Inter's "0" is ~1.3 average characters wide, so 68ch ran ~90 characters a line.
 */
export const MEASURE = '35em';
