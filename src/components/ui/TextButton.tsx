import { Link } from 'react-router';
import styled, { css } from 'styled-components';
import { COLOR_ACCENT, COLOR_ACCENT_STRONG, TEXT_SM } from '@/theme';

const textAction = css`
  align-items: center;
  background: none;
  border: none;
  color: ${COLOR_ACCENT};
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  font-size: ${TEXT_SM};
  min-height: 44px;
  padding: 0 4px;
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, currentColor 40%, transparent);
  text-underline-offset: 3px;

  &:hover {
    color: ${COLOR_ACCENT_STRONG};
    text-decoration-color: currentColor;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

/** A button that looks like a link (secondary actions: "Clear filters", "Forgot password?"). */
export const TextButton = styled.button.attrs({ type: 'button' })`
  ${textAction}
`;

/** An inline router link in the accent color. */
export const TextLink = styled(Link)`
  ${textAction}
`;
