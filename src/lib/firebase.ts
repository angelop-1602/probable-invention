// lib/firebase.ts
// DEPRECATED: Please use src/lib/firebase-service.ts instead
// This file will be removed in a future update

import { app, auth, db, storage, withRetry } from "./firebase-service";

export { app, auth, db, storage, withRetry };

// Show deprecation warning in non-production environments
if (process.env.NODE_ENV !== 'production') {
  console.warn("WARNING: Using deprecated firebase.ts module. Please import from '@/lib/firebase-service' instead.");
}
