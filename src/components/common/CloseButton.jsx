import PropTypes from 'prop-types';
import styled from 'styled-components';
import FlexGroup from './FlexGroup';
import {
  COLOR_GREEN,
  COLOR_LIGHT_GREEN,
} from '../../constants';

function CloseButton({ onClick }) {
  const handleClose = () => {
    onClick();
  };

  return (
    <Container
      onClick={handleClose}
    >
      X
    </Container>
  );
}

const Container = styled(FlexGroup)`
  background-color: ${COLOR_GREEN};
  cursor: pointer;
  height: 35px;
  width: 35px;
  justify-content: center;
  align-items: center;
  font-size: 22px;
  border-radius: 2px;
  box-shadow: 0px 0px 3px ${COLOR_GREEN};

  &:hover {
    background-color: ${COLOR_LIGHT_GREEN};
  }
`;

CloseButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export default CloseButton;
