import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import isEmpty from 'lodash/isEmpty';
import styled from 'styled-components';
import TextInput from './common/TextInput';
import Button from './common/Button';
import FlexGroup from './common/FlexGroup';
import useAuth from '../hooks/useAuth';
import { login } from '../firebase';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth) {
      navigate('/');
    }
  }, [auth, navigate]);

  const handleEmailChange = (value) => {
    setEmail(value);
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
  };

  const handleLogin = useCallback(() => {
    const run = async () => {
      const success = await login(email, password);
      if (success) {
        setEmail('');
        setPassword('');
      }
    };
    run();
  }, [email, password]);

  const handleKeyDown = useCallback(({ code }) => {
    if (code === 'Enter' && !isEmpty(email) && !isEmpty(password)) {
      handleLogin();
    }
  }, [handleLogin, email, password]);

  useEffect(() => {
    if (document) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      if (document) {
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [handleKeyDown]);

  const canRegister = !isEmpty(email) && !isEmpty(password);

  if (auth) {
    return null;
  }

  return (
    <Container
      vertical
    >
      <Label>
        Email
      </Label>
      <TextInput
        onChange={handleEmailChange}
        type="email"
        value={email}
      />
      <Spacer />
      <Label>
        Password
      </Label>
      <TextInput
        onChange={handlePasswordChange}
        type="password"
        value={password}
      />
      <Spacer />
      <Button
        disabled={!canRegister}
        onClick={handleLogin}
      >
        Login
      </Button>
    </Container>
  );
}

const Container = styled(FlexGroup)`
  align-items: center;
  margin-top: 30px;
  padding-left: 25%;
  padding-right: 25%;
`;

const Label = styled(FlexGroup)`
  font-size: 14px;
  font-weight: bold;
  text-align: left;
  text-transform: uppercase;
  margin-bottom: 5px;
`;

const Spacer = styled.div`
  height: 40px;
`;

export default Login;
