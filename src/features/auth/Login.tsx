import { useState, type FormEvent } from 'react';
import styled from 'styled-components';
import TextInput from '@/components/ui/TextInput';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { errorMessage, sendPasswordReset, signIn } from '@/lib/firebase';
import { BELOW_800 } from '@/theme';
import { AuthField, AuthForm, AuthNotice, LinkButton } from './styles';

/** Email + password sign-in (and "Forgot password?"), shown in the slide-down panel. */
function Login({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await signIn(email, password);
      setPassword('');
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    setError('');
    setNotice('');
    if (!email.trim()) {
      setError('Enter your email above, then choose “Forgot password?” again.');
      return;
    }
    try {
      await sendPasswordReset(email);
      setNotice('If there is an account for that email, a reset link is on its way.');
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <AuthForm onSubmit={handleSubmit} aria-label="Log in">
      <Fields>
        <AuthField>
          <label htmlFor="login-email">Email</label>
          <TextInput
            id="login-email"
            autoComplete="email"
            onChange={setEmail}
            required
            type="email"
            value={email}
          />
        </AuthField>
        <AuthField>
          <label htmlFor="login-password">Password</label>
          <TextInput
            id="login-password"
            autoComplete="current-password"
            onChange={setPassword}
            required
            type="password"
            value={password}
          />
        </AuthField>
        <Button type="submit" disabled={busy || !email || !password}>
          Login
        </Button>
      </Fields>
      <LinkButton type="button" onClick={handleReset}>
        Forgot password?
      </LinkButton>
      <ErrorMessage>{error}</ErrorMessage>
      {notice ? <AuthNotice role="status">{notice}</AuthNotice> : null}
    </AuthForm>
  );
}

const Fields = styled.div`
  align-items: flex-end;
  display: flex;
  gap: 20px;

  @media ${BELOW_800} {
    align-items: center;
    flex-direction: column;
    gap: 10px;
  }
`;

export default Login;
