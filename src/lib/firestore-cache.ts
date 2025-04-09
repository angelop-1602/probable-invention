import { openDB, IDBPDatabase } from 'idb';
import { 
  getFirestore, 
  doc, 
  collection, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  DocumentReference, 
  CollectionReference, 
  DocumentData, 
  QuerySnapshot, 
  Query, 
  DocumentSnapshot 
} from 'firebase/firestore';

// Database name and version for IndexedDB
const DB_NAME = 'protocol-data-db';
const DB_VERSION = 1;

// Store names in IndexedDB
const DOC_STORE = 'documents';
const DOC_METADATA_STORE = 'documentMetadata';
const COLLECTION_STORE = 'collections';
const COLLECTION_METADATA_STORE = 'collectionMetadata';

// Interface for data metadata
interface DataMetadata {
  id: string;
  path: string;
  timestamp: number;
  version: string;
}

// Interface for cached document
interface CachedDocument {
  id: string;
  path: string;
  data: DocumentData;
  metadata: DataMetadata;
}

// Interface for cached collection
interface CachedCollection {
  id: string;
  path: string;
  data: DocumentData[];
  metadata: DataMetadata;
}

/**
 * Initialize the IndexedDB database
 */
async function initDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains(DOC_STORE)) {
        db.createObjectStore(DOC_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(DOC_METADATA_STORE)) {
        db.createObjectStore(DOC_METADATA_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(COLLECTION_STORE)) {
        db.createObjectStore(COLLECTION_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(COLLECTION_METADATA_STORE)) {
        db.createObjectStore(COLLECTION_METADATA_STORE, { keyPath: 'id' });
      }
    }
  });
}

/**
 * Store document and metadata in IndexedDB
 * @param path - Firestore document path
 * @param data - Document data
 */
async function storeDocumentInIndexedDB(path: string, data: DocumentData): Promise<void> {
  const db = await initDB();
  const id = path.replace(/\//g, '_');
  const timestamp = Date.now();
  const version = `v${timestamp}`;
  
  // Store the document data
  await db.put(DOC_STORE, { id, path, data });
  
  // Store the metadata separately
  const metadata: DataMetadata = {
    id,
    path,
    timestamp,
    version
  };
  
  await db.put(DOC_METADATA_STORE, metadata);
}

/**
 * Store collection and metadata in IndexedDB
 * @param path - Firestore collection path
 * @param data - Collection data (array of documents)
 */
async function storeCollectionInIndexedDB(path: string, data: DocumentData[]): Promise<void> {
  const db = await initDB();
  const id = path.replace(/\//g, '_');
  const timestamp = Date.now();
  const version = `v${timestamp}`;
  
  // Store the collection data
  await db.put(COLLECTION_STORE, { id, path, data });
  
  // Store the metadata separately
  const metadata: DataMetadata = {
    id,
    path,
    timestamp,
    version
  };
  
  await db.put(COLLECTION_METADATA_STORE, metadata);
}

/**
 * Get document from IndexedDB if it exists and is valid
 * @param path - Firestore document path
 * @param maxAge - Maximum age in milliseconds before considering data stale
 * @returns The cached document or null if not found or stale
 */
async function getDocumentFromIndexedDB(
  path: string, 
  maxAge?: number
): Promise<CachedDocument | null> {
  const db = await initDB();
  const id = path.replace(/\//g, '_');
  
  // Get the metadata
  const metadata = await db.get(DOC_METADATA_STORE, id);
  if (!metadata) return null;
  
  // If maxAge is provided, check if the data is still valid
  if (maxAge && Date.now() - metadata.timestamp > maxAge) {
    return null;
  }
  
  // Get the document data
  const documentData = await db.get(DOC_STORE, id);
  if (!documentData) return null;
  
  return {
    id,
    path,
    data: documentData.data,
    metadata
  };
}

/**
 * Get collection from IndexedDB if it exists and is valid
 * @param path - Firestore collection path
 * @param maxAge - Maximum age in milliseconds before considering data stale
 * @returns The cached collection or null if not found or stale
 */
async function getCollectionFromIndexedDB(
  path: string, 
  maxAge?: number
): Promise<CachedCollection | null> {
  const db = await initDB();
  const id = path.replace(/\//g, '_');
  
  // Get the metadata
  const metadata = await db.get(COLLECTION_METADATA_STORE, id);
  if (!metadata) return null;
  
  // If maxAge is provided, check if the data is still valid
  if (maxAge && Date.now() - metadata.timestamp > maxAge) {
    return null;
  }
  
  // Get the collection data
  const collectionData = await db.get(COLLECTION_STORE, id);
  if (!collectionData) return null;
  
  return {
    id,
    path,
    data: collectionData.data,
    metadata
  };
}

/**
 * Fetch document from Firestore and cache it in IndexedDB
 * @param path - Firestore document path
 * @returns The document data
 */
async function fetchAndCacheDocument(path: string): Promise<DocumentData | null> {
  const db = getFirestore();
  const docRef = doc(db, path);
  
  // Get the document from Firestore
  const snapshot = await getDoc(docRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  const data = snapshot.data();
  
  // Cache the document in IndexedDB
  await storeDocumentInIndexedDB(path, data);
  
  return data;
}

/**
 * Fetch collection from Firestore and cache it in IndexedDB
 * @param path - Firestore collection path
 * @param queryConstraints - Optional query constraints
 * @returns Array of document data
 */
async function fetchAndCacheCollection(
  path: string,
  queryFn?: (ref: CollectionReference) => Query
): Promise<DocumentData[]> {
  const db = getFirestore();
  const collectionRef = collection(db, path);
  
  // Apply query constraints if provided
  const queryRef = queryFn ? queryFn(collectionRef) : collectionRef;
  
  // Get the collection from Firestore
  const snapshot = await getDocs(queryRef);
  
  const data = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  // Cache the collection in IndexedDB
  await storeCollectionInIndexedDB(path, data);
  
  return data;
}

/**
 * Get document with caching
 * @param path - Firestore document path
 * @param maxAge - Maximum age in milliseconds before refreshing the cache (default: 5 minutes)
 * @returns The document data
 */
async function getDocumentWithCache(
  path: string, 
  maxAge: number = 5 * 60 * 1000
): Promise<DocumentData | null> {
  // Try to get from cache first
  const cachedDoc = await getDocumentFromIndexedDB(path, maxAge);
  
  if (cachedDoc) {
    return cachedDoc.data;
  }
  
  // If not in cache or stale, fetch from Firestore
  return fetchAndCacheDocument(path);
}

/**
 * Get collection with caching
 * @param path - Firestore collection path
 * @param queryFn - Optional function to create a query
 * @param maxAge - Maximum age in milliseconds before refreshing the cache (default: 5 minutes)
 * @returns Array of document data
 */
async function getCollectionWithCache(
  path: string,
  queryFn?: (ref: CollectionReference) => Query,
  maxAge: number = 5 * 60 * 1000
): Promise<DocumentData[]> {
  // Try to get from cache first
  const cachedCollection = await getCollectionFromIndexedDB(path, maxAge);
  
  if (cachedCollection) {
    return cachedCollection.data;
  }
  
  // If not in cache or stale, fetch from Firestore
  return fetchAndCacheCollection(path, queryFn);
}

/**
 * Listen to document changes and update cache
 * @param path - Firestore document path
 * @param callback - Function to call when the document changes
 * @returns Unsubscribe function
 */
function listenToDocumentWithCache(
  path: string,
  callback: (data: DocumentData | null) => void
): () => void {
  const db = getFirestore();
  const docRef = doc(db, path);
  
  // Setup real-time listener
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      
      // Update cache
      storeDocumentInIndexedDB(path, data)
        .then(() => {
          // Call callback with new data
          callback(data);
        })
        .catch(err => {
          console.error('Error updating document cache:', err);
          // Still call callback even if cache update fails
          callback(data);
        });
    } else {
      callback(null);
    }
  });
}

/**
 * Listen to collection changes and update cache
 * @param path - Firestore collection path
 * @param queryFn - Optional function to create a query
 * @param callback - Function to call when the collection changes
 * @returns Unsubscribe function
 */
function listenToCollectionWithCache(
  path: string,
  callback: (data: DocumentData[]) => void,
  queryFn?: (ref: CollectionReference) => Query
): () => void {
  const db = getFirestore();
  const collectionRef = collection(db, path);
  
  // Apply query constraints if provided
  const queryRef = queryFn ? queryFn(collectionRef) : collectionRef;
  
  // Setup real-time listener
  return onSnapshot(queryRef, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Update cache
    storeCollectionInIndexedDB(path, data)
      .then(() => {
        // Call callback with new data
        callback(data);
      })
      .catch(err => {
        console.error('Error updating collection cache:', err);
        // Still call callback even if cache update fails
        callback(data);
      });
  });
}

/**
 * Clear old cache entries to prevent storage from growing too large
 * @param maxAge - Maximum age in milliseconds before entry is considered old (default: 7 days)
 */
async function cleanupCache(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
  const db = await initDB();
  const now = Date.now();
  
  // Clean up document metadata and data
  const docMetadataTx = db.transaction(DOC_METADATA_STORE, 'readwrite');
  const docMetadataStore = docMetadataTx.objectStore(DOC_METADATA_STORE);
  const allDocMetadata = await docMetadataStore.getAll();
  
  for (const metadata of allDocMetadata) {
    if (now - metadata.timestamp > maxAge) {
      await docMetadataStore.delete(metadata.id);
      await db.delete(DOC_STORE, metadata.id);
    }
  }
  
  await docMetadataTx.done;
  
  // Clean up collection metadata and data
  const colMetadataTx = db.transaction(COLLECTION_METADATA_STORE, 'readwrite');
  const colMetadataStore = colMetadataTx.objectStore(COLLECTION_METADATA_STORE);
  const allColMetadata = await colMetadataStore.getAll();
  
  for (const metadata of allColMetadata) {
    if (now - metadata.timestamp > maxAge) {
      await colMetadataStore.delete(metadata.id);
      await db.delete(COLLECTION_STORE, metadata.id);
    }
  }
  
  await colMetadataTx.done;
}

export {
  getDocumentWithCache,
  getCollectionWithCache,
  listenToDocumentWithCache,
  listenToCollectionWithCache,
  fetchAndCacheDocument,
  fetchAndCacheCollection,
  cleanupCache
};

export type { CachedDocument, CachedCollection, DataMetadata }; 