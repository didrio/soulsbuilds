import styled from 'styled-components';
import { BELOW_MOBILE, TEXT_XL } from '@/theme';
import { displayText } from './typography';

/** A section heading: the serif in the text color, left-aligned. An `<h2>` by default (`as` for another level). */
const SectionHeading = styled.h2`
  ${displayText}
  font-size: 24px;
  margin: 0 0 12px;

  @media ${BELOW_MOBILE} {
    font-size: ${TEXT_XL};
  }
`;

export default SectionHeading;
