import styled from 'styled-components';
import FlexGroup from './FlexGroup';
import { COLOR_GREEN, COLOR_LIGHT_GREEN } from '@/theme';

function CloseButton({ onClick }: { onClick: () => void }) {
  const handleClose = () => {
    onClick();
  };

  return <Container onClick={handleClose}>X</Container>;
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

export default CloseButton;
