import styled from 'styled-components';
import { BELOW_MOBILE, COLOR_LINE, COLOR_LINE_STRONG, SPACE_LG, SPACE_XL } from '@/theme';

/**
 * The ornamental divider (neutral: outside the accent budget): fading rules either side of a small original flourish (diamonds and
 * dots). Decorative, so hidden from assistive tech. `compact` is a short one for page states.
 */
function Ornament({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Container aria-hidden="true" className={className} $compact={compact}>
      <svg viewBox="0 0 120 14" width={compact ? 80 : 120} height="14" focusable="false">
        <g fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M0 7h40M80 7h40" opacity=".6" />
          <path d="M60 1l6 6-6 6-6-6z" />
          <path d="M60 4.5l2.5 2.5-2.5 2.5-2.5-2.5z" fill="currentColor" />
          <path d="M44 7l4-3 4 3-4 3zM68 7l4-3 4 3-4 3z" opacity=".8" />
          <circle cx="36" cy="7" r="1" fill="currentColor" />
          <circle cx="84" cy="7" r="1" fill="currentColor" />
        </g>
      </svg>
    </Container>
  );
}

const Container = styled.div<{ $compact: boolean }>`
  align-items: center;
  color: ${COLOR_LINE_STRONG};
  display: flex;
  gap: 10px;
  margin: ${({ $compact }) => ($compact ? '0' : `${SPACE_XL} 0`)};
  width: ${({ $compact }) => ($compact ? 'auto' : '100%')};

  &::before,
  &::after {
    content: '';
    display: ${({ $compact }) => ($compact ? 'none' : 'block')};
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, ${COLOR_LINE});
  }

  &::after {
    background: linear-gradient(90deg, ${COLOR_LINE}, transparent);
  }

  @media ${BELOW_MOBILE} {
    margin: ${({ $compact }) => ($compact ? '0' : `${SPACE_LG} 0`)};
  }
`;

export default Ornament;
