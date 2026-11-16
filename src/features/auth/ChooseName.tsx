import { useState, type FormEvent } from 'react';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { TextButton } from '@/components/ui/TextButton';
import { createUserProfile, errorMessage } from '@/lib/firebase';
import { LIMITS } from '@/lib/models';
import FormField from './FormField';
import { AuthForm, AuthLead, AuthSwitch } from './styles';
import { useFieldErrors } from './useFieldErrors';

interface ChooseNameProps {
  uid: string;
  /** The profile exists: continue. */
  onDone: (uid: string) => Promise<void>;
  onLogOut: () => void;
}

/**
 * "Choose a display name" (T30): the step after creating an account, and for any signed-in account
 * without a profile. It creates `users/{uid}`; the name is never taken from Google.
 */
function ChooseName({ uid, onDone, onLogOut }: ChooseNameProps) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const { errors, show, clear, ref, edit } = useFieldErrors(['name'] as const);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!name.trim()) {
      show({ name: 'Choose a name to show on your builds.' });
      return;
    }
    setBusy(true);
    clear();
    try {
      await createUserProfile(uid, name);
      await onDone(uid);
    } catch (error) {
      show({ form: errorMessage(error) });
      setBusy(false);
    }
  };

  return (
    <AuthForm onSubmit={handleSubmit} aria-label="Choose a display name" noValidate>
      <AuthLead>
        It’s shown on your builds and comments. You can change it later in your account settings.
      </AuthLead>
      <FormField
        id="choose-name"
        label="Display name"
        ref={ref('name')}
        autoComplete="nickname"
        error={errors.name}
        maxLength={LIMITS.displayName}
        onChange={edit('name', setName)}
        value={name}
      />
      <ErrorMessage>{errors.form}</ErrorMessage>
      <Button type="submit" disabled={busy}>
        {busy ? 'Saving…' : 'Continue'}
      </Button>
      <AuthSwitch>
        Not now?<TextButton onClick={onLogOut}>Log out</TextButton>
      </AuthSwitch>
    </AuthForm>
  );
}

export default ChooseName;
