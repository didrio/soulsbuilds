import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import useAuth from './useAuth';
import { firestore } from '../firebase';

const useUser = () => {
  const [user, setUser] = useState(null);
  const auth = useAuth();

  useEffect(() => {
    const run = async () => {
      try {
        if (auth?.uid) {
          const docRef = doc(firestore, `users/${auth.uid}`);
          const snapshot = await getDoc(docRef);
          const data = snapshot.data();
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
