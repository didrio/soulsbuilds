import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import ErrorMessage from '@/components/ui/ErrorMessage';
import TextInput from '@/components/ui/TextInput';
import { TextButton } from '@/components/ui/TextButton';
import { AuthField, AuthForm } from '@/features/auth/styles';
import useAuth from '@/features/auth/useAuth';
import { errorMessage, hasPassword } from '@/lib/firebase';
import {
  COLOR_DANGER,
  COLOR_LINE,
  COLOR_TEXT_MUTED,
  SPACE_LG,
  SPACE_MD,
  SPACE_SM,
  SPACE_XL,
  TEXT_SM,
} from '@/theme';
import { useDeleteAccount } from './queries';
import { labelText } from '@/components/ui/typography';

/**
 * The owner's "Delete account" (T18), at the bottom of their profile. With `finishing`, it's the
 * retry offered on their own "User not found" page after a deletion stopped halfway (the profile
 * goes last before the Auth account, so that's the only state a retry can find).
 */
function DeleteAccount({ finishing = false }: { finishing?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Strip $finishing={finishing}>
      {finishing ? <p>Your account wasn’t fully deleted.</p> : <StripText>Account</StripText>}
      <DangerTextButton onClick={() => setOpen(true)}>
        {finishing ? 'Finish deleting your account' : 'Delete account'}
      </DangerTextButton>
      {open ? <DeleteAccountDialog onClose={() => setOpen(false)} /> : null}
    </Strip>
  );
}

function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const remove = useDeleteAccount();
  const { user } = useAuth();
  // T30: a Google-only account has no password; it confirms in a Google window instead.
  const withPassword = user ? hasPassword(user) : true;
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

const Strip = styled.div<{ $finishing: boolean }>`
  align-items: center;
  border-top: ${({ $finishing }) => ($finishing ? 'none' : `1px solid ${COLOR_LINE}`)};
  color: ${COLOR_TEXT_MUTED};
  display: flex;
  flex-direction: ${({ $finishing }) => ($finishing ? 'column' : 'row')};
  font-size: ${TEXT_SM};
  gap: ${SPACE_SM} ${SPACE_MD};
  justify-content: ${({ $finishing }) => ($finishing ? 'center' : 'space-between')};
  margin-top: ${({ $finishing }) => ($finishing ? SPACE_MD : SPACE_XL)};
  padding-top: ${SPACE_SM};

  & > p {
    margin: 0;
  }
`;

const StripText = styled.span`
  ${labelText}
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
