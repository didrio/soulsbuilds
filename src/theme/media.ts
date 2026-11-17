// Max-width breakpoints as media-query prefixes: @media ${BELOW_MOBILE} { ... }. Design mobile-first
// where you can; BELOW_MOBILE and BELOW_TABLET are the layout's break points.
const below = (px: number) => `only screen and (max-width: ${px}px)`;

/** Phones. */
export const BELOW_MOBILE = below(640);
/** Phones and small tablets: list rows stack, side panels move above (the build sidebar, T48). */
export const BELOW_TABLET = below(900);
