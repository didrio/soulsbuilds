import styled from 'styled-components';
import { Link } from 'react-router-dom';
import FlexGroup from './common/FlexGroup';
import { logout } from '../firebase';
import useAuth from '../hooks/useAuth';

function Header() {
  const auth = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <Container>
      <Link
        to="/"
      >
        Souls Builds
      </Link>
      {auth ? (
        <FlexGroup
          onClick={handleLogout}
        >
          Logout
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
`;

const LoginContainer = styled(FlexGroup)`
  & > a {
    margin-left: 25px;
  }
`;

export default Header;
