import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import ErrorMessage from '@/components/ui/ErrorMessage';
import SectionHeading from '@/components/ui/SectionHeading';
import TextInput from '@/components/ui/TextInput';
import { TextButton } from '@/components/ui/TextButton';
import { AuthField, AuthForm } from '@/features/auth/styles';
import useAuth from '@/features/auth/useAuth';
import { errorMessage } from '@/lib/firebase';
import { COLOR_DANGER, SPACE_LG, SPACE_MD, SPACE_SM, TEXT_SM } from '@/theme';
import { useDeleteAccount } from './queries';
import { Section, SectionLead } from './styles';

/**
 * "Delete account" (T18), the last section of the Account page (T31; it was at the bottom of the
 * profile). With `finishing`, it's the retry offered on the owner's "User not found" profile and
 * Account page after a deletion stopped halfway (the profile goes last before the Auth account, so
 * that's the only state a retry can find).
 */
function DeleteAccount({ finishing = false }: { finishing?: boolean }) {
  const [open, setOpen] = useState(false);
  const dialog = open ? <DeleteAccountDialog onClose={() => setOpen(false)} /> : null;
  if (finishing) {
    return (
      <Finishing>
        <p>Your account wasn’t fully deleted.</p>
        <DangerTextButton onClick={() => setOpen(true)}>
          Finish deleting your account
        </DangerTextButton>
        {dialog}
      </Finishing>
    );
  }
  return (
    <Section aria-labelledby="account-delete">
      <SectionHeading id="account-delete">Delete account</SectionHeading>
      <SectionLead>
        Deletes your account, your builds and everything you’ve posted. It can’t be undone.
      </SectionLead>
      <div>
        <Button variant="danger" onClick={() => setOpen(true)}>
          Delete account
        </Button>
      </div>
      {dialog}
    </Section>
  );
}

function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const remove = useDeleteAccount();
  // T30: a Google-only account has no password; it confirms in a Google window instead.
  const withPassword = useAuth().providers.includes('password');
  const [password, setPassword] = useState('');
  const [progress, setProgress] = useState<[number, number] | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if ((withPassword && !password) || remove.isPending) return;
    remove.mutate(
      {
        password: withPassword ? password : null,
        onProgress: (done, total) => setProgress([done, total]),
      },
      {
        onSuccess: (deleted) => {
          if (deleted) void navigate('/', { replace: true });
        },
        onSettled: () => setProgress(null),
      },
    );
  };

  return (
    <Dialog title="Delete your account?" onClose={() => (remove.isPending ? null : onClose())}>
      <AuthForm onSubmit={handleSubmit} aria-label="Delete account">
        <Lead>This deletes, for good:</Lead>
        <Gone>
          <li>your account{withPassword ? ' (email and password)' : ''}</li>
          <li>your builds, with their likes and comments</li>
          <li>your comments and likes on other builds</li>
          <li>your reports</li>
        </Gone>
        <Lead>It can’t be undone.</Lead>
        {withPassword ? (
          <AuthField>
            <label htmlFor="delete-account-password">Your password</label>
            <TextInput
              id="delete-account-password"
              autoComplete="current-password"
              onChange={setPassword}
              required
              type="password"
              value={password}
            />
          </AuthField>
        ) : (
          <Lead>To confirm, choose your Google account in the window that opens.</Lead>
        )}
        <ErrorMessage>{remove.error ? errorMessage(remove.error) : ''}</ErrorMessage>
        <Button
          type="submit"
          variant="danger"
          disabled={(withPassword && !password) || remove.isPending}>
          {remove.isPending
            ? progress && progress[1] > 1
              ? `Deleting… ${progress[0]}/${progress[1]}`
              : 'Deleting…'
            : withPassword
              ? 'Delete my account'
              : 'Confirm with Google and delete'}
        </Button>
        <Button variant="ghost" disabled={remove.isPending} onClick={onClose}>
          Cancel
        </Button>
      </AuthForm>
    </Dialog>
  );
}

const Finishing = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  font-size: ${TEXT_SM};
  gap: ${SPACE_SM} ${SPACE_MD};
  margin-top: ${SPACE_MD};

  & > p {
    margin: 0;
  }
`;

const DangerTextButton = styled(TextButton)`
  color: ${COLOR_DANGER};

  &:hover {
    color: ${COLOR_DANGER};
  }
`;

const Lead = styled.p`
  margin: 0;
`;

const Gone = styled.ul`
  margin: 0;
  padding-left: ${SPACE_LG};
`;

export default DeleteAccount;
