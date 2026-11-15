import { useEffect, useState, type ReactNode } from 'react';
import { onAuthChange } from '@/lib/firebase';
import { AuthContext, type AuthValue } from './authContext';

/** Listens to Firebase Auth once for the whole app; read it with `useAuth()`. */
function AuthProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<AuthValue>({ loading: true, user: null, uid: null });

  useEffect(
    () =>
      onAuthChange((user) => {
        setValue({ loading: false, user, uid: user?.uid ?? null });
      }),
    [],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export default AuthProvider;
