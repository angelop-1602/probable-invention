import { useState, useEffect, useCallback } from 'react';
import { 
  fetchAndCacheZippedFiles, 
  listenToFileUpdates, 
  unzipFiles 
} from '@/lib/document-storage';

/**
 * Hook for accessing and managing documents from Firebase Storage
 * Handles fetching, caching, and streaming documents
 */
export function useDocumentStorage() {
  const [documents, setDocuments] = useState<Map<string, Blob>>(new Map());
  const [documentUrls, setDocumentUrls] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch a document from Firebase Storage and cache it locally
   * @param applicationId - The application ID
   * @param documentType - The document type (submission, resubmission, etc.)
   * @param documentId - The Firestore document ID
   * @param version - The version of the document
   * @returns A map of filenames to blob URLs
   */
  const fetchDocument = useCallback(async (
    applicationId: string,
    documentType: string,
    documentId: string,
    version: string
  ) => {
    setIsLoading(true);
    setError(null);
    
    console.log('useDocumentStorage: Fetching document:', {
      applicationId,
      documentType,
      documentId,
      version
    });
    
    try {
      // Normalize document type and ID
      // Some document types might be capitalized or have spaces
      const normalizedDocType = documentType.toLowerCase().trim().replace(/\s+/g, '');
      
      // If documentId is undefined or empty, use applicationId + documentType as fallback
      const normalizedDocId = documentId 
        ? documentId 
        : `${applicationId}_${normalizedDocType}`;
      
      // If version is undefined or empty, use "v1" as fallback
      const normalizedVersion = version || "v1";
      
      console.log('useDocumentStorage: Using normalized values:', {
        normalizedDocType,
        normalizedDocId,
        normalizedVersion
      });
      
      const fileBlobs = await fetchAndCacheZippedFiles(
        applicationId,
        normalizedDocType,
        normalizedDocId,
        normalizedVersion
      );
      
      if (fileBlobs.size === 0) {
        console.warn('useDocumentStorage: No files returned from fetchAndCacheZippedFiles');
        setError('No document files were found. Please try again later.');
        setDocuments(new Map());
        setDocumentUrls(new Map());
        return new Map<string, string>();
      }
      
      console.log(`useDocumentStorage: Successfully fetched ${fileBlobs.size} files`);
      setDocuments(fileBlobs);
      
      // Create blob URLs for all files
      const urls = new Map<string, string>();
      for (const [path, blob] of fileBlobs.entries()) {
        const blobUrl = URL.createObjectURL(blob);
        urls.set(path, blobUrl);
      }
      
      setDocumentUrls(urls);
      return urls;
    } catch (err) {
      console.error('Error fetching document:', err);
      setError('Failed to fetch document. Please try again later.');
      setDocuments(new Map());
      setDocumentUrls(new Map());
      return new Map<string, string>();
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Listen for updates to document files
   * @param applicationId - The application ID
   * @param documentType - The document type (submission, resubmission, etc.)
   * @param documentName - Optional specific document name
   * @returns A cleanup function to unsubscribe
   */
  const listenForDocumentUpdates = useCallback((
    applicationId: string,
    documentType: string,
    documentName?: string
  ) => {
    setIsLoading(true);
    
    const unsubscribe = listenToFileUpdates(
      applicationId,
      documentType,
      (fileBlobs) => {
        setDocuments(fileBlobs);
        
        // Create blob URLs for all files
        const urls = new Map<string, string>();
        for (const [path, blob] of fileBlobs.entries()) {
          const blobUrl = URL.createObjectURL(blob);
          urls.set(path, blobUrl);
        }
        
        setDocumentUrls(urls);
        setIsLoading(false);
      },
      documentName
    );
    
    return unsubscribe;
  }, []);

  /**
   * Get a specific file from a zipped document
   * @param zipBlob - The zipped blob
   * @param filename - The filename to extract (optional, gets the first file if not specified)
   * @returns A blob URL for the file
   */
  const getFileFromZip = useCallback(async (
    zipBlob: Blob,
    filename?: string
  ): Promise<string> => {
    try {
      const files = await unzipFiles(zipBlob);
      
      if (files.size === 0) {
        throw new Error('No files found in the document');
      }
      
      let fileBlob: Blob | undefined;
      
      if (filename && files.has(filename)) {
        fileBlob = files.get(filename);
      } else {
        // Get the first file
        fileBlob = files.values().next().value;
      }
      
      if (!fileBlob) {
        throw new Error('Failed to extract file from document');
      }
      
      return URL.createObjectURL(fileBlob);
    } catch (err) {
      console.error('Error extracting file from zip:', err);
      throw new Error('Could not extract file from document');
    }
  }, []);

  /**
   * Clean up resources when component unmounts
   */
  useEffect(() => {
    return () => {
      // Revoke all blob URLs to prevent memory leaks
      documentUrls.forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [documentUrls]);

  return {
    documents,
    documentUrls,
    isLoading,
    error,
    fetchDocument,
    listenForDocumentUpdates,
    getFileFromZip
  };
}

export default useDocumentStorage; 