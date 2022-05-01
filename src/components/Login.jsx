import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import isEmpty from 'lodash/isEmpty';
import styled from 'styled-components';
import TextInput from './common/TextInput';
import Button from './common/Button';
import FlexGroup from './common/FlexGroup';
import useAuth from '../hooks/useAuth';
import { login } from '../firebase';

function Login({ onSubmit }) {
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
        onSubmit();
      }
    };
    run();
  }, [email, password, onSubmit]);

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
    <Container>
      <Input>
        <Label>
          Email
        </Label>
        <TextInput
          onChange={handleEmailChange}
          type="email"
          value={email}
        />
      </Input>
      <Input>
        <Label>
          Password
        </Label>

        <TextInput
          onChange={handlePasswordChange}
          type="password"
          value={password}
        />
      </Input>
      <RegisterButton
        disabled={!canRegister}
        onClick={handleLogin}
      >
        Login
      </RegisterButton>
    </Container>
  );
}

const Container = styled(FlexGroup)`
  align-items: center;
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
`;

const RegisterButton = styled(Button)`
  margin-bottom: -22px;
`;

Login.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

export default Login;
