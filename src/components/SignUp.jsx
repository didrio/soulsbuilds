import PropTypes from 'prop-types';
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

function SignUp({ onSubmit }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
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

  const handleNameChange = (value) => {
    setName(value);
  };

  const handleSignUp = useCallback(() => {
    setIsSubmitting(true);
    const run = async () => {
      const success = await createUser(email, password, {
        ...DEFAULT_USER_DATA,
        email,
        name,
      });
      if (success) {
        onSubmit();
      }
      if (!success) {
        setIsSubmitting(false);
      }
    };
    run();
  }, [email, password, name, onSubmit]);

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

  const canRegister = !isEmpty(email) && !isEmpty(password) && !isEmpty(password);

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
      <Input>
        <Label>
          Display Name
        </Label>
        <TextInput
          onChange={handleNameChange}
          value={name}
        />
      </Input>
      <RegisterButton
        disabled={!canRegister}
        onClick={handleSignUp}
      >
        Register
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

const LoadingContainer = styled(FlexGroup)`
  width: 100%;
  justify-content: center;
  margin-top: 100px;
`;

const Input = styled(FlexGroup)`
  flex-direction: column;
  margin-right: 20px;
  width: 200px;
`;

const RegisterButton = styled(Button)`
  margin-bottom: -22px;
`;

SignUp.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

export default SignUp;
