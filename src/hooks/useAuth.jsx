import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

const useAuth = () => {
  const [authUser, setAuthUser] = useState(null);

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
