import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import styled, { css } from 'styled-components';
import {
  COLOR_ACCENT,
  COLOR_ACCENT_STRONG,
  COLOR_DANGER,
  COLOR_DANGER_SOFT,
  COLOR_LINE_STRONG,
  COLOR_ON_ACCENT,
  COLOR_SURFACE_RAISED,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  DURATION_FAST,
  FONT_UI,
  RADIUS_FRAME,
  TEXT_MD,
} from '@/theme';

/**
 * - `primary`: the one main action on a screen (the accent; one per screen, part of the accent budget).
 * - `secondary`: other actions (neutral, raised). The default for most buttons.
 * - `ghost`: low-emphasis actions in a row of buttons (nav, "Report"): muted text, no border.
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
    border-color: ${COLOR_ACCENT};
    background: ${COLOR_ACCENT};

    &:not(:disabled):hover {
      border-color: ${COLOR_ACCENT_STRONG};
      background: ${COLOR_ACCENT_STRONG};
    }
  `,
  secondary: css`
    color: ${COLOR_TEXT};
    border-color: ${COLOR_LINE_STRONG};
    background: ${COLOR_SURFACE_RAISED};

    &:not(:disabled):hover {
      border-color: ${COLOR_TEXT_MUTED};
    }
  `,
  ghost: css`
    color: ${COLOR_TEXT_MUTED};
    border-color: transparent;
    background: none;

    &:not(:disabled):hover {
      color: ${COLOR_TEXT};
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
  font-size: ${TEXT_MD};
  font-weight: 500;
  gap: 8px;
  justify-content: center;
  min-height: 44px;
  padding: 0 16px;
  text-align: center;
  transition:
    box-shadow ${DURATION_FAST},
    border-color ${DURATION_FAST},
    background ${DURATION_FAST},
    color ${DURATION_FAST};
  white-space: nowrap;

  ${({ $variant }) => variants[$variant]}
  ${({ $variant }) => ($variant === 'primary' ? 'font-weight: 600;' : '')}

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
