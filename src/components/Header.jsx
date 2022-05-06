import styled from 'styled-components';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import FlexGroup from './common/FlexGroup';
import { logout } from '../firebase';
import useAuth from '../hooks/useAuth';
import {
  COLOR_LIGHTEST_GREEN,
  COLOR_GOLD,
  COLOR_LIGHTEST_GREEN_LOW_OPACITY,
} from '../constants';

const FONT_SIZE_LINK = '22px';

function Header({
  onShowLogin,
  onShowRegister,
}) {
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

  const handleShowLogin = () => {
    onShowLogin();
  };

  const handleShowRegister = () => {
    onShowRegister();
  };

  return (
    <Container>
      <LogoContainer>
        <Link
          to="/"
        >
          Souls Builds
        </Link>
      </LogoContainer>
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
          <LoginClicker
            onClick={handleShowLogin}
          >
            Login
          </LoginClicker>
          <LoginClicker
            onClick={handleShowRegister}
          >
            Register
          </LoginClicker>
        </LoginContainer>
      )}
    </Container>
  );
}

Header.propTypes = {
  onShowLogin: PropTypes.func.isRequired,
  onShowRegister: PropTypes.func.isRequired,
};

const Container = styled(FlexGroup)`
  justify-content: space-between;
  font-size: 24px;
  font-weight: bold;
  width: 100%;
  border-bottom: 1px solid ${COLOR_LIGHTEST_GREEN_LOW_OPACITY};
  padding-bottom: 10px;
  align-items: flex-end;
`;

const LogoContainer = styled(FlexGroup)`
  & > a {
    color: ${COLOR_LIGHTEST_GREEN};
    font-size: 44px;
  }

  font-family: "OptimusPrincepsSemiBold", serif;
  text-shadow: 0px 0px 7px ${COLOR_GOLD};
`;

const LogoutContainer = styled(FlexGroup)`
  cursor: pointer;
  font-size: ${FONT_SIZE_LINK};
  font-weight: normal;

  &:hover {
    color: ${COLOR_LIGHTEST_GREEN};
  }
`;

const LoginContainer = styled(FlexGroup)`
  & > a {
    margin-left: 25px;
    font-size: ${FONT_SIZE_LINK};
    font-weight: normal;
  }
`;

const LoginClicker = styled(FlexGroup)`
  cursor: pointer;
  margin-left: 25px;
  font-size: ${FONT_SIZE_LINK};
  font-weight: normal;

  &:hover {
    color: ${COLOR_LIGHTEST_GREEN};
  }
`;

const ProfileContainer = styled(LogoutContainer)`
  margin-right: 20px;
  font-weight: normal;
  font-size: 22px;
`;

export default Header;
