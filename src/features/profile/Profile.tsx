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
import { errorMessage, resendVerificationEmail } from '@/lib/firebase';
import { LIMITS, type UserProfile } from '@/lib/models';
import {
  COLOR_ACCENT,
  COLOR_LINE,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  SPACE_LG,
  SPACE_MD,
  SPACE_REGION,
  SPACE_SM,
  TEXT_MD,
  TEXT_SM,
} from '@/theme';
import DeleteAccount from './DeleteAccount';
import { useLikedBuilds, useUpdateDisplayName, useUserProfile } from './queries';

type Tab = 'builds' | 'liked';

/**
 * `/user/:userId`: display name (editable by its owner), tabs for their builds and likes, and for
 * the owner, "Delete account" at the bottom.
 */
function Profile() {
  const { userId = '' } = useParams();
  const { uid, user } = useAuth();
  const profile = useUserProfile(userId);
  const [tab, setTab] = useState<Tab>('builds');
  const isOwner = uid === userId;

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
      <ProfileHeader profile={profile.data} editable={isOwner} />
      {isOwner && user && !user.emailVerified ? <VerifyEmailNotice /> : null}
      <TabBar>
        <Tabs role="tablist" aria-label="Profile">
          {(['builds', 'liked'] as Tab[]).map((value) => (
            <TabButton
              key={value}
              type="button"
              role="tab"
              id={`tab-${value}`}
              aria-selected={tab === value}
              aria-controls={`panel-${value}`}
              onClick={() => setTab(value)}>
              {value === 'builds' ? 'Builds' : 'Liked'}
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
      </div>
      {isOwner ? <DeleteAccount /> : null}
    </>
  );
}

function ProfileHeader({ profile, editable }: { profile: UserProfile; editable: boolean }) {
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
      tagline={<Tagline userId={profile.id} joinedAt={profile.createdAt} />}>
      {editable ? <TextButton onClick={() => setEditing(true)}>Change name</TextButton> : null}
    </PageHero>
  );
}

/**
 * "Joined May 2022 · 4 builds · 17 likes received" (T20): summed from the builds the Builds tab
 * loads anyway (same query), so it costs no extra reads. Zero likes are left out.
 */
function Tagline({ userId, joinedAt }: { userId: string; joinedAt: Date }) {
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
`;

const TabButton = styled.button`
  background: none;
  border: none;
  color: ${COLOR_TEXT_MUTED};
  cursor: pointer;
  font-size: ${TEXT_MD};
  font-weight: 500;
  min-height: 48px;
  padding: 0 ${SPACE_MD};
  position: relative;

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

export default Profile;
