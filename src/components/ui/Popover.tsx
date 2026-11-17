import { useId, useState, type ReactNode } from 'react';
import styled from 'styled-components';
import {
  COLOR_ACCENT,
  COLOR_LINE,
  COLOR_LINE_STRONG,
  COLOR_SURFACE,
  COLOR_SURFACE_RAISED,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  RADIUS_FRAME,
  RADIUS_PANEL,
  SHADOW_OVERLAY,
  SPACE_XS,
  TEXT_SM,
} from '@/theme';
import { opticalCenter } from './typography';
import FocusScope from './FocusScope';
import { ChevronDownIcon } from './icons';
import OutsideClickHandler from './OutsideClickHandler';

interface PopoverProps {
  /** The button's muted name ("Level"); also the panel's accessible name. */
  label: string;
  /** What's chosen, after the name ("125–150", "Any"). */
  value: string;
  /** Something other than the default is chosen (the button looks set). */
  active?: boolean;
  /** The panel's content; `close` closes it (after a pick). */
  children: (close: () => void) => ReactNode;
  /** Panel width in px. */
  width?: number;
}

/**
 * A filter button with a panel under it (T74: the builds page's Sort, Level, Tags, Weapon): the
 * button says "<label> <value>"; the panel takes focus, Escape or a click outside closes it, and focus
 * goes back to the button. Not modal: Tab can leave it.
 */
function Popover({ label, value, active = false, children, width = 280 }: PopoverProps) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <OutsideClickHandler onOutsideClick={() => (open ? close() : undefined)}>
      <Anchor>
        <Trigger
          type="button"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          $active={active}
          $open={open}
          onClick={() => setOpen(!open)}>
          <Name>{label}</Name> {value}
          <ChevronDownIcon size={14} />
        </Trigger>
        {open ? (
          <Panel id={panelId} role="group" aria-label={label} onEscape={close} $width={width}>
            {children(close)}
          </Panel>
        ) : null}
      </Anchor>
    </OutsideClickHandler>
  );
}

const Anchor = styled.div`
  position: relative;
`;

const Trigger = styled.button<{ $active: boolean; $open: boolean }>`
  align-items: center;
  background: ${({ $active }) => ($active ? COLOR_SURFACE_RAISED : COLOR_SURFACE)};
  border: 1px solid
    ${({ $active, $open }) => ($open ? COLOR_ACCENT : $active ? COLOR_LINE_STRONG : COLOR_LINE)};
  border-radius: ${RADIUS_FRAME};
  color: ${COLOR_TEXT};
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  font-size: ${TEXT_SM};
  font-weight: 500;
  gap: 6px;
  min-height: 44px;
  padding: 0 12px;
  ${opticalCenter}
  white-space: nowrap;

  &:hover {
    border-color: ${({ $open }) => ($open ? COLOR_ACCENT : COLOR_LINE_STRONG)};
  }

  & > svg {
    color: ${COLOR_TEXT_MUTED};
  }
`;

const Name = styled.span`
  color: ${COLOR_TEXT_MUTED};
`;

const Panel = styled(FocusScope)<{ $width: number }>`
  background: ${COLOR_SURFACE_RAISED};
  border: 1px solid ${COLOR_LINE_STRONG};
  border-radius: ${RADIUS_PANEL};
  box-shadow: ${SHADOW_OVERLAY};
  left: 0;
  max-width: calc(100vw - 32px);
  padding: ${SPACE_XS};
  position: absolute;
  top: calc(100% + ${SPACE_XS});
  width: ${({ $width }) => `${$width}px`};
  z-index: 10;
`;

export default Popover;
