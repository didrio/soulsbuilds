import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import isEmpty from 'lodash/isEmpty';
import styled from 'styled-components';
import TextInput from './common/TextInput';
import Button from './common/Button';
import FlexGroup from './common/FlexGroup';
import LoadingAnimation from './common/LoadingAnimation';
import {
  DEFAULT_USER_DATA,
} from '../constants';
import { createUser } from '../firebase';
import useAuth from '../hooks/useAuth';

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth) {
      navigate('/');
    }
  }, [navigate, auth]);

  const handleEmailChange = (value) => {
    setEmail(value);
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
  };

  const handleSignUp = useCallback(() => {
    setIsSubmitting(true);
    const run = async () => {
      const success = await createUser(email, password, {
        ...DEFAULT_USER_DATA,
        email,
      });
      if (!success) {
        setIsSubmitting(false);
      }
    };
    run();
  }, [email, password]);

  const handleKeyDown = useCallback(({ code }) => {
    if (code === 'Enter' && !isEmpty(email) && !isEmpty(password)) {
      handleSignUp();
    }
  }, [handleSignUp, email, password]);

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

  if (isSubmitting) {
    return (
      <LoadingContainer>
        <LoadingAnimation
          size={40}
        />
      </LoadingContainer>
    );
  }

  return (
    <FlexGroup
      vertical
    >
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
          onClick={handleSignUp}
        >
          Register
        </Button>
      </Container>
    </FlexGroup>
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

const LoadingContainer = styled(FlexGroup)`
  width: 100%;
  justify-content: center;
  margin-top: 100px;
`;

export default SignUp;
