import styled from 'styled-components';
import { COLOR_GOLD, COLOR_LIGHT_GREEN, SPACE_GUTTER, SPACE_LG, SPACE_XXL } from '@/theme';

/** Site footer: who we are not. The game data and icons come from FromSoftware's game files. */
function Footer() {
  return (
    <Container>
      <p>
        Souls Builds is a fan site. It is not affiliated with or endorsed by FromSoftware or Bandai
        Namco.
      </p>
      <p>
        ELDEN RING, its item names, data and icons are trademarks and copyright of FromSoftware,
        Inc. and Bandai Namco Entertainment Inc.
      </p>
    </Container>
  );
}

const Container = styled.footer`
  border-top: 1px solid ${COLOR_LIGHT_GREEN};
  box-sizing: border-box;
  color: ${COLOR_GOLD};
  font-size: 14px;
  line-height: 1.5;
  margin-top: ${SPACE_XXL};
  padding: ${SPACE_LG} ${SPACE_GUTTER};
  text-align: center;
  width: 100%;

  & > p {
    margin: 0 auto;
    max-width: 720px;
  }
`;

export default Footer;
