import { useState } from 'react';
import { useParams } from 'react-router';
import styled from 'styled-components';
import { useCurrentGame } from '@/app/game';
import { ButtonLink } from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import Frame from '@/components/ui/Frame';
import { PlusIcon } from '@/components/ui/icons';
import PageHead from '@/components/ui/PageHead';
import PageMessage from '@/components/ui/PageMessage';
import { TextLink } from '@/components/ui/TextButton';
import { displayText } from '@/components/ui/typography';
import useAuth from '@/features/auth/useAuth';
import BuildsList from '@/features/builds/BuildsList';
import { useUserBuilds } from '@/features/builds/queries';
import { useTrackedBuilds } from '@/features/tracking/queries';
import { CompletedPanel, PlayingPanel } from '@/features/tracking/TrackedBuilds';
import { errorMessage } from '@/lib/firebase';
import { pageTitle, SITE_ORIGIN } from '@/lib/share';
import type { UserProfile } from '@/lib/models';
import {
  BELOW_MOBILE,
  COLOR_ACCENT,
  COLOR_LINE,
  COLOR_SURFACE_RAISED,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  SPACE_GUTTER,
  SPACE_LG,
  SPACE_MD,
  SPACE_REGION,
  SPACE_SM,
  TEXT_LG,
  TEXT_MD,
  TEXT_XS,
  TEXT_XXL,
} from '@/theme';
import DeleteAccount from '@/features/account/DeleteAccount';
import { useLikedBuilds, useUserProfile } from './queries';

type Tab = 'builds' | 'liked' | 'playing' | 'completed';

const TAB_LABELS: Record<Tab, string> = {
  builds: 'Builds',
  liked: 'Liked',
  playing: 'Playing',
  completed: 'Completed',
};

/**
 * `/user/:userId`, the public profile: a hero with the name and counts, tabs for their builds and
 * likes, and for the owner, the builds they track (T36: Playing and Completed, private). Settings
 * live on `/account` (T31).
 */
function Profile() {
  const { userId = '' } = useParams();
  const { uid } = useAuth();
  const profile = useUserProfile(userId);
  const [tab, setTab] = useState<Tab>('builds');
  const isOwner = uid === userId;
  // The owner's tracked builds (private): the tab counts and the tagline's "N builds finished".
  const tracked = useTrackedBuilds(isOwner ? uid : null).data;
  const counts: Partial<Record<Tab, number>> = {
    builds: useUserBuilds(userId).data?.length,
    playing: tracked?.playing.length,
    completed: tracked?.finished.length,
  };
  const game = useCurrentGame();
  const ownBuilds = counts.builds;
  const tabs: Tab[] = isOwner ? ['builds', 'liked', 'playing', 'completed'] : ['builds', 'liked'];

  if (profile.isPending) return <PageMessage loading />;
  if (profile.isError) {
    return (
      <PageMessage title="Couldn’t load this profile">
        <ErrorMessage onRetry={() => void profile.refetch()}>
          {errorMessage(profile.error)}
        </ErrorMessage>
      </PageMessage>
    );
  }
  if (!profile.data) {
    return (
      <PageMessage title="User not found">
        <PageHead title={pageTitle('User not found')} noindex />
        <TextLink to="/">Browse builds</TextLink>
        {isOwner ? <DeleteAccount finishing /> : null}
      </PageMessage>
    );
  }

  return (
    <>
      <PageHead
        title={pageTitle(`${profile.data.displayName}’s ${game.name} builds`)}
        description={`${game.name} builds by ${profile.data.displayName} on Souls Builds.`}
        canonical={`${SITE_ORIGIN}/user/${userId}`}
        noindex={ownBuilds === 0}
      />
      <ProfileHeader
        profile={profile.data}
        isOwner={isOwner}
        finished={tracked?.finished.length ?? 0}
      />
      <TabBar>
        <Tabs role="tablist" aria-label="Profile">
          {tabs.map((value) => (
            <TabButton
              key={value}
              type="button"
              role="tab"
              id={`tab-${value}`}
              aria-selected={tab === value}
              aria-controls={`panel-${value}`}
              onClick={() => setTab(value)}>
              {TAB_LABELS[value]}
              {counts[value] ? <TabCount>{counts[value]}</TabCount> : null}
            </TabButton>
          ))}
        </Tabs>
        {isOwner ? (
          <ButtonLink to="/build/new" variant="secondary">
            <PlusIcon />
            Create a build
          </ButtonLink>
        ) : null}
      </TabBar>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'builds' ? <OwnBuilds userId={userId} isOwner={isOwner} /> : null}
        {tab === 'liked' ? <LikedBuilds userId={userId} isOwner={isOwner} /> : null}
        {tab === 'playing' && isOwner ? (
          <PlayingPanel uid={userId} onShowCompleted={() => setTab('completed')} />
        ) : null}
        {tab === 'completed' && isOwner ? <CompletedPanel uid={userId} /> : null}
      </div>
    </>
  );
}

/**
 * The profile's hero (T31): the build page's frame, the name, and the tagline. The owner gets a link
 * to their account settings (rename, email, password, deletion), which aren't on the public page.
 */
function ProfileHeader({
  profile,
  isOwner,
  finished,
}: {
  profile: UserProfile;
  isOwner: boolean;
  /** The owner's finished builds (T36; private, so 0 for visitors). */
  finished: number;
}) {
  return (
    <Hero $hero aria-labelledby="profile-name">
      <Name id="profile-name">{profile.displayName}</Name>
      <HeroTagline>
        <Tagline userId={profile.id} joinedAt={profile.createdAt} finished={finished} />
      </HeroTagline>
      {isOwner ? <TextLink to="/account">Account settings</TextLink> : null}
    </Hero>
  );
}

/**
 * "Joined May 2022 · 4 builds · 17 likes received" (T20): summed from the builds the Builds tab
 * loads anyway (same query), so it costs no extra reads. Zero likes are left out. The owner also
 * sees "3 builds finished" (T36; private).
 */
function Tagline({
  userId,
  joinedAt,
  finished,
}: {
  userId: string;
  joinedAt: Date;
  finished: number;
}) {
  const builds = useUserBuilds(userId).data;
  const likes = builds?.reduce((sum, build) => sum + build.likeCount, 0) ?? 0;
  return (
    <>
      Joined {joined(joinedAt)}
      {builds ? (
        <>
          {' · '}
          <Count>{builds.length}</Count> {builds.length === 1 ? 'build' : 'builds'}
        </>
      ) : null}
      {likes ? (
        <>
          {' · '}
          <Count>{likes}</Count> {likes === 1 ? 'like' : 'likes'} received
        </>
      ) : null}
      {finished ? (
        <>
          {' · '}
          <Count>{finished}</Count> {finished === 1 ? 'build' : 'builds'} finished
        </>
      ) : null}
    </>
  );
}

function OwnBuilds({ userId, isOwner }: { userId: string; isOwner: boolean }) {
  const builds = useUserBuilds(userId);
  return (
    <>
      <BuildListState
        query={builds}
        empty={isOwner ? 'You haven’t made any builds yet.' : 'This user has no builds yet.'}
      />
    </>
  );
}

function LikedBuilds({ userId, isOwner }: { userId: string; isOwner: boolean }) {
  const builds = useLikedBuilds(userId);
  return (
    <BuildListState
      query={builds}
      empty={isOwner ? 'You haven’t liked any builds yet.' : 'No liked builds yet.'}
    />
  );
}

function BuildListState({
  query,
  empty,
}: {
  query: ReturnType<typeof useUserBuilds>;
  empty: string;
}) {
  if (query.isPending) return <PageMessage loading />;
  if (query.isError) {
    return (
      <ErrorMessage onRetry={() => void query.refetch()}>{errorMessage(query.error)}</ErrorMessage>
    );
  }
  if (query.data.length === 0) return <PageMessage>{<p>{empty}</p>}</PageMessage>;
  return <BuildsList builds={query.data} />;
}

const joined = (date: Date) => date.toLocaleDateString('en', { month: 'long', year: 'numeric' });

const Count = styled.b`
  color: ${COLOR_TEXT};
  font-variant-numeric: tabular-nums;
  font-weight: 600;
`;

const Hero = styled(Frame)`
  display: flex;
  flex-direction: column;
  gap: ${SPACE_SM};
  margin-top: 32px;

  @media ${BELOW_MOBILE} {
    margin-top: ${SPACE_GUTTER};
  }
`;

const Name = styled.h1`
  ${displayText}
  font-size: ${TEXT_XXL};
  margin: 0;
  overflow-wrap: anywhere;

  @media ${BELOW_MOBILE} {
    font-size: 28px;
  }
`;

const HeroTagline = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_LG};
  margin: 0;

  @media ${BELOW_MOBILE} {
    font-size: 15px;
  }
`;

const TabBar = styled.div`
  align-items: center;
  border-bottom: 1px solid ${COLOR_LINE};
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACE_SM};
  justify-content: space-between;
  margin: ${SPACE_REGION} 0 ${SPACE_LG};
  padding-bottom: 6px;
`;

const Tabs = styled.div`
  display: flex;
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
`;

const TabButton = styled.button`
  background: none;
  border: none;
  color: ${COLOR_TEXT_MUTED};
  cursor: pointer;
  font-size: ${TEXT_MD};
  font-weight: 500;
  align-items: center;
  display: inline-flex;
  flex: none;
  gap: 6px;
  min-height: 48px;
  padding: 0 ${SPACE_MD};
  position: relative;

  @media ${BELOW_MOBILE} {
    padding: 0 ${SPACE_SM};
  }

  &:hover {
    color: ${COLOR_TEXT};
  }

  &[aria-selected='true'] {
    color: ${COLOR_TEXT};
  }

  &[aria-selected='true']::after {
    background: ${COLOR_ACCENT};
    bottom: -7px;
    content: '';
    height: 2px;
    left: 0;
    position: absolute;
    right: 0;
  }
`;

const TabCount = styled.span`
  background: ${COLOR_SURFACE_RAISED};
  border-radius: 3px;
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_XS};
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  padding: 0 5px;
`;

export default Profile;
