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
import { RouteItems, routeProgress } from './GuideRoute';
import { legTitle, stopHow, stopTitle } from './phrases';

/**
 * Tracking a build (T35): the route's next stop at the top of the Loadout tab: where, what to do,
 * the items and why, and a link to the whole route. Nothing once every stop is done. Lazy, with the
 * route's data (`BuildEditorPage`).
 */
function NextStop({
  buildId,
  equipment,
  collected,
}: {
  buildId: string;
  equipment: Equipment;
  collected: string[];
}) {
  const { stops, own, progress, have } = routeProgress(equipment, collected);
  const stop = progress && progress.next >= 0 ? stops[progress.next] : undefined;
  if (!stop) return null;

  const area = legTitle(stop.leg);
  const title = stopTitle(stop.leg, stop.step) ?? area;
  const how = stopHow(stop.step);
  return (
    <Card aria-labelledby="next-stop-title">
      <Body>
        <NextLabel as="p">Next stop</NextLabel>
        <Title id="next-stop-title">{title}</Title>
        <Sub>{title === area ? how : `${area} · ${how}`}</Sub>
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
      <ButtonLink to={tabPath(buildId, 'route')}>See the whole route</ButtonLink>
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
