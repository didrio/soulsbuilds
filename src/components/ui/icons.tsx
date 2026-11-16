// A few inline SVG icons (no icon library). Decorative by default: give the control a text label.
import type { SVGProps } from 'react';

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
