import { useState } from 'react';
import styled from 'styled-components';
import Frame from '@/components/ui/Frame';
import ItemTile from '@/components/ui/ItemTile';
import SectionHeading from '@/components/ui/SectionHeading';
import { acquisition } from '@/data/acquisition';
import { iconUrl } from '@/data/core';
import type { Equipment } from '@/lib/models';
import {
  BELOW_MOBILE,
  COLOR_ACCENT,
  COLOR_LINE,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  FONT_DISPLAY,
  FONT_UI,
  SPACE_MD,
  SPACE_SM,
  SPACE_XS,
  TEXT_MD,
  TEXT_SM,
  TEXT_XS,
  TRACKING_CAPS,
} from '@/theme';
import { actionLead, actionNote, itemInfo, itemNotes, legTitle, stepPlace } from './phrases';
import { planRoute, type RouteAction } from './route';

const isPhone = () =>
  typeof window !== 'undefined' && (window.matchMedia?.(BELOW_MOBILE).matches ?? false);

/**
 * "How to get this build" (T15): a numbered route from a fresh save to every item of the build, one
 * collapsible list per region (numbering runs on across them). On phones only the first region starts
 * open. Lazy-loaded by the build page with the ~400 KB acquisition data.
 */
function GuideSection({ equipment }: { equipment: Equipment }) {
  const route = planRoute(equipment, acquisition);
  const [phone] = useState(isPhone);
  if (route.legs.length === 0) return null;

  // Numbering runs on across the regions: each list starts where the last one ended.
  const starts: number[] = [];
  let next = 1;
  for (const leg of route.legs) {
    starts.push(next);
    next += leg.steps.length;
  }

  return (
    <Frame aria-labelledby="guide-title">
      <SectionHeading id="guide-title">How to get this build</SectionHeading>
      <Hint>
        A sensible order through the usual progression, from a fresh save. Not a walkthrough:
        upgrade materials and runes aren’t included.
      </Hint>
      {route.legs.map((leg, index) => (
        <Leg key={index} open={!phone || index === 0}>
          <Summary>
            <LegHeading>{legTitle(leg)}</LegHeading>
            <Count>
              {leg.steps.length} {leg.steps.length === 1 ? 'step' : 'steps'}
            </Count>
          </Summary>
          <Steps start={starts[index]}>
            {leg.steps.map((step, stepIndex) => {
              const place = stepPlace(leg, step.location);
              return (
                <Step key={stepIndex}>
                  {place ? <Place>{place}</Place> : null}
                  {step.actions.map((action, actionIndex) => (
                    <Action key={actionIndex} action={action} />
                  ))}
                </Step>
              );
            })}
          </Steps>
        </Leg>
      ))}
    </Frame>
  );
}

/** One thing to do at a step: "Buy from Twin Maiden Husks: [icon] Spirit Calling Bell (100 runes)". */
function Action({ action }: { action: RouteAction }) {
  const note = actionNote(action);
  return (
    <ActionLine>
      <Lead>
        {actionLead(action)}
        {action.items.length > 0 ? ':' : null}
      </Lead>
      {action.items.map((item) => {
        const { name, icon } = itemInfo(item.ref);
        const notes = itemNotes(action, item);
        return (
          <Item key={`${item.ref.file}:${item.ref.id}`}>
            {icon ? <ItemTile src={iconUrl(icon)} size={28} /> : null}
            <ItemName>{name}</ItemName>
            {notes.length > 0 ? <Note>({notes.join(', ')})</Note> : null}
          </Item>
        );
      })}
      {note ? <Note>({note})</Note> : null}
    </ActionLine>
  );
}

const Hint = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  margin: 0 0 ${SPACE_MD};
`;

const Leg = styled.details`
  border-top: 1px solid ${COLOR_LINE};

  &:last-child {
    border-bottom: 1px solid ${COLOR_LINE};
  }
`;

// The whole bar toggles the region; ≥ 44 px tall for touch.
const Summary = styled.summary`
  align-items: center;
  cursor: pointer;
  display: flex;
  gap: ${SPACE_SM};
  list-style: none;
  min-height: 44px;

  &::-webkit-details-marker {
    display: none;
  }

  &::before {
    color: ${COLOR_ACCENT};
    content: '▸';
    font-size: ${TEXT_SM};
    transition: transform 0.15s ease;
  }

  details[open] > &::before {
    transform: rotate(90deg);
  }
`;

const LegHeading = styled.h3`
  color: ${COLOR_ACCENT};
  font-family: ${FONT_DISPLAY};
  font-size: ${TEXT_SM};
  font-weight: 600;
  letter-spacing: ${TRACKING_CAPS};
  margin: 0;
  text-transform: uppercase;
`;

const Count = styled.span`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_XS};
  white-space: nowrap;
`;

const Steps = styled.ol`
  margin: 0 0 ${SPACE_MD};
  padding-left: 2.2em;

  li::marker {
    color: ${COLOR_ACCENT};
    font-family: ${FONT_DISPLAY};
    font-weight: 600;
  }

  @media ${BELOW_MOBILE} {
    padding-left: 1.8em;
  }
`;

const Step = styled.li`
  padding: ${SPACE_XS} 0;

  & + & {
    border-top: 1px solid ${COLOR_LINE};
  }
`;

const Place = styled.div`
  color: ${COLOR_TEXT};
  font-family: ${FONT_UI};
  font-size: ${TEXT_MD};
  font-weight: 600;
`;

const ActionLine = styled.div`
  align-items: center;
  color: ${COLOR_TEXT_MUTED};
  display: flex;
  flex-wrap: wrap;
  font-size: ${TEXT_SM};
  gap: 2px ${SPACE_SM};
  margin-top: 2px;
`;

const Lead = styled.span`
  color: ${COLOR_TEXT_MUTED};
`;

const Item = styled.span`
  align-items: center;
  display: inline-flex;
  gap: 6px;
`;

const ItemName = styled.span`
  color: ${COLOR_TEXT};
`;

const Note = styled.span`
  color: ${COLOR_TEXT_MUTED};
`;

export default GuideSection;
