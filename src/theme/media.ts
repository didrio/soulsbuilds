// Max-width breakpoints the 2022 layout uses, as media-query prefixes:
//   @media ${BELOW_800} { ... }
const below = (px: number) => `only screen and (max-width: ${px}px)`;

export const BELOW_400 = below(400);
export const BELOW_500 = below(500);
export const BELOW_750 = below(750);
export const BELOW_800 = below(800);
export const BELOW_1000 = below(1000);
export const BELOW_1100 = below(1100);
export const BELOW_1200 = below(1200);
export const BELOW_1400 = below(1400);
