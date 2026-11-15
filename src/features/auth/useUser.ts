import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import useAuth from './useAuth';
import { firestore } from '@/lib/firebase';
import type { User, UserDoc } from '@/lib/models';

/** The signed-in user's users/{uid} doc, or `null` (signed out or not loaded yet). */
const useUser = (): User | null => {
  const [user, setUser] = useState<User | null>(null);
  const auth = useAuth();

  useEffect(() => {
    const run = async () => {
      try {
        if (auth && auth.uid) {
          const docRef = doc(firestore, `users/${auth.uid}`);
          const snapshot = await getDoc(docRef);
          const data = snapshot.data() as UserDoc;
          setUser({ ...data, id: auth.uid });
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('error', error);
      }
    };
    run();
  }, [auth]);

  return user;
};

export default useUser;
