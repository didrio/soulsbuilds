// Firebase Auth: sign up/in (email and password, or Google), sign out, password reset, and readable
// error messages; the account settings' changes (T31: email, password, re-authentication). The public profile (users/{uid}) is created separately, in the "Choose a display name"
// step (T30), so a Google account's real name is never used by default.
import {
  applyActionCode,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updatePassword,
  verifyBeforeUpdateEmail,
  verifyPasswordResetCode,
  type ActionCodeSettings,
  type User,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { LIMITS } from '@/lib/models';
import { auth, USE_EMULATORS } from './app';

export type AuthUser = User;

/**
 * For the emails Auth sends (verification, reset, email change): a `continueUrl` that makes Firebase's
 * default action page show a "Continue" link back to the site, until the emails' action URL can point
 * at our own `/auth/action` (T43, blocked: docs/firebase.md "Sign-in setup" step 6). It has to be on an
 * authorized domain, so production always uses the main one.
 */
function emailLinkSettings(): ActionCodeSettings {
  return { url: USE_EMULATORS ? window.location.origin : 'https://soulsbuilds.com' };
}

/**
 * Whether a saved sign-in can never work again: its refresh token was revoked, or the account was
 * deleted or disabled (locally: `npm run dev` starts the Auth emulator empty, so an account you made
 * last time is gone). A network error isn't.
 */
export function isDeadSession(error: unknown): boolean {
  return (
    error instanceof FirebaseError &&
    [
      'auth/invalid-refresh-token',
      'auth/user-token-expired',
      'auth/user-not-found',
      'auth/user-disabled',
    ].includes(error.code)
  );
}

/**
 * Calls `callback` with the signed-in user (or null) now and on every change; returns unsubscribe.
 * A user restored from a saved session whose token can't be renewed is signed out (the callback
 * then gets null), then `onDeadSession` runs: Firestore, unable to get a token, was offline
 * meanwhile, so whatever was read then came back empty and should be read again.
 */
export function onAuthChange(
  callback: (user: AuthUser | null) => void,
  onDeadSession?: () => void,
): () => void {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
    if (!user) return;
    user.getIdToken().catch(async (error: unknown) => {
      if (!isDeadSession(error)) return;
      await firebaseSignOut(auth);
      onDeadSession?.();
    });
  });
}

/** Signs in with email and password; resolves to the uid. */
export async function signIn(email: string, password: string): Promise<string> {
  const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
  return user.uid;
}

/**
 * Creates an email + password account; resolves to the new uid. No profile yet: the user picks a
 * display name next (`createUserProfile`).
 */
export async function signUp(email: string, password: string): Promise<string> {
  const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
  // Send-only verification: posting doesn't require it, so a failure here must not fail sign-up.
  await sendEmailVerification(user, emailLinkSettings()).catch(() => undefined);
  return user.uid;
}

function googleProvider() {
  const provider = new GoogleAuthProvider();
  // Always show the account chooser, so someone with several Google accounts picks one.
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

/** Closing the Google window, or opening a second one, isn't an error worth showing. */
function isPopupCancelled(error: unknown) {
  return (
    error instanceof FirebaseError &&
    ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(error.code)
  );
}

/**
 * Signs in (or up: same thing) with Google in a popup; resolves to the uid, or null when the user
 * closed the popup.
 */
export async function signInWithGoogle(): Promise<string | null> {
  try {
    const { user } = await signInWithPopup(auth, googleProvider());
    return user.uid;
  } catch (error) {
    if (isPopupCancelled(error)) return null;
    throw error;
  }
}

/** Re-authenticates the signed-in user with Google; false if they closed the window. */
async function reauthenticateWithGoogle(user: AuthUser): Promise<boolean> {
  try {
    await reauthenticateWithPopup(user, googleProvider());
    return true;
  } catch (error) {
    if (isPopupCancelled(error)) return false;
    throw error;
  }
}

/** Whether the user can sign in with a password (Google-only accounts can't). */
export function hasPassword(user: Pick<AuthUser, 'providerData'>): boolean {
  return user.providerData.some((info) => info.providerId === 'password');
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Sends a reset link. An unknown email succeeds silently, like a known one, so the form can't tell
 * anyone whether an account exists (with email enumeration protection on, Firebase does this itself).
 */
export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email.trim(), emailLinkSettings());
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'auth/user-not-found') return;
    throw error;
  }
}

/**
 * The email a password-reset link (`/auth/action?mode=resetPassword`, T43) is for. Rejects when the
 * link is expired, used or invalid (`isDeadLink`).
 */
export function checkPasswordResetCode(code: string): Promise<string> {
  return verifyPasswordResetCode(auth, code);
}

/** Sets the new password through a reset link; the link is used up. Doesn't sign anyone in. */
export async function confirmNewPassword(code: string, password: string): Promise<void> {
  await confirmPasswordReset(auth, code, password);
}

/**
 * Applies a verify-email link, or the one `changeEmail` sends to the new address (T43). The link
 * is used up, so call it once per link.
 */
export async function applyEmailLink(code: string): Promise<void> {
  await applyActionCode(auth, code);
}

/** Whether an email link is expired, already used or not valid: asking for a new one is the fix. */
export function isDeadLink(error: unknown): boolean {
  return (
    error instanceof FirebaseError &&
    ['auth/expired-action-code', 'auth/invalid-action-code'].includes(error.code)
  );
}

function currentUser(): AuthUser {
  if (!auth.currentUser) throw new FirebaseError('auth/user-not-found', 'Not signed in');
  return auth.currentUser;
}

/** Sends the signed-in user a verification email (the Account page's "Resend" button). */
export async function resendVerificationEmail(): Promise<void> {
  await sendEmailVerification(currentUser(), emailLinkSettings());
}

/**
 * Confirms the signed-in user is who they say before a sensitive change (T31): with their current
 * password, or with `null`, in a Google window. Auth refuses these changes after an old sign-in
 * (`auth/requires-recent-login`); asking every time also means a wrong password changes nothing.
 * Resolves to false when they close the Google window.
 */
export async function reauthenticate(password: string | null): Promise<boolean> {
  const user = currentUser();
  if (password === null) return reauthenticateWithGoogle(user);
  await reauthenticateWithCredential(
    user,
    EmailAuthProvider.credential(user.email ?? '', password),
  );
  return true;
}

/** Changes the password of an email + password account, after checking the current one. */
export async function changePassword(current: string, next: string): Promise<void> {
  await reauthenticate(current);
  await updatePassword(currentUser(), next);
}

/**
 * Sends a link to `newEmail`; the account's email changes when it's opened (and Firebase then signs
 * the user out everywhere, so they log in with the new address). Email + password accounts only: a
 * Google account's address belongs to Google.
 */
export async function changeEmail(newEmail: string, password: string): Promise<void> {
  await reauthenticate(password);
  await verifyBeforeUpdateEmail(currentUser(), newEmail.trim(), emailLinkSettings());
}

/**
 * Adds a password to a Google-only account, so it can also log in with its email. Confirmed in a
 * Google window first; resolves to false (nothing changed) when it's closed.
 */
export async function setPassword(password: string): Promise<boolean> {
  if (!(await reauthenticate(null))) return false;
  // Not `linkWithCredential`: an email credential for the account's own address fails with
  // `auth/email-already-in-use`. Setting the password adds the 'password' sign-in method.
  await updatePassword(currentUser(), password);
  return true;
}

/**
 * Reloads the signed-in user from Auth (a verified email, a new sign-in method), which
 * `onAuthStateChanged` doesn't report; resolves to the user, or null when signed out.
 */
export async function reloadUser(): Promise<AuthUser | null> {
  if (auth.currentUser) await reload(auth.currentUser);
  return auth.currentUser;
}

/** Whether an error means the current password was wrong (on a form that only asks for that). */
export function isWrongPassword(error: unknown): boolean {
  return (
    error instanceof FirebaseError &&
    ['auth/invalid-credential', 'auth/wrong-password'].includes(error.code)
  );
}

const PASSWORD_LENGTH = `Choose a password of at least ${LIMITS.password} characters.`;

const AUTH_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'That email address is not valid.',
  'auth/missing-email': 'Enter your email address.',
  'auth/missing-password': 'Enter your password.',
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/wrong-password': 'Wrong email or password.',
  'auth/user-not-found': 'Wrong email or password.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/email-already-in-use': 'An account with that email already exists. Try logging in.',
  'auth/weak-password': PASSWORD_LENGTH,
  // The project's password policy (T30: at least 8 characters, enforced by Firebase Auth).
  'auth/password-does-not-meet-requirements': PASSWORD_LENGTH,
  'auth/account-exists-with-different-credential':
    'That email already has an account. Log in with your email and password.',
  'auth/popup-blocked': 'Your browser blocked the Google window. Allow pop-ups and try again.',
  'auth/user-mismatch': 'That’s a different Google account. Choose the one you signed up with.',
  'auth/too-many-requests': 'Too many attempts. Wait a minute and try again.',
  'auth/requires-recent-login': 'For your security, confirm it’s you again, then retry.',
  'auth/provider-already-linked': 'Your account already has a password.',
  'auth/credential-already-in-use': 'Another account already uses that sign-in.',
  'auth/expired-action-code': 'This link has expired.',
  'auth/invalid-action-code': 'This link isn’t valid, or it was already used.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
};

const FIELD_ERRORS: Record<string, 'email' | 'password'> = {
  'auth/invalid-email': 'email',
  'auth/missing-email': 'email',
  'auth/email-already-in-use': 'email',
  'auth/missing-password': 'password',
  'auth/weak-password': 'password',
  'auth/password-does-not-meet-requirements': 'password',
};

/** A message to show the user for any error from Firebase (or anything else). */
export function errorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    if (AUTH_MESSAGES[error.code]) return AUTH_MESSAGES[error.code]!;
    if (error.code === 'permission-denied') return 'You are not allowed to do that.';
    if (error.code === 'unavailable') return 'Can’t reach the server. Check your connection.';
  }
  return 'Something went wrong. Please try again.';
}

/**
 * Which form field an Auth error is about, so the message shows next to it; null for the form as a
 * whole ("Wrong email or password" names neither, on purpose).
 */
export function errorField(error: unknown): 'email' | 'password' | null {
  return error instanceof FirebaseError ? (FIELD_ERRORS[error.code] ?? null) : null;
}
