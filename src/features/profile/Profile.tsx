import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router';
import styled from 'styled-components';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import FlexGroup from '@/components/ui/FlexGroup';
import LoadingAnimation from '@/components/ui/LoadingAnimation';
import PageMessage from '@/components/ui/PageMessage';
import TextInput from '@/components/ui/TextInput';
import useAuth from '@/features/auth/useAuth';
import BuildsList from '@/features/builds/BuildsList';
import { useUserBuilds } from '@/features/builds/queries';
import { errorMessage, resendVerificationEmail } from '@/lib/firebase';
import { LIMITS, type UserProfile } from '@/lib/models';
import {
  COLOR_GOLD,
  COLOR_GREEN,
  COLOR_LIGHT_GREEN,
  COLOR_LIGHTEST_GREEN,
  SPACE_LG,
  SPACE_SM,
} from '@/theme';
import { useLikedBuilds, useUpdateDisplayName, useUserProfile } from './queries';

type Tab = 'builds' | 'liked';

/** `/user/:userId`: display name (editable by its owner), and tabs for their builds and likes. */
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
        <Link to="/">Browse builds</Link>
      </PageMessage>
    );
  }

  return (
    <Container vertical>
      <ProfileHeader profile={profile.data} editable={isOwner} />
      {isOwner && user && !user.emailVerified ? <VerifyEmailNotice /> : null}
      <Tabs role="tablist" aria-label="Profile">
        {(['builds', 'liked'] as Tab[]).map((value) => (
          <TabButton
            key={value}
            type="button"
            role="tab"
            id={`tab-${value}`}
            aria-selected={tab === value}
            aria-controls={`panel-${value}`}
            $active={tab === value}
            onClick={() => setTab(value)}>
            {value === 'builds' ? 'Builds' : 'Liked'}
          </TabButton>
        ))}
      </Tabs>
      <Panel role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'builds' ? <OwnBuilds userId={userId} isOwner={isOwner} /> : null}
        {tab === 'liked' ? <LikedBuilds userId={userId} isOwner={isOwner} /> : null}
      </Panel>
    </Container>
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
        <FlexGroup>
          <Button type="submit" disabled={!name.trim() || rename.isPending}>
            Save
          </Button>
          <Spaced
            onClick={() => {
              setName(profile.displayName);
              setEditing(false);
            }}>
            Cancel
          </Spaced>
        </FlexGroup>
        <ErrorMessage>{rename.error ? errorMessage(rename.error) : ''}</ErrorMessage>
      </RenameForm>
    );
  }

  return (
    <HeaderContainer>
      <Header>{profile.displayName}</Header>
      {editable ? (
        <TextButton type="button" onClick={() => setEditing(true)}>
          Change name
        </TextButton>
      ) : null}
    </HeaderContainer>
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
      <TextButton type="button" disabled={status === 'sending'} onClick={() => void resend()}>
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
      {isOwner ? (
        <NewBuildContainer>
          <NewBuildLink to="/build/new">+ Create New Build</NewBuildLink>
        </NewBuildContainer>
      ) : null}
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
  if (query.isPending) return <LoadingAnimation size={40} />;
  if (query.isError) {
    return (
      <ErrorMessage onRetry={() => void query.refetch()}>{errorMessage(query.error)}</ErrorMessage>
    );
  }
  if (query.data.length === 0) return <Empty>{empty}</Empty>;
  return <BuildsList builds={query.data} />;
}

const Container = styled(FlexGroup)`
  align-items: center;
  width: 100%;
`;

const HeaderContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  margin-bottom: ${SPACE_LG};
`;

const Header = styled.h1`
  color: ${COLOR_LIGHTEST_GREEN};
  font-size: 26px;
  margin: 0 0 6px;
  overflow-wrap: anywhere;
  text-align: center;
`;

const TextButton = styled.button`
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  text-decoration: underline;
`;

const Notice = styled.div`
  align-items: center;
  border: 1px solid ${COLOR_LIGHT_GREEN};
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACE_SM} ${SPACE_LG};
  justify-content: center;
  margin-bottom: ${SPACE_LG};
  padding: ${SPACE_SM} ${SPACE_LG};
`;

const RenameForm = styled.form`
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: ${SPACE_SM};
  margin-bottom: ${SPACE_LG};
`;

const NameInput = styled.div`
  width: 260px;
`;

const Spaced = styled(Button)`
  margin-left: ${SPACE_LG};
`;

const Tabs = styled.div`
  display: flex;
  margin-bottom: ${SPACE_LG};
`;

const TabButton = styled.button<{ $active: boolean }>`
  background-color: ${({ $active }) => ($active ? COLOR_LIGHT_GREEN : COLOR_GREEN)};
  border: 1px solid ${COLOR_LIGHT_GREEN};
  color: ${COLOR_GOLD};
  cursor: pointer;
  font: inherit;
  font-size: 18px;
  padding: 8px ${SPACE_LG};

  &:focus-visible {
    outline: 2px solid ${COLOR_GOLD};
  }
`;

const Panel = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  width: 95%;
`;

const Empty = styled.p`
  font-size: 20px;
`;

const NewBuildContainer = styled(FlexGroup)`
  justify-content: center;
  margin-bottom: ${SPACE_LG};
  width: 100%;
`;

const NewBuildLink = styled(Link)`
  color: ${COLOR_LIGHTEST_GREEN};
  font-size: 20px;
  font-weight: bold;
`;

export default Profile;
