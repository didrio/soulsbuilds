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

export const getUser = async (id) => {
  let success = true;
  try {
    const userRef = doc(firestore, `users/${id}`);
    const snapshot = await getDoc(userRef);
    const data = snapshot.data();
    return {
      ...data,
      id,
    };
  } catch (error) {
    console.log(error.message);
    success = false;
  }
  return success;
};

export const logout = async () => {
  await signOut(auth);
};

export const saveBuild = async (buildId, data, newId, userId) => {
  let success = true;
  let savedBuildId = null;
  try {
    if (buildId === 'new') {
      savedBuildId = newId;
      const buildsRef = doc(firestore, `builds/${newId}`);
      await setDoc(buildsRef, data);
      const { builds = [] } = await getUser(userId);
      const userRef = doc(firestore, `users/${userId}`);
      await updateDoc(userRef, {
        builds: [...builds, newId],
      });
    } else if (buildId) {
      savedBuildId = buildId;
      const docRef = doc(firestore, `builds/${buildId}`);
      await updateDoc(docRef, data);
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
  return {
    ...data,
    id: snapshot.id,
  };
};

export const getBuilds = async () => {
  const buildsRef = collection(firestore, 'builds');
  const querySnapshot = await getDocs(buildsRef);
  return querySnapshot.docs.map((buildDoc) => ({
    ...buildDoc.data(),
    id: buildDoc.id,
  }));
};

export const handleUserLike = async (userId, buildId, shouldAdd = true) => {
  const userRef = doc(firestore, `users/${userId}`);
  const buildRef = doc(firestore, `builds/${buildId}`);
  const userSnapshot = await getDoc(userRef);
  const buildSnapshot = await getDoc(buildRef);
  const { likes = 0 } = buildSnapshot.data();
  let newLikes = shouldAdd ? (Number(likes) + 1) : (Number(likes) - 1);
  if (newLikes < 0) {
    newLikes = 0;
  }
  let { likedBuilds = [] } = userSnapshot.data();
  if (shouldAdd && likedBuilds.includes(buildId)) {
    return;
  }
  if (!shouldAdd && !likedBuilds.includes(buildId)) {
    return;
  }
  if (shouldAdd) {
    likedBuilds = [...likedBuilds, buildId];
  } else {
    likedBuilds = likedBuilds.filter((id) => id !== buildId);
  }
  await updateDoc(userRef, { likedBuilds });
  await updateDoc(buildRef, { likes: newLikes });
};

export const addComment = async (userId, buildId, comment) => {
  const buildRef = doc(firestore, `builds/${buildId}`);
  const buildSnapshot = await getDoc(buildRef);
  const { comments = [] } = buildSnapshot.data();
  await updateDoc(buildRef, {
    comments: [
      ...comments,
      { user: userId, comment, date: Date.now() },
    ],
  });
};
