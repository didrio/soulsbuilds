// The route's two tile kinds besides real item icons (T28): a lit tile with no icon (the legend's "in
// this build") and a dashed one for items the build doesn't use (key items, prayerbooks…).
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
