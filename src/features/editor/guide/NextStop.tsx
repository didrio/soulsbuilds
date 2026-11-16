import { useRef } from 'react';
import styled from 'styled-components';
import { ButtonLink } from '@/components/ui/Button';
import Label from '@/components/ui/Label';
import { panel } from '@/components/ui/inWorld';
import { displayText } from '@/components/ui/typography';
import type { Equipment } from '@/lib/models';
import {
  BELOW_MOBILE,
  COLOR_ACCENT,
  COLOR_ACCENT_LINE,
  COLOR_TEXT_MUTED,
  SPACE_GROUP,
  SPACE_SM,
  TEXT_SM,
  TEXT_XS,
} from '@/theme';
import { tabPath } from '../tabs';
import { MarkDone, RouteItems, routeProgress } from './GuideRoute';
import { legTitle, stopHow, stopTitle } from './phrases';
import { stopProgress, type RouteTracking } from './progress';

/**
 * Tracking a build (T35): the route's next stop at the top of the Loadout tab: where, what to do,
 * the items and why, "Mark done" when it has none of the build's gear (T44), and a link to the whole
 * route. Nothing once every stop is done. Lazy, with the route's data (`BuildEditorPage`).
 */
function NextStop({
  buildId,
  equipment,
  tracking,
}: {
  buildId: string;
  equipment: Equipment;
  tracking: RouteTracking;
}) {
  const { stops, own, progress, have, markArgs } = routeProgress(equipment, tracking);
  const title = useRef<HTMLHeadingElement>(null);
  const index = progress?.next ?? -1;
  const stop = stops[index];
  if (!progress || !stop) return null;

  const mark = () => {
    const [keys, route] = markArgs(index);
    tracking.onMark(keys, route);
    // The card moves on; when the next stop has no "Mark done", focus goes to its title.
    const after = stopProgress(stops, tracking.collected, own, [...tracking.marked, ...keys]);
    if (!after.markable[after.next]) title.current?.focus();
  };

  const area = legTitle(stop.leg);
  const name = stopTitle(stop.leg, stop.step) ?? area;
  const how = stopHow(stop.step);
  return (
    <Card aria-labelledby="next-stop-title">
      <Body>
        <NextLabel as="p">Next stop</NextLabel>
        <Title id="next-stop-title" ref={title} tabIndex={-1}>
          {name}
        </Title>
        <Sub>{name === area ? how : `${area} · ${how}`}</Sub>
        {stop.step.actions.map((action, index) =>
          action.reason ? <Reason key={`r${index}`}>{action.reason}</Reason> : null,
        )}
        {stop.step.actions.map((action, index) => (
          <RouteItems
            key={index}
            action={action}
            own={own}
            have={have}
            stopDone={false}
            size={40}
          />
        ))}
      </Body>
      <Actions>
        {progress.markable[index] ? <MarkDone done={false} onClick={mark} /> : null}
        <ButtonLink to={tabPath(buildId, 'route')}>See the whole route</ButtonLink>
      </Actions>
    </Card>
  );
}

const Card = styled.section`
  ${panel}
  align-items: center;
  border-color: ${COLOR_ACCENT_LINE};
  display: flex;
  gap: ${SPACE_GROUP};
  padding: 16px 20px;

  @media ${BELOW_MOBILE} {
    align-items: stretch;
    flex-direction: column;
    gap: ${SPACE_SM};
    padding: 14px 16px;
  }
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACE_SM};

  @media ${BELOW_MOBILE} {
    flex-direction: column;
  }
`;

const Body = styled.div`
  flex: 1;
  min-width: 0;
`;

const NextLabel = styled(Label)`
  color: ${COLOR_ACCENT};
`;

const Title = styled.h2`
  ${displayText}
  font-size: 23px;
  margin: 2px 0 0;

  &:focus {
    outline: none;
  }
`;

const Sub = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  margin: 2px 0 0;
`;

const Reason = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_XS};
  font-style: italic;
  margin: 0;
`;

export default NextStop;
