// The profile's in-progress builds as cards (T36): the portrait, the name, how far the player is (the
// same numbers as the build's hero) and the route's next stop. Lazy (`TrackedBuilds`): it needs the
// full game data (starting classes) and the route's acquisition data.
import { Link } from 'react-router';
import styled from 'styled-components';
import ItemTile from '@/components/ui/ItemTile';
import Label from '@/components/ui/Label';
import { panel } from '@/components/ui/inWorld';
import { displayText } from '@/components/ui/typography';
import { getCardItem, iconUrl } from '@/data/core';
import { routeProgress } from '@/features/editor/guide/GuideRoute';
import { legTitle, stopTitle } from '@/features/editor/guide/phrases';
import { useUserProfiles } from '@/features/profile/queries';
import { buildImage } from '@/lib/equipment';
import type { Build } from '@/lib/models';
import { formatDayMonth } from '@/lib/relativeTime';
import { trackingProgress, type TrackingState } from '@/lib/tracking';
import {
  BELOW_MOBILE,
  COLOR_ACCENT,
  COLOR_ACCENT_LINE,
  COLOR_LINE,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  SPACE_GROUP,
  SPACE_SM,
  TEXT_SM,
  TEXT_XS,
} from '@/theme';
import ProgressBar from './ProgressBar';
import type { TrackedBuild } from './queries';
import { trackingContext } from './useBuildTracking';

/** Where the route sends the player next: "Erdtree Sanctuary, Leyndell", or null when there's none. */
export function nextStopTitle(
  build: Pick<Build, 'equipment'>,
  state: Pick<TrackingState, 'collected' | 'marked'>,
) {
  const { stops, progress } = routeProgress(build.equipment, state);
  const stop = progress && progress.next >= 0 ? stops[progress.next] : undefined;
  if (!stop) return null;
  const area = legTitle(stop.leg);
  const title = stopTitle(stop.leg, stop.step) ?? area;
  return title === area ? title : `${title}, ${area}`;
}

function PlayingList({ items }: { items: TrackedBuild[] }) {
  const authors = useUserProfiles(items.map(({ build }) => build.ownerId));
  return (
    <Cards>
      {items.map(({ build, state }) => (
        <li key={build.id}>
          <PlayingCard build={build} state={state} author={authors[build.ownerId]?.displayName} />
        </li>
      ))}
    </Cards>
  );
}

function PlayingCard({
  build,
  state,
  author,
}: {
  build: Build;
  state: TrackingState;
  author: string | undefined;
}) {
  const image = getCardItem(buildImage(build));
  const progress = trackingProgress(state, trackingContext(build));
  const next = nextStopTitle(build, state);
  const { gear, level } = progress;
  return (
    <Card to={`/build/${build.id}`}>
      <Top>
        <ItemTile src={image ? iconUrl(image.icon) : null} size={56} />
        <Names>
          <Name>{build.name}</Name>
          <Sub>
            {author ? `by ${author} · ` : ''}started {formatDayMonth(state.startedAt)}
          </Sub>
        </Names>
        <Percent>{`${progress.percent}%`}</Percent>
      </Top>
      <ProgressBar percent={progress.percent} />
      <Numbers>
        {gear.total > 0 ? (
          <span>
            Gear{' '}
            <b>
              {gear.done} of {gear.total}
            </b>
          </span>
        ) : null}
        <span>
          Level{' '}
          <b>
            {level.yours} of {level.target}
          </b>
        </span>
      </Numbers>
      {next ? (
        <Next>
          <NextLabel>Next stop</NextLabel> <b>{next}</b>
        </Next>
      ) : null}
    </Card>
  );
}

const Cards = styled.ul`
  display: grid;
  gap: ${SPACE_GROUP};
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 420px), 1fr));
  list-style: none;
  margin: 0;
  padding: 0;
`;

const Card = styled(Link)`
  ${panel}
  color: ${COLOR_TEXT};
  display: flex;
  flex-direction: column;
  gap: ${SPACE_SM};
  padding: 14px 16px;
  text-decoration: none;
  transition: border-color 120ms;

  &:hover {
    border-color: ${COLOR_ACCENT_LINE};
    color: ${COLOR_TEXT};
  }
`;

const Top = styled.span`
  align-items: center;
  display: flex;
  gap: ${SPACE_GROUP};
`;

const Names = styled.span`
  flex: 1;
  min-width: 0;
`;

const Name = styled.span`
  ${displayText}
  display: block;
  font-size: 19px;
`;

const Sub = styled.span`
  color: ${COLOR_TEXT_MUTED};
  display: block;
  font-size: ${TEXT_SM};
  margin-top: 2px;
`;

const Percent = styled.span`
  ${displayText}
  color: ${COLOR_ACCENT};
  font-size: 26px;
  font-variant-numeric: tabular-nums;

  @media ${BELOW_MOBILE} {
    font-size: 24px;
  }
`;

const Numbers = styled.span`
  color: ${COLOR_TEXT_MUTED};
  display: flex;
  font-size: ${TEXT_XS};
  justify-content: space-between;
  margin-top: -4px;

  b {
    color: ${COLOR_TEXT};
    font-variant-numeric: tabular-nums;
    font-weight: 500;
  }
`;

const Next = styled.span`
  border-top: 1px solid ${COLOR_LINE};
  font-size: ${TEXT_SM};
  padding-top: ${SPACE_SM};

  b {
    font-weight: 600;
  }
`;

const NextLabel = styled(Label)`
  color: ${COLOR_ACCENT};
  margin-right: 6px;
`;

export default PlayingList;
