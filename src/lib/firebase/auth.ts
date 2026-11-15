// Firebase Auth: sign up/in/out, password reset, and readable error messages.
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from './app';
import { createUserProfile } from './users';

export type AuthUser = User;

/** Calls `callback` with the signed-in user (or null) now and on every change; returns unsubscribe. */
export function onAuthChange(callback: (user: AuthUser | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function signIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

/** Creates the account and its public profile; resolves to the new uid. */
export async function signUp(
  email: string,
  password: string,
  displayName: string,
): Promise<string> {
  const name = displayName.trim();
  const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(user, { displayName: name });
  await createUserProfile(user.uid, name);
  // Send-only verification: posting doesn't require it, so a failure here must not fail sign-up.
  await sendEmailVerification(user).catch(() => undefined);
  return user.uid;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

/** Sends the signed-in user a verification email (the profile's "Resend" button). */
export async function resendVerificationEmail(): Promise<void> {
  if (!auth.currentUser) throw new FirebaseError('auth/user-not-found', 'Not signed in');
  await sendEmailVerification(auth.currentUser);
}

const AUTH_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'That email address is not valid.',
  'auth/missing-email': 'Enter your email address.',
  'auth/missing-password': 'Enter your password.',
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/wrong-password': 'Wrong email or password.',
  'auth/user-not-found': 'Wrong email or password.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/email-already-in-use': 'An account with that email already exists. Try logging in.',
  'auth/weak-password': 'Choose a password of at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Wait a minute and try again.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
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
