import { useState, type FormEvent } from 'react';
import styled from 'styled-components';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { TextButton } from '@/components/ui/TextButton';
import { signIn } from '@/lib/firebase';
import FormField from './FormField';
import GoogleButton from './GoogleButton';
import { AuthDivider, AuthForm, AuthSwitch } from './styles';
import { authErrors, useFieldErrors, type FieldErrors } from './useFieldErrors';

interface LoginProps {
  /** Shared with the other views, so "Forgot password?" and "Create an account" keep it. */
  email: string;
  onEmail: (email: string) => void;
  onDone: (uid: string) => Promise<void>;
  onForgot: () => void;
  onSwitch: () => void;
}

/** Log in: Google, or email and password (T30), in the auth dialog. */
function Login({ email, onEmail, onDone, onForgot, onSwitch }: LoginProps) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const { errors, show, clear, ref, edit } = useFieldErrors(['email', 'password'] as const);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const missing: FieldErrors<'email' | 'password'> = {};
    if (!email.trim()) missing.email = 'Enter your email address.';
    if (!password) missing.password = 'Enter your password.';
    if (Object.keys(missing).length > 0) {
      show(missing);
      return;
    }
    setBusy(true);
    clear();
    try {
      await onDone(await signIn(email, password));
    } catch (error) {
      show(authErrors(error));
      setBusy(false);
    }
  };

  return (
    <AuthForm onSubmit={handleSubmit} aria-label="Log in" noValidate>
      <GoogleButton onDone={onDone} onError={(form) => show(form ? { form } : {})} />
      <AuthDivider>or</AuthDivider>
      <FormField
        id="login-email"
        label="Email"
        ref={ref('email')}
        autoComplete="username"
        error={errors.email}
        onChange={edit('email', onEmail)}
        type="email"
        value={email}
      />
      <FormField
        id="login-password"
        label="Password"
        password
        ref={ref('password')}
        autoComplete="current-password"
        error={errors.password}
        onChange={edit('password', setPassword)}
        value={password}
      />
      <Forgot>
        <TextButton onClick={onForgot}>Forgot password?</TextButton>
      </Forgot>
      <ErrorMessage>{errors.form}</ErrorMessage>
      <Button type="submit" disabled={busy}>
        {busy ? 'Logging in…' : 'Log in'}
      </Button>
      <AuthSwitch>
        New here?<TextButton onClick={onSwitch}>Create an account</TextButton>
      </AuthSwitch>
    </AuthForm>
  );
}

const Forgot = styled.div`
  display: flex;
  justify-content: flex-end;
  margin: -14px -4px -10px 0;
`;

export default Login;
