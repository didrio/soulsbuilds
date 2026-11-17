// A build's slots as icon tiles (T48; shared since T63 by the Equipment panel and the sidebar): the tile
// with its item card, and a labelled row of them.
import { useId, useState } from 'react';
import styled from 'styled-components';
import ItemTile from '@/components/ui/ItemTile';
import Label from '@/components/ui/Label';
import Tooltip from '@/components/ui/Tooltip';
import VisuallyHidden from '@/components/ui/VisuallyHidden';
import { useAppDispatch } from '@/app/hooks';
import { iconUrl } from '@/data/core';
import {
  COLOR_DANGER,
  COLOR_GLOW,
  COLOR_SURFACE,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  SPACE_GROUP,
  TEXT_XS,
} from '@/theme';
import { slotWeaponDetails, type GearGroup, type SlotEntry } from '../gear';
import { itemSubline, type ItemWarning } from '../itemDetails';
import ItemCard, { ITEM_CARD_WIDTH } from '../ItemCard';
import { factsText, itemFacts } from '../itemFacts';
import { changeLabel, itemLabel, openPickerFor, SLOT_LABELS } from '../ItemRow';

/**
 * One slot as a tile: no name on the page (owner, T48). Read-only, it shows the item card (T45) on
 * mouse hover, keyboard focus or tap: the name, what it is, its facts (scaling, requirements, weight,
 * poise, FP, effect…) and a warning when the stats fall short (also a small mark on the tile); the
 * facts are its description for screen readers. Editable, it's the button that opens the picker
 * ("Choose helm" when empty), with only a short tooltip (name, affinity and skill, warning), so a big
 * card never covers the tiles being edited.
 */
export function GearTile({
  entry,
  editable,
  size = 44,
}: {
  entry: SlotEntry;
  editable: boolean;
  size?: number;
}) {
  const dispatch = useAppDispatch();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [tapped, setTapped] = useState(false);
  const { item, type, warning = null } = entry;
  const descriptionId = useId();
  const weapon = slotWeaponDetails(entry);
  const subline = item ? itemSubline(item, weapon) : '';
  const facts = editable ? null : itemFacts(entry);
  const open = hovered || focused || tapped;
  const close = () => {
    setHovered(false);
    setFocused(false);
    setTapped(false);
  };

  return (
    <>
      <TileButton
        type="button"
        aria-label={editable ? changeLabel(entry, weapon) : itemLabel(entry, weapon)}
        aria-describedby={facts ? descriptionId : undefined}
        $editable={editable}
        onBlur={() => {
          setFocused(false);
          setTapped(false);
        }}
        onClick={
          editable
            ? () => {
                close();
                dispatch(openPickerFor(entry));
              }
            : () => setTapped(!tapped)
        }
        onFocus={(event) => setFocused(event.currentTarget.matches(':focus-visible'))}
        onKeyDown={(event) => {
          if (event.key === 'Escape') close();
        }}
        onPointerEnter={(event) => setHovered(event.pointerType === 'mouse')}
        onPointerLeave={() => setHovered(false)}>
        <ItemTile src={item ? iconUrl(item.icon) : null} size={size} />
        {item && warning ? <WarningMark $severity={warning.severity} aria-hidden="true" /> : null}
        {item && facts ? (
          <Tooltip open={open} width={ITEM_CARD_WIDTH}>
            <ItemCard name={item.name} facts={facts} warning={warning} />
          </Tooltip>
        ) : (
          <Tooltip open={open}>
            {item ? (
              <>
                <TipLine>{item.name}</TipLine>
                {subline ? <TipSub>{subline}</TipSub> : null}
                {warning ? (
                  <TipWarning $severity={warning.severity}>{warning.text}</TipWarning>
                ) : null}
              </>
            ) : (
              `Choose ${SLOT_LABELS[type]}`
            )}
          </Tooltip>
        )}
      </TileButton>
      {facts ? <VisuallyHidden id={descriptionId}>{factsText(facts)}</VisuallyHidden> : null}
    </>
  );
}

/**
 * A labelled row of tiles; the spells say how many memory slots they take. Read-only, an empty slot
 * (the Equipment panel's fixed slots: hands, armor, talismans, flask) is a faint placeholder that
 * holds its place, hidden from screen readers.
 */
export function GearRow({
  group,
  editable,
  size,
  className,
}: {
  group: GearGroup;
  editable: boolean;
  size?: number;
  className?: string;
}) {
  const id = useId();
  const { memory } = group;
  return (
    <Group className={className}>
      <GroupHead>
        <Label as="h3" id={id}>
          {group.title}
        </Label>
        {memory ? (
          <SlotCount $over={memory.used > memory.available}>
            <strong>{memory.used}</strong>
            {` of ${memory.available} memory slots`}
          </SlotCount>
        ) : null}
      </GroupHead>
      {group.entries.length ? (
        <Tiles aria-labelledby={id} $gap={size && size > 44 ? 8 : 6}>
          {group.entries.map((entry) =>
            entry.item || editable ? (
              <li key={entry.id}>
                <GearTile entry={entry} editable={editable} size={size} />
              </li>
            ) : (
              <li key={entry.id} aria-hidden="true">
                <ItemTile src={null} size={size} placeholder />
              </li>
            ),
          )}
        </Tiles>
      ) : null}
    </Group>
  );
}

const Group = styled.section`
  display: grid;
  gap: 6px;
  min-width: 0;
`;

const GroupHead = styled.div`
  align-items: baseline;
  display: flex;
  gap: ${SPACE_GROUP};
  justify-content: space-between;

  h3 {
    margin: 0;
  }
`;

const SlotCount = styled.p<{ $over: boolean }>`
  color: ${({ $over }) => ($over ? COLOR_DANGER : COLOR_TEXT_MUTED)};
  font-size: ${TEXT_XS};
  font-variant-numeric: tabular-nums;
  margin: 0;

  strong {
    color: ${({ $over }) => ($over ? COLOR_DANGER : COLOR_TEXT)};
    font-weight: 600;
  }
`;

const Tiles = styled.ul<{ $gap: number }>`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ $gap }) => $gap}px;
  list-style: none;
  margin: 0;
  padding: 0;

  & > li {
    display: flex;
  }
`;

// The tile is the whole button; the tooltip and the warning mark are positioned against it.
const TileButton = styled.button<{ $editable: boolean }>`
  background: none;
  border: 0;
  color: inherit;
  cursor: ${({ $editable }) => ($editable ? 'pointer' : 'default')};
  display: block;
  font: inherit;
  padding: 0;
  position: relative;

  & > span:first-child {
    display: flex;
  }

  &:hover > span:first-child,
  &:focus-visible > span:first-child {
    box-shadow: ${({ $editable }) => ($editable ? `0 0 12px ${COLOR_GLOW}` : 'none')};
  }
`;

// A dot on the tile's corner: the danger color when it can't be used as built, muted for a caveat.
const WarningMark = styled.span<{ $severity: ItemWarning['severity'] }>`
  background: ${({ $severity }) => ($severity === 'warning' ? COLOR_DANGER : COLOR_TEXT_MUTED)};
  border: 2px solid ${COLOR_SURFACE};
  border-radius: 50%;
  height: 12px;
  position: absolute;
  right: -4px;
  top: -4px;
  width: 12px;
`;

const TipLine = styled.span`
  display: block;
`;

const TipSub = styled.span`
  color: ${COLOR_TEXT_MUTED};
  display: block;
  font-weight: 400;
`;

const TipWarning = styled.span<{ $severity: ItemWarning['severity'] }>`
  color: ${({ $severity }) => ($severity === 'warning' ? COLOR_DANGER : COLOR_TEXT_MUTED)};
  display: block;
  font-size: ${TEXT_XS};
  font-style: ${({ $severity }) => ($severity === 'note' ? 'italic' : 'normal')};
`;
