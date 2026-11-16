import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import styled from 'styled-components';
import ItemTile from '@/components/ui/ItemTile';
import Tooltip from '@/components/ui/Tooltip';
import { useAppDispatch } from '@/app/hooks';
import { iconUrl } from '@/data/core';
import { COLOR_ACCENT, COLOR_GLOW } from '@/theme';
import { changeLabel, openPickerFor, type SlotEntry } from './ItemRow';

export const SLOT_TILE_SIZE = 52;

/**
 * One slot as an icon tile (T22: armor, talismans, great rune, spirit ash, tears, arrows,
 * consumables): a button named after the item, its name in a bubble on hover, keyboard focus or tap
 * (Escape or a tap elsewhere closes it). Editable: the button opens the picker, named like a row
 * ("Change Erdtree's Favor", "Choose talisman"), and an empty slot shows "+".
 */
function ItemSlot({ entry, editable }: { entry: SlotEntry; editable: boolean }) {
  const dispatch = useAppDispatch();
  const ref = useRef<HTMLSpanElement>(null);
  // Focus from a click or tap shouldn't hold the bubble open (that's the pin's job); keyboard focus does.
  const pointerDown = useRef(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const { item } = entry;
  const open = hovered || focused || pinned;

  // A tap or click anywhere else closes a pinned bubble.
  useEffect(() => {
    if (!pinned) return;
    const close = (event: globalThis.PointerEvent) => {
      if (event.target instanceof Node && !ref.current?.contains(event.target)) setPinned(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [pinned]);

  const close = () => {
    setHovered(false);
    setFocused(false);
    setPinned(false);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && open) {
      event.stopPropagation();
      close();
    }
  };
  // Mouse only: a tap also sends pointerenter, which would keep the bubble open after it's unpinned.
  const onPointerEnter = (event: PointerEvent) => setHovered(event.pointerType === 'mouse');

  const label = editable ? changeLabel(entry) : (item?.name ?? '');
  return (
    <Wrap ref={ref} onPointerEnter={onPointerEnter} onPointerLeave={() => setHovered(false)}>
      <TileButton
        type="button"
        aria-label={label}
        $open={open}
        onBlur={() => setFocused(false)}
        onPointerDown={() => (pointerDown.current = true)}
        onFocus={() => {
          setFocused(!pointerDown.current);
          pointerDown.current = false;
        }}
        onKeyDown={onKeyDown}
        onClick={() => {
          // After a touch, focus comes after pointerup, so the flag is cleared here (and on focus).
          pointerDown.current = false;
          if (editable) dispatch(openPickerFor(entry));
          else setPinned(!pinned);
        }}>
        <ItemTile src={item ? iconUrl(item.icon) : null} size={SLOT_TILE_SIZE} emptyMark="+" />
      </TileButton>
      <Tooltip open={open}>{item?.name ?? label}</Tooltip>
    </Wrap>
  );
}

const Wrap = styled.span`
  display: inline-flex;
  position: relative;
`;

const TileButton = styled.button<{ $open: boolean }>`
  background: none;
  border: none;
  cursor: pointer;
  display: inline-flex;
  padding: 0;
  position: relative;

  & > span:first-child {
    border-color: ${({ $open }) => ($open ? COLOR_ACCENT : '')};
    box-shadow: ${({ $open }) => ($open ? `0 0 12px ${COLOR_GLOW}` : '')};
  }

  &:hover > span:first-child {
    border-color: ${COLOR_ACCENT};
  }
`;

export default ItemSlot;
