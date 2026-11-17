import { useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { onAuthChange, reloadUser } from '@/lib/firebase';
import { AuthContext, authValue, SIGNED_OUT, type AuthValue } from './authContext';

/**
 * Listens to Firebase Auth once for the whole app; read it with `useAuth()`. A saved session that
 * can't be renewed is signed out (`onAuthChange`), and then every query is read again: Firestore
 * was offline until then, so lists loaded meanwhile came back empty.
 */
function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState<AuthValue>({ ...SIGNED_OUT, loading: true });

  useEffect(() => {
    const refreshUser = async () => {
      setValue(authValue(await reloadUser(), refreshUser));
    };
    return onAuthChange(
      (user) => setValue(authValue(user, refreshUser)),
      () => void queryClient.resetQueries(),
    );
  }, [queryClient]);

  return <AuthContext value={value}>{children}</AuthContext>;
}

export default AuthProvider;
