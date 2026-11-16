// Opening the log in / sign up dialog from anywhere on a page, not only the header. App owns the dialog
// and provides the opener. `onSignedIn` continues what the visitor was doing once they're in (T41:
// "Track this build" starts tracking); it gets the new uid, since `useAuth` may not have caught up yet.
// Closing the dialog without signing in drops it.
import { createContext, use } from 'react';

export type AuthDialogKind = 'login' | 'signup';

export type OpenAuthDialog = (kind: AuthDialogKind, onSignedIn?: (uid: string) => void) => void;

export const AuthDialogContext = createContext<OpenAuthDialog>(() => undefined);

/** Opens the log in or sign up dialog. */
export const useOpenAuthDialog = () => use(AuthDialogContext);
