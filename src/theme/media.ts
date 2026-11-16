// Max-width breakpoints as media-query prefixes: @media ${BELOW_MOBILE} { ... }. Design mobile-first
// where you can; BELOW_MOBILE and BELOW_TABLET are the layout's break points, BELOW_WIDE a narrow one.
const below = (px: number) => `only screen and (max-width: ${px}px)`;

/** Phones. */
export const BELOW_MOBILE = below(640);
/** Phones and small tablets: list rows stack, side panels move above. */
export const BELOW_TABLET = below(900);
/**
 * Small laptops (T28): the build page's gear column beside the 340 px stats column is under ~650 px,
 * so dense grids (the spell grid) drop columns.
 */
export const BELOW_WIDE = below(1100);
/** Short windows (small laptops): tall panels shouldn't stick, or their bottom stays out of reach. */
export const SHORT_SCREEN = 'only screen and (max-height: 759px)';
