import { createContext } from 'react';
import type { AuthUser } from '@/lib/firebase';

/** The signed-in Firebase Auth user. `loading` is true until Firebase has restored the session. */
export interface AuthValue {
  loading: boolean;
  user: AuthUser | null;
  /** The signed-in user's uid, or null (signed out or still loading). */
  uid: string | null;
  /**
   * Copied from `user` when it last changed or was refreshed (T31): Auth updates the same `user`
   * object in place (a linked password, a verified email), which React can't see.
   */
  email: string | null;
  emailVerified: boolean;
  /** Sign-in methods: `'password'`, `'google.com'`. */
  providers: string[];
  /** Reloads the user from Auth and publishes the new email, verification and sign-in methods. */
  refreshUser: () => Promise<void>;
}

const noRefresh = () => Promise.resolve();

/** The context value for a user (or null: signed out). */
export function authValue(
  user: AuthUser | null,
  refreshUser: () => Promise<void> = noRefresh,
): AuthValue {
  return {
    loading: false,
    user,
    uid: user?.uid ?? null,
    email: user?.email ?? null,
    emailVerified: user?.emailVerified ?? false,
    providers: user?.providerData.map((info) => info.providerId) ?? [],
    refreshUser,
  };
}

export const SIGNED_OUT: AuthValue = authValue(null);

export const AuthContext = createContext<AuthValue>({ ...SIGNED_OUT, loading: true });
