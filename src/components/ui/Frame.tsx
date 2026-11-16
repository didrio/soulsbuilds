import styled from 'styled-components';
import { BELOW_MOBILE, SPACE_GUTTER, SPACE_PANEL } from '@/theme';
import { heroFrame, panel } from './inWorld';

/**
 * The site's card: a plain panel (surface, neutral hairline). `$hero` is the build hero's frame
 * instead: accent corner marks and the skin's tint glowing from the left; nothing else gets it. A
 * `<section>` by default; use `as` for another element. Padding included.
 */
const Frame = styled.section<{ $hero?: boolean }>`
  ${({ $hero }) => ($hero ? heroFrame : panel)}
  padding: ${SPACE_PANEL};

  @media ${BELOW_MOBILE} {
    padding: ${SPACE_GUTTER};
  }
`;

export default Frame;
