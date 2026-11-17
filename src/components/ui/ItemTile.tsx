import styled, { css, keyframes } from 'styled-components';
import {
  COLOR_BLACK,
  COLOR_CELEBRATE,
  COLOR_INSET,
  COLOR_TILE_BORDER,
  COLOR_TILE_BOTTOM,
  COLOR_TILE_EMPTY_BORDER,
  COLOR_TILE_SHINE,
  COLOR_TILE_TOP,
  COLOR_TEXT_MUTED,
  TEXT_LG,
} from '@/theme';

interface ItemTileProps {
  /** Icon URL (`iconUrl(item.icon)` from @/data/core), or null for an empty slot. */
  src: string | null;
  /** Tooltip (the item name). The tile itself is decorative: show or announce the name elsewhere. */
  title?: string;
  /** Edge length in px (default 56). */
  size?: number;
  /** Shown in an empty slot instead of the small diamond (e.g. "+" on a button that fills it). */
  emptyMark?: string;
  /**
   * An empty slot that only holds the place (read-only fixed layouts, T27): fainter than an empty
   * tile, with no diamond.
   */
  placeholder?: boolean;
  /** Tracking a build (T34): `missing` is greyed out with a dashed border, until it's collected. */
  track?: 'missing';
  /** A short glow, as an item is collected (off with reduced motion, GlobalStyle). */
  celebrate?: boolean;
  className?: string;
}

/**
 * An inventory-style item slot: dark, lit from above, with the item icon as the hero. Empty slots are
 * a faint frame with a small diamond, so filled slots stand out; `placeholder` ones are fainter still.
 */
function ItemTile({
  src,
  title,
  size = 56,
  emptyMark,
  placeholder = false,
  track,
  celebrate = false,
  className,
}: ItemTileProps) {
  return (
    <Tile
      className={className}
      title={title}
      $empty={!src}
      $mark={Boolean(emptyMark) || placeholder}
      $placeholder={!src && placeholder}
      $size={size}
      $track={src ? track : undefined}
      $celebrate={celebrate}>
      {src ? <img src={src} alt="" loading="lazy" decoding="async" /> : null}
      {!src && emptyMark ? <Mark aria-hidden="true">{emptyMark}</Mark> : null}
    </Tile>
  );
}

const pickup = keyframes`
  0% { transform: scale(0.9); box-shadow: 0 0 0 0 ${COLOR_CELEBRATE}; }
  35% { transform: scale(1.07); box-shadow: 0 0 30px 8px ${COLOR_CELEBRATE}; }
  100% { transform: scale(1); box-shadow: 0 0 0 0 transparent; }
`;

const tracked = {
  missing: css`
    background: ${COLOR_INSET};
    border-style: dashed;
    box-shadow: none;

    & > img {
      filter: grayscale(1) brightness(0.7);
      opacity: 0.6;
    }
  `,
};

const Tile = styled.span<{
  $empty: boolean;
  $mark: boolean;
  $placeholder: boolean;
  $size: number;
  $track?: 'missing';
  $celebrate: boolean;
}>`
  align-items: center;
  background: ${({ $empty, $placeholder }) =>
    $placeholder
      ? 'rgba(0, 0, 0, 0.12)'
      : $empty
        ? 'rgba(0, 0, 0, 0.25)'
        : `radial-gradient(circle at 50% 38%, ${COLOR_TILE_SHINE}, transparent 65%), linear-gradient(${COLOR_TILE_TOP}, ${COLOR_TILE_BOTTOM})`};
  border: 1px solid ${({ $empty }) => ($empty ? COLOR_TILE_EMPTY_BORDER : COLOR_TILE_BORDER)};
  box-shadow: ${({ $empty }) =>
    $empty ? 'none' : `inset 0 0 0 1px ${COLOR_BLACK}, inset 0 -10px 18px rgba(0, 0, 0, 0.5)`};
  display: inline-flex;
  flex: none;
  height: ${({ $size }) => $size}px;
  justify-content: center;
  opacity: ${({ $placeholder }) => ($placeholder ? 0.55 : 1)};
  position: relative;
  transition: border-color 120ms;
  width: ${({ $size }) => $size}px;

  & > img {
    filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.7));
    height: 92%;
    object-fit: contain;
    width: 92%;
    transition:
      filter 300ms,
      opacity 300ms;
  }

  ${({ $track }) => ($track ? tracked[$track] : '')}
  ${({ $celebrate }) =>
    $celebrate
      ? css`
          animation: ${pickup} 1s ease-out;
        `
      : ''}

  &::after {
    border: 1px solid ${COLOR_TILE_EMPTY_BORDER};
    content: '';
    display: ${({ $empty, $mark }) => ($empty && !$mark ? 'block' : 'none')};
    height: 6px;
    transform: rotate(45deg);
    width: 6px;
  }
`;

const Mark = styled.span`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_LG};
  line-height: 1;
`;

export default ItemTile;
