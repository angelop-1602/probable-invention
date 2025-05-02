import JSZip from 'jszip';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { getStorage, ref, getBytes } from 'firebase/storage';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Define the database schema
interface DocumentCacheDB extends DBSchema {
  documents: {
    key: string;
    value: {
      id: string;
      content: Uint8Array;
      unzippedContent: string | ArrayBuffer;
      timestamp: number;
      version: string;
    };
    indexes: { 'by-timestamp': number };
  };
  metadata: {
    key: string;
    value: {
      id: string;
      lastModified: number;
      version: string;
    };
  };
}

// Cache duration in milliseconds (24 hours)
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;

// Initialize IndexedDB
const initDB = async (): Promise<IDBPDatabase<DocumentCacheDB>> => {
  return openDB<DocumentCacheDB>('document-cache', 1, {
    upgrade(db) {
      // Create document store
      const docStore = db.createObjectStore('documents', {
        keyPath: 'id',
      });
      docStore.createIndex('by-timestamp', 'timestamp');

      // Create metadata store
      db.createObjectStore('metadata', {
        keyPath: 'id',
      });
    },
  });
};

// Check if document exists in cache and is valid
export const checkDocumentCache = async (
  documentId: string
): Promise<{ exists: boolean; data?: any }> => {
  try {
    const db = await initDB();
    
    // Get document from cache
    const cachedDoc = await db.get('documents', documentId);
    
    // Get metadata for validation
    const metadata = await db.get('metadata', documentId);
    
    // If document doesn't exist in cache
    if (!cachedDoc) {
      return { exists: false };
    }
    
    // Check if cache is expired
    const now = Date.now();
    if (now - cachedDoc.timestamp > CACHE_EXPIRY) {
      return { exists: false };
    }
    
    // Check if version is still valid
    if (metadata && metadata.version !== cachedDoc.version) {
      return { exists: false };
    }
    
    return {
      exists: true,
      data: {
        content: cachedDoc.content,
        unzippedContent: cachedDoc.unzippedContent,
      },
    };
  } catch (error) {
    console.error('Error checking document cache:', error);
    return { exists: false };
  }
};

// Helper function to convert ArrayBuffer to Uint8Array
const arrayBufferToUint8Array = (buffer: ArrayBuffer): Uint8Array => {
  return new Uint8Array(buffer);
};

// Store document in cache
export const cacheDocument = async (
  documentId: string,
  content: Uint8Array | ArrayBuffer,
  unzippedContent: string | ArrayBuffer,
  version: string
): Promise<void> => {
  try {
    const db = await initDB();
    
    // Convert ArrayBuffer to Uint8Array if needed
    const contentUint8Array = content instanceof ArrayBuffer 
      ? arrayBufferToUint8Array(content) 
      : content;
    
    // Store document
    await db.put('documents', {
      id: documentId,
      content: contentUint8Array,
      unzippedContent,
      timestamp: Date.now(),
      version,
    });
    
    // Store metadata
    await db.put('metadata', {
      id: documentId,
      lastModified: Date.now(),
      version,
    });
    
  } catch (error) {
    console.error('Error caching document:', error);
  }
};

// Invalidate cache entry
export const invalidateCache = async (documentId: string): Promise<void> => {
  try {
    const db = await initDB();
    await db.delete('documents', documentId);
    
    // We don't delete metadata as it might be useful to know the document existed
    // Just update the lastModified timestamp
    const metadata = await db.get('metadata', documentId);
    if (metadata) {
      await db.put('metadata', {
        ...metadata,
        lastModified: Date.now(),
      });
    }
  } catch (error) {
    console.error('Error invalidating cache:', error);
  }
};

// Unzip document content
export const unzipDocument = async (
  content: Uint8Array | ArrayBuffer
): Promise<ArrayBuffer> => {
  try {
    const zip = new JSZip();
    
    // Ensure content is in the right format for JSZip
    // JSZip accepts various formats including ArrayBuffer and Uint8Array directly
    const zipFile = await zip.loadAsync(content);
    
    // Get the first file in the zip
    const files = Object.values(zipFile.files);
    if (files.length === 0) {
      throw new Error('Zip file is empty');
    }
    
    // Get the file content - adjust the format based on your file type
    const file = files[0];
    const fileContent = await file.async('arraybuffer');
    
    return fileContent;
  } catch (error) {
    console.error('Error unzipping document:', error);
    throw error;
  }
};

// Clean up old cache entries
export const cleanupCache = async (): Promise<void> => {
  try {
    const db = await initDB();
    const now = Date.now();
    
    // Get all documents
    const tx = db.transaction('documents', 'readwrite');
    const index = tx.store.index('by-timestamp');
    let cursor = await index.openCursor();
    
    // Delete documents older than cache expiry
    while (cursor) {
      if (now - cursor.value.timestamp > CACHE_EXPIRY) {
        await cursor.delete();
      }
      cursor = await cursor.continue();
    }
    
    await tx.done;
  } catch (error) {
    console.error('Error cleaning up cache:', error);
  }
}; 