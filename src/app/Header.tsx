import { useId, useState } from 'react';
import { Link, NavLink, useMatch } from 'react-router';
import styled from 'styled-components';
import Button, { ButtonLink } from '@/components/ui/Button';
import FocusScope from '@/components/ui/FocusScope';
import Label from '@/components/ui/Label';
import { CloseIcon, MenuIcon, PlusIcon } from '@/components/ui/icons';
import OutsideClickHandler from '@/components/ui/OutsideClickHandler';
import GameMenu, { GameList } from './GameMenu';
import NewHereStrip from './NewHereStrip';
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
  TEXT_BODY,
  TEXT_SM,
} from '@/theme';
import AccountMenu, { useDisplayName } from './AccountMenu';

interface HeaderProps {
  /** Which auth dialog is open, for aria-expanded. */
  openDialog: 'login' | 'signup' | null;
  onLogIn: () => void;
  onSignUp: () => void;
}

/**
 * Full-width bar: the wordmark and the current game; Builds, the account menu (the display name:
 * Profile, Account, Log out; T31) and New build (the primary button), or Builds, Plan a build (the
 * planner opens signed out, T68), Log in and Sign up. Phones: a labelled "+" (New build, or Plan a
 * build) and a Menu button that opens the rest as a panel under the bar (with the game list, T79).
 * The game name next to the wordmark is the game menu (T79, `GameMenu`).
 * On a build's page Builds shows as the current section (T66: the build page's way back to the list,
 * since "All builds" went). Builds is the full list, `/builds`; the wordmark is the home page (T74).
 */
function Header({ openDialog, onLogIn, onSignUp }: HeaderProps) {
  const { loading, uid } = useAuth();
  const menuId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const buildPage = useMatch('/build/:buildId/*');
  const inBuilds = buildPage !== null && buildPage.params.buildId !== 'new';

  const logIn = (onNavigate?: () => void) => (
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
  );

  return (
    <Bar>
      <Inner>
        <Wordmark to="/">Souls Builds</Wordmark>
        <GameMenu />
        <NewHereStrip place="header" />
        {loading ? null : (
          <>
            <Nav aria-label="Main">
              <NavItem to="/builds" end $section={inBuilds}>
                Builds
              </NavItem>
              {uid ? null : <NavItem to="/build/new">Plan a build</NavItem>}
              {uid ? <AccountMenu /> : logIn()}
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
                <IconLink to="/build/new" variant="secondary" aria-label="Plan a build">
                  <PlusIcon size={18} />
                </IconLink>
              )}
              {uid ? null : (
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
                    <nav aria-label="Main">
                      <NavItem to="/builds" end onClick={closeMenu} $section={inBuilds}>
                        Builds
                      </NavItem>
                      {uid ? null : (
                        <NavItem to="/build/new" onClick={closeMenu}>
                          Plan a build
                        </NavItem>
                      )}
                      {uid ? (
                        <PhoneAccountLinks uid={uid} onNavigate={closeMenu} />
                      ) : (
                        logIn(closeMenu)
                      )}
                    </nav>
                    <PhoneGames>
                      <GameLabel>Game</GameLabel>
                      <GameList onNavigate={closeMenu} />
                    </PhoneGames>
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

/** The phone menu's account part (T31): who's signed in, then Profile, Account and Log out. */
function PhoneAccountLinks({ uid, onNavigate }: { uid: string; onNavigate: () => void }) {
  const name = useDisplayName();
  return (
    <>
      <SignedInAs>
        Signed in as <b>{name}</b>
      </SignedInAs>
      <NavItem to={`/user/${uid}`} onClick={onNavigate}>
        Profile
      </NavItem>
      <NavItem to="/account" onClick={onNavigate}>
        Account
      </NavItem>
      <Button
        variant="ghost"
        onClick={() => {
          onNavigate();
          void signOut();
        }}>
        Log out
      </Button>
    </>
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
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.02em;
  margin-right: 12px; /* T79: room between the wordmark and the game menu */
  white-space: nowrap;

  /* Phones: the game menu moves into the Menu panel, so the bar has room (T79). */
  @media ${BELOW_MOBILE} {
    font-size: 19px;
    margin-right: 0;
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

// Builds and Profile; the current page (or section, `$section`) in the text color.
const NavItem = styled(NavLink)<{ $section?: boolean }>`
  align-items: center;
  color: ${({ $section }) => ($section ? COLOR_TEXT : COLOR_TEXT_MUTED)};
  display: inline-flex;
  font-weight: 500;
  min-height: 44px;
  padding: 0 12px 1px; /* T79: lifts mixed-case text to the optical center, like opticalCenter */
  white-space: nowrap;

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
    font-size: ${TEXT_BODY};
    justify-content: flex-start;
    min-height: 48px;
    padding: 0 8px;
  }

  & > nav > a:hover,
  & > nav > button:hover {
    background: ${COLOR_SURFACE_RAISED};
  }

  & > nav > a + a,
  & > nav > a + button,
  & > nav > p {
    border-top: 1px solid ${COLOR_LINE};
  }
`;

// The game list in the phone menu (T79), under the links.
const PhoneGames = styled.div`
  border-top: 1px solid ${COLOR_LINE};
  margin-top: 8px;
  padding-top: 8px;

  li > a,
  li[aria-disabled] {
    padding: 0 8px;
  }
`;

const GameLabel = styled(Label)`
  display: block;
  padding: 4px 8px;
`;

const SignedInAs = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  margin: 0;
  overflow: hidden;
  padding: 12px 8px 4px;
  text-overflow: ellipsis;
  white-space: nowrap;

  & > b {
    color: ${COLOR_TEXT};
    font-weight: 600;
  }
`;

export default Header;
