# Protocol Review System Optimization

This document outlines the optimizations implemented for document handling and real-time updates in the Protocol Review System.

## Overview

We've implemented the following optimizations:

1. **Document Zipping and Caching**: Files are now zipped before uploading to Firebase Storage, reducing storage costs and network bandwidth.
2. **Firestore Data Caching**: Firestore data is cached locally in IndexedDB, reducing read costs and improving performance.
3. **Real-time Updates**: The system now provides real-time updates for both application status and document changes.

## Implementation Details

### 1. Document Storage Service

```typescript
// src/lib/document-storage.ts
```

This service handles:
- Zipping files before uploading to Firebase Storage
- Storing metadata in Firestore for tracking file versions
- Caching zipped files in IndexedDB
- On-demand unzipping of files when needed
- Real-time updates when files change

Key functions:
- `zipFiles`: Compresses multiple files into a single zip file
- `uploadZippedFiles`: Uploads a zipped blob to Firebase Storage
- `storeFileMetadataInFirestore`: Stores file metadata in Firestore
- `unzipFiles`: Decompresses a zip blob into individual files
- `fetchAndCacheZippedFiles`: Downloads, caches, and unzips files from Firebase Storage
- `listenToFileUpdates`: Sets up real-time listeners for file changes

### 2. Firestore Cache Service

```typescript
// src/lib/firestore-cache.ts
```

This service handles:
- Caching Firestore documents and collections in IndexedDB
- Providing access to cached data with versioning
- Updating cache when Firestore data changes
- Real-time updates for Firestore data

Key functions:
- `getDocumentWithCache`: Retrieves a document with caching
- `getCollectionWithCache`: Retrieves a collection with caching
- `listenToDocumentWithCache`: Sets up real-time document listeners with cache updates
- `listenToCollectionWithCache`: Sets up real-time collection listeners with cache updates

### 3. Enhanced Submission Service

```typescript
// src/lib/enhanced-submission-service.ts
```

This service uses both document storage and Firestore cache services to:
- Submit protocol applications with optimized document handling
- Check for duplicate submissions
- Track application status in real-time
- Retrieve application documents efficiently

### 4. React Hooks for UI Integration

```typescript
// src/hooks/useApplicationData.ts
```

These hooks make it easy to use the optimized services in React components:
- `useSubmitApplication`: Handles protocol submission with optimized document handling
- `useApplicationStatus`: Provides real-time application status updates
- `useApplicationDocuments`: Gives access to application documents with real-time updates
- `useUserApplications`: Retrieves all applications for a user with caching

## UI Components

### Protocol Submission

```typescript
// src/components/ProponentSubmission.tsx
```

This component provides a form for submitting new protocol applications with:
- Multiple file uploads
- Optimized document handling in the background
- Form validation
- Success/error handling

### Application Tracker

```typescript
// src/components/ApplicationTracker.tsx
```

This component provides real-time tracking of application status with:
- Status visualization with color coding
- Progress tracking with a progress bar
- Real-time document access
- Document download functionality

### Proponent Dashboard

```typescript
// src/app/proponent/page.tsx
```

This page combines both submission and tracking functionality in a single dashboard with:
- Tab navigation between submission and tracking
- Application lookup by code
- List of user's applications
- Real-time updates for all data

## Benefits

1. **Reduced Firebase Costs**:
   - Fewer Firestore reads due to local caching
   - Reduced Storage costs due to file compression
   - Less bandwidth usage for document transfer

2. **Improved Performance**:
   - Faster loading of previously accessed data due to caching
   - Efficient document handling with zipping/unzipping
   - Real-time updates without excessive polling

3. **Enhanced User Experience**:
   - Real-time status updates without page refreshes
   - Faster document access for previously viewed files
   - Offline capability for already cached data

## Usage Considerations

### Data Freshness vs. Cost

The caching system balances data freshness with cost optimization:
- By default, Firestore data is cached for 5 minutes
- Files are cached for 7 days by default
- Real-time listeners ensure critical updates are reflected immediately
- Cache cleanup runs periodically to prevent excessive storage usage

### Browser Storage Limitations

IndexedDB has storage limitations that vary by browser and device. The system:
- Automatically cleans up old cache entries
- Uses efficient storage with zipped files
- Handles cache misses gracefully by fetching from Firebase

## Future Improvements

1. **Selective Document Downloading**: Allow users to select which documents to download rather than downloading the entire zip.
2. **Progressive Web App Support**: Add service workers for full offline support.
3. **Cache Synchronization**: Implement multi-device cache synchronization for users with multiple devices.
4. **Compression Level Options**: Add options to balance between compression ratio and performance based on document types.

### Optimized Collection Structure
- Only using `protocolReviewApplications` collection for storing application data
- Documents are stored directly in the protocol document under a `documents` array
- Document titles are explicitly stored in fields `displayName` and `title` for better identification
- No separate `applications` collection is used to avoid redundancy 