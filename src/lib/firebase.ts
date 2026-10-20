import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Embedded default configuration ensuring CI/CD and Cloudflare Pages builds succeed without gitignored JSON dependencies
const DEFAULT_CONFIG = {
  projectId: "gen-lang-client-0265633535",
  appId: "1:1077276660800:web:e31ffedd1bef962accfba5",
  apiKey: "AIzaSyCDChmT0TrVIbweiaPa4wytXT9R8mWFlKU",
  authDomain: "gen-lang-client-0265633535.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-jkvoyage-471c7253-3c50-4a3c-bc94-f757485f75f8",
  storageBucket: "gen-lang-client-0265633535.firebasestorage.app",
  messagingSenderId: "1077276660800",
};

// Load configuration from Vite environment variables when provided, otherwise use default configuration
const firebaseConfig = {
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || DEFAULT_CONFIG.projectId,
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || DEFAULT_CONFIG.appId,
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || DEFAULT_CONFIG.apiKey,
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || DEFAULT_CONFIG.authDomain,
  firestoreDatabaseId: (import.meta.env.VITE_FIREBASE_DATABASE_ID as string) || DEFAULT_CONFIG.firestoreDatabaseId,
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || DEFAULT_CONFIG.storageBucket,
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || DEFAULT_CONFIG.messagingSenderId,
};

export const app = initializeApp(firebaseConfig);

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account",
});