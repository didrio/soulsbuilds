import { useId, type ReactNode } from 'react';
import styled, { css } from 'styled-components';
import {
  BELOW_MOBILE,
  COLOR_BACKDROP,
  COLOR_HIGHLIGHT,
  COLOR_ACCENT,
  FONT_DISPLAY,
  SHADOW_OVERLAY,
  SPACE_GUTTER,
  SPACE_LG,
  SPACE_MD,
  TEXT_XL,
} from '@/theme';
import CloseButton from './CloseButton';
import FocusScope from './FocusScope';
import { framed } from './inWorld';

interface DialogProps {
  /** The visible title, also the dialog's accessible name. */
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Max width in px (default 440). */
  width?: number;
  /**
   * `tall`: a fixed height (most of the screen) with the content as a flex column, so a long list
   * inside can scroll under a fixed toolbar (the item picker). Default: as tall as the content.
   */
  tall?: boolean;
}

/**
 * A modal dialog: backdrop (click to close), a framed panel with a title and a close button, focus
 * trapped inside (starting on the first control in `children`), Escape closes, and focus goes back to the opener on close (FocusScope). Render it
 * only while open.
 */
function Dialog({ title, onClose, children, width = 440, tall = false }: DialogProps) {
  const titleId = useId();
  return (
    <Backdrop
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}>
      <Panel
        trap
        onEscape={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        $tall={tall}
        $width={width}>
        <Title id={titleId}>{title}</Title>
        {children}
        {/* Last in the tab order, so focus starts on the dialog's first field; shown top right. */}
        <Close>
          <CloseButton onClick={onClose} />
        </Close>
      </Panel>
    </Backdrop>
  );
}

const Backdrop = styled.div`
  align-items: flex-start;
  background: ${COLOR_BACKDROP};
  display: flex;
  inset: 0;
  justify-content: center;
  overflow-y: auto;
  padding: 10vh ${SPACE_GUTTER} ${SPACE_GUTTER};
  position: fixed;
  z-index: 100;

  @media ${BELOW_MOBILE} {
    padding-top: ${SPACE_GUTTER};
  }
`;

const Panel = styled(FocusScope)<{ $tall: boolean; $width: number }>`
  ${framed}
  box-shadow: ${SHADOW_OVERLAY};
  max-width: ${({ $width }) => $width}px;
  outline: none;
  padding: ${SPACE_LG};
  width: 100%;

  ${({ $tall }) =>
    $tall &&
    css`
      display: flex;
      flex-direction: column;
      height: min(84vh, 800px);
      margin-top: -4vh;

      @media ${BELOW_MOBILE} {
        height: calc(100dvh - 2 * ${SPACE_GUTTER});
        margin-top: 0;
        padding: ${SPACE_MD};
      }
    `}
`;

const Close = styled.div`
  position: absolute;
  right: 6px;
  top: 6px;
`;

const Title = styled.h2`
  flex: none;
  background: linear-gradient(${COLOR_HIGHLIGHT} 30%, ${COLOR_ACCENT});
  background-clip: text;
  color: transparent;
  font-family: ${FONT_DISPLAY};
  font-size: ${TEXT_XL};
  font-weight: 700;
  letter-spacing: 0.03em;
  margin: 0 40px 16px 0;
`;

export default Dialog;
