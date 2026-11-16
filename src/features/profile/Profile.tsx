import { useState, type FormEvent } from 'react';
import { useParams } from 'react-router';
import styled from 'styled-components';
import Button, { ButtonLink } from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import Frame from '@/components/ui/Frame';
import { PlusIcon } from '@/components/ui/icons';
import PageHero from '@/components/ui/PageHero';
import PageMessage from '@/components/ui/PageMessage';
import TextInput from '@/components/ui/TextInput';
import { TextButton, TextLink } from '@/components/ui/TextButton';
import useAuth from '@/features/auth/useAuth';
import BuildsList from '@/features/builds/BuildsList';
import { useUserBuilds } from '@/features/builds/queries';
import { useTrackedBuilds } from '@/features/tracking/queries';
import { CompletedPanel, PlayingPanel } from '@/features/tracking/TrackedBuilds';
import { errorMessage, resendVerificationEmail } from '@/lib/firebase';
import { LIMITS, type UserProfile } from '@/lib/models';
import {
  BELOW_MOBILE,
  COLOR_ACCENT,
  COLOR_LINE,
  COLOR_SURFACE_RAISED,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  SPACE_LG,
  SPACE_MD,
  SPACE_REGION,
  SPACE_SM,
  TEXT_MD,
  TEXT_SM,
  TEXT_XS,
} from '@/theme';
import DeleteAccount from './DeleteAccount';
import { useLikedBuilds, useUpdateDisplayName, useUserProfile } from './queries';

type Tab = 'builds' | 'liked' | 'playing' | 'completed';

const TAB_LABELS: Record<Tab, string> = {
  builds: 'Builds',
  liked: 'Liked',
  playing: 'Playing',
  completed: 'Completed',
};

/**
 * `/user/:userId`: display name (editable by its owner), tabs for their builds and likes, and for
 * the owner, the builds they track (T36: Playing and Completed, private) and "Delete account" at the
 * bottom.
 */
function Profile() {
  const { userId = '' } = useParams();
  const { uid, user } = useAuth();
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
        <TextLink to="/">Browse builds</TextLink>
        {isOwner ? <DeleteAccount finishing /> : null}
      </PageMessage>
    );
  }

  return (
    <>
      <ProfileHeader
        profile={profile.data}
        editable={isOwner}
        finished={tracked?.finished.length ?? 0}
      />
      {isOwner && user && !user.emailVerified ? <VerifyEmailNotice /> : null}
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
      {isOwner ? <DeleteAccount /> : null}
    </>
  );
}

function ProfileHeader({
  profile,
  editable,
  finished,
}: {
  profile: UserProfile;
  editable: boolean;
  /** The owner's finished builds (T36; private, so 0 for visitors). */
  finished: number;
}) {
  const rename = useUpdateDisplayName(profile.id);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.displayName);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    rename.mutate(name, { onSuccess: () => setEditing(false) });
  };

  if (editing) {
    return (
      <PageHero title={profile.displayName}>
        <RenameForm onSubmit={handleSubmit} aria-label="Change display name">
          <NameInput>
            <TextInput
              aria-label="Display name"
              maxLength={LIMITS.displayName}
              onChange={setName}
              required
              value={name}
            />
          </NameInput>
          <Button type="submit" disabled={!name.trim() || rename.isPending}>
            Save
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setName(profile.displayName);
              setEditing(false);
            }}>
            Cancel
          </Button>
          <ErrorMessage>{rename.error ? errorMessage(rename.error) : ''}</ErrorMessage>
        </RenameForm>
      </PageHero>
    );
  }

  return (
    <PageHero
      title={profile.displayName}
      tagline={<Tagline userId={profile.id} joinedAt={profile.createdAt} finished={finished} />}>
      {editable ? <TextButton onClick={() => setEditing(true)}>Change name</TextButton> : null}
    </PageHero>
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

/** Shown to the owner until their email is verified (send-only: nothing is gated on it). */
function VerifyEmailNotice() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  const resend = async () => {
    setStatus('sending');
    setError('');
    try {
      await resendVerificationEmail();
      setStatus('sent');
    } catch (err) {
      setError(errorMessage(err));
      setStatus('idle');
    }
  };

  return (
    <Notice role="status">
      <span>
        {status === 'sent'
          ? 'Verification email sent. Check your inbox.'
          : 'Verify your email: we sent you a link when you signed up.'}
      </span>
      <TextButton disabled={status === 'sending'} onClick={() => void resend()}>
        Resend email
      </TextButton>
      <ErrorMessage>{error}</ErrorMessage>
    </Notice>
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

const Notice = styled(Frame)`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  font-size: ${TEXT_SM};
  gap: 0 ${SPACE_MD};
  justify-content: center;
  margin: ${SPACE_LG} auto 0;
  max-width: 640px;
  padding-bottom: 6px;
  padding-top: 6px;
`;

const RenameForm = styled.form`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACE_SM};
  justify-content: flex-start;
  margin-top: ${SPACE_MD};
`;

const NameInput = styled.div`
  width: 260px;
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
