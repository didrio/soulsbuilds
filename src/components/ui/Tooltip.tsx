import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import styled from 'styled-components';
import {
  COLOR_FRAME,
  COLOR_INSET,
  COLOR_TEXT,
  SHADOW_OVERLAY,
  SPACE_SM,
  SPACE_XS,
  TEXT_SM,
} from '@/theme';

interface TooltipProps {
  open: boolean;
  children: ReactNode;
}

/** Space kept between the bubble and the window's edges. */
const EDGE = 8;

/**
 * A small bubble above its anchor (put it inside a `position: relative` element with the anchor),
 * pointing at it; below the anchor when there's no room above, and nudged sideways to stay on screen.
 * Visual only (`aria-hidden`): give the anchor the same text as its accessible name. The anchor owns
 * when it shows (hover, keyboard focus, tap) and closes it on Escape.
 */
function Tooltip({ open, children }: TooltipProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [place, setPlace] = useState({ below: false, shift: 0 });

  useLayoutEffect(() => {
    const bubble = ref.current;
    if (!open || !bubble) return;
    const anchor = bubble.parentElement?.getBoundingClientRect();
    const { width, height } = bubble.getBoundingClientRect();
    if (!anchor || width === 0) return;
    const center = anchor.left + anchor.width / 2;
    const left = center - width / 2;
    const right = center + width / 2;
    const maxRight = document.documentElement.clientWidth - EDGE;
    const shift = left < EDGE ? EDGE - left : right > maxRight ? maxRight - right : 0;
    setPlace({ below: anchor.top - height - EDGE < 0, shift });
  }, [open]);

  if (!open) return null;
  return (
    <Bubble
      ref={ref}
      aria-hidden="true"
      $below={place.below}
      style={{ '--shift': `${place.shift}px` } as CSSProperties}>
      {children}
    </Bubble>
  );
}

const Bubble = styled.span<{ $below: boolean }>`
  background: ${COLOR_INSET};
  border: 1px solid ${COLOR_FRAME};
  box-shadow: ${SHADOW_OVERLAY};
  color: ${COLOR_TEXT};
  font-size: ${TEXT_SM};
  font-weight: 600;
  left: 50%;
  line-height: 1.35;
  max-width: 240px;
  padding: ${SPACE_XS} ${SPACE_SM};
  pointer-events: none;
  position: absolute;
  text-align: left;
  transform: translateX(calc(-50% + var(--shift, 0px)));
  width: max-content;
  z-index: 20;
  ${({ $below }) => ($below ? 'top: calc(100% + 8px);' : 'bottom: calc(100% + 8px);')}

  /* The pointer, kept on the anchor when the bubble is nudged sideways. */
  &::after {
    border: 5px solid transparent;
    content: '';
    left: calc(50% - var(--shift, 0px));
    margin-left: -5px;
    position: absolute;
    ${({ $below }) =>
      $below
        ? `bottom: 100%; border-bottom-color: ${COLOR_FRAME};`
        : `top: 100%; border-top-color: ${COLOR_FRAME};`}
  }
`;

export default Tooltip;
