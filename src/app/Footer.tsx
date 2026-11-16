import { Link } from 'react-router';
import styled from 'styled-components';
import {
  COLOR_ACCENT_STRONG,
  COLOR_LINE,
  COLOR_TEXT_MUTED,
  SPACE_GUTTER,
  SPACE_XXXL,
  TEXT_SM,
  TEXT_XS,
} from '@/theme';

/** Site footer: legal links, and who we are not. The game data and icons come from FromSoftware's game files. */
function Footer() {
  return (
    <Container>
      <Links aria-label="Legal">
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
      </Links>
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
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_XS};
  line-height: 1.6;
  margin-top: ${SPACE_XXXL};
  padding: 28px ${SPACE_GUTTER} 44px;
  position: relative;
  text-align: center;

  &::before {
    background: ${COLOR_LINE};
    content: '';
    height: 1px;
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
  }

  & > p {
    margin: 0 auto;
    max-width: 640px;
  }
`;

const Links = styled.nav`
  display: flex;
  gap: 24px;
  justify-content: center;
  margin-bottom: 8px;

  & > a {
    align-items: center;
    color: ${COLOR_TEXT_MUTED};
    display: inline-flex;
    font-size: ${TEXT_SM};
    font-weight: 500;
    min-height: 44px;
  }

  & > a:hover {
    color: ${COLOR_ACCENT_STRONG};
  }
`;

export default Footer;
