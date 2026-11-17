// A few inline SVG icons (no icon library). Decorative by default: give the control a text label.
import type { SVGProps } from 'react';
import {
  BRAND_GOOGLE_BLUE,
  BRAND_GOOGLE_GREEN,
  BRAND_GOOGLE_RED,
  BRAND_GOOGLE_YELLOW,
} from '@/theme';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const stroke = (size: number, rest: SVGProps<SVGSVGElement>) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
  ...rest,
});

export const SearchIcon = ({ size = 18, ...rest }: IconProps) => (
  <svg {...stroke(size, rest)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const PlusIcon = ({ size = 16, ...rest }: IconProps) => (
  <svg {...stroke(size, rest)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const MenuIcon = ({ size = 20, ...rest }: IconProps) => (
  <svg {...stroke(size, rest)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const CloseIcon = ({ size = 16, ...rest }: IconProps) => (
  <svg {...stroke(size, rest)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const ChevronDownIcon = ({ size = 16, ...rest }: IconProps) => (
  <svg {...stroke(size, rest)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

/** A speech bubble: comment counts (T20). */
/** Three lines narrowing down: a list's filters (T74). */
export const FilterIcon = ({ size = 16, ...rest }: IconProps) => (
  <svg {...stroke(size, rest)}>
    <path d="M4 6h16M7 12h10M10 18h4" />
  </svg>
);

export const CommentIcon = ({ size = 16, ...rest }: IconProps) => (
  <svg {...stroke(size, rest)}>
    <path d="M4 5h16v11H9l-5 4z" />
  </svg>
);

const HEART =
  'M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.4h2c.7-1.3 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z';

export const HeartIcon = ({
  size = 16,
  filled = true,
  ...rest
}: IconProps & { filled?: boolean }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    aria-hidden
    focusable={false}
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={filled ? 0 : 2}
    {...rest}>
    <path d={HEART} />
  </svg>
);

/** A small diamond (lozenge), the site's ornament mark. */
export const LozengeIcon = ({ size = 8, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 8 8" aria-hidden focusable={false} {...rest}>
    <path d="M4 0l4 4-4 4-4-4z" fill="currentColor" />
  </svg>
);

export const CheckIcon = ({ size = 16, ...rest }: IconProps) => (
  <svg {...stroke(size, rest)}>
    <path d="M5 12l4 4L19 6" />
  </svg>
);

export const MinusIcon = ({ size = 16, ...rest }: IconProps) => (
  <svg {...stroke(size, rest)}>
    <path d="M5 12h14" />
  </svg>
);

/** An arrow up: levelling a stat. */
export const LevelUpIcon = ({ size = 16, ...rest }: IconProps) => (
  <svg {...stroke(size, rest)}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </svg>
);

/** A map pin: a stop on the route. */
export const PinIcon = ({ size = 16, ...rest }: IconProps) => (
  <svg {...stroke(size, rest)}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);

/** A screen and a phone: on every device. */
export const DevicesIcon = ({ size = 16, ...rest }: IconProps) => (
  <svg {...stroke(size, rest)}>
    <path d="M15 16H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v3M7 20h8" />
    <rect x="17" y="11" width="5" height="9" rx="1" />
  </svg>
);

export const LockIcon = ({ size = 14, ...rest }: IconProps) => (
  <svg {...stroke(size, rest)} strokeWidth={1.8}>
    <rect x="5" y="11" width="14" height="10" rx="1" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

/** Google's "G" mark, in its own colors (Google's sign-in branding guidelines). */
export const GoogleIcon = ({ size = 18, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden focusable={false} {...rest}>
    <path
      fill={BRAND_GOOGLE_RED}
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill={BRAND_GOOGLE_BLUE}
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill={BRAND_GOOGLE_YELLOW}
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill={BRAND_GOOGLE_GREEN}
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </svg>
);
