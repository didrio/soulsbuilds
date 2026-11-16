import styled from 'styled-components';
import { COLOR_ACCENT, COLOR_FRAME, FONT_DISPLAY, TEXT_SM, TRACKING_CAPS } from '@/theme';

/**
 * A section heading in the game-menu style: Cinzel capitals in the accent, between fading rules.
 * An `<h2>` by default (use `as` for another level); `$align="start"` drops the left rule.
 */
const SectionHeading = styled.h2<{ $align?: 'center' | 'start' }>`
  align-items: center;
  color: ${COLOR_ACCENT};
  display: flex;
  font-family: ${FONT_DISPLAY};
  font-size: ${TEXT_SM};
  font-weight: 600;
  gap: 12px;
  letter-spacing: ${TRACKING_CAPS};
  margin: 0 0 16px;
  text-transform: uppercase;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, ${COLOR_FRAME});
  }

  &::before {
    display: ${({ $align }) => ($align === 'start' ? 'none' : 'block')};
  }

  &::after {
    background: linear-gradient(90deg, ${COLOR_FRAME}, transparent);
  }
`;

export default SectionHeading;
