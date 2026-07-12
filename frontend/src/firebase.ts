import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import type { Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (import.meta.env.FIREBASE_API_KEY as string),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (import.meta.env.FIREBASE_AUTH_DOMAIN as string),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || (import.meta.env.FIREBASE_PROJECT_ID as string),
  appId: import.meta.env.VITE_FIREBASE_APP_ID || (import.meta.env.FIREBASE_APP_ID as string),
};

const isConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (isConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  } catch (err) {
    console.error('Firebase initialization failed:', err);
  }
} else {
  console.warn('Firebase VITE_FIREBASE_API_KEY env var not set. Firebase Auth initialized in mockup/disabled state.');
}

export { auth, googleProvider };
