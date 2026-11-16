// CSS fragments for the in-world look (the "50%" of the design that feels like the game), shared by the
// components below and by pages. Original CSS, not game art. Colors follow the game skin.
import { css } from 'styled-components';
import {
  COLOR_ACCENT,
  COLOR_FRAME,
  COLOR_FRAME_SOFT,
  COLOR_GLOW,
  COLOR_SURFACE,
  DURATION_FAST,
  RADIUS_FRAME,
  SHADOW_FRAME,
} from '@/theme';

const line = `linear-gradient(${COLOR_ACCENT}, ${COLOR_ACCENT})`;
const CORNER = '12px';

/** A framed panel: thin accent border, sunken shade, and accent corner marks (like the game's menus). */
export const framed = css`
  position: relative;
  border: 1px solid ${COLOR_FRAME_SOFT};
  border-radius: ${RADIUS_FRAME};
  box-shadow: ${SHADOW_FRAME};
  background-color: ${COLOR_SURFACE};
  background-image: ${Array(8).fill(line).join(', ')};
  background-repeat: no-repeat;
  background-size:
    ${CORNER} 1px,
    1px ${CORNER},
    ${CORNER} 1px,
    1px ${CORNER},
    ${CORNER} 1px,
    1px ${CORNER},
    ${CORNER} 1px,
    1px ${CORNER};
  background-position:
    -1px -1px,
    -1px -1px,
    calc(100% + 1px) -1px,
    calc(100% + 1px) -1px,
    -1px calc(100% + 1px),
    -1px calc(100% + 1px),
    calc(100% + 1px) calc(100% + 1px),
    calc(100% + 1px) calc(100% + 1px);
`;

/** A 1px rule that fades out at both ends. Use as a `background` on a 1px-high element. */
export const fadingRule = `linear-gradient(90deg, transparent, ${COLOR_FRAME} 15%, ${COLOR_FRAME} 85%, transparent)`;

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
