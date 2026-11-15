import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import TextInput from '@/components/ui/TextInput';
import Button from '@/components/ui/Button';
import FlexGroup from '@/components/ui/FlexGroup';
import LoadingAnimation from '@/components/ui/LoadingAnimation';
import { createUser, DEFAULT_USER_DATA } from '@/lib/firebase';
import { BELOW_800 } from '@/theme';
import useAuth from './useAuth';

/** Registration form, shown in the slide-down panel. Calls `onSubmit` on success. */
function SignUp({ onSubmit }: { onSubmit: () => void }) {
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

  const handleEmailChange = (value: string) => {
    setEmail(value);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
  };

  const handleNameChange = (value: string) => {
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

  // A global Enter handler rather than a <form> (T5).
  const handleKeyDown = useCallback(
    ({ code }: KeyboardEvent) => {
      if (code === 'Enter' && email.length > 0 && password.length > 0) {
        handleSignUp();
      }
    },
    [handleSignUp, email, password],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Checks the password twice and never the name (T5).
  const canRegister = email.length > 0 && password.length > 0 && password.length > 0;

  if (auth) {
    return null;
  }

  if (isSubmitting) {
    return (
      <LoadingContainer>
        <LoadingAnimation size={40} />
      </LoadingContainer>
    );
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
      <Input>
        <Label>Display Name</Label>
        <TextInput onChange={handleNameChange} value={name} />
      </Input>
      <RegisterButton disabled={!canRegister} onClick={handleSignUp}>
        Register
      </RegisterButton>
    </Container>
  );
}

const Container = styled(FlexGroup)`
  align-items: center;

  @media ${BELOW_800} {
    flex-direction: column;
  }
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

  @media ${BELOW_800} {
    margin-top: 10px;
  }
`;

const RegisterButton = styled(Button)`
  margin-bottom: -22px;

  @media ${BELOW_800} {
    margin-bottom: 0px;
    margin-top: 10px;
  }
`;

export default SignUp;
