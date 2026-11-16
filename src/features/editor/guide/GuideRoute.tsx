import styled from 'styled-components';
import ItemTile from '@/components/ui/ItemTile';
import { acquisition } from '@/data/acquisition';
import { iconUrl } from '@/data/core';
import type { Equipment } from '@/lib/models';
import {
  BELOW_MOBILE,
  COLOR_LINE,
  COLOR_LINE_STRONG,
  COLOR_SURFACE,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  SPACE_MD,
  SPACE_SM,
  TEXT_LABEL,
  TEXT_MD,
  TEXT_SM,
  TEXT_XS,
} from '@/theme';
import { displayText } from '@/components/ui/typography';
import { DashedTile } from './GuideTiles';
import { actionLead, actionNote, itemInfo, itemNotes, legTitle, stepPlace } from './phrases';
import { equipmentItems, planRoute, type ItemRef, type RouteAction, type RouteStep } from './route';

const refKey = (ref: ItemRef) => `${ref.file}:${ref.id}`;

/** A step that is a fight: a boss or a progression gate. */
const isBoss = (step: RouteStep) =>
  step.actions.some((action) => action.kind === 'boss' || action.kind === 'gate');

/**
 * The route of "How to get this build" (T15, T28): a numbered path of areas from a fresh save to every
 * item of the build. Each area lists its stops: the place (bosses marked), what to do, and the items,
 * the build's own as icon tiles, others (key items…) as dashed tiles. Lazy-loaded with the ~400 KB
 * acquisition data when the How to get tab opens (`GuideSection`).
 */
function GuideRoute({ equipment }: { equipment: Equipment }) {
  const route = planRoute(equipment, acquisition);
  const own = new Set(equipmentItems(equipment).map(refKey));
  if (route.legs.length === 0) return <Hint>None of these items has a known source yet.</Hint>;

  return (
    <Path>
      {route.legs.map((leg, index) => (
        <Area key={index}>
          <AreaNumber aria-hidden="true">{index + 1}</AreaNumber>
          <div>
            <AreaHead>
              <AreaName>{legTitle(leg)}</AreaName>
              <Count>
                {leg.steps.length} {leg.steps.length === 1 ? 'stop' : 'stops'}
              </Count>
            </AreaHead>
            {leg.steps.map((step, stepIndex) => {
              const place = stepPlace(leg, step.location);
              return (
                <Stop key={stepIndex}>
                  {place || isBoss(step) ? (
                    <PlaceLine>
                      {place ? <Place>{place}</Place> : null}
                      {isBoss(step) ? <BossChip>Boss</BossChip> : null}
                    </PlaceLine>
                  ) : null}
                  {step.actions.map((action, actionIndex) => (
                    <Action key={actionIndex} action={action} own={own} />
                  ))}
                </Stop>
              );
            })}
          </div>
        </Area>
      ))}
    </Path>
  );
}

/** One thing to do at a stop: "Buy from Twin Maiden Husks", then its items as tiles with names. */
function Action({ action, own }: { action: RouteAction; own: Set<string> }) {
  const note = actionNote(action);
  return (
    <>
      <Lead>
        {actionLead(action)}
        {note ? ` (${note})` : null}
      </Lead>
      {action.items.length > 0 ? (
        <Items>
          {action.items.map((item) => {
            const { name, icon } = itemInfo(item.ref);
            const notes = itemNotes(action, item);
            const mine = own.has(refKey(item.ref)) && icon !== null;
            return (
              <Item key={refKey(item.ref)}>
                {mine ? <ItemTile src={iconUrl(icon)} size={36} /> : <DashedTile $size={36} />}
                <span>
                  <ItemName>{name}</ItemName>
                  {notes.length > 0 ? <Note>{` · ${notes.join(', ')}`}</Note> : null}
                </span>
              </Item>
            );
          })}
        </Items>
      ) : null}
    </>
  );
}

const Hint = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  margin: 0;
`;

// One area per number, on a vertical line that joins the numbers.
const Path = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const Area = styled.li`
  column-gap: ${SPACE_MD};
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  padding-bottom: ${SPACE_SM};
  position: relative;

  &:not(:last-child)::before {
    background: ${COLOR_LINE};
    bottom: 0;
    content: '';
    left: 15px;
    position: absolute;
    top: 32px;
    width: 1px;
  }

  @media ${BELOW_MOBILE} {
    column-gap: ${SPACE_SM};
    grid-template-columns: 28px minmax(0, 1fr);

    &:not(:last-child)::before {
      left: 13px;
      top: 28px;
    }
  }
`;

const AreaNumber = styled.span`
  align-items: center;
  background: ${COLOR_SURFACE};
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

  @media ${BELOW_MOBILE} {
    height: 28px;
    width: 28px;
  }
`;

const AreaHead = styled.div`
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: 2px ${SPACE_SM};
  padding-top: 3px;
`;

const AreaName = styled.h3`
  ${displayText}
  font-size: 20px;
  margin: 0;
`;

const Count = styled.span`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_XS};
  white-space: nowrap;
`;

const Stop = styled.div`
  padding: ${SPACE_SM} 0 ${SPACE_SM};
`;

const PlaceLine = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Place = styled.span`
  color: ${COLOR_TEXT};
  font-size: ${TEXT_MD};
  font-weight: 600;
`;

const BossChip = styled.span`
  border: 1px solid ${COLOR_LINE_STRONG};
  border-radius: 3px;
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_LABEL};
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 0 6px;
`;

const Lead = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  margin: 2px 0 0;
`;

const Items = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
`;

const Item = styled.li`
  align-items: center;
  display: inline-flex;
  font-size: ${TEXT_MD};
  gap: 8px;
`;

const ItemName = styled.span`
  color: ${COLOR_TEXT};
`;

const Note = styled.span`
  color: ${COLOR_TEXT_MUTED};
  font-variant-numeric: tabular-nums;
`;

export default GuideRoute;
