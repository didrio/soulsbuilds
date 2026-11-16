import { useState } from 'react';
import styled, { css } from 'styled-components';
import Button from '@/components/ui/Button';
import ItemTile from '@/components/ui/ItemTile';
import Label from '@/components/ui/Label';
import VisuallyHidden from '@/components/ui/VisuallyHidden';
import { CheckIcon } from '@/components/ui/icons';
import { acquisition } from '@/data/acquisition';
import { iconUrl } from '@/data/core';
import type { Equipment } from '@/lib/models';
import {
  BELOW_MOBILE,
  COLOR_ACCENT,
  COLOR_ACCENT_DEEP,
  COLOR_ACCENT_LINE,
  COLOR_LINE,
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
  refKey,
  routeStops,
  stopProgress,
  type RouteStop,
} from './progress';
import { equipmentItems, planRoute, type RouteAction } from './route';

/** The route with its stops, and the player's progress along it when they track the build. */
export function routeProgress(equipment: Equipment, collected: string[] | undefined) {
  const route = planRoute(equipment, acquisition);
  const own = new Set(equipmentItems(equipment).map(refKey));
  const stops = routeStops(route);
  const progress = collected ? stopProgress(stops, collected, own) : null;
  return { stops, own, progress, have: new Set(collected ?? []) };
}

type StopState = 'todo' | 'done' | 'next';

/**
 * The route of "How to get this build" (T15, T28, T35): numbered stops from a fresh save to every item
 * of the build. Each stop has its area, its place, what to do there and the items, with why the ones
 * that aren't the build's are needed. Tracking the build (`collected`): "N of M stops done", finished
 * stops folded away, the next stop highlighted. Lazy-loaded with the ~400 KB acquisition data
 * (`GuideSection`).
 */
function GuideRoute({ equipment, collected }: { equipment: Equipment; collected?: string[] }) {
  const { stops, own, progress, have } = routeProgress(equipment, collected);
  const [showDone, setShowDone] = useState(false);
  if (stops.length === 0) return <Hint>None of these items has a known source yet.</Hint>;

  const doneCount = progress?.doneCount ?? 0;
  const stateOf = (index: number): StopState =>
    !progress ? 'todo' : progress.done[index] ? 'done' : index === progress.next ? 'next' : 'todo';
  const shown = stops
    .map((stop, index) => ({ stop, state: stateOf(index) }))
    .filter(({ state }) => !progress || showDone || state !== 'done');

  return (
    <>
      {progress ? (
        <Progress>
          <ProgressLine>
            <ProgressText>
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
          <Bar aria-hidden="true">
            <Fill style={{ width: `${(doneCount / stops.length) * 100}%` }} />
          </Bar>
        </Progress>
      ) : null}
      {shown.length > 0 ? (
        <Stops>
          {shown.map(({ stop, state }) => (
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
                  have={progress ? have : null}
                />
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

/** A stop's area, place, actions and items (the route's rows; `NextStop` shows the same items). */
function StopBody({
  stop,
  done,
  own,
  have,
}: {
  stop: RouteStop;
  done: boolean;
  own: Set<string>;
  have: Set<string> | null;
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
            <RouteItems action={action} own={own} have={have} stopDone={done} size={36} />
          </div>
        );
      })}
    </>
  );
}

/**
 * An action's items: tile, name, price or trade, and why it's needed. The build's own items are lit,
 * others dimmed; while tracking, an item lights up once it's collected (or its stop is done).
 */
export function RouteItems({
  action,
  own,
  have,
  stopDone,
  size,
}: {
  action: RouteAction;
  own: Set<string>;
  /** The collected item keys while tracking, else null. */
  have: Set<string> | null;
  stopDone: boolean;
  size: number;
}) {
  if (action.items.length === 0) return null;
  return (
    <Items>
      {action.items.map((item) => {
        const { name, icon } = itemInfo(item.ref);
        const notes = itemNotes(action, item);
        const reason = itemReason(item);
        const mine = own.has(refKey(item.ref));
        const lit = !have
          ? mine
          : mine && isTrackable(item.ref)
            ? isCollected(item.ref, have)
            : stopDone;
        return (
          <Item key={refKey(item.ref)}>
            {icon !== null ? (
              <ItemTile src={iconUrl(icon)} size={size} track={lit ? undefined : 'missing'} />
            ) : (
              <DashedTile $size={size} />
            )}
            <span>
              <ItemName $mine={mine}>{name}</ItemName>
              {notes.length > 0 ? <Note>{` · ${notes.join(', ')}`}</Note> : null}
              {reason ? <ItemReason>{reason}</ItemReason> : null}
            </span>
          </Item>
        );
      })}
    </Items>
  );
}

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
`;

const Count = styled.span`
  color: ${COLOR_TEXT};
  font-variant-numeric: tabular-nums;
  font-weight: 600;
`;

const Bar = styled.span`
  background: ${COLOR_LINE};
  border-radius: 3px;
  display: block;
  height: 6px;
  margin-top: ${SPACE_SM};
  overflow: hidden;
`;

const Fill = styled.span`
  background: linear-gradient(90deg, ${COLOR_ACCENT_DEEP}, ${COLOR_ACCENT});
  display: block;
  height: 100%;
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
