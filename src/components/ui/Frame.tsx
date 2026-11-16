import styled from 'styled-components';
import { BELOW_MOBILE, SPACE_LG, SPACE_MD } from '@/theme';
import { framed } from './inWorld';

/**
 * A framed panel (thin accent border, corner marks, sunken shade): the site's card. A `<section>` by
 * default; use `as` for another element. Padding included.
 */
const Frame = styled.section`
  ${framed}
  padding: ${SPACE_LG};

  @media ${BELOW_MOBILE} {
    padding: ${SPACE_MD};
  }
`;

export default Frame;
