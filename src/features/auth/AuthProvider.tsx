import { useEffect, useState, type ReactNode } from 'react';
import { onAuthChange, reloadUser } from '@/lib/firebase';
import { AuthContext, authValue, SIGNED_OUT, type AuthValue } from './authContext';

/** Listens to Firebase Auth once for the whole app; read it with `useAuth()`. */
function AuthProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<AuthValue>({ ...SIGNED_OUT, loading: true });

  useEffect(() => {
    const refreshUser = async () => {
      setValue(authValue(await reloadUser(), refreshUser));
    };
    return onAuthChange((user) => setValue(authValue(user, refreshUser)));
  }, []);

  return <AuthContext value={value}>{children}</AuthContext>;
}

export default AuthProvider;
