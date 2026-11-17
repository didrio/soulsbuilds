// The type tiers as CSS fragments (T26; docs/architecture.md "Styling"). Components that need a tier
// on their own element mix these in; `Label` and `SectionHeading` are the ready-made versions.
import { css } from 'styled-components';
import {
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  FONT_DISPLAY,
  FONT_UI,
  TEXT_LABEL,
  TRACKING_LABEL,
  WEIGHT_DISPLAY,
} from '@/theme';

/** Names and headings: Spectral 600 (T79), title case, the text color. Set the size where it's used. */
export const displayText = css`
  color: ${COLOR_TEXT};
  font-family: ${FONT_DISPLAY};
  font-weight: ${WEIGHT_DISPLAY};
  letter-spacing: 0;
  line-height: 1.15;
  text-transform: none;
`;

/** Labels: Inter 11px/600, uppercase, tracked, muted. The only caps style in the app. */
export const labelText = css`
  color: ${COLOR_TEXT_MUTED};
  font-family: ${FONT_UI};
  font-size: ${TEXT_LABEL};
  font-weight: 600;
  letter-spacing: ${TRACKING_LABEL};
  line-height: 1.4;
  text-transform: uppercase;
`;

/**
 * Optical centering for a label in a box (buttons, chips, tags, triggers; T79). Inter's caps sit dead
 * center in a flex box, but its lowercase (x-height) sits ~0.09em lower, so mixed-case labels read low
 * and an icon at the box center reads high. Lift the label by half that and drop icons back to center.
 * Mix in after the box's own `padding`.
 */
export const opticalCenter = css`
  padding-bottom: 0.09em;
  padding-top: 0;

  & > svg {
    position: relative;
    top: 0.045em;
  }
`;
