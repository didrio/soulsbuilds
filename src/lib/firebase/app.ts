// The Firebase app, Auth and Firestore instances, wired to the emulators in dev and tests.
import { initializeApp } from 'firebase/app';
import { getToken, initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { isRecaptchaResource, watchAppCheck } from './appCheckStatus';

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
};

const emulatorConfig = {
  apiKey: 'demo-api-key',
  authDomain: `${EMULATOR_PROJECT_ID}.firebaseapp.com`,
  projectId: EMULATOR_PROJECT_ID,
};

// Firebase App Check (T10): proves requests come from this site, so the public API key can't be
// scripted against Firestore/Auth from elsewhere. reCAPTCHA Enterprise site key, public by design
// like the config above (created 2026-11-15 for soulsbuilds.web.app, soulsbuilds.firebaseapp.com and
// soulsbuilds.com). Empty = App Check off. Enforcement is turned on at T12 after watching the metrics
// (steps in docs/firebase.md "App Check"). Never used with the emulators.
const APP_CHECK_SITE_KEY = '6LfIGSEuAAAAAEib49PavJ7XuoPi1nv__TN4x5gN';

declare global {
  // App Check debug mode: `true` makes the SDK print a debug token to register in the console.
  var FIREBASE_APPCHECK_DEBUG_TOKEN: boolean | string | undefined;
}

const firebaseApp = initializeApp(USE_EMULATORS ? emulatorConfig : productionConfig);

if (!USE_EMULATORS && APP_CHECK_SITE_KEY) {
  // `npm run preview` serves the production build on 127.0.0.1, which the site key doesn't allow:
  // use a debug token there instead.
  if (['127.0.0.1', 'localhost'].includes(window.location.hostname)) {
    globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  // T24: if reCAPTCHA is blocked, the SDK waits forever and so does every request. Listen for its scripts
  // failing (capture phase: resource errors don't bubble) before the SDK injects them, then watch the token.
  const recaptchaErrors: (() => void)[] = [];
  document.addEventListener(
    'error',
    (event) => {
      if (isRecaptchaResource(event.target)) recaptchaErrors.forEach((callback) => callback());
    },
    true,
  );
  const appCheck = initializeAppCheck(firebaseApp, {
    provider: new ReCaptchaEnterpriseProvider(APP_CHECK_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  });
  watchAppCheck({
    getToken: () => getToken(appCheck),
    onRecaptchaError: (callback) => recaptchaErrors.push(callback),
  });
}
export const auth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);

if (USE_EMULATORS) {
  connectAuthEmulator(auth, `http://${EMULATOR_HOST}:${AUTH_EMULATOR_PORT}`, {
    disableWarnings: true,
  });
  connectFirestoreEmulator(firestore, EMULATOR_HOST, FIRESTORE_EMULATOR_PORT);
}
