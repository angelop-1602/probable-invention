/**
 * DEPRECATED: This file is maintained for backward compatibility.
 * Please import directly from '@/lib/application/application.utils' instead.
 */

export * from './application/application.utils';

// Show deprecation warning in non-production environments
if (process.env.NODE_ENV !== 'production') {
  console.warn("WARNING: Using deprecated application-utils.ts module. Please import from '@/lib/application' instead.");
} 