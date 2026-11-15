import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import TextInput from '@/components/ui/TextInput';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { errorMessage, signUp } from '@/lib/firebase';
import { LIMITS } from '@/lib/models';
import { queryKeys } from '@/lib/queryKeys';
import { BELOW_800 } from '@/theme';
import { AuthField, AuthForm } from './styles';

/** Registration form (email, password, display name), shown in the slide-down panel. */
function SignUp({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const canRegister = email.trim() !== '' && password !== '' && name.trim() !== '' && !busy;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canRegister) return;
    setBusy(true);
    setError('');
    try {
      const uid = await signUp(email, password, name);
      await queryClient.invalidateQueries({ queryKey: queryKeys.user(uid) });
      onDone();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <AuthForm onSubmit={handleSubmit} aria-label="Register">
      <Fields>
        <AuthField>
          <label htmlFor="signup-email">Email</label>
          <TextInput
            id="signup-email"
            autoComplete="email"
            onChange={setEmail}
            required
            type="email"
            value={email}
          />
        </AuthField>
        <AuthField>
          <label htmlFor="signup-password">Password</label>
          <TextInput
            id="signup-password"
            autoComplete="new-password"
            minLength={6}
            onChange={setPassword}
            required
            type="password"
            value={password}
          />
        </AuthField>
        <AuthField>
          <label htmlFor="signup-name">Display name</label>
          <TextInput
            id="signup-name"
            autoComplete="nickname"
            maxLength={LIMITS.displayName}
            onChange={setName}
            required
            value={name}
          />
        </AuthField>
        <Button type="submit" disabled={!canRegister}>
          {busy ? 'Registering…' : 'Register'}
        </Button>
      </Fields>
      <ErrorMessage>{error}</ErrorMessage>
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

export default SignUp;
