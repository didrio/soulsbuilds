import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import ErrorMessage from '@/components/ui/ErrorMessage';
import TextInput from '@/components/ui/TextInput';
import { TextButton } from '@/components/ui/TextButton';
import { AuthField, AuthForm } from '@/features/auth/styles';
import { errorMessage } from '@/lib/firebase';
import {
  COLOR_DANGER,
  COLOR_LINE,
  COLOR_TEXT_MUTED,
  FONT_DISPLAY,
  SPACE_LG,
  SPACE_MD,
  SPACE_SM,
  SPACE_XL,
  TEXT_SM,
  TRACKING_CAPS,
} from '@/theme';
import { useDeleteAccount } from './queries';

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
  const [password, setPassword] = useState('');
  const [progress, setProgress] = useState<[number, number] | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!password || remove.isPending) return;
    remove.mutate(
      { password, onProgress: (done, total) => setProgress([done, total]) },
      {
        onSuccess: () => void navigate('/', { replace: true }),
        onSettled: () => setProgress(null),
      },
    );
  };

  return (
    <Dialog title="Delete your account?" onClose={() => (remove.isPending ? null : onClose())}>
      <AuthForm onSubmit={handleSubmit} aria-label="Delete account">
        <Lead>This deletes, for good:</Lead>
        <Gone>
          <li>your account (email and password)</li>
          <li>your builds, with their likes and comments</li>
          <li>your comments and likes on other builds</li>
          <li>your reports</li>
        </Gone>
        <Lead>It can’t be undone.</Lead>
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
        <ErrorMessage>{remove.error ? errorMessage(remove.error) : ''}</ErrorMessage>
        <Button type="submit" variant="danger" disabled={!password || remove.isPending}>
          {remove.isPending
            ? progress && progress[1] > 1
              ? `Deleting… ${progress[0]}/${progress[1]}`
              : 'Deleting…'
            : 'Delete my account'}
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
  font-family: ${FONT_DISPLAY};
  letter-spacing: ${TRACKING_CAPS};
  text-transform: uppercase;
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
