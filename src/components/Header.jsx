import styled from 'styled-components';
import FlexGroup from './common/FlexGroup';

function Header() {
  return (
    <Container>
      Souls Builds
    </Container>
  );
}

const Container = styled(FlexGroup)`
  padding: 20px 30px;
  font-size: 24px;
  font-weight: bold;
`;

export default Header;
