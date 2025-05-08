import { initializeApp, getApps, cert } from 'firebase-admin/app';

/**
 * Initialize Firebase Admin SDK for server-side operations
 * This is used for API routes to bypass CORS restrictions
 */
export function initFirebaseAdminApp() {
  // Only initialize if it hasn't been initialized already
  if (getApps().length === 0) {
    // Check if we have Firebase Admin credentials in environment variables
    try {
      // For production, use service account from environment variables
      if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
        return initializeApp({
          credential: cert(serviceAccount)
        });
      } 
      
      // For development, the client-side Firebase config is sufficient
      // as we're just using this as a proxy to avoid CORS
      return initializeApp({
        // Note: In a real production app, you would use a service account
        // This is a simplified version for development purposes
      });
    } catch (error) {
      console.error('Error initializing Firebase Admin:', error);
      throw error;
    }
  }
} 