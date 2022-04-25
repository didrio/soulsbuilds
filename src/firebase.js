import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import {
  getFirestore, setDoc, collection, doc, getDoc, getDocs, updateDoc,
} from 'firebase/firestore';

const config = {
  apiKey: 'AIzaSyB2A_BSdKqYsLDe2jPSKbnMyu8JxhJFtow',
  authDomain: 'soulsbuilds.firebaseapp.com',
  projectId: 'soulsbuilds',
  storageBucket: 'soulsbuilds.appspot.com',
  messagingSenderId: '981152509260',
  appId: '1:981152509260:web:a637087018de332b29b3e9',
  measurementId: 'G-EXTD6Y44QT',
};

const firebaseApp = initializeApp(config);
export const auth = getAuth(firebaseApp);
export const analytics = getAnalytics(firebaseApp);
export const firestore = getFirestore(firebaseApp);

export const login = async (email, password) => {
  let success = true;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.log(error.message);
    success = false;
  }
  return success;
};

export const createUser = async (email, password, data) => {
  let success = true;
  try {
    const response = await createUserWithEmailAndPassword(auth, email, password);
    const usersRef = doc(firestore, `users/${response.user.uid}`);
    await setDoc(usersRef, data);
  } catch (error) {
    console.log(error.message);
    success = false;
  }
  return success;
};

export const logout = () => {
  signOut(auth);
};

export const saveBuild = async (buildId, data, newId) => {
  let success = true;
  let savedBuildId = null;
  try {
    if (buildId === 'new') {
      const buildsRef = doc(firestore, `builds/${newId}`);
      const result = await setDoc(buildsRef, data);
      savedBuildId = result.id;
    } else if (buildId) {
      const docRef = doc(firestore, `builds/${buildId}`);
      await updateDoc(docRef, data);
      savedBuildId = buildId;
    }
  } catch (error) {
    console.log(error.message);
    success = false;
  }
  return { success, savedBuildId };
};

export const getBuild = async (buildId) => {
  const docRef = doc(firestore, `builds/${buildId}`);
  const snapshot = await getDoc(docRef);
  const data = snapshot.data();
  return data;
};

export const getBuilds = async () => {
  const buildsRef = collection(firestore, 'builds');
  const querySnapshot = await getDocs(buildsRef);
  return querySnapshot.docs.map((buildDoc) => ({
    ...buildDoc.data(),
    id: buildDoc.id,
  }));
};
