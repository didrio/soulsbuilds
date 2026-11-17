import { useEffect, useId, useRef, useState, type RefObject } from 'react';
import styled from 'styled-components';
import Frame from '@/components/ui/Frame';
import ItemTile from '@/components/ui/ItemTile';
import Label from '@/components/ui/Label';
import SectionHeading from '@/components/ui/SectionHeading';
import Tooltip from '@/components/ui/Tooltip';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { iconUrl } from '@/data/core';
import {
  BELOW_TABLET,
  COLOR_DANGER,
  COLOR_GLOW,
  COLOR_LINE,
  COLOR_SURFACE,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  SPACE_GROUP,
  SPACE_MD,
  TEXT_SM,
  TEXT_XS,
} from '@/theme';
import { gearGroups, slotWeaponDetails, type GearGroup, type SlotEntry } from '../gear';
import { itemSubline, type ItemWarning } from '../itemDetails';
import { changeLabel, itemLabel, openPickerFor, SLOT_LABELS } from '../ItemRow';
import { selectGearState } from '../store/derived';
import { TAB_BAR_HEIGHT } from './BuildTabs';
import StatsCard from './StatsCard';

/** Where the sidebar sticks: under the tab bar, with a little air. */
const STICKY_TOP = TAB_BAR_HEIGHT + 16;
/** Room kept under it: the window's edge, or the sticky Save bar while editing. */
const ROOM_BELOW = { viewing: 16, editing: 88 };

/**
 * Whether the element fits in the window below `top` with `below` to spare, so it can stick without
 * its bottom ever being out of reach. Measured again when it or the window changes size.
 */
function useFitsWindow(ref: RefObject<HTMLElement | null>, top: number, below: number) {
  const [fits, setFits] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setFits(element.offsetHeight + top + below <= window.innerHeight);
    measure();
    window.addEventListener('resize', measure);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(element);
    return () => {
      window.removeEventListener('resize', measure);
      observer?.disconnect();
    };
  }, [ref, top, below]);
  return fits;
}

/**
 * One slot as a tile: no name on the page (owner, T48). Read-only, it names itself on mouse hover,
 * keyboard focus or tap (the tooltip: the name, a weapon's affinity and skill or a spell's slots, and
 * a warning when the stats don't meet its requirements, also a small mark on the tile). Editable,
 * it's the button that opens the picker ("Choose helm" when empty), named on hover or focus.
 */
function GearTile({ entry, editable }: { entry: SlotEntry; editable: boolean }) {
  const dispatch = useAppDispatch();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [tapped, setTapped] = useState(false);
  const { item, type, warning = null } = entry;
  const weapon = slotWeaponDetails(entry);
  const subline = item ? itemSubline(item, weapon) : '';
  const close = () => {
    setHovered(false);
    setFocused(false);
    setTapped(false);
  };

  return (
    <TileButton
      type="button"
      aria-label={editable ? changeLabel(entry, weapon) : itemLabel(entry, weapon)}
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
      <ItemTile src={item ? iconUrl(item.icon) : null} size={44} />
      {item && warning ? <WarningMark $severity={warning.severity} aria-hidden="true" /> : null}
      <Tooltip open={hovered || focused || tapped}>
        {item ? (
          <>
            <TipLine>{item.name}</TipLine>
            {subline ? <TipSub>{subline}</TipSub> : null}
            {warning ? <TipWarning $severity={warning.severity}>{warning.text}</TipWarning> : null}
          </>
        ) : (
          `Choose ${SLOT_LABELS[type]}`
        )}
      </Tooltip>
    </TileButton>
  );
}

/** A labelled row of tiles; the spells say how many memory slots they take. */
function GearRow({ group, editable }: { group: GearGroup; editable: boolean }) {
  const id = useId();
  const { memory } = group;
  return (
    <Group>
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
        <Tiles aria-labelledby={id}>
          {group.entries.map((entry) => (
            <li key={entry.id}>
              <GearTile entry={entry} editable={editable} />
            </li>
          ))}
        </Tiles>
      ) : null}
    </Group>
  );
}

/**
 * The build in a sidebar (T48, the owner's design): the stats (`StatsCard`: rune level, starting
 * class, attributes with bars and talisman bonuses, HP / FP / stamina, equip load, poise), then the
 * gear as icon tiles by group (`gear.ts`). The same on every tab, signed in or out, tracking or not.
 * Desktop: a 340 px column that sticks under the tab bar when it fits the window. Below 900 px it
 * sits above the tab (until T49's sections). Editing: the stats take inputs and every slot is a tile
 * that opens the picker, so the build is edited right here.
 */
function BuildSidebar({ editable, level }: { editable: boolean; level: number }) {
  const ref = useRef<HTMLElement>(null);
  const fits = useFitsWindow(ref, STICKY_TOP, editable ? ROOM_BELOW.editing : ROOM_BELOW.viewing);
  const groups = gearGroups(useAppSelector(selectGearState), editable);

  return (
    <Aside ref={ref} as="aside" aria-label="Stats and gear" $sticky={fits}>
      <StatsCard editable={editable} level={level} />
      <Gear aria-labelledby="gear-title">
        <SectionHeading id="gear-title">Gear</SectionHeading>
        {groups.length ? (
          <Groups>
            {groups.map((group) => (
              <GearRow key={group.key} group={group} editable={editable} />
            ))}
          </Groups>
        ) : (
          <Empty>No items yet.</Empty>
        )}
      </Gear>
    </Aside>
  );
}

const Aside = styled(Frame)<{ $sticky: boolean }>`
  align-self: start;
  min-width: 0;
  position: ${({ $sticky }) => ($sticky ? 'sticky' : 'static')};
  top: ${STICKY_TOP}px;

  @media ${BELOW_TABLET} {
    position: static;
  }
`;

const Gear = styled.section`
  border-top: 1px solid ${COLOR_LINE};
  margin-top: ${SPACE_MD};
  padding-top: ${SPACE_MD};

  h2 {
    margin-bottom: ${SPACE_GROUP};
  }
`;

const Groups = styled.div`
  display: grid;
  gap: ${SPACE_GROUP};
`;

const Group = styled.section`
  display: grid;
  gap: 6px;
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

const Tiles = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  list-style: none;
  margin: 0;
  padding: 0;
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

const Empty = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  margin: 0;
`;

export default BuildSidebar;
