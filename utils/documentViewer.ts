import { getStorage, ref, getBytes, getMetadata } from 'firebase/storage';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import {
  checkDocumentCache,
  cacheDocument,
  invalidateCache,
  unzipDocument,
  cleanupCache
} from './documentCache';

// Firebase initialization
import { storage } from '../lib/firebase';

interface DocumentViewerOptions {
  // Force fetch from Firebase, ignoring cache
  forceFresh?: boolean;
  // Cleanup old cache entries when retrieving a document
  cleanupOldCache?: boolean;
}

/**
 * Gets a document from Firebase Storage or local cache
 * 1. Checks if document is cached and valid
 * 2. If cached, returns the unzipped document
 * 3. If not cached or invalid, fetches from Firebase Storage
 * 4. Unzips the document
 * 5. Caches both the zipped and unzipped versions
 * 6. Returns the unzipped document
 */
export const getDocument = async (
  documentPath: string,
  options: DocumentViewerOptions = {}
): Promise<{ 
  content: string | ArrayBuffer;
  fromCache: boolean;
  metadata: any;
}> => {
  const { forceFresh = false, cleanupOldCache = true } = options;
  
  try {
    // Clean up old cache entries if requested
    if (cleanupOldCache) {
      await cleanupCache();
    }
    
    // Generate a unique ID for the document
    const documentId = documentPath.replace(/\//g, '_');
    
    // Check if document is in cache and valid
    if (!forceFresh) {
      const cacheResult = await checkDocumentCache(documentId);
      
      if (cacheResult.exists && cacheResult.data) {
        console.log('Document retrieved from cache:', documentId);
        return {
          content: cacheResult.data.unzippedContent,
          fromCache: true,
          metadata: { cacheTimestamp: cacheResult.data.timestamp },
        };
      }
    }
    
    // If not in cache or forced fresh, fetch from Firebase Storage
    console.log('Fetching document from Firebase Storage:', documentPath);
    
    // Get the document reference from Firebase Storage
    const storageRef = ref(storage, documentPath);
    
    // Get the document metadata (for versioning)
    const metadata = await getMetadata(storageRef);
    const version = metadata.generation || metadata.updated || '';
    
    // Fetch the zipped document from Firebase Storage
    const bytes = await getBytes(storageRef);
    
    // Unzip the document
    const unzippedContent = await unzipDocument(bytes);
    
    // Cache both the zipped and unzipped versions
    // Convert ArrayBuffer to Uint8Array if needed
    await cacheDocument(
      documentId, 
      bytes, 
      unzippedContent,
      version
    );
    
    return {
      content: unzippedContent,
      fromCache: false,
      metadata,
    };
  } catch (error) {
    console.error('Error retrieving document:', error);
    throw error;
  }
};

/**
 * Handles document updates and invalidates the cache if needed
 */
export const updateDocumentCache = async (documentPath: string): Promise<void> => {
  try {
    const documentId = documentPath.replace(/\//g, '_');
    await invalidateCache(documentId);
  } catch (error) {
    console.error('Error updating document cache:', error);
  }
};

/**
 * Renders the document content based on its type
 * This is a helper function to be used in components
 */
export const renderDocument = (
  content: string | ArrayBuffer,
  mimeType: string
): { type: string; renderedContent: any } => {
  // Convert ArrayBuffer to appropriate format based on MIME type
  if (content instanceof ArrayBuffer) {
    if (mimeType.startsWith('image/')) {
      // For images
      const blob = new Blob([content], { type: mimeType });
      const imageUrl = URL.createObjectURL(blob);
      return { type: 'image', renderedContent: imageUrl };
    } else if (mimeType.startsWith('application/pdf')) {
      // For PDFs
      const blob = new Blob([content], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(blob);
      return { type: 'pdf', renderedContent: pdfUrl };
    } else if (mimeType.startsWith('text/')) {
      // For text files
      const textDecoder = new TextDecoder('utf-8');
      const text = textDecoder.decode(content);
      return { type: 'text', renderedContent: text };
    }
  } else if (typeof content === 'string') {
    // Handle string content (likely already text)
    return { type: 'text', renderedContent: content };
  }
  
  // Default case - return raw content
  return { type: 'unknown', renderedContent: content };
}; 