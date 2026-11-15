// The Firebase app, Auth and Firestore instances, wired to the emulators in dev and tests.
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

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
