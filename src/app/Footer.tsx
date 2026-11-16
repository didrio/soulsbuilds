import { Link } from 'react-router';
import styled from 'styled-components';
import { fadingRule } from '@/components/ui/inWorld';
import {
  COLOR_ACCENT,
  COLOR_ACCENT_STRONG,
  COLOR_TEXT_MUTED,
  FONT_DISPLAY,
  SPACE_GUTTER,
  SPACE_XXXL,
  TEXT_SM,
  TEXT_XS,
  TRACKING_CAPS,
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
    background: ${fadingRule};
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
    color: ${COLOR_ACCENT};
    display: inline-flex;
    font-family: ${FONT_DISPLAY};
    font-size: ${TEXT_SM};
    font-weight: 600;
    letter-spacing: ${TRACKING_CAPS};
    min-height: 44px;
    text-transform: uppercase;
  }

  & > a:hover {
    color: ${COLOR_ACCENT_STRONG};
  }
`;

export default Footer;
