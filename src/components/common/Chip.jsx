import styled from 'styled-components';
import PropTypes from 'prop-types';
import FlexGroup from './FlexGroup';
import {
  COLOR_GREEN,
  COLOR_LIGHT_GREEN,
} from '../../constants';

function Chip({ children }) {
  return (
    <Container>
      {children}
    </Container>
  );
}

Chip.propTypes = {
  children: PropTypes.node.isRequired,
};

const Container = styled(FlexGroup)`
  background-color: ${COLOR_GREEN};
  border: 1px solid ${COLOR_LIGHT_GREEN};
  align-items: center;
  justify-content: center;
  height: 30px;
  box-shadow: 0px 0px 3px ${COLOR_GREEN};
  cursor: pointer;
  box-sizing: border-box;
  padding: 0 10px;
  font-size: 14px;

  &:hover {
    background-color: ${COLOR_LIGHT_GREEN};
  }
`;

export default Chip;
