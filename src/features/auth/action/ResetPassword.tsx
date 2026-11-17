import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useOpenAuthDialog } from '@/app/authDialog';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import PageMessage from '@/components/ui/PageMessage';
import { confirmNewPassword, errorMessage, isDeadLink } from '@/lib/firebase';
import { LIMITS } from '@/lib/models';
import FormField from '../FormField';
import ForgotPassword from '../ForgotPassword';
import { AuthForm, AuthLead } from '../styles';
import { authErrors, useFieldErrors } from '../useFieldErrors';
import ActionCard from './ActionCard';
import { useResetLink } from './queries';

/** A reset link that's expired or used: say so, and ask for a new one right here. */
function ExpiredReset() {
  const openAuthDialog = useOpenAuthDialog();
  const [email, setEmail] = useState('');
  return (
    <ActionCard title="This link has expired">
      <p>Reset links work once, and only for a while.</p>
      <ForgotPassword email={email} onEmail={setEmail} onBack={() => openAuthDialog('login')} />
    </ActionCard>
  );
}

/**
 * The page behind a password-reset email (T43): the new-password form for the account the link
 * names, then "Log in". The link is checked first, so a dead one never shows a form.
 */
function ResetPassword({ code }: { code: string }) {
  const link = useResetLink(code);
  const openAuthDialog = useOpenAuthDialog();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [dead, setDead] = useState(false);
  const { errors, show, clear, ref, edit } = useFieldErrors(['password'] as const);

  if (link.isPending) return <PageMessage loading />;
  if (dead || (link.isError && isDeadLink(link.error))) return <ExpiredReset />;
  if (link.isError) {
    return (
      <PageMessage title="Couldn’t check your link">
        <ErrorMessage onRetry={() => void link.refetch()}>{errorMessage(link.error)}</ErrorMessage>
      </PageMessage>
    );
  }
  if (done) {
    return (
      <ActionCard title="Password changed">
        <p>Your new password is set. Log in with it.</p>
        <Button onClick={() => openAuthDialog('login', () => void navigate('/'))}>Log in</Button>
      </ActionCard>
    );
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (password.length < LIMITS.password) {
      show({ password: `Choose a password of at least ${LIMITS.password} characters.` });
      return;
    }
    setBusy(true);
    clear();
    try {
      await confirmNewPassword(code, password);
      setDone(true);
    } catch (error) {
      if (isDeadLink(error)) setDead(true);
      else show(authErrors(error));
      setBusy(false);
    }
  };

  return (
    <ActionCard title="Choose a new password">
      <AuthForm onSubmit={handleSubmit} aria-label="Password reset" noValidate>
        <AuthLead>For {link.data}.</AuthLead>
        <FormField
          id="new-password"
          label="New password"
          password
          ref={ref('password')}
          autoComplete="new-password"
          error={errors.password}
          hint={errors.password ? undefined : `At least ${LIMITS.password} characters.`}
          onChange={edit('password', setPassword)}
          value={password}
        />
        <ErrorMessage>{errors.form}</ErrorMessage>
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save password'}
        </Button>
      </AuthForm>
    </ActionCard>
  );
}

export default ResetPassword;
