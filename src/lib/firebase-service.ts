/**
 * DEPRECATED: This file is maintained for backward compatibility.
 * Please import directly from '@/lib/firebase' instead.
 */

export * from './firebase/firebase.service';

// Show deprecation warning in non-production environments
if (process.env.NODE_ENV !== 'production') {
  console.warn("WARNING: Using deprecated firebase-service.ts module. Please import from '@/lib/firebase' instead.");
} 