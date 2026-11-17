import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useOpenAuthDialog } from '@/app/authDialog';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import PageMessage from '@/components/ui/PageMessage';
import { TextLink } from '@/components/ui/TextButton';
import { errorMessage, isDeadLink, resendVerificationEmail } from '@/lib/firebase';
import useAuth from '../useAuth';
import { AuthNotice } from '../styles';
import ActionCard from './ActionCard';
import { useVerifyLink } from './queries';

/** An expired or used link: say so, and the way to a new one (Resend, or start the change again). */
function DeadLink({ change }: { change: boolean }) {
  const { loading, uid } = useAuth();
  const openAuthDialog = useOpenAuthDialog();
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const resend = async () => {
    setError('');
    try {
      await resendVerificationEmail();
      setSent(true);
    } catch (failure) {
      setError(errorMessage(failure));
    }
  };

  return (
    <ActionCard title="This link has expired">
      <p>
        {change
          ? 'It expired, or it was already used. Start the change again from your account page.'
          : 'It expired, or it was already used (if you’ve verified already, you’re all set).'}
      </p>
      {change ? (
        <TextLink to="/account">Go to your account</TextLink>
      ) : loading ? null : uid ? (
        <>
          <Button onClick={() => void resend()} disabled={sent}>
            {sent ? 'Link sent' : 'Send a new link'}
          </Button>
          {sent ? <AuthNotice role="status">A new link is on its way.</AuthNotice> : null}
          <ErrorMessage>{error}</ErrorMessage>
        </>
      ) : (
        <>
          <p>Log in, then choose Resend on your account page.</p>
          <Button onClick={() => openAuthDialog('login', () => void navigate('/account'))}>
            Log in
          </Button>
        </>
      )}
    </ActionCard>
  );
}

/**
 * The page behind a verification email (T43), and behind the link `changeEmail` sends to a new
 * address (`verifyAndChangeEmail`): applies the link once and says what happened.
 */
function VerifyEmail({ code, change }: { code: string; change: boolean }) {
  const link = useVerifyLink(code);
  const { loading, uid } = useAuth();
  const openAuthDialog = useOpenAuthDialog();

  if (link.isPending) return <PageMessage loading />;
  if (link.isError && isDeadLink(link.error)) return <DeadLink change={change} />;
  if (link.isError) {
    return (
      <PageMessage title="Couldn’t check your link">
        <ErrorMessage onRetry={() => void link.refetch()}>{errorMessage(link.error)}</ErrorMessage>
      </PageMessage>
    );
  }
  return (
    <ActionCard title={change ? 'Email changed' : 'Email verified'}>
      <p>
        {change
          ? 'Your account has its new email address. Log in with it.'
          : 'Thanks, your email address is confirmed.'}
      </p>
      {loading ? null : uid && !change ? (
        <TextLink to="/account">Go to your account</TextLink>
      ) : (
        <Button onClick={() => openAuthDialog('login')}>Log in</Button>
      )}
      <TextLink to="/">Browse builds</TextLink>
    </ActionCard>
  );
}

export default VerifyEmail;
