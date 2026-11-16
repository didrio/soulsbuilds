// Opening the log in / sign up dialog from anywhere on a page (T34: "Keep my progress"), not only the
// header. App owns the dialog and provides the opener.
import { createContext, use } from 'react';

export type AuthDialogKind = 'login' | 'signup';

export const AuthDialogContext = createContext<(kind: AuthDialogKind) => void>(() => undefined);

/** Opens the log in or sign up dialog. */
export const useOpenAuthDialog = () => use(AuthDialogContext);
