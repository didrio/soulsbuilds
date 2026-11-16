import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { TextButton } from '@/components/ui/TextButton';
import { signUp } from '@/lib/firebase';
import { LIMITS } from '@/lib/models';
import FormField from './FormField';
import GoogleButton from './GoogleButton';
import { AuthDivider, AuthFinePrint, AuthForm, AuthSwitch } from './styles';
import { authErrors, useFieldErrors, type FieldErrors } from './useFieldErrors';

interface SignUpProps {
  email: string;
  onEmail: (email: string) => void;
  onDone: (uid: string) => Promise<void>;
  onSwitch: () => void;
}

/**
 * Create an account: Google, or email and password (T30). The display name comes next, in its own
 * step, once the account exists.
 */
function SignUp({ email, onEmail, onDone, onSwitch }: SignUpProps) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const { errors, show, clear, ref, edit } = useFieldErrors(['email', 'password'] as const);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const invalid: FieldErrors<'email' | 'password'> = {};
    if (!email.trim()) invalid.email = 'Enter your email address.';
    if (password.length < LIMITS.password) {
      invalid.password = `Choose a password of at least ${LIMITS.password} characters.`;
    }
    if (Object.keys(invalid).length > 0) {
      show(invalid);
      return;
    }
    setBusy(true);
    clear();
    try {
      await onDone(await signUp(email, password));
    } catch (error) {
      show(authErrors(error));
      setBusy(false);
    }
  };

  return (
    <AuthForm onSubmit={handleSubmit} aria-label="Sign up" noValidate>
      <GoogleButton onDone={onDone} onError={(form) => show(form ? { form } : {})} />
      <AuthDivider>or</AuthDivider>
      <FormField
        id="signup-email"
        label="Email"
        ref={ref('email')}
        autoComplete="email"
        error={errors.email}
        onChange={edit('email', onEmail)}
        type="email"
        value={email}
      />
      <FormField
        id="signup-password"
        label="Password"
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
        {busy ? 'Creating account…' : 'Create account'}
      </Button>
      <AuthFinePrint>
        By creating an account you agree to the{' '}
        <Link to="/terms" target="_blank">
          Terms
        </Link>{' '}
        and{' '}
        <Link to="/privacy" target="_blank">
          Privacy policy
        </Link>
        .
      </AuthFinePrint>
      <AuthSwitch>
        Already have an account?<TextButton onClick={onSwitch}>Log in</TextButton>
      </AuthSwitch>
    </AuthForm>
  );
}

export default SignUp;
