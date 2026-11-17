import { useSearchParams } from 'react-router';
import PageMessage from '@/components/ui/PageMessage';
import { TextLink } from '@/components/ui/TextButton';
import ResetPassword from './ResetPassword';
import VerifyEmail from './VerifyEmail';

/**
 * `/auth/action` (T43): where the links in Firebase's emails land (the owner points the templates'
 * action URL here). `mode` says what the link is for, `oobCode` is its one-time code. Reset links
 * and verification links (the account's own, or the new address of an email change) are handled;
 * anything else says it can't be used here.
 */
function ActionPage() {
  const [params] = useSearchParams();
  const mode = params.get('mode');
  const code = params.get('oobCode');

  if (code && mode === 'resetPassword') return <ResetPassword code={code} />;
  if (code && (mode === 'verifyEmail' || mode === 'verifyAndChangeEmail')) {
    return <VerifyEmail code={code} change={mode === 'verifyAndChangeEmail'} />;
  }
  return (
    <PageMessage title="This link can’t be used">
      <p>It’s incomplete, or it isn’t a kind of link this site handles. Ask for a new one.</p>
      <TextLink to="/">Browse builds</TextLink>
    </PageMessage>
  );
}

export default ActionPage;
