// The route's legend tiles (T28, T35): a lit one (the build's items, or collected ones while tracking)
// and a dashed one like a dimmed item (`ItemTile track="missing"`); the dashed one also stands in for
// an item without an icon.
import styled from 'styled-components';
import {
  COLOR_LINE_STRONG,
  COLOR_TEXT_MUTED,
  COLOR_TILE_BORDER,
  COLOR_TILE_BOTTOM,
  COLOR_TILE_TOP,
} from '@/theme';

export const SolidTile = styled.span<{ $size: number }>`
  background: linear-gradient(${COLOR_TILE_TOP}, ${COLOR_TILE_BOTTOM});
  border: 1px solid ${COLOR_TILE_BORDER};
  display: inline-block;
  flex: none;
  height: ${({ $size }) => $size}px;
  width: ${({ $size }) => $size}px;
`;

export const DashedTile = styled.span<{ $size: number }>`
  align-items: center;
  border: 1px dashed ${COLOR_LINE_STRONG};
  border-radius: 3px;
  color: ${COLOR_TEXT_MUTED};
  display: inline-flex;
  flex: none;
  height: ${({ $size }) => $size}px;
  justify-content: center;
  width: ${({ $size }) => $size}px;

  /* A small diamond, like an empty slot, on the larger ones. */
  &::after {
    border: 1px solid currentColor;
    content: '';
    display: ${({ $size }) => ($size >= 28 ? 'block' : 'none')};
    height: 7px;
    transform: rotate(45deg);
    width: 7px;
  }
`;
