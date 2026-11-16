import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import styled, { css } from 'styled-components';
import {
  COLOR_ACCENT,
  COLOR_ACCENT_DEEP,
  COLOR_ACCENT_STRONG,
  COLOR_DANGER,
  COLOR_DANGER_SOFT,
  COLOR_FRAME,
  COLOR_GLOW,
  COLOR_GLOW_STRONG,
  COLOR_ON_ACCENT,
  COLOR_SURFACE,
  COLOR_TEXT,
  DURATION_FAST,
  FONT_UI,
  RADIUS_FRAME,
  TEXT_SM,
} from '@/theme';

/**
 * - `primary`: the one main action on a screen (metallic accent).
 * - `secondary`: other actions (framed, glows on hover). The default for most buttons.
 * - `ghost`: low-emphasis actions in a row of buttons (nav, "Report").
 * - `danger`: destructive actions (delete).
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = Omit<ComponentPropsWithoutRef<'button'>, 'type'> & {
  children: ReactNode;
  /** 'submit' inside a <form>; defaults to 'button'. */
  type?: 'button' | 'submit';
  variant?: ButtonVariant;
};

/** A button (44 px tall). Other `<button>` props (aria-*, onClick, disabled…) pass through. */
function Button({ type = 'button', variant = 'primary', ...rest }: ButtonProps) {
  return <StyledButton type={type} $variant={variant} {...rest} />;
}

/** A router link that looks like a button (e.g. "New build"). */
export function ButtonLink({
  variant = 'secondary',
  ...rest
}: LinkProps & { variant?: ButtonVariant }) {
  return <StyledLink $variant={variant} {...rest} />;
}

const variants = {
  primary: css`
    color: ${COLOR_ON_ACCENT};
    border-color: ${COLOR_ACCENT_STRONG};
    background: linear-gradient(
      ${COLOR_ACCENT_STRONG},
      ${COLOR_ACCENT} 40%,
      ${COLOR_ACCENT} 70%,
      ${COLOR_ACCENT_DEEP}
    );
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);

    &:not(:disabled):hover {
      border-color: ${COLOR_ACCENT_STRONG};
      box-shadow:
        0 0 22px ${COLOR_GLOW_STRONG},
        inset 0 1px 0 rgba(255, 255, 255, 0.4);
    }
  `,
  secondary: css`
    color: ${COLOR_TEXT};
    border-color: ${COLOR_FRAME};
    background: linear-gradient(rgba(255, 255, 255, 0.03), rgba(0, 0, 0, 0.2)), ${COLOR_SURFACE};

    &:not(:disabled):hover {
      border-color: ${COLOR_ACCENT};
      box-shadow:
        0 0 18px ${COLOR_GLOW},
        inset 0 0 14px ${COLOR_GLOW};
    }
  `,
  ghost: css`
    color: ${COLOR_TEXT};
    border-color: transparent;
    background: none;

    &:not(:disabled):hover {
      color: ${COLOR_ACCENT_STRONG};
      background: linear-gradient(90deg, transparent, ${COLOR_GLOW}, transparent);
    }
  `,
  danger: css`
    color: ${COLOR_DANGER};
    border-color: ${COLOR_DANGER};
    background: none;

    &:not(:disabled):hover {
      background: ${COLOR_DANGER_SOFT};
    }
  `,
};

const base = css<{ $variant: ButtonVariant }>`
  align-items: center;
  border: 1px solid transparent;
  border-radius: ${RADIUS_FRAME};
  cursor: pointer;
  display: inline-flex;
  flex-shrink: 0;
  font-family: ${FONT_UI};
  font-size: ${TEXT_SM};
  font-weight: 600;
  gap: 8px;
  justify-content: center;
  letter-spacing: 0.01em;
  min-height: 44px;
  padding: 0 18px;
  text-align: center;
  transition:
    box-shadow ${DURATION_FAST},
    border-color ${DURATION_FAST},
    background ${DURATION_FAST},
    color ${DURATION_FAST};
  white-space: nowrap;

  ${({ $variant }) => variants[$variant]}

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
`;

const StyledButton = styled.button<{ $variant: ButtonVariant }>`
  ${base}
`;

const StyledLink = styled(Link)<{ $variant: ButtonVariant }>`
  ${base}
`;

export default Button;
