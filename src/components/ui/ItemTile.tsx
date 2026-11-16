import styled from 'styled-components';
import {
  COLOR_BLACK,
  COLOR_TILE_BORDER,
  COLOR_TILE_BOTTOM,
  COLOR_TILE_EMPTY_BORDER,
  COLOR_TILE_SHINE,
  COLOR_TILE_TOP,
} from '@/theme';

interface ItemTileProps {
  /** Icon URL (`iconUrl(item.icon)` from @/data/core), or null for an empty slot. */
  src: string | null;
  /** Tooltip (the item name). The tile itself is decorative: show or announce the name elsewhere. */
  title?: string;
  /** Edge length in px (default 56). */
  size?: number;
  className?: string;
}

/**
 * An inventory-style item slot: dark, lit from above, with the item icon as the hero. Empty slots are
 * a faint frame with a small diamond, so filled slots stand out.
 */
function ItemTile({ src, title, size = 56, className }: ItemTileProps) {
  return (
    <Tile className={className} title={title} $empty={!src} $size={size}>
      {src ? <img src={src} alt="" loading="lazy" decoding="async" /> : null}
    </Tile>
  );
}

const Tile = styled.span<{ $empty: boolean; $size: number }>`
  align-items: center;
  background: ${({ $empty }) =>
    $empty
      ? 'rgba(0, 0, 0, 0.25)'
      : `radial-gradient(circle at 50% 38%, ${COLOR_TILE_SHINE}, transparent 65%), linear-gradient(${COLOR_TILE_TOP}, ${COLOR_TILE_BOTTOM})`};
  border: 1px solid ${({ $empty }) => ($empty ? COLOR_TILE_EMPTY_BORDER : COLOR_TILE_BORDER)};
  box-shadow: ${({ $empty }) =>
    $empty ? 'none' : `inset 0 0 0 1px ${COLOR_BLACK}, inset 0 -10px 18px rgba(0, 0, 0, 0.5)`};
  display: inline-flex;
  flex: none;
  height: ${({ $size }) => $size}px;
  justify-content: center;
  transition: border-color 120ms;
  width: ${({ $size }) => $size}px;

  & > img {
    filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.7));
    height: 92%;
    object-fit: contain;
    width: 92%;
  }

  &::after {
    border: 1px solid ${COLOR_TILE_EMPTY_BORDER};
    content: '';
    display: ${({ $empty }) => ($empty ? 'block' : 'none')};
    height: 6px;
    transform: rotate(45deg);
    width: 6px;
  }
`;

export default ItemTile;
