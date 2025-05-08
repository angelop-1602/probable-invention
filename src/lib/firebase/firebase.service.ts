/**
 * Firebase Service
 * 
 * Single source of truth for all Firebase services and utilities.
 * All Firebase initialization and utilities are managed in this file.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore, persistentLocalCache, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase (safely handle SSR and prevent duplicate initialization)
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth: Auth = getAuth(app);

// Initialize Firestore with optimized settings for ad-blocker resistance
const db: Firestore = getFirestore(app);

// In development, connect to Firestore emulator if configured
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development' && 
    process.env.NEXT_PUBLIC_USE_EMULATOR === 'true') {
  const emulatorHost = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || 'localhost';
  const emulatorPort = parseInt(process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT || '8080', 10);
  
  connectFirestoreEmulator(db, emulatorHost, emulatorPort);
  console.log(`Connected to Firestore emulator at ${emulatorHost}:${emulatorPort}`);
}

// Initialize Storage
const storage: FirebaseStorage = getStorage(app);

// Add event listener to detect ad blocker issues in browser environments
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    if (e.message && (
      e.message.includes('ERR_BLOCKED_BY_CLIENT') ||
      e.message.includes('failed to fetch') ||
      e.message.includes('Network Error')
    )) {
      console.warn('Firebase request may be blocked by an ad blocker. Consider whitelisting this domain in your ad blocker settings.');
    }
  });
}

/**
 * Retry utility for Firebase operations with exponential backoff
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Operation failed (attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt < maxRetries) {
        // Wait with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
      }
    }
  }
  
  throw lastError;
};

/**
 * Adds a random parameter to a Firestore URL to help avoid pattern-based blocking
 */
export const randomizeFirestoreUrl = (url: string): string => {
  const randomParam = `_r=${Math.random().toString(36).substring(2, 15)}`;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${randomParam}`;
};

/**
 * Create friendly error messages for Firestore errors
 */
export const getFirestoreErrorMessage = (error: unknown): string => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  if (
    errorMessage.includes('ERR_BLOCKED_BY_CLIENT') ||
    errorMessage.includes('failed to fetch') ||
    errorMessage.includes('Network Error') ||
    errorMessage.includes('timeout')
  ) {
    return 'Unable to connect to the database. This may be caused by an ad blocker or privacy extension. Please disable it for this site and refresh the page.';
  }
  
  if (errorMessage.includes('permission-denied')) {
    return 'You do not have permission to access this resource.';
  }
  
  if (errorMessage.includes('not-found')) {
    return 'The requested resource could not be found.';
  }
  
  return `An error occurred: ${errorMessage}`;
};

export { app, auth, db, storage }; 