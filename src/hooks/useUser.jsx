import { useState, useEffect } from 'react';
import isEmpty from 'lodash/isEmpty';
import useAuth from './useAuth';
import { firestore } from '../firebase';

const useUser = () => {
  const [user, setUser] = useState(null);
  const auth = useAuth();

  const email = auth?.email ?? '';

  useEffect(() => {
    const run = async () => {
      const db = firestore();
      try {
        const query = await db.collection('users').where('email', '==', email).get();
        if (!isEmpty(query?.docs ?? [])) {
          const data = query.docs[0].data();
          setUser(data);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('error', error);
      }
    };
    run();
  }, [email]);

  return user;
};

export default useUser;
