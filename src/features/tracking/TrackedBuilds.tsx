// The profile's "Playing" and "Completed" tabs (T36): the player's tracked builds, private to them.
// The Completed shelf only needs the card data; the Playing cards (progress and next stop) need the
// full game data and the route, so they load as their own chunk (./PlayingList).
import { lazy, Suspense } from 'react';
import { Link } from 'react-router';
import styled from 'styled-components';
import ErrorMessage from '@/components/ui/ErrorMessage';
import ItemTile from '@/components/ui/ItemTile';
import PageMessage from '@/components/ui/PageMessage';
import SectionHeading from '@/components/ui/SectionHeading';
import { LockIcon } from '@/components/ui/icons';
import { TextButton, TextLink } from '@/components/ui/TextButton';
import { getCardItem, iconUrl } from '@/data/core';
import { tabPath } from '@/features/editor/tabs';
import { errorMessage } from '@/lib/firebase';
import { buildImage } from '@/lib/equipment';
import { formatMonthYear } from '@/lib/relativeTime';
import {
  COLOR_ACCENT_LINE,
  COLOR_BLACK,
  COLOR_CELEBRATE,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  SPACE_GROUP,
  SPACE_MD,
  SPACE_SM,
  TEXT_SM,
  TEXT_XS,
} from '@/theme';
import { useTrackedBuilds, type TrackedBuild } from './queries';

const PlayingList = lazy(() => import('./PlayingList'));

/** How many finished builds the Playing tab shows under "Recently completed". */
const RECENT = 3;

/** In-progress builds as cards, then the latest finished ones; `onShowCompleted` opens Completed. */
export function PlayingPanel({
  uid,
  onShowCompleted,
}: {
  uid: string;
  onShowCompleted: () => void;
}) {
  const tracked = useTrackedBuilds(uid);
  if (tracked.isPending) return <PageMessage loading />;
  if (tracked.isError) {
    return (
      <ErrorMessage onRetry={() => void tracked.refetch()}>
        {errorMessage(tracked.error)}
      </ErrorMessage>
    );
  }
  const { playing, finished } = tracked.data;
  return (
    <Panel>
      <Private>
        <LockIcon />
        Only you can see what you’re playing.
      </Private>
      {playing.length ? (
        <Suspense fallback={<PageMessage loading />}>
          <PlayingList items={playing} />
        </Suspense>
      ) : (
        <PageMessage>
          <p>You’re not tracking a build. Open one and press “Track this build”.</p>
          <TextLink to="/">Browse builds</TextLink>
        </PageMessage>
      )}
      {finished.length ? (
        <section aria-labelledby="recently-completed">
          <ShelfHead>
            <SectionHeading id="recently-completed">Recently completed</SectionHeading>
            <TextButton onClick={onShowCompleted}>{`All ${finished.length}`}</TextButton>
          </ShelfHead>
          <Shelf items={finished.slice(0, RECENT)} />
        </section>
      ) : null}
    </Panel>
  );
}

/** Every finished build as a trophy: the build image (T40) with a soft glow, the name, the month. */
export function CompletedPanel({ uid }: { uid: string }) {
  const tracked = useTrackedBuilds(uid);
  if (tracked.isPending) return <PageMessage loading />;
  if (tracked.isError) {
    return (
      <ErrorMessage onRetry={() => void tracked.refetch()}>
        {errorMessage(tracked.error)}
      </ErrorMessage>
    );
  }
  const { finished } = tracked.data;
  return (
    <Panel>
      <Private>
        <LockIcon />
        Only you can see the builds you finished.
      </Private>
      {finished.length ? (
        <Shelf items={finished} />
      ) : (
        <PageMessage>
          <p>No finished builds yet. A build you track to 100% shows up here.</p>
        </PageMessage>
      )}
    </Panel>
  );
}

function Shelf({ items }: { items: TrackedBuild[] }) {
  return (
    <Trophies>
      {items.map(({ build, state }) => {
        const image = getCardItem(buildImage(build));
        return (
          <li key={build.id}>
            <Trophy to={tabPath(build.id, 'guide', build.name)}>
              <TrophyTile src={image ? iconUrl(image.icon) : null} size={76} />
              <TrophyName>{build.name}</TrophyName>
              {state.completedAt ? (
                <TrophyDate dateTime={state.completedAt.toISOString()}>
                  {formatMonthYear(state.completedAt)}
                </TrophyDate>
              ) : null}
            </Trophy>
          </li>
        );
      })}
    </Trophies>
  );
}

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${SPACE_MD};
`;

const Private = styled.p`
  align-items: center;
  color: ${COLOR_TEXT_MUTED};
  display: flex;
  font-size: ${TEXT_SM};
  gap: 6px;
  margin: 0;
`;

const ShelfHead = styled.div`
  align-items: baseline;
  display: flex;
  justify-content: space-between;
  margin-top: ${SPACE_SM};
`;

const Trophies = styled.ul`
  display: grid;
  gap: ${SPACE_GROUP};
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  list-style: none;
  margin: 0;
  padding: 0;
`;

const Trophy = styled(Link)`
  align-items: center;
  color: ${COLOR_TEXT};
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 6px 0;
  text-align: center;
  text-decoration: none;

  &:hover {
    color: ${COLOR_TEXT};
  }
`;

// A trophy: the accent line and a soft glow around the tile (keeping the tile's inner shading).
const TrophyTile = styled(ItemTile)`
  border-color: ${COLOR_ACCENT_LINE};
  box-shadow:
    0 0 18px -2px ${COLOR_CELEBRATE},
    inset 0 0 0 1px ${COLOR_BLACK},
    inset 0 -10px 18px rgba(0, 0, 0, 0.5);
`;

const TrophyName = styled.span`
  font-size: ${TEXT_SM};
  font-weight: 600;
  line-height: 1.3;
`;

const TrophyDate = styled.time`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_XS};
`;
