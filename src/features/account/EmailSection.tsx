import { useEffect, useId, useState, type FormEvent } from 'react';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import SectionHeading from '@/components/ui/SectionHeading';
import { TextButton } from '@/components/ui/TextButton';
import FormField from '@/features/auth/FormField';
import { AuthNotice } from '@/features/auth/styles';
import { useFieldErrors } from '@/features/auth/useFieldErrors';
import useAuth from '@/features/auth/useAuth';
import { changeEmail, errorMessage, resendVerificationEmail } from '@/lib/firebase';
import { changeErrors } from './errors';
import {
  Actions,
  Row,
  RowLabel,
  RowStatus,
  RowValue,
  Section,
  SectionLead,
  SettingsForm,
} from './styles';

/**
 * The account's email (T31): whether it's verified (with Resend, moved from the profile), and for an
 * email + password account, changing it by a link sent to the new address. A Google account's
 * address belongs to Google, so it has no change form.
 */
function EmailSection() {
  const { email, emailVerified, providers } = useAuth();
  const withPassword = providers.includes('password');
  const formId = useId();
  const [changing, setChanging] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  return (
    <Section aria-labelledby="account-email">
      <SectionHeading id="account-email">Email</SectionHeading>
      <SectionLead>
        {withPassword
          ? 'Only you see it. It’s how you log in and reset your password.'
          : 'Only you see it. It comes from your Google account.'}
      </SectionLead>
      <Row>
        <RowLabel>Email</RowLabel>
        <RowValue>{email}</RowValue>
        {emailVerified ? <RowStatus>Verified</RowStatus> : null}
        {withPassword ? (
          <TextButton
            aria-expanded={changing}
            aria-controls={changing ? formId : undefined}
            onClick={() => setChanging(!changing)}>
            Change email
          </TextButton>
        ) : null}
      </Row>
      {emailVerified ? null : <VerifyEmailNotice />}
      {sentTo ? (
        <AuthNotice role="status">
          We sent a link to {sentTo}. Your email changes when you open it; then log in with the new
          address.
        </AuthNotice>
      ) : null}
      {changing && email ? (
        <ChangeEmailForm
          id={formId}
          current={email}
          onSent={(to) => {
            setSentTo(to);
            setChanging(false);
          }}
          onCancel={() => setChanging(false)}
        />
      ) : null}
    </Section>
  );
}

/** Send-only verification (decision "Email verification"): nothing is gated on it. */
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
    <Row role="status">
      <RowLabel>Not verified</RowLabel>
      <RowValue>
        {status === 'sent'
          ? 'Verification email sent. Check your inbox.'
          : 'We sent you a link when you signed up.'}
      </RowValue>
      <TextButton disabled={status === 'sending'} onClick={() => void resend()}>
        Resend email
      </TextButton>
      <ErrorMessage>{error}</ErrorMessage>
    </Row>
  );
}

function ChangeEmailForm({
  id,
  current,
  onSent,
  onCancel,
}: {
  id: string;
  current: string;
  onSent: (to: string) => void;
  onCancel: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const { errors, show, clear, ref, edit } = useFieldErrors(['email', 'current'] as const);
  // Opened by "Change email": start in its first field.
  useEffect(() => document.getElementById('account-new-email')?.focus(), []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const to = email.trim();
    const problems = {
      email: !to
        ? 'Enter your new email address.'
        : to.toLowerCase() === current.toLowerCase()
          ? 'That’s already your email.'
          : undefined,
      current: password ? undefined : 'Enter your current password.',
    };
    if (problems.email || problems.current) {
      show(problems);
      return;
    }
    setBusy(true);
    clear();
    try {
      await changeEmail(to, password);
      onSent(to);
    } catch (error) {
      show(changeErrors(error));
      setBusy(false);
    }
  };

  return (
    <SettingsForm id={id} onSubmit={handleSubmit} aria-label="Change email" noValidate>
      <FormField
        id="account-new-email"
        label="New email"
        ref={ref('email')}
        autoComplete="email"
        error={errors.email}
        onChange={edit('email', setEmail)}
        type="email"
        value={email}
      />
      <FormField
        id="account-email-password"
        label="Current password"
        ref={ref('current')}
        autoComplete="current-password"
        error={errors.current}
        onChange={edit('current', setPassword)}
        password
        value={password}
      />
      <ErrorMessage>{errors.form}</ErrorMessage>
      <Actions>
        <Button type="submit" disabled={busy}>
          {busy ? 'Sending…' : 'Send link'}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </Actions>
    </SettingsForm>
  );
}

export default EmailSection;
