import { useState } from 'react';
import styled from 'styled-components';
import Button from '@/components/ui/Button';
import { GoogleIcon } from '@/components/ui/icons';
import { errorMessage, signInWithGoogle } from '@/lib/firebase';

interface GoogleButtonProps {
  /** Signed in: continue (the dialog checks for a profile next). */
  onDone: (uid: string) => Promise<void>;
  onError: (message: string) => void;
}

/**
 * "Continue with Google" (T30): signs in or up in one click, in a popup. Closing the popup does
 * nothing; anything else shows as the form's error.
 */
function GoogleButton({ onDone, onError }: GoogleButtonProps) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    onError('');
    try {
      const uid = await signInWithGoogle();
      if (uid) await onDone(uid);
    } catch (error) {
      onError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Wide variant="secondary" disabled={busy} onClick={() => void handleClick()}>
      <GoogleIcon />
      {busy ? 'Waiting for Google…' : 'Continue with Google'}
    </Wide>
  );
}

const Wide = styled(Button)`
  gap: 10px;
  width: 100%;
`;

export default GoogleButton;
