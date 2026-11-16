import { useEffect, useId, useState, type FormEvent } from 'react';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import SectionHeading from '@/components/ui/SectionHeading';
import { TextButton } from '@/components/ui/TextButton';
import FormField from '@/features/auth/FormField';
import { AuthNotice } from '@/features/auth/styles';
import { authErrors, useFieldErrors } from '@/features/auth/useFieldErrors';
import useAuth from '@/features/auth/useAuth';
import { changePassword, setPassword } from '@/lib/firebase';
import { LIMITS } from '@/lib/models';
import { changeErrors, PASSWORD_TOO_SHORT } from './errors';
import {
  Actions,
  Row,
  RowLabel,
  RowStatus,
  RowValue,
  Section,
  SectionLead,
  SettingsForm,
} from './styles';

const PASSWORD_HINT = `At least ${LIMITS.password} characters.`;

/**
 * How the account logs in (T31): Google and/or email + password. A password can be changed (with
 * the current one); a Google-only account can set one, confirmed in a Google window, to log in with
 * its email too.
 */
function SignInSection() {
  const { email, providers, refreshUser } = useAuth();
  const withGoogle = providers.includes('google.com');
  const withPassword = providers.includes('password');
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState('');

  const done = (message: string) => {
    setNotice(message);
    setOpen(false);
  };

  return (
    <Section aria-labelledby="account-sign-in">
      <SectionHeading id="account-sign-in">Sign-in</SectionHeading>
      <SectionLead>The ways you can log in to this account.</SectionLead>
      {withGoogle ? (
        <Row>
          <RowLabel>Google</RowLabel>
          <RowValue>{email}</RowValue>
          <RowStatus>Connected</RowStatus>
        </Row>
      ) : null}
      <Row>
        <RowLabel>Password</RowLabel>
        <RowValue>{withPassword ? 'Set' : 'Not set'}</RowValue>
        <TextButton
          aria-expanded={open}
          aria-controls={open ? formId : undefined}
          onClick={() => {
            setOpen(!open);
            setNotice('');
          }}>
          {withPassword ? 'Change password' : 'Set a password'}
        </TextButton>
      </Row>
      {notice ? <AuthNotice role="status">{notice}</AuthNotice> : null}
      {open && withPassword ? (
        <ChangePasswordForm
          id={formId}
          onDone={() => done('Password changed.')}
          onCancel={() => setOpen(false)}
        />
      ) : null}
      {open && !withPassword ? (
        <SetPasswordForm
          id={formId}
          onDone={async () => {
            await refreshUser();
            done('Password set. You can also log in with your email and this password.');
          }}
          onCancel={() => setOpen(false)}
        />
      ) : null}
    </Section>
  );
}

interface FormProps {
  id: string;
  onDone: () => void | Promise<void>;
  onCancel: () => void;
}

function ChangePasswordForm({ id, onDone, onCancel }: FormProps) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const { errors, show, clear, ref, edit } = useFieldErrors(['current', 'password'] as const);
  useEffect(() => document.getElementById('account-current-password')?.focus(), []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const problems = {
      current: current ? undefined : 'Enter your current password.',
      password: next.length >= LIMITS.password ? undefined : PASSWORD_TOO_SHORT,
    };
    if (problems.current || problems.password) {
      show(problems);
      return;
    }
    setBusy(true);
    clear();
    try {
      await changePassword(current, next);
      await onDone();
    } catch (error) {
      show(changeErrors(error));
      setBusy(false);
    }
  };

  return (
    <SettingsForm id={id} onSubmit={handleSubmit} aria-label="Change password" noValidate>
      <FormField
        id="account-current-password"
        label="Current password"
        ref={ref('current')}
        autoComplete="current-password"
        error={errors.current}
        onChange={edit('current', setCurrent)}
        password
        value={current}
      />
      <FormField
        id="account-new-password"
        label="New password"
        ref={ref('password')}
        autoComplete="new-password"
        error={errors.password}
        hint={PASSWORD_HINT}
        onChange={edit('password', setNext)}
        password
        value={next}
      />
      <ErrorMessage>{errors.form}</ErrorMessage>
      <Actions>
        <Button type="submit" disabled={busy}>
          {busy ? 'Changing…' : 'Change password'}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </Actions>
    </SettingsForm>
  );
}

function SetPasswordForm({ id, onDone, onCancel }: FormProps) {
  const [password, setPasswordValue] = useState('');
  const [busy, setBusy] = useState(false);
  const { errors, show, clear, ref, edit } = useFieldErrors(['password'] as const);
  useEffect(() => document.getElementById('account-set-password')?.focus(), []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (password.length < LIMITS.password) {
      show({ password: PASSWORD_TOO_SHORT });
      return;
    }
    setBusy(true);
    clear();
    try {
      if (await setPassword(password)) await onDone();
      else setBusy(false);
    } catch (error) {
      // No email field here: an email error is about the form.
      const { email, ...rest } = authErrors(error);
      show(email ? { form: email } : rest);
      setBusy(false);
    }
  };

  return (
    <SettingsForm id={id} onSubmit={handleSubmit} aria-label="Set a password" noValidate>
      <FormField
        id="account-set-password"
        label="New password"
        ref={ref('password')}
        autoComplete="new-password"
        error={errors.password}
        hint={PASSWORD_HINT}
        onChange={edit('password', setPasswordValue)}
        password
        value={password}
      />
      <ErrorMessage>{errors.form}</ErrorMessage>
      <Actions>
        <Button type="submit" disabled={busy}>
          {busy ? 'Waiting for Google…' : 'Confirm with Google and set password'}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </Actions>
    </SettingsForm>
  );
}

export default SignInSection;
