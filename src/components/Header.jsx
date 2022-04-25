import styled from 'styled-components';
import { Link } from 'react-router-dom';
import FlexGroup from './common/FlexGroup';
import { logout } from '../firebase';
import useAuth from '../hooks/useAuth';
import { COLOR_LIGHTEST_GREEN } from '../constants';

function Header() {
  const auth = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  return (
    <Container>
      <Link
        to="/"
      >
        Souls Builds
      </Link>
      {auth ? (
        <LogoutContainer
          onClick={handleLogout}
        >
          Logout
        </LogoutContainer>
      ) : (
        <LoginContainer>
          <Link
            to="/login"
          >
            Login
          </Link>
          <Link
            to="/signup"
          >
            Register
          </Link>
        </LoginContainer>
      )}
    </Container>
  );
}

const Container = styled(FlexGroup)`
  justify-content: space-between;
  padding: 20px 30px;
  font-size: 24px;
  font-weight: bold;
  width: 70%;
  margin-bottom: 30px;

  & > a {
    font-size: 30px;

    &:hover {
      color: ${COLOR_LIGHTEST_GREEN};
    }
  }
`;

const LogoutContainer = styled(FlexGroup)`
  cursor: pointer;
  font-size: 18px;

  &:hover {
    color: ${COLOR_LIGHTEST_GREEN};
  }
`;

const LoginContainer = styled(FlexGroup)`
  & > a {
    margin-left: 25px;
    font-size: 18px;

    &:hover {
      color: ${COLOR_LIGHTEST_GREEN};
    }
  }
`;

export default Header;
