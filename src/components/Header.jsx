import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import FlexGroup from './common/FlexGroup';
import { logout } from '../firebase';
import useAuth from '../hooks/useAuth';
import { COLOR_LIGHTEST_GREEN } from '../constants';

function Header() {
  const auth = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  const handleNavigateProfile = () => {
    if (auth.uid) {
      navigate(`/user/${auth.uid}`);
    }
  };

  return (
    <Container>
      <Link
        to="/"
      >
        Souls Builds
      </Link>
      {auth ? (
        <FlexGroup>
          <ProfileContainer
            onClick={handleNavigateProfile}
          >
            Profile
          </ProfileContainer>
          <LogoutContainer
            onClick={handleLogout}
          >
            Logout
          </LogoutContainer>
        </FlexGroup>
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

const ProfileContainer = styled(LogoutContainer)`
  margin-right: 20px;
`;

export default Header;
