import { useId, useState } from 'react';
import { Link, NavLink } from 'react-router';
import styled from 'styled-components';
import Button, { ButtonLink } from '@/components/ui/Button';
import FocusScope from '@/components/ui/FocusScope';
import { CloseIcon, MenuIcon, PlusIcon } from '@/components/ui/icons';
import OutsideClickHandler from '@/components/ui/OutsideClickHandler';
import useAuth from '@/features/auth/useAuth';
import { signOut } from '@/lib/firebase';
import {
  BELOW_MOBILE,
  COLOR_ACCENT,
  COLOR_BG,
  COLOR_LINE,
  COLOR_SURFACE_RAISED,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  CONTENT_WIDTH,
  FONT_BRAND,
  SHADOW_OVERLAY,
  SPACE_GUTTER,
  TEXT_MD,
  TEXT_XS,
} from '@/theme';
import { useCurrentGame } from './game';

interface HeaderProps {
  /** Which auth dialog is open, for aria-expanded. */
  openDialog: 'login' | 'signup' | null;
  onLogIn: () => void;
  onSignUp: () => void;
}

/**
 * Full-width bar: the wordmark and the current game; Builds, Profile, Log out and New build (the
 * primary button), or Builds, Log in and Sign up. Phones: a labelled "+" (New build) and a Menu
 * button that opens the rest as a panel under the bar.
 */
function Header({ openDialog, onLogIn, onSignUp }: HeaderProps) {
  const { loading, uid } = useAuth();
  const game = useCurrentGame();
  const menuId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  const links = (onNavigate?: () => void) => (
    <>
      <NavItem to="/" end onClick={onNavigate}>
        Builds
      </NavItem>
      {uid ? (
        <>
          <NavItem to={`/user/${uid}`} onClick={onNavigate}>
            Profile
          </NavItem>
          <Button
            variant="ghost"
            onClick={() => {
              onNavigate?.();
              void signOut();
            }}>
            Log out
          </Button>
        </>
      ) : (
        <Button
          variant="ghost"
          aria-haspopup="dialog"
          aria-expanded={openDialog === 'login'}
          onClick={() => {
            onNavigate?.();
            onLogIn();
          }}>
          Log in
        </Button>
      )}
    </>
  );

  return (
    <Bar>
      <Inner>
        <Wordmark to="/">Souls Builds</Wordmark>
        <GameName>{game.name}</GameName>
        {loading ? null : (
          <>
            <Nav aria-label="Main">
              {links()}
              {uid ? (
                <ButtonLink to="/build/new" variant="primary">
                  <PlusIcon />
                  New build
                </ButtonLink>
              ) : (
                <Button
                  variant="primary"
                  aria-haspopup="dialog"
                  aria-expanded={openDialog === 'signup'}
                  onClick={onSignUp}>
                  Sign up
                </Button>
              )}
            </Nav>
            <PhoneActions>
              {uid ? (
                <IconLink to="/build/new" variant="primary" aria-label="New build">
                  <PlusIcon size={18} />
                </IconLink>
              ) : (
                <Button
                  variant="primary"
                  aria-haspopup="dialog"
                  aria-expanded={openDialog === 'signup'}
                  onClick={onSignUp}>
                  Sign up
                </Button>
              )}
              <OutsideClickHandler onOutsideClick={closeMenu}>
                <MenuButton
                  type="button"
                  aria-label="Menu"
                  aria-expanded={menuOpen}
                  aria-controls={menuOpen ? menuId : undefined}
                  onClick={() => setMenuOpen(!menuOpen)}>
                  {menuOpen ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
                </MenuButton>
                {menuOpen ? (
                  <Menu id={menuId} onEscape={closeMenu}>
                    <nav aria-label="Main">{links(closeMenu)}</nav>
                  </Menu>
                ) : null}
              </OutsideClickHandler>
            </PhoneActions>
          </>
        )}
      </Inner>
    </Bar>
  );
}

const Bar = styled.header`
  border-bottom: 1px solid ${COLOR_LINE};
  position: relative;
`;

const Inner = styled.div`
  align-items: center;
  display: flex;
  gap: 16px;
  height: 64px;
  margin: 0 auto;
  max-width: ${CONTENT_WIDTH};
  padding: 0 24px;

  @media ${BELOW_MOBILE} {
    gap: 8px;
    height: 56px;
    padding: 0 8px 0 ${SPACE_GUTTER};
  }
`;

const Wordmark = styled(Link)`
  color: ${COLOR_TEXT};
  font-family: ${FONT_BRAND};
  font-size: 19px;
  font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;

  @media ${BELOW_MOBILE} {
    font-size: 17px;
  }
`;

const GameName = styled.span`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_MD};
  white-space: nowrap;

  @media ${BELOW_MOBILE} {
    font-size: ${TEXT_XS};
  }
`;

const Nav = styled.nav`
  align-items: center;
  display: flex;
  gap: 4px;
  margin-left: auto;

  & > a:last-child,
  & > button:last-child {
    margin-left: 8px;
  }

  @media ${BELOW_MOBILE} {
    display: none;
  }
`;

// Builds and Profile; the current page in the text color.
const NavItem = styled(NavLink)`
  align-items: center;
  color: ${COLOR_TEXT_MUTED};
  display: inline-flex;
  font-weight: 500;
  min-height: 44px;
  padding: 0 12px;

  &:hover,
  &[aria-current='page'] {
    color: ${COLOR_TEXT};
  }
`;

const PhoneActions = styled.div`
  align-items: center;
  display: none;
  gap: 4px;
  margin-left: auto;

  @media ${BELOW_MOBILE} {
    display: flex;
  }
`;

const IconLink = styled(ButtonLink)`
  padding: 0;
  width: 44px;
`;

const MenuButton = styled.button`
  align-items: center;
  background: none;
  border: none;
  color: ${COLOR_TEXT};
  cursor: pointer;
  display: inline-flex;
  height: 44px;
  justify-content: center;
  width: 44px;

  &:hover,
  &[aria-expanded='true'] {
    color: ${COLOR_ACCENT};
  }
`;

// Drops down under the bar, full width.
const Menu = styled(FocusScope)`
  background: ${COLOR_BG};
  border-bottom: 1px solid ${COLOR_LINE};
  box-shadow: ${SHADOW_OVERLAY};
  left: 0;
  outline: none;
  padding: 8px ${SPACE_GUTTER} 12px;
  position: absolute;
  right: 0;
  top: 100%;
  z-index: 50;

  & > nav {
    display: flex;
    flex-direction: column;
  }

  & > nav > a,
  & > nav > button {
    border-radius: 0;
    color: ${COLOR_TEXT};
    font-size: 16px;
    justify-content: flex-start;
    min-height: 48px;
    padding: 0 8px;
  }

  & > nav > a:hover,
  & > nav > button:hover {
    background: ${COLOR_SURFACE_RAISED};
  }

  & > nav > a + a,
  & > nav > a + button {
    border-top: 1px solid ${COLOR_LINE};
  }
`;

export default Header;
