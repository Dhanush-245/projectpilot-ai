export interface FirebaseWebConfigEnv {
  VITE_FIREBASE_API_KEY?: string;
  VITE_FIREBASE_AUTH_DOMAIN?: string;
  VITE_FIREBASE_PROJECT_ID?: string;
  VITE_FIREBASE_STORAGE_BUCKET?: string;
  VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  VITE_FIREBASE_APP_ID?: string;
  VITE_FIREBASE_MEASUREMENT_ID?: string;
}

export function buildFirebaseWebConfig(env: FirebaseWebConfigEnv = {}) {
  const config = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
  };
  const missing = Object.entries(config)
    .filter(([key, value]) => key !== 'measurementId' && !value?.trim())
    .map(([key]) => key);
  if (missing.length > 0) {
    throw new Error(`Missing Firebase configuration: ${missing.join(', ')}`);
  }
  return config as Required<Omit<typeof config, 'measurementId'>> & { measurementId?: string };
}
