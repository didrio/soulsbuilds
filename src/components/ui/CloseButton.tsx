import styled from 'styled-components';
import {
  COLOR_SURFACE_RAISED,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  DURATION_FAST,
  RADIUS_FRAME,
} from '@/theme';
import { CloseIcon } from './icons';

/** A 44 px "×" button; `label` is its accessible name (default "Close"). */
function CloseButton({ onClick, label = 'Close' }: { onClick: () => void; label?: string }) {
  return (
    <Container type="button" aria-label={label} onClick={onClick}>
      <CloseIcon size={20} />
    </Container>
  );
}

const Container = styled.button`
  align-items: center;
  background: none;
  border: none;
  border-radius: ${RADIUS_FRAME};
  color: ${COLOR_TEXT_MUTED};
  cursor: pointer;
  display: inline-flex;
  flex-shrink: 0;
  height: 44px;
  justify-content: center;
  transition:
    color ${DURATION_FAST},
    background ${DURATION_FAST};
  width: 44px;

  &:hover {
    background: ${COLOR_SURFACE_RAISED};
    color: ${COLOR_TEXT};
  }
`;

export default CloseButton;
