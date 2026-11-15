import styled from 'styled-components';
import { COLOR_GOLD, COLOR_GREEN, COLOR_LIGHT_GREEN } from '@/theme';

/** A square "×" button; `label` is its accessible name (default "Close"). */
function CloseButton({ onClick, label = 'Close' }: { onClick: () => void; label?: string }) {
  return (
    <Container type="button" aria-label={label} onClick={onClick}>
      ×
    </Container>
  );
}

const Container = styled.button`
  align-items: center;
  background-color: ${COLOR_GREEN};
  border: none;
  border-radius: 2px;
  box-shadow: 0px 0px 3px ${COLOR_GREEN};
  color: ${COLOR_GOLD};
  cursor: pointer;
  display: flex;
  flex-shrink: 0;
  font-size: 26px;
  height: 35px;
  justify-content: center;
  width: 35px;

  &:hover {
    background-color: ${COLOR_LIGHT_GREEN};
  }

  &:focus-visible {
    outline: 2px solid ${COLOR_GOLD};
  }
`;

export default CloseButton;
