import { initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import {
  connectFirestoreEmulator,
  getFirestore,
  setDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import type { Build, BuildDoc, User, UserDoc } from './models';

// Local dev (`npm run dev`) and tests always talk to the Firebase emulators under the `demo-soulsbuilds`
// project. A `demo-` project has no real backend, so local work can never touch production.
// Production builds (`vite build`, also what `npm run preview` serves) use the real project below.
// The web config is public by design (it identifies the project; security rules protect the data).
export const USE_EMULATORS = import.meta.env.DEV;

// Keep in sync with "emulators" in firebase.json.
export const EMULATOR_PROJECT_ID = 'demo-soulsbuilds';
const EMULATOR_HOST = '127.0.0.1';
const AUTH_EMULATOR_PORT = 9099;
const FIRESTORE_EMULATOR_PORT = 8085;

const productionConfig = {
  apiKey: 'AIzaSyB2A_BSdKqYsLDe2jPSKbnMyu8JxhJFtow',
  authDomain: 'soulsbuilds.firebaseapp.com',
  projectId: 'soulsbuilds',
  storageBucket: 'soulsbuilds.appspot.com',
  messagingSenderId: '981152509260',
  appId: '1:981152509260:web:a637087018de332b29b3e9',
  measurementId: 'G-EXTD6Y44QT',
};

const emulatorConfig = {
  apiKey: 'demo-api-key',
  authDomain: `${EMULATOR_PROJECT_ID}.firebaseapp.com`,
  projectId: EMULATOR_PROJECT_ID,
};

const firebaseApp = initializeApp(USE_EMULATORS ? emulatorConfig : productionConfig);
export const auth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);

if (USE_EMULATORS) {
  connectAuthEmulator(auth, `http://${EMULATOR_HOST}:${AUTH_EMULATOR_PORT}`, {
    disableWarnings: true,
  });
  connectFirestoreEmulator(firestore, EMULATOR_HOST, FIRESTORE_EMULATOR_PORT);
} else {
  // Analytics only in production, and only where the browser supports it. (Consent: T12.)
  isAnalyticsSupported().then((supported) => {
    if (supported) getAnalytics(firebaseApp);
  });
}

/** The user doc a new account starts with (v1: `admin` is client-set; T3 fixes). */
export const DEFAULT_USER_DATA: UserDoc = {
  admin: false,
  email: '',
  name: '',
};

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

export const login = async (email: string, password: string): Promise<boolean> => {
  let success = true;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.log(errorMessage(error));
    success = false;
  }
  return success;
};

export const createUser = async (
  email: string,
  password: string,
  data: UserDoc,
): Promise<boolean> => {
  let success = true;
  try {
    const response = await createUserWithEmailAndPassword(auth, email, password);
    const usersRef = doc(firestore, `users/${response.user.uid}`);
    await setDoc(usersRef, data);
  } catch (error) {
    console.log(errorMessage(error));
    success = false;
  }
  return success;
};

/**
 * Reads users/{id}. Resolves to `false` if the read fails, and to just `{ id }` (typed as a full
 * User, unvalidated) if the doc doesn't exist. T4 replaces this with proper not-found handling.
 */
export const getUser = async (id: string): Promise<User | false> => {
  let success = true;
  try {
    const userRef = doc(firestore, `users/${id}`);
    const snapshot = await getDoc(userRef);
    const data = snapshot.data() as UserDoc | undefined;
    return {
      ...data,
      id,
    } as User;
  } catch (error) {
    console.log(errorMessage(error));
    success = false;
  }
  return success;
};

export const logout = async () => {
  await signOut(auth);
};

/** Creates (`buildId === 'new'`, stored under `newId`) or overwrites the fields of a build. */
export const saveBuild = async (
  buildId: string | null,
  data: BuildDoc,
  newId: string,
  userId: string,
): Promise<{ success: boolean; savedBuildId: string | null }> => {
  let success = true;
  let savedBuildId: string | null = null;
  try {
    if (buildId === 'new') {
      savedBuildId = newId;
      const buildsRef = doc(firestore, `builds/${newId}`);
      await setDoc(buildsRef, data);
      const user = await getUser(userId);
      const builds = (user && user.builds) || [];
      const userRef = doc(firestore, `users/${userId}`);
      await updateDoc(userRef, {
        builds: [...builds, newId],
      });
    } else if (buildId) {
      savedBuildId = buildId;
      const docRef = doc(firestore, `builds/${buildId}`);
      await updateDoc(docRef, { ...data });
    }
  } catch (error) {
    console.log(errorMessage(error));
    success = false;
  }
  return { success, savedBuildId };
};

/** Reads builds/{id}. A missing doc yields just `{ id }` (typed as a full Build; crash: T4). */
export const getBuild = async (buildId: string): Promise<Build> => {
  const docRef = doc(firestore, `builds/${buildId}`);
  const snapshot = await getDoc(docRef);
  const data = snapshot.data() as BuildDoc | undefined;
  return {
    ...data,
    id: snapshot.id,
  } as Build;
};

export const getBuilds = async (): Promise<Build[]> => {
  const buildsRef = collection(firestore, 'builds');
  const querySnapshot = await getDocs(buildsRef);
  return querySnapshot.docs.map((buildDoc) => ({
    ...(buildDoc.data() as BuildDoc),
    id: buildDoc.id,
  }));
};

export const handleUserLike = async (userId: string, buildId: string, shouldAdd = true) => {
  const userRef = doc(firestore, `users/${userId}`);
  const buildRef = doc(firestore, `builds/${buildId}`);
  const userSnapshot = await getDoc(userRef);
  const buildSnapshot = await getDoc(buildRef);
  const { likes = 0 } = buildSnapshot.data() as Partial<BuildDoc>;
  let newLikes = shouldAdd ? Number(likes) + 1 : Number(likes) - 1;
  if (newLikes < 0) {
    newLikes = 0;
  }
  let { likedBuilds = [] } = userSnapshot.data() as UserDoc;
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

export const addComment = async (userId: string, buildId: string, comment: string) => {
  const buildRef = doc(firestore, `builds/${buildId}`);
  const buildSnapshot = await getDoc(buildRef);
  const { comments = [] } = buildSnapshot.data() as Partial<BuildDoc>;
  await updateDoc(buildRef, {
    comments: [...comments, { user: userId, comment, date: Date.now() }],
  });
};
