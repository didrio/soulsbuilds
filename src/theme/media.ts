// Max-width breakpoints as media-query prefixes: @media ${BELOW_MOBILE} { ... }. Design mobile-first
// where you can; these two are the layout's break points.
const below = (px: number) => `only screen and (max-width: ${px}px)`;

/** Phones. */
export const BELOW_MOBILE = below(640);
/** Phones and small tablets: list rows stack, side panels move above. */
export const BELOW_TABLET = below(900);
