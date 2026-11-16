import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Dialog from '@/components/ui/Dialog';
import { getUserProfile, signOut } from '@/lib/firebase';
import { queryKeys } from '@/lib/queryKeys';
import ChooseName from './ChooseName';
import ForgotPassword from './ForgotPassword';
import Login from './Login';
import SignUp from './SignUp';

export type AuthView = 'login' | 'signup' | 'reset' | 'name';

export interface AuthDialogState {
  view: AuthView;
  /** What to do once signed in with a profile (T41: start tracking). Dropped if the dialog closes. */
  onSignedIn?: (uid: string) => void;
  /** The account that needs a name, set before `useAuth` may have caught up. */
  uid?: string;
}

const TITLES: Record<AuthView, string> = {
  login: 'Log in',
  signup: 'Create your account',
  reset: 'Reset your password',
  name: 'Choose a display name',
};

interface AuthDialogProps {
  state: AuthDialogState;
  /** The signed-in user (for the name step opened because their profile is missing). */
  uid: string | null;
  /** Switches view, or closes with null. */
  onChange: (state: AuthDialogState | null) => void;
}

/**
 * The log in / sign up dialog (T30). After any sign-in it checks for the user's profile: there →
 * continue and close; missing (a new account, or one whose profile never got written) → the
 * "Choose a display name" step, then continue. Closing that step logs out, so nobody is signed in
 * without a profile.
 */
function AuthDialog({ state, uid, onChange }: AuthDialogProps) {
  const queryClient = useQueryClient();
  // Shared by the views, so switching between them keeps it (and prefills "Forgot password?").
  const [email, setEmail] = useState('');
  const view = (next: AuthView) => () => onChange({ ...state, view: next });

  const signedIn = async (newUid: string) => {
    const profile = await queryClient.fetchQuery({
      queryKey: queryKeys.user(newUid),
      queryFn: () => getUserProfile(newUid),
      staleTime: 0,
    });
    if (profile) {
      state.onSignedIn?.(newUid);
      onChange(null);
    } else {
      onChange({ ...state, view: 'name', uid: newUid });
    }
  };

  const named = async (namedUid: string) => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.user(namedUid) });
    state.onSignedIn?.(namedUid);
    onChange(null);
  };

  const close = () => {
    if (state.view === 'name') void signOut();
    onChange(null);
  };

  const nameUid = state.uid ?? uid;

  return (
    // A new Dialog per view, so focus starts on the view's first field.
    <Dialog key={state.view} title={TITLES[state.view]} onClose={close}>
      {state.view === 'login' ? (
        <Login
          email={email}
          onEmail={setEmail}
          onDone={signedIn}
          onForgot={view('reset')}
          onSwitch={view('signup')}
        />
      ) : null}
      {state.view === 'signup' ? (
        <SignUp email={email} onEmail={setEmail} onDone={signedIn} onSwitch={view('login')} />
      ) : null}
      {state.view === 'reset' ? (
        <ForgotPassword email={email} onEmail={setEmail} onBack={view('login')} />
      ) : null}
      {state.view === 'name' && nameUid ? (
        <ChooseName uid={nameUid} onDone={named} onLogOut={close} />
      ) : null}
    </Dialog>
  );
}

export default AuthDialog;
