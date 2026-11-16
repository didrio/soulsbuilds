// CSS fragments for the in-world look, shared by the components below and by pages. Original CSS, not
// game art. Colors follow the game skin, within the accent budget (src/theme/colors.ts).
import { css } from 'styled-components';
import {
  COLOR_ACCENT,
  COLOR_GLOW,
  COLOR_LINE,
  COLOR_SURFACE,
  COLOR_TINT,
  DURATION_FAST,
  RADIUS_PANEL,
} from '@/theme';

const line = `linear-gradient(${COLOR_ACCENT}, ${COLOR_ACCENT})`;
const CORNER = '14px';

/** A plain panel: the surface with a neutral hairline (redesign v2: panels stay quiet). */
export const panel = css`
  position: relative;
  border: 1px solid ${COLOR_LINE};
  border-radius: ${RADIUS_PANEL};
  background-color: ${COLOR_SURFACE};
`;

/**
 * The build hero's frame: a plain panel plus accent corner marks (like the game's menus) and the
 * skin's tint glowing in from the left. The only place corner marks appear.
 */
export const heroFrame = css`
  ${panel}
  background-image:
    ${Array(8).fill(line).join(', ')},
    radial-gradient(ellipse 45% 150% at 0% 50%, ${COLOR_TINT}, transparent 70%);
  background-repeat: no-repeat;
  background-size:
    ${CORNER} 1px,
    1px ${CORNER},
    ${CORNER} 1px,
    1px ${CORNER},
    ${CORNER} 1px,
    1px ${CORNER},
    ${CORNER} 1px,
    1px ${CORNER},
    100% 100%;
  background-position:
    0 0,
    0 0,
    100% 0,
    100% 0,
    0 100%,
    0 100%,
    100% 100%,
    100% 100%,
    0 0;
`;

/**
 * The game-menu selection bar on hover and keyboard focus: a horizontal glow with accent hairlines
 * above and below that fade at the ends. Uses ::before/::after; the element must be position: relative.
 */
export const selectionBar = css`
  &::before,
  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      ${COLOR_ACCENT} 30%,
      ${COLOR_ACCENT} 70%,
      transparent
    );
    opacity: 0;
    transition: opacity ${DURATION_FAST};
    pointer-events: none;
  }

  &::before {
    top: -1px;
  }

  &::after {
    bottom: -1px;
  }

  &:hover,
  &:focus-visible {
    background: linear-gradient(
      90deg,
      transparent,
      ${COLOR_GLOW} 25%,
      ${COLOR_GLOW} 75%,
      transparent
    );
    outline: none;
  }

  &:hover::before,
  &:hover::after,
  &:focus-visible::before,
  &:focus-visible::after {
    opacity: 1;
  }
`;
