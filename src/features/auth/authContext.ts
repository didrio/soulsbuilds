import { createContext } from 'react';
import type { AuthUser } from '@/lib/firebase';

/** The signed-in Firebase Auth user. `loading` is true until Firebase has restored the session. */
export interface AuthValue {
  loading: boolean;
  user: AuthUser | null;
  /** The signed-in user's uid, or null (signed out or still loading). */
  uid: string | null;
}

export const SIGNED_OUT: AuthValue = { loading: false, user: null, uid: null };

export const AuthContext = createContext<AuthValue>({ loading: true, user: null, uid: null });
