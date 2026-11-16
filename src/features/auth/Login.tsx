import { useState, type FormEvent } from 'react';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import TextInput from '@/components/ui/TextInput';
import { TextButton } from '@/components/ui/TextButton';
import { errorMessage, sendPasswordReset, signIn } from '@/lib/firebase';
import styled from 'styled-components';
import { AuthField, AuthForm, AuthNotice, AuthSwitch } from './styles';

/** Email + password sign-in (and "Forgot password?"), shown in the auth dialog. */
function Login({ onDone, onSwitch }: { onDone: (uid: string) => void; onSwitch: () => void }) {
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
      const uid = await signIn(email, password);
      setPassword('');
      onDone(uid);
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
      <Forgot>
        <TextButton onClick={() => void handleReset()}>Forgot password?</TextButton>
      </Forgot>
      <ErrorMessage>{error}</ErrorMessage>
      {notice ? <AuthNotice role="status">{notice}</AuthNotice> : null}
      <Button type="submit" disabled={busy || !email || !password}>
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
