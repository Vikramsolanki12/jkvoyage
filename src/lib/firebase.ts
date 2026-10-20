import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import fallbackConfig from "../../firebase-applet-config.json";

// Load configuration directly from .env (with fallback)
const firebaseConfig = {
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || fallbackConfig.projectId,
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || fallbackConfig.appId,
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || fallbackConfig.apiKey,
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || fallbackConfig.authDomain,
  firestoreDatabaseId: (import.meta.env.VITE_FIREBASE_DATABASE_ID as string) || fallbackConfig.firestoreDatabaseId,
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || fallbackConfig.storageBucket,
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || fallbackConfig.messagingSenderId,
};

export const app = initializeApp(firebaseConfig);

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account",
});