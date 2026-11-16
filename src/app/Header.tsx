import { Link } from 'react-router';
import styled from 'styled-components';
import Button, { ButtonLink } from '@/components/ui/Button';
import { LozengeIcon } from '@/components/ui/icons';
import { fadingRule } from '@/components/ui/inWorld';
import useAuth from '@/features/auth/useAuth';
import { signOut } from '@/lib/firebase';
import {
  BELOW_MOBILE,
  COLOR_ACCENT,
  COLOR_HIGHLIGHT,
  COLOR_TEXT_MUTED,
  CONTENT_WIDTH,
  FONT_DISPLAY,
  SPACE_GUTTER,
  TEXT_SM,
  TRACKING_CAPS,
} from '@/theme';
import { useCurrentGame } from './game';

interface HeaderProps {
  /** Which auth dialog is open, for aria-expanded. */
  openDialog: 'login' | 'signup' | null;
  onLogIn: () => void;
  onSignUp: () => void;
}

/** Full-width bar: logo and the current game; New build/Profile/Log out, or Log in/Sign up. */
function Header({ openDialog, onLogIn, onSignUp }: HeaderProps) {
  const { loading, uid } = useAuth();
  const game = useCurrentGame();

  return (
    <Bar>
      <Inner>
        <Brand>
          <Logo to="/">Souls Builds</Logo>
          <GameLabel>
            <LozengeIcon />
            {game.name}
          </GameLabel>
        </Brand>
        {loading ? null : (
          <Nav aria-label="Account">
            {uid ? (
              <>
                <ButtonLink to="/build/new" variant="primary">
                  New build
                </ButtonLink>
                <ButtonLink to={`/user/${uid}`} variant="ghost">
                  Profile
                </ButtonLink>
                <Button variant="ghost" onClick={() => void signOut()}>
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  aria-haspopup="dialog"
                  aria-expanded={openDialog === 'login'}
                  onClick={onLogIn}>
                  Log in
                </Button>
                <Button
                  variant="primary"
                  aria-haspopup="dialog"
                  aria-expanded={openDialog === 'signup'}
                  onClick={onSignUp}>
                  Sign up
                </Button>
              </>
            )}
          </Nav>
        )}
      </Inner>
    </Bar>
  );
}

const Bar = styled.header`
  background: linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.25));
  position: relative;

  &::after {
    background: ${fadingRule};
    bottom: 0;
    content: '';
    height: 1px;
    left: 0;
    position: absolute;
    right: 0;
  }
`;

const Inner = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin: 0 auto;
  max-width: ${CONTENT_WIDTH};
  min-height: 68px;
  padding: 8px 24px;

  @media ${BELOW_MOBILE} {
    padding: 6px ${SPACE_GUTTER};
  }
`;

const Brand = styled.div`
  align-items: center;
  display: flex;
  gap: 18px;
`;

const Logo = styled(Link)`
  background: linear-gradient(${COLOR_HIGHLIGHT}, ${COLOR_ACCENT} 80%);
  background-clip: text;
  color: transparent;
  font-family: ${FONT_DISPLAY};
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;

  @media ${BELOW_MOBILE} {
    font-size: 19px;
  }
`;

const GameLabel = styled.span`
  align-items: center;
  color: ${COLOR_TEXT_MUTED};
  display: inline-flex;
  font-family: ${FONT_DISPLAY};
  font-size: ${TEXT_SM};
  font-weight: 600;
  gap: 10px;
  letter-spacing: ${TRACKING_CAPS};
  text-transform: uppercase;
  white-space: nowrap;

  & > svg {
    color: ${COLOR_ACCENT};
  }

  @media ${BELOW_MOBILE} {
    display: none;
  }
`;

const Nav = styled.nav`
  align-items: center;
  display: flex;
  gap: 6px;
  margin-left: auto;

  @media ${BELOW_MOBILE} {
    & > a,
    & > button {
      padding: 0 12px;
    }
  }
`;

export default Header;
