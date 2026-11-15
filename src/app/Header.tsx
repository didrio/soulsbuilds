import styled from 'styled-components';
import { Link } from 'react-router';
import useAuth from '@/features/auth/useAuth';
import { signOut } from '@/lib/firebase';
import {
  COLOR_LIGHTEST_GREEN,
  COLOR_GOLD,
  COLOR_LIGHTEST_GREEN_LOW_OPACITY,
  FONT_DISPLAY,
  BELOW_500,
  SPACE_LG,
  SPACE_SM,
} from '@/theme';

interface HeaderProps {
  /** Which slide-down panel is open, for aria-expanded. */
  openPanel: 'login' | 'register' | null;
  onShowLogin: () => void;
  onShowRegister: () => void;
}

/** Logo plus New build/Profile/Logout when signed in, Login/Register (toggle the panel) when not. */
function Header({ openPanel, onShowLogin, onShowRegister }: HeaderProps) {
  const { loading, uid } = useAuth();

  return (
    <Container>
      <Logo to="/">Souls Builds</Logo>
      {loading ? null : (
        <Nav aria-label="Account">
          {uid ? (
            <>
              <NavLink to="/build/new">New build</NavLink>
              <NavLink to={`/user/${uid}`}>Profile</NavLink>
              <NavButton type="button" onClick={() => void signOut()}>
                Logout
              </NavButton>
            </>
          ) : (
            <>
              <NavButton type="button" aria-expanded={openPanel === 'login'} onClick={onShowLogin}>
                Login
              </NavButton>
              <NavButton
                type="button"
                aria-expanded={openPanel === 'register'}
                onClick={onShowRegister}>
                Register
              </NavButton>
            </>
          )}
        </Nav>
      )}
    </Container>
  );
}

const Container = styled.header`
  align-items: flex-end;
  border-bottom: 1px solid ${COLOR_LIGHTEST_GREEN_LOW_OPACITY};
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACE_SM};
  justify-content: space-between;
  padding-bottom: ${SPACE_SM};
  width: 100%;
`;

const Logo = styled(Link)`
  color: ${COLOR_LIGHTEST_GREEN};
  font-family: ${FONT_DISPLAY};
  font-size: 44px;
  font-weight: bold;
  text-shadow: 0px 0px 7px ${COLOR_GOLD};
  transition: text-shadow ease-in-out 0.1s;

  &:hover {
    text-shadow: 0px 0px 11px ${COLOR_GOLD};
  }

  @media ${BELOW_500} {
    font-size: 34px;
  }
`;

const Nav = styled.nav`
  display: flex;
  gap: ${SPACE_LG};
`;

const navItem = `
  font-size: 20px;
  font-weight: bold;
`;

const NavLink = styled(Link)`
  ${navItem}
  color: ${COLOR_GOLD};

  &:hover {
    color: ${COLOR_LIGHTEST_GREEN};
  }
`;

const NavButton = styled.button`
  ${navItem}
  background: none;
  border: none;
  color: ${COLOR_GOLD};
  cursor: pointer;
  font-family: inherit;
  padding: 0;

  &:hover {
    color: ${COLOR_LIGHTEST_GREEN};
  }
`;

export default Header;
