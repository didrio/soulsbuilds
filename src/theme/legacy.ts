// 2022 token names, kept only so the editor, build page and picker (T17) keep compiling and blend in
// with the new design until T17 restyles them. Each maps onto the new palette. Don't use these in new
// code; T17 deletes this file.
import { COLOR_ACCENT, COLOR_ACCENT_DEEP, COLOR_ACCENT_STRONG } from './colors';
import { FONT_PROSE } from './fonts';

const below = (px: number) => `only screen and (max-width: ${px}px)`;

/** @deprecated 2022 token; use the T16 tokens. */
export const COLOR_BLUE = '#5aa9e6';
/** @deprecated 2022 token; use the T16 tokens. */
export const COLOR_DARK_GRAY = '#333333';
/** @deprecated 2022 token; use the T16 tokens. */
export const COLOR_DARKER_GRAY = '#252526';
/** @deprecated 2022 token; use the T16 tokens. */
export const COLOR_DARKEST_GRAY = '#1e1e1e';
/** @deprecated 2022 token; use the T16 tokens. */
export const COLOR_DIM_GRAY = '#818080';
/** @deprecated 2022 token; use the T16 tokens. */
export const COLOR_GRAY = '#555555';
/** @deprecated 2022 token; use the T16 tokens. */
export const COLOR_LIGHTER_GRAY = '#777777';
/** @deprecated 2022 token; use COLOR_TEXT_MUTED. */
export const COLOR_LIGHT_GRAY = '#a9a193';
/** @deprecated 2022 token; use COLOR_DANGER. */
export const COLOR_RED = '#f29484';
/** @deprecated 2022 token; use COLOR_DANGER. */
export const COLOR_ERROR = '#f29484';
/** @deprecated 2022 token; use COLOR_TEXT. */
export const COLOR_WHITE = '#ffffff';

/** @deprecated 2022 token; use COLOR_ACCENT_STRONG. */
export const COLOR_LIGHT_GOLD = COLOR_ACCENT_STRONG;
/** @deprecated 2022 token; use COLOR_FRAME. */
export const COLOR_LIGHT_GOLD_LOW_OPACITY = 'var(--sb-frame)';
/** @deprecated 2022 token; use COLOR_ACCENT. */
export const COLOR_GOLD = COLOR_ACCENT;
/** @deprecated 2022 token; use COLOR_ACCENT_DEEP. */
export const COLOR_DARK_GOLD = COLOR_ACCENT_DEEP;

/** @deprecated 2022 token; use COLOR_TEXT. */
export const COLOR_LIGHTEST_GREEN = '#ede6d6';
/** @deprecated 2022 token; use COLOR_LINE. */
export const COLOR_LIGHTEST_GREEN_LOW_OPACITY = '#3a352c';
/** @deprecated 2022 token; use COLOR_LINE_STRONG or COLOR_SURFACE_RAISED. */
export const COLOR_LIGHT_GREEN = '#3d382e';
/** @deprecated 2022 token; use COLOR_SURFACE_RAISED. */
export const COLOR_GREEN = '#24211b';
/** @deprecated 2022 token; use COLOR_SURFACE. */
export const COLOR_DARK_GREEN = '#1a1814';
/** @deprecated 2022 token; use COLOR_BG. */
export const COLOR_DARKER_GREEN = '#0d0c0a';
/** @deprecated 2022 token. */
export const COLOR_TEXT_SHADOW = 'rgba(0, 0, 0, 1)';

/** @deprecated 2022 token; use FONT_UI (controls) or FONT_PROSE (write-ups). */
export const FONT_BODY = FONT_PROSE;

/** @deprecated 2022 breakpoint; use BELOW_MOBILE or BELOW_TABLET. */
export const BELOW_400 = below(400);
/** @deprecated 2022 breakpoint; use BELOW_MOBILE or BELOW_TABLET. */
export const BELOW_500 = below(500);
/** @deprecated 2022 breakpoint; use BELOW_MOBILE or BELOW_TABLET. */
export const BELOW_750 = below(750);
/** @deprecated 2022 breakpoint; use BELOW_MOBILE or BELOW_TABLET. */
export const BELOW_800 = below(800);
/** @deprecated 2022 breakpoint; use BELOW_MOBILE or BELOW_TABLET. */
export const BELOW_1000 = below(1000);
/** @deprecated 2022 breakpoint; use BELOW_MOBILE or BELOW_TABLET. */
export const BELOW_1100 = below(1100);
/** @deprecated 2022 breakpoint; use BELOW_MOBILE or BELOW_TABLET. */
export const BELOW_1200 = below(1200);
/** @deprecated 2022 breakpoint; use BELOW_MOBILE or BELOW_TABLET. */
export const BELOW_1400 = below(1400);
