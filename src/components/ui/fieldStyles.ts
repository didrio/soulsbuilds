// The shared look of text fields and selects: sunken, framed, 44 px, 16px text, accent border + glow on
// focus.
import { css } from 'styled-components';
import {
  COLOR_ACCENT,
  COLOR_DANGER,
  COLOR_GLOW,
  COLOR_INSET,
  COLOR_LINE_STRONG,
  COLOR_PLACEHOLDER,
  COLOR_TEXT,
  DURATION_FAST,
  FONT_UI,
  RADIUS_FRAME,
  SHADOW_FIELD,
  TEXT_BODY,
} from '@/theme';

export const fieldStyles = css`
  background-color: ${COLOR_INSET};
  border: 1px solid ${COLOR_LINE_STRONG};
  border-radius: ${RADIUS_FRAME};
  box-shadow: ${SHADOW_FIELD};
  color: ${COLOR_TEXT};
  font-family: ${FONT_UI};
  font-size: ${TEXT_BODY}; /* 16px: iOS zooms into fields set smaller (T67) */
  min-height: 44px;
  outline: none;
  padding: 8px 12px;
  transition:
    border-color ${DURATION_FAST},
    box-shadow ${DURATION_FAST};
  width: 100%;

  &::placeholder {
    color: ${COLOR_PLACEHOLDER};
  }

  &:focus-visible {
    border-color: ${COLOR_ACCENT};
    box-shadow:
      ${SHADOW_FIELD},
      0 0 14px ${COLOR_GLOW};
  }

  &[aria-invalid='true'] {
    border-color: ${COLOR_DANGER};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;
