// Firebase Auth: sign up/in (email and password, or Google), sign out, password reset, and readable
// error messages. The public profile (users/{uid}) is created separately, in the "Choose a display name"
// step (T30), so a Google account's real name is never used by default.
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { LIMITS } from '@/lib/models';
import { auth } from './app';

export type AuthUser = User;

/** Calls `callback` with the signed-in user (or null) now and on every change; returns unsubscribe. */
export function onAuthChange(callback: (user: AuthUser | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
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
  await sendEmailVerification(user).catch(() => undefined);
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

/** Re-authenticates the signed-in user with Google (before deleting the account); false if cancelled. */
export async function reauthenticateWithGoogle(user: AuthUser): Promise<boolean> {
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
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'auth/user-not-found') return;
    throw error;
  }
}

/** Sends the signed-in user a verification email (the profile's "Resend" button). */
export async function resendVerificationEmail(): Promise<void> {
  if (!auth.currentUser) throw new FirebaseError('auth/user-not-found', 'Not signed in');
  await sendEmailVerification(auth.currentUser);
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
  'auth/requires-recent-login': 'For your security, log in again and retry.',
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
