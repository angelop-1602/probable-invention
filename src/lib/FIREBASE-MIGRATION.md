# Firebase Migration Guide

## Overview

We've consolidated all Firebase-related functionality into a single file for better maintainability and to fix initialization issues. This guide will help you migrate your code to use the new Firebase service.

## Changes Made

1. Created a new consolidated file: `src/lib/firebase-service.ts`
2. Removed duplicate initialization code
3. Deleted deprecated files:
   - `src/lib/firebase-config.ts`
   - `src/lib/firestore-helper.ts`
   - `src/lib/firebase/firebase-config.ts`
   - `src/lib/firebase/index.ts`

## How to Migrate

### Current imports:

```typescript
// If you're currently using:
import { db, auth, storage } from '@/lib/firebase';
```

### New recommended imports:

```typescript
// Update to:
import { db, auth, storage } from '@/lib/firebase-service';
```

### Available exports:

- `app`: Firebase application instance
- `auth`: Firebase authentication service
- `db`: Firestore database service
- `storage`: Firebase storage service
- `withRetry`: Utility for retrying Firebase operations
- `randomizeFirestoreUrl`: Utility to avoid ad blocker detection
- `getFirestoreErrorMessage`: User-friendly error message formatter

## Backward Compatibility

The old `firebase.ts` file now re-exports from the new `firebase-service.ts` file to maintain backward compatibility. However, it will be removed in a future update, so please migrate your imports as soon as possible.

## Benefits

- Single source of truth for Firebase configuration
- Prevents "Firebase already initialized" errors
- Better organization and maintainability
- Consistent initialization settings across the app
- Built-in ad blocker detection and error handling

## Troubleshooting

If you encounter any issues after migration, please check:

1. That all imports have been updated to use the new file
2. That any custom Firebase configuration is now applied in `firebase-service.ts`
3. That the Firebase Provider component is correctly placed in your component tree 