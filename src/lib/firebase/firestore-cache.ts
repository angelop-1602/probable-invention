/**
 * Firestore Cache Module
 * 
 * This module provides caching functionality for Firestore data
 * using IndexedDB for persistence.
 */

import { collection, query, QueryConstraint, getDocs, onSnapshot, doc, getDoc, DocumentData, Query } from "firebase/firestore";
import { openDB, IDBPDatabase } from 'idb';
import { db as firestore } from './firebase.service';

// Cache database name and version
const CACHE_DB_NAME = 'firestore-cache-db';
const CACHE_DB_VERSION = 1;
const COLLECTION_STORE = 'collection-cache';
const DOCUMENT_STORE = 'document-cache';
const METADATA_STORE = 'cache-metadata';

// Cache TTL in milliseconds (default: 1 hour)
const DEFAULT_CACHE_TTL = 60 * 60 * 1000;

// Cache database reference
let dbPromise: Promise<IDBPDatabase> | null = null;

/**
 * Initialize the IndexedDB database
 */
const initDB = async (): Promise<IDBPDatabase> => {
  if (!dbPromise) {
    dbPromise = openDB(CACHE_DB_NAME, CACHE_DB_VERSION, {
      upgrade(db) {
        // Create collection cache store
        if (!db.objectStoreNames.contains(COLLECTION_STORE)) {
          db.createObjectStore(COLLECTION_STORE);
        }
        
        // Create document cache store
        if (!db.objectStoreNames.contains(DOCUMENT_STORE)) {
          db.createObjectStore(DOCUMENT_STORE);
        }
        
        // Create metadata store
        if (!db.objectStoreNames.contains(METADATA_STORE)) {
          db.createObjectStore(METADATA_STORE);
        }
      }
    });
  }
  
  return dbPromise;
};

/**
 * Generate a cache key from a collection path and optional query constraints
 */
const generateCacheKey = (path: string, queryFn?: (ref: any) => Query<DocumentData>): string => {
  if (!queryFn) {
    return path;
  }
  
  // Create a collection reference
  const collectionRef = collection(firestore, path);
  
  // Apply query function
  const queryRef = queryFn(collectionRef);
  
  // Get the query string representation
  const queryString = JSON.stringify(queryRef);
  
  // Hash the query string
  let hash = 0;
  for (let i = 0; i < queryString.length; i++) {
    const char = queryString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return `${path}:${hash}`;
};

/**
 * Get collection data with cache
 * @param path Collection path
 * @param queryFn Optional query function
 * @returns Collection data
 */
export const getCollectionWithCache = async (
  path: string,
  queryFn?: (ref: any) => Query<DocumentData>
): Promise<any[]> => {
  try {
    const db = await initDB();
    const cacheKey = generateCacheKey(path, queryFn);
    
    // Check cache metadata
    const metadata = await db.get(METADATA_STORE, cacheKey);
    
    if (metadata && Date.now() - metadata.timestamp < metadata.ttl) {
      // Cache is valid, return cached data
      const cachedData = await db.get(COLLECTION_STORE, cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }
    
    // Cache is invalid or missing, fetch from Firestore
    const collectionRef = collection(firestore, path);
    const queryRef = queryFn ? queryFn(collectionRef) : collectionRef;
    const snapshot = await getDocs(queryRef);
    
    // Process data
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Store in cache
    await db.put(COLLECTION_STORE, data, cacheKey);
    await db.put(METADATA_STORE, {
      timestamp: Date.now(),
      ttl: DEFAULT_CACHE_TTL
    }, cacheKey);
    
    return data;
  } catch (error) {
    console.error('Error getting collection with cache:', error);
    
    // Try to fall back to direct Firestore call
    const collectionRef = collection(firestore, path);
    const queryRef = queryFn ? queryFn(collectionRef) : collectionRef;
    const snapshot = await getDocs(queryRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
};

/**
 * Listen to a document with cache fallback
 * @param path Document path
 * @param callback Callback function for document updates
 * @returns Unsubscribe function
 */
export const listenToDocumentWithCache = (
  path: string,
  callback: (data: any) => void
): (() => void) => {
  // Create document reference
  const docRef = doc(firestore, path);
  
  // Start by getting the document from cache
  getDocumentWithCache(path)
    .then(cachedData => {
      if (cachedData) {
        callback(cachedData);
      }
    })
    .catch(err => {
      console.error('Error getting document from cache:', err);
    });
  
  // Set up real-time listener
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = {
        id: snapshot.id,
        ...snapshot.data()
      };
      
      // Update cache
      updateDocumentCache(path, data);
      
      // Call callback
      callback(data);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error(`Error listening to document ${path}:`, error);
  });
};

/**
 * Listen to a collection with cache fallback
 * @param path Collection path
 * @param callback Callback function for collection updates
 * @param queryFn Optional query function
 * @returns Unsubscribe function
 */
export const listenToCollectionWithCache = (
  path: string,
  callback: (data: any[]) => void,
  queryFn?: (ref: any) => Query<DocumentData>
): (() => void) => {
  // Create collection reference
  const collectionRef = collection(firestore, path);
  const queryRef = queryFn ? queryFn(collectionRef) : collectionRef;
  
  // Start by getting the collection from cache
  getCollectionWithCache(path, queryFn)
    .then(cachedData => {
      if (cachedData && cachedData.length > 0) {
        callback(cachedData);
      }
    })
    .catch(err => {
      console.error('Error getting collection from cache:', err);
    });
  
  // Set up real-time listener
  return onSnapshot(queryRef, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Update cache
    updateCollectionCache(path, data, queryFn);
    
    // Call callback
    callback(data);
  }, (error) => {
    console.error(`Error listening to collection ${path}:`, error);
  });
};

/**
 * Get document data with cache
 * @param path Document path
 * @returns Document data
 */
export const getDocumentWithCache = async (path: string): Promise<any> => {
  try {
    const db = await initDB();
    
    // Check cache metadata
    const metadata = await db.get(METADATA_STORE, path);
    
    if (metadata && Date.now() - metadata.timestamp < metadata.ttl) {
      // Cache is valid, return cached data
      const cachedData = await db.get(DOCUMENT_STORE, path);
      if (cachedData) {
        return cachedData;
      }
    }
    
    // Cache is invalid or missing, fetch from Firestore
    const docRef = doc(firestore, path);
    const snapshot = await getDoc(docRef);
    
    if (snapshot.exists()) {
      // Process data
      const data = {
        id: snapshot.id,
        ...snapshot.data()
      };
      
      // Store in cache
      await db.put(DOCUMENT_STORE, data, path);
      await db.put(METADATA_STORE, {
        timestamp: Date.now(),
        ttl: DEFAULT_CACHE_TTL
      }, path);
      
      return data;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting document with cache:', error);
    
    // Try to fall back to direct Firestore call
    const docRef = doc(firestore, path);
    const snapshot = await getDoc(docRef);
    
    if (snapshot.exists()) {
      return {
        id: snapshot.id,
        ...snapshot.data()
      };
    }
    
    return null;
  }
};

/**
 * Update document cache
 * @param path Document path
 * @param data Document data
 */
const updateDocumentCache = async (path: string, data: any): Promise<void> => {
  try {
    const db = await initDB();
    
    // Store in cache
    await db.put(DOCUMENT_STORE, data, path);
    await db.put(METADATA_STORE, {
      timestamp: Date.now(),
      ttl: DEFAULT_CACHE_TTL
    }, path);
  } catch (error) {
    console.error('Error updating document cache:', error);
  }
};

/**
 * Update collection cache
 * @param path Collection path
 * @param data Collection data
 * @param queryFn Optional query function
 */
const updateCollectionCache = async (
  path: string,
  data: any[],
  queryFn?: (ref: any) => Query<DocumentData>
): Promise<void> => {
  try {
    const db = await initDB();
    const cacheKey = generateCacheKey(path, queryFn);
    
    // Store in cache
    await db.put(COLLECTION_STORE, data, cacheKey);
    await db.put(METADATA_STORE, {
      timestamp: Date.now(),
      ttl: DEFAULT_CACHE_TTL
    }, cacheKey);
  } catch (error) {
    console.error('Error updating collection cache:', error);
  }
};

/**
 * Clean up old cache entries
 * @param maxAge Maximum age of cache entries in milliseconds
 */
export const cleanupCache = async (maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> => {
  try {
    const db = await initDB();
    const now = Date.now();
    
    // Get all metadata entries
    const tx = db.transaction(METADATA_STORE, 'readwrite');
    const store = tx.objectStore(METADATA_STORE);
    let cursor = await store.openCursor();
    
    // List of keys to delete
    const keysToDelete = [];
    
    // Check each entry
    while (cursor) {
      const metadata = cursor.value;
      const key = cursor.key;
      
      if (now - metadata.timestamp > maxAge) {
        keysToDelete.push(key);
        await cursor.delete();
      }
      
      cursor = await cursor.continue();
    }
    
    // Delete corresponding data entries
    if (keysToDelete.length > 0) {
      // Delete from document store
      const docTx = db.transaction(DOCUMENT_STORE, 'readwrite');
      const docStore = docTx.objectStore(DOCUMENT_STORE);
      
      for (const key of keysToDelete) {
        await docStore.delete(key);
      }
      
      // Delete from collection store
      const colTx = db.transaction(COLLECTION_STORE, 'readwrite');
      const colStore = colTx.objectStore(COLLECTION_STORE);
      
      for (const key of keysToDelete) {
        await colStore.delete(key);
      }
    }
    
    console.log(`Cleaned up ${keysToDelete.length} cache entries`);
  } catch (error) {
    console.error('Error cleaning up cache:', error);
  }
}; 