import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import TextInput from '@/components/ui/TextInput';
import Button from '@/components/ui/Button';
import FlexGroup from '@/components/ui/FlexGroup';
import useAuth from './useAuth';
import { login } from '@/lib/firebase';
import { BELOW_800 } from '@/theme';

/** Email + password sign-in, shown in the slide-down panel. Calls `onSubmit` on success. */
function Login({ onSubmit }: { onSubmit: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth) {
      navigate('/');
    }
  }, [auth, navigate]);

  const handleEmailChange = (value: string) => {
    setEmail(value);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
  };

  const handleLogin = useCallback(() => {
    const run = async () => {
      const success = await login(email, password);
      if (success) {
        setEmail('');
        setPassword('');
        onSubmit();
      }
    };
    run();
  }, [email, password, onSubmit]);

  // A global Enter handler rather than a <form> (T5).
  const handleKeyDown = useCallback(
    ({ code }: KeyboardEvent) => {
      if (code === 'Enter' && email.length > 0 && password.length > 0) {
        handleLogin();
      }
    },
    [handleLogin, email, password],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const canRegister = email.length > 0 && password.length > 0;

  if (auth) {
    return null;
  }

  return (
    <Container>
      <Input>
        <Label>Email</Label>
        <TextInput onChange={handleEmailChange} type="email" value={email} />
      </Input>
      <Input>
        <Label>Password</Label>

        <TextInput onChange={handlePasswordChange} type="password" value={password} />
      </Input>
      <RegisterButton disabled={!canRegister} onClick={handleLogin}>
        Login
      </RegisterButton>
    </Container>
  );
}

const Container = styled(FlexGroup)`
  align-items: center;
  justify-content: center;

  @media ${BELOW_800} {
    flex-direction: column;
    margin-top: -10px;
  }
`;

const Label = styled(FlexGroup)`
  font-size: 13px;
  font-weight: bold;
  text-transform: uppercase;
  margin-bottom: 2px;
`;

const Input = styled(FlexGroup)`
  flex-direction: column;
  margin-right: 20px;
  width: 200px;

  @media ${BELOW_800} {
    margin-top: 10px;
  }
`;

const RegisterButton = styled(Button)`
  margin-bottom: -22px;

  @media ${BELOW_800} {
    margin-bottom: 0px;
    margin-top: 20px;
  }
`;

export default Login;
