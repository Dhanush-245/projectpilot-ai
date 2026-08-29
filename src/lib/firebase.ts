import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously as firebaseSignInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore,
  initializeFirestore
} from 'firebase/firestore';
import { buildFirebaseWebConfig } from './firebaseConfig';

const firebaseConfig = buildFirebaseWebConfig(import.meta.env);

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with custom databaseId if configured
let firestoreInstance: Firestore;
try {
  const databaseId = (import.meta.env.VITE_FIREBASE_DATABASE_ID as string | undefined)?.trim();
  if (databaseId) {
    firestoreInstance = initializeFirestore(app, {}, databaseId);
  } else {
    firestoreInstance = getFirestore(app);
  }
} catch (e) {
  // If already initialized
  const databaseId = (import.meta.env.VITE_FIREBASE_DATABASE_ID as string | undefined)?.trim();
  firestoreInstance = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
}

export const db = firestoreInstance;

// Helper to remove any undefined fields before sending to Firestore (Prevents undefined crashes)
export function sanitizeData<T extends Record<string, any>>(data: T): T {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        sanitized[key] = sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  return sanitized as T;
}

// Authentication Helpers
export async function loginWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function loginAsGuest(): Promise<FirebaseUser> {
  const result = await firebaseSignInAnonymously(auth);
  return result.user;
}

export async function logoutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export { onAuthStateChanged };
export type { FirebaseUser };

/**
 * Retrieves the current user's Firebase ID token for authenticated backend API requests.
 */
export async function getCurrentUserToken(forceRefresh: boolean = false): Promise<string | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  try {
    return await currentUser.getIdToken(forceRefresh);
  } catch (err) {
    console.error('Failed to retrieve Firebase ID token:', err);
    return null;
  }
}
