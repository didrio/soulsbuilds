import { useState, type FormEvent } from 'react';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { TextButton } from '@/components/ui/TextButton';
import { sendPasswordReset } from '@/lib/firebase';
import FormField from './FormField';
import { AuthForm, AuthLead, AuthNotice, AuthSwitch } from './styles';
import { authErrors, useFieldErrors } from './useFieldErrors';

interface ForgotPasswordProps {
  /** Prefilled from the log-in form. */
  email: string;
  onEmail: (email: string) => void;
  onBack: () => void;
}

/**
 * "Forgot password?" (T30): its own view in the auth dialog. The answer is the same whether or not
 * the email has an account, so the form can't be used to find out who has one.
 */
function ForgotPassword({ email, onEmail, onBack }: ForgotPasswordProps) {
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const { errors, show, clear, ref, edit } = useFieldErrors(['email'] as const);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!email.trim()) {
      show({ email: 'Enter your email address.' });
      return;
    }
    setBusy(true);
    clear();
    setSentTo('');
    try {
      await sendPasswordReset(email);
      setSentTo(email.trim());
    } catch (error) {
      show(authErrors(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthForm onSubmit={handleSubmit} aria-label="Reset your password" noValidate>
      <AuthLead>
        Enter your account’s email and we’ll send you a link to choose a new password.
      </AuthLead>
      <FormField
        id="reset-email"
        label="Email"
        ref={ref('email')}
        autoComplete="username"
        error={errors.email}
        onChange={edit('email', onEmail)}
        type="email"
        value={email}
      />
      <ErrorMessage>{errors.form}</ErrorMessage>
      {sentTo ? (
        <AuthNotice role="status">
          If there’s an account for {sentTo}, a reset link is on its way. Check your spam folder
          too.
        </AuthNotice>
      ) : null}
      <Button type="submit" disabled={busy}>
        {busy ? 'Sending…' : sentTo ? 'Send again' : 'Send reset link'}
      </Button>
      <AuthSwitch>
        <TextButton onClick={onBack}>Back to log in</TextButton>
      </AuthSwitch>
    </AuthForm>
  );
}

export default ForgotPassword;
