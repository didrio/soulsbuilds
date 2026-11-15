import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User as AuthUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';

/**
 * The signed-in Firebase Auth user: `null` while unknown, `false` when signed out.
 * Each caller registers its own listener (T4 replaces this with one AuthProvider).
 */
const useAuth = (): AuthUser | null | false => {
  const [authUser, setAuthUser] = useState<AuthUser | null | false>(null);

  useEffect(() => {
    const unlisten = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthUser(user);
      } else {
        setAuthUser(false);
      }
    });
    return () => {
      unlisten();
    };
  }, []);

  return authUser;
};

export default useAuth;
