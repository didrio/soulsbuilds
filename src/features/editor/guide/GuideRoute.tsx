import { useRef, useState, type ReactNode } from 'react';
import styled, { css } from 'styled-components';
import Button from '@/components/ui/Button';
import ItemTile from '@/components/ui/ItemTile';
import Label from '@/components/ui/Label';
import Tooltip from '@/components/ui/Tooltip';
import VisuallyHidden from '@/components/ui/VisuallyHidden';
import { useAppSelector } from '@/app/hooks';
import { CheckIcon } from '@/components/ui/icons';
import { acquisition } from '@/data/acquisition';
import { iconUrl } from '@/data/core';
import type { AcquisitionFile } from '@/data/core';
import type { Equipment } from '@/lib/models';
import { trackedItems } from '@/lib/tracking';
import {
  BELOW_MOBILE,
  COLOR_ACCENT,
  COLOR_ACCENT_LINE,
  COLOR_LINE,
  COLOR_INSET,
  COLOR_LINE_STRONG,
  COLOR_ON_ACCENT,
  COLOR_SURFACE_RAISED,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  COLOR_TINT,
  SPACE_MD,
  SPACE_SM,
  TEXT_MD,
  TEXT_SM,
  TEXT_XS,
} from '@/theme';
import { gearGroups, type GearState, type SlotEntry } from '../gear';
import ItemCard, { ITEM_CARD_WIDTH } from '../ItemCard';
import { itemFacts } from '../itemFacts';
import type { SlotType } from '../slots';
import { selectGearState } from '../store/derived';
import { DashedTile } from './GuideTiles';
import {
  actionLead,
  actionNote,
  itemInfo,
  itemNotes,
  itemReason,
  legTitle,
  stopTitle,
} from './phrases';
import {
  isCollected,
  isTrackable,
  itemTrackKeys,
  refKey,
  routeMarkKeys,
  routeStops,
  stopMarkKeys,
  stopProgress,
  type RouteStop,
  type RouteTracking,
} from './progress';
import { equipmentItems, planRoute, type ItemRef, type RouteAction } from './route';

/** The route with its stops, and the player's progress along it when they track the build. */
export function routeProgress(
  equipment: Equipment,
  tracking: Pick<RouteTracking, 'collected' | 'marked'> | undefined,
) {
  const route = planRoute(equipment, acquisition);
  const own = new Set(equipmentItems(equipment).map(refKey));
  const stops = routeStops(route);
  const progress = tracking ? stopProgress(stops, tracking.collected, own, tracking.marked) : null;
  const items = trackedItems(equipment);
  return {
    stops,
    own,
    progress,
    have: new Set(tracking?.collected ?? []),
    /** Marks stop `index` done, or undoes it (T44). */
    markArgs: (index: number) =>
      [stopMarkKeys(stops[index]!, own), routeMarkKeys(stops, own)] as const,
    /** An item's tracking keys, to check it off (T46). */
    keysOf: (ref: ItemRef) => itemTrackKeys(ref, items),
  };
}

/** The data file each slot's items come from, as the route names them (`ItemRef.file`). */
const SLOT_FILES: Record<SlotType, AcquisitionFile> = {
  SLOT_TYPE_WEAPON: 'weapons',
  SLOT_TYPE_ARROW: 'arrows',
  SLOT_TYPE_HELM: 'armor',
  SLOT_TYPE_CHEST: 'armor',
  SLOT_TYPE_GAUNTLET: 'armor',
  SLOT_TYPE_LEG: 'armor',
  SLOT_TYPE_TAL: 'talismans',
  SLOT_TYPE_SPELL: 'spells',
  SLOT_TYPE_TEAR: 'tears',
  SLOT_TYPE_GREAT_RUNE: 'greatRunes',
  SLOT_TYPE_SPIRIT_ASH: 'spiritAshes',
  SLOT_TYPE_CON: 'consumables',
};

/**
 * The build's gear by route item (`refKey`), for the item cards on the route's tiles (T45): the same
 * entries as the sidebar's, so affinity, skill and requirements match. A weapon held twice keeps its
 * first slot.
 */
export function gearByRef(state: GearState): Map<string, SlotEntry> {
  const entries = new Map<string, SlotEntry>();
  for (const entry of gearGroups(state, false).flatMap((group) => group.entries)) {
    if (!entry.item) continue;
    const key = refKey({ file: SLOT_FILES[entry.type], id: entry.item.id });
    if (!entries.has(key)) entries.set(key, entry);
  }
  return entries;
}

type StopState = 'todo' | 'done' | 'next';

/**
 * The route of "How to get this build" (T15, T28, T35): numbered stops from a fresh save to every item
 * of the build. Each stop has its area, its place, what to do there and the items, with why the ones
 * that aren't the build's are needed. Tracking the build, the route is the checklist (T46): a checkbox
 * on each of the build's items, "N of M stops done", finished stops folded away, the next stop
 * highlighted, and "Mark done" on stops without the build's gear (T44). Lazy-loaded with the ~400 KB
 * acquisition data (`GuideSection`).
 */
function GuideRoute({ equipment, tracking }: { equipment: Equipment; tracking?: RouteTracking }) {
  const { stops, own, progress, have, markArgs, keysOf } = routeProgress(equipment, tracking);
  // The Guide shows the build in the editor store (it's only on a build being viewed).
  const gear = gearByRef(useAppSelector(selectGearState));
  const [showDone, setShowDone] = useState(false);
  // The item just checked off glows once.
  const [justCollected, setJustCollected] = useState<string | null>(null);
  const progressLine = useRef<HTMLParagraphElement>(null);
  if (stops.length === 0) return <Hint>None of these items has a known source yet.</Hint>;

  const doneCount = progress?.doneCount ?? 0;
  const stateOf = (index: number): StopState =>
    !progress ? 'todo' : progress.done[index] ? 'done' : index === progress.next ? 'next' : 'todo';
  const shown = stops
    .map((stop, index) => ({ stop, index, state: stateOf(index) }))
    .filter(({ state }) => !progress || showDone || state !== 'done');
  const mark = (index: number, done: boolean) => {
    tracking?.onMark(...markArgs(index));
    // Marked done, the stop folds away: focus goes to the count it joins.
    if (!done && !showDone) progressLine.current?.focus();
  };
  const toggle = (index: number, ref: ItemRef) => {
    if (!tracking) return;
    const keys = keysOf(ref);
    const on = !isCollected(ref, have);
    tracking.onToggle(keys);
    setJustCollected(on ? refKey(ref) : null);
    // The stop's last item checked off folds it away, like "Mark done".
    const collected = on
      ? [...tracking.collected, ...keys]
      : tracking.collected.filter((key) => !keys.includes(key));
    const after = stopProgress(stops, collected, own, tracking.marked);
    if (on && after.done[index] && !showDone) progressLine.current?.focus();
  };

  return (
    <>
      {progress ? (
        <Progress>
          <ProgressLine>
            <ProgressText ref={progressLine} tabIndex={-1}>
              <Count>{doneCount}</Count> of {stops.length} stops done.
            </ProgressText>
            {doneCount > 0 ? (
              <Button
                variant="secondary"
                aria-expanded={showDone}
                onClick={() => setShowDone(!showDone)}>
                {`${showDone ? 'Hide' : 'Show'} the ${doneCount} finished ${doneCount === 1 ? 'stop' : 'stops'}`}
              </Button>
            ) : null}
          </ProgressLine>
        </Progress>
      ) : null}
      {shown.length > 0 ? (
        <Stops>
          {shown.map(({ stop, index, state }) => (
            <Stop key={stop.number} $state={state}>
              <Marker $state={state} aria-hidden="true">
                {state === 'done' ? <CheckIcon size={14} strokeWidth={3} /> : stop.number}
              </Marker>
              <div>
                {state === 'next' ? <NextLabel as="p">Next stop</NextLabel> : null}
                <StopBody
                  stop={stop}
                  done={state === 'done'}
                  own={own}
                  gear={gear}
                  have={progress ? have : null}
                  check={
                    tracking
                      ? { onToggle: (ref) => toggle(index, ref), glow: justCollected }
                      : undefined
                  }
                />
                {progress?.markable[index] ? (
                  <MarkRow>
                    <MarkDone
                      done={state === 'done'}
                      onClick={() => mark(index, state === 'done')}
                    />
                  </MarkRow>
                ) : null}
              </div>
            </Stop>
          ))}
        </Stops>
      ) : (
        <Hint>Every stop is done.</Hint>
      )}
    </>
  );
}

/**
 * "Mark done" on a stop without the build's gear (T44): a toggle. Its name stays "Mark done"; pressed,
 * it shows "Done" with a check, and pressing it again undoes it.
 */
function MarkDone({ done, onClick }: { done: boolean; onClick: () => void }) {
  return (
    <MarkButton
      variant="secondary"
      aria-pressed={done}
      aria-label={done ? 'Mark done' : undefined}
      onClick={onClick}>
      {done ? (
        <>
          <CheckIcon size={14} strokeWidth={3} aria-hidden="true" /> Done
        </>
      ) : (
        'Mark done'
      )}
    </MarkButton>
  );
}

/** Checking the build's items off on the route (T46). */
interface ItemCheck {
  onToggle: (ref: ItemRef) => void;
  /** The item just checked off (`refKey`): its tile glows once. */
  glow: string | null;
}

/** A stop's area, place, actions and items (the route's rows). */
function StopBody({
  stop,
  done,
  own,
  gear,
  have,
  check,
}: {
  stop: RouteStop;
  done: boolean;
  own: Set<string>;
  gear: Map<string, SlotEntry>;
  have: Set<string> | null;
  check?: ItemCheck;
}) {
  const title = stopTitle(stop.leg, stop.step);
  return (
    <>
      <Label as="p">
        {legTitle(stop.leg)}
        {done ? <VisuallyHidden> (done)</VisuallyHidden> : null}
      </Label>
      {title ? <Place $done={done}>{title}</Place> : null}
      {stop.step.actions.map((action, index) => {
        const note = actionNote(action);
        return (
          <div key={index}>
            <Lead>
              {actionLead(action)}
              {note && note !== title ? ` (${note})` : null}
            </Lead>
            {action.reason ? <Reason>{action.reason}</Reason> : null}
            <RouteItems
              action={action}
              own={own}
              gear={gear}
              have={have}
              stopDone={done}
              size={36}
              check={check}
            />
          </div>
        );
      })}
    </>
  );
}

/**
 * An action's items: tile, name, price or trade, and why it's needed. The build's own items are lit,
 * others dimmed; while tracking, an item lights up once it's collected (or its stop is done), and the
 * build's items are checkboxes (T46): the whole row is the label, so it's a 44 px target.
 */
function RouteItems({
  action,
  own,
  gear,
  have,
  stopDone,
  size,
  check,
}: {
  action: RouteAction;
  own: Set<string>;
  /** The build's gear by `refKey`: its items get an item card on hover. */
  gear: Map<string, SlotEntry>;
  /** The collected item keys while tracking, else null. */
  have: Set<string> | null;
  stopDone: boolean;
  size: number;
  check?: ItemCheck;
}) {
  if (action.items.length === 0) return null;
  return (
    <Items>
      {action.items.map((item) => {
        const { name, icon } = itemInfo(item.ref);
        const notes = itemNotes(action, item);
        const reason = itemReason(item);
        const key = refKey(item.ref);
        const mine = own.has(key);
        const checkable = mine && isTrackable(item.ref);
        const lit = !have ? mine : checkable ? isCollected(item.ref, have) : stopDone;
        const content = (
          <>
            {icon !== null ? (
              <HoverCard entry={mine ? gear.get(key) : undefined}>
                <ItemTile
                  src={iconUrl(icon)}
                  size={size}
                  track={lit ? undefined : 'missing'}
                  celebrate={lit && check?.glow === key}
                />
              </HoverCard>
            ) : (
              <DashedTile $size={size} />
            )}
            <span>
              <ItemName $mine={mine}>{name}</ItemName>
              {notes.length > 0 ? <Note>{` · ${notes.join(', ')}`}</Note> : null}
              {reason ? <ItemReason>{reason}</ItemReason> : null}
            </span>
          </>
        );
        return (
          <Item key={key}>
            {check && have && checkable ? (
              <CheckRow>
                <Checkbox type="checkbox" checked={lit} onChange={() => check.onToggle(item.ref)} />
                {content}
              </CheckRow>
            ) : (
              content
            )}
          </Item>
        );
      })}
    </Items>
  );
}

/**
 * A route tile that shows the build item's card on mouse hover (T45). Hover only, and visual only:
 * the name is printed beside the tile, a tab stop per route item would cost more than it gives, and
 * the sidebar's tiles carry the same facts for keyboard and screen-reader users.
 */
function HoverCard({ entry, children }: { entry: SlotEntry | undefined; children: ReactNode }) {
  const [hovered, setHovered] = useState(false);
  const facts = entry ? itemFacts(entry) : null;
  if (!entry?.item || !facts) return children;
  return (
    <TileHover
      onPointerEnter={(event) => setHovered(event.pointerType === 'mouse')}
      onPointerLeave={() => setHovered(false)}>
      {children}
      <Tooltip open={hovered} width={ITEM_CARD_WIDTH}>
        <ItemCard name={entry.item.name} facts={facts} warning={entry.warning} />
      </Tooltip>
    </TileHover>
  );
}

const TileHover = styled.span`
  display: inline-flex;
  flex: none;
  position: relative;
`;

const MarkRow = styled.div`
  margin-top: ${SPACE_SM};
`;

const MarkButton = styled(Button)`
  &[aria-pressed='true'] {
    border-color: ${COLOR_ACCENT_LINE};
    color: ${COLOR_ACCENT};
  }
`;

const Hint = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  margin: 0;
`;

const Progress = styled.div`
  margin-bottom: ${SPACE_SM};
`;

const ProgressLine = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACE_SM} ${SPACE_MD};
  justify-content: space-between;
`;

const ProgressText = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_MD};
  margin: 0;

  &:focus {
    outline: none;
  }
`;

const Count = styled.span`
  color: ${COLOR_TEXT};
  font-variant-numeric: tabular-nums;
  font-weight: 600;
`;

const Stops = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const Stop = styled.li<{ $state: StopState }>`
  border-top: 1px solid ${COLOR_LINE};
  column-gap: ${SPACE_MD};
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  padding: 14px 0;

  ${({ $state }) =>
    $state === 'next'
      ? css`
          background: ${COLOR_TINT};
          border: 1px solid ${COLOR_ACCENT_LINE};
          border-radius: 4px;
          margin: 8px -16px;
          padding: 14px 16px;

          & + li {
            border-top: none;
          }
        `
      : ''}

  @media ${BELOW_MOBILE} {
    column-gap: ${SPACE_SM};
    grid-template-columns: 28px minmax(0, 1fr);

    ${({ $state }) =>
      $state === 'next'
        ? css`
            margin: 8px -12px;
            padding: 12px;
          `
        : ''}
  }
`;

const Marker = styled.span<{ $state: StopState }>`
  align-items: center;
  border: 1px solid ${COLOR_LINE_STRONG};
  border-radius: 50%;
  box-sizing: border-box;
  color: ${COLOR_TEXT_MUTED};
  display: flex;
  font-size: ${TEXT_XS};
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  height: 32px;
  justify-content: center;
  width: 32px;

  ${({ $state }) =>
    $state === 'done'
      ? css`
          background: ${COLOR_SURFACE_RAISED};
          border-color: ${COLOR_SURFACE_RAISED};
          color: ${COLOR_ACCENT};
        `
      : $state === 'next'
        ? css`
            background: ${COLOR_ACCENT};
            border-color: ${COLOR_ACCENT};
            color: ${COLOR_ON_ACCENT};
          `
        : ''}

  @media ${BELOW_MOBILE} {
    height: 28px;
    width: 28px;
  }
`;

const NextLabel = styled(Label)`
  color: ${COLOR_ACCENT};
  margin-bottom: 2px;
`;

const Place = styled.p<{ $done: boolean }>`
  color: ${({ $done }) => ($done ? COLOR_TEXT_MUTED : COLOR_TEXT)};
  font-size: 15px;
  font-weight: 600;
  margin: 2px 0 0;
`;

const Lead = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  margin: 1px 0 0;
`;

const Reason = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_XS};
  font-style: italic;
  margin: 0;
`;

const Items = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
`;

const Item = styled.li`
  align-items: center;
  display: inline-flex;
  font-size: ${TEXT_MD};
  gap: 10px;
  min-width: 0;
`;

// A build's item while tracking: the checkbox, tile and name are one label.
const CheckRow = styled.label`
  align-items: center;
  cursor: pointer;
  display: inline-flex;
  gap: 10px;
  min-height: 44px;
  min-width: 0;
`;

// The site's own box (inset, like the inputs); checked: the accent with a tick drawn in CSS.
const Checkbox = styled.input`
  appearance: none;
  background: ${COLOR_INSET};
  border: 1px solid ${COLOR_LINE_STRONG};
  border-radius: 3px;
  cursor: pointer;
  flex: none;
  height: 20px;
  margin: 0;
  position: relative;
  width: 20px;

  &:checked {
    background: ${COLOR_ACCENT};
    border-color: ${COLOR_ACCENT};
  }

  &:checked::after {
    border: solid ${COLOR_ON_ACCENT};
    border-width: 0 2px 2px 0;
    content: '';
    height: 10px;
    left: 6px;
    position: absolute;
    top: 2px;
    transform: rotate(45deg);
    width: 5px;
  }
`;

const ItemName = styled.span<{ $mine: boolean }>`
  color: ${({ $mine }) => ($mine ? COLOR_TEXT : COLOR_TEXT_MUTED)};
`;

const Note = styled.span`
  color: ${COLOR_TEXT_MUTED};
  font-variant-numeric: tabular-nums;
`;

const ItemReason = styled.span`
  color: ${COLOR_TEXT_MUTED};
  display: block;
  font-size: ${TEXT_XS};
`;

export default GuideRoute;
