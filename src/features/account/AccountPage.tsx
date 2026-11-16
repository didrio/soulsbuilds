import { useEffect } from 'react';
import styled from 'styled-components';
import { useOpenAuthDialog } from '@/app/authDialog';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import PageHero from '@/components/ui/PageHero';
import PageMessage from '@/components/ui/PageMessage';
import { TextLink } from '@/components/ui/TextButton';
import useAuth from '@/features/auth/useAuth';
import { useUserProfile } from '@/features/profile/queries';
import { errorMessage, signOut } from '@/lib/firebase';
import { SPACE_LG, SPACE_MD, SPACE_REGION } from '@/theme';
import DeleteAccount from './DeleteAccount';
import DisplayNameSection from './DisplayNameSection';
import EmailSection from './EmailSection';
import SignInSection from './SignInSection';

/**
 * `/account` (T31): the signed-in user's settings, kept apart from their public profile. Display
 * name, email (verification, change), sign-in methods (change or set a password), Log out and
 * Delete account. Nothing here is public.
 */
function AccountPage() {
  const { loading, uid, refreshUser } = useAuth();
  const openAuthDialog = useOpenAuthDialog();
  const profile = useUserProfile(uid);

  // Pick up a verification (or anything else) done in another tab since the user last loaded.
  useEffect(() => {
    if (uid) void refreshUser();
  }, [uid, refreshUser]);

  if (loading) return <PageMessage loading />;
  if (!uid) {
    return (
      <PageMessage title="Log in to see your account">
        <Button onClick={() => openAuthDialog('login')}>Log in</Button>
      </PageMessage>
    );
  }
  if (profile.isPending) return <PageMessage loading />;
  if (profile.isError) {
    return (
      <PageMessage title="Couldn’t load your account">
        <ErrorMessage onRetry={() => void profile.refetch()}>
          {errorMessage(profile.error)}
        </ErrorMessage>
      </PageMessage>
    );
  }
  if (!profile.data) {
    return (
      <PageMessage title="Account not found">
        <DeleteAccount finishing />
      </PageMessage>
    );
  }

  return (
    <Page>
      <PageHero title="Account" tagline="Only you can see this page.">
        <HeroActions>
          <TextLink to={`/user/${uid}`}>View your public profile</TextLink>
          <Button variant="secondary" onClick={() => void signOut()}>
            Log out
          </Button>
        </HeroActions>
      </PageHero>
      <Sections>
        <DisplayNameSection profile={profile.data} />
        <EmailSection />
        <SignInSection />
        <DeleteAccount />
      </Sections>
    </Page>
  );
}

const Page = styled.div`
  margin: 0 auto;
  max-width: 720px;
`;

const HeroActions = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACE_MD} ${SPACE_LG};
  margin-top: ${SPACE_MD};
`;

const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${SPACE_LG};
  margin-top: ${SPACE_REGION};
`;

export default AccountPage;
