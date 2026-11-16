// The palette, in two layers. Every color in the app comes from src/theme (ESLint rejects hex literals
// elsewhere in src/).
//
// 1. Base (this file): shared by every game. Warm near-black surfaces, off-white text, lines.
// 2. Game skin (skins.ts): the accent and what derives from it (frames, glows). The COLOR_ACCENT…
//    tokens below are CSS custom properties that GameSkinStyle sets for the current game, so a
//    component imports one constant and gets the right game's color.
//
// Contrast (WCAG AA) is enforced by colors.test.ts, not just noted: body and muted text ≥ 4.5:1 on
// every surface, the accent as text ≥ 4.5:1, text on the accent button ≥ 4.5:1, and the focus ring
// and input borders ≥ 3:1. Add a pair there when you put text on a new background.

// ---- Base ----
export const COLOR_BG = '#0d0c0a';
/** Panels, the header, cards. */
export const COLOR_SURFACE = '#1a1814';
/** Hover/selected rows, raised controls. */
export const COLOR_SURFACE_RAISED = '#24211b';
/** Sunken fields (inputs, selects, segmented controls). */
export const COLOR_INSET = '#100f0c';
/** Dividers and list rules. */
export const COLOR_LINE = '#3a352c';
/** Borders of inputs and other controls (≥ 3:1 against COLOR_INSET and COLOR_SURFACE). */
export const COLOR_LINE_STRONG = '#7a7365';
export const COLOR_TEXT = '#ede6d6';
export const COLOR_TEXT_MUTED = '#a9a193';
export const COLOR_PLACEHOLDER = '#8d8678';
export const COLOR_DANGER = '#f29484';
export const COLOR_DANGER_SOFT = 'rgba(242, 148, 132, 0.12)';
export const COLOR_SUCCESS = '#a3d18f';
/** Top of the gradient on the logo and page titles (the bottom is the accent). */
export const COLOR_HIGHLIGHT = '#fff7e4';

// Item slots (inventory-style tiles).
export const COLOR_TILE_TOP = '#1d1a15';
export const COLOR_TILE_BOTTOM = '#100f0c';
export const COLOR_TILE_BORDER = '#3d382e';
export const COLOR_TILE_EMPTY_BORDER = '#2c2822';
export const COLOR_TILE_SHINE = 'rgba(255, 236, 200, 0.07)';

// Overlays and shadows.
export const COLOR_BLACK = '#000000';
export const COLOR_BACKDROP = 'rgba(0, 0, 0, 0.72)';
export const COLOR_SHADOW = 'rgba(0, 0, 0, 0.55)';
export const COLOR_VIGNETTE = 'rgba(0, 0, 0, 0.55)';
export const COLOR_BG_TOP = '#1c1912';

// ---- Game skin (values per game in skins.ts) ----
/** Links, active states, section headings, the accent as text. */
export const COLOR_ACCENT = 'var(--sb-accent)';
/** Hover/active accent, the focus ring, big numbers. */
export const COLOR_ACCENT_STRONG = 'var(--sb-accent-strong)';
/** The dark end of accent gradients (primary button, stat bars). */
export const COLOR_ACCENT_DEEP = 'var(--sb-accent-deep)';
/** Text on the accent (the primary button). */
export const COLOR_ON_ACCENT = 'var(--sb-on-accent)';
/** Panel frames, ornament lines. */
export const COLOR_FRAME = 'var(--sb-frame)';
export const COLOR_FRAME_SOFT = 'var(--sb-frame-soft)';
/** The "grace" glow: hovered rows, page-title light. */
export const COLOR_GLOW = 'var(--sb-glow)';
export const COLOR_GLOW_STRONG = 'var(--sb-glow-strong)';
