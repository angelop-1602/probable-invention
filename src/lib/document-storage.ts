import JSZip from 'jszip';
import { openDB, IDBPDatabase } from 'idb';
import { getStorage, ref, uploadBytes, getDownloadURL, getMetadata } from 'firebase/storage';
import { doc, getFirestore, setDoc, getDoc, updateDoc, onSnapshot, collection, where, orderBy, limit, query } from 'firebase/firestore';

// Database name and version for IndexedDB
const DB_NAME = 'protocol-submissions-db';
const DB_VERSION = 1;

// Store names in IndexedDB
const FILE_STORE = 'files';
const METADATA_STORE = 'fileMetadata';

// Interface for file metadata
interface FileMetadata {
  id: string;
  fileName: string;
  contentType: string;
  version: string;
  timestamp: number;
  size?: number;
  displayName?: string;  // Make it optional to maintain compatibility with existing data
  title?: string;  // Add title property
}

// Interface for cached file
interface CachedFile {
  id: string;
  data: Blob | ArrayBuffer;
  metadata: FileMetadata;
}

/**
 * Initialize the IndexedDB database
 */
async function initDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains(FILE_STORE)) {
        db.createObjectStore(FILE_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE, { keyPath: 'id' });
      }
    }
  });
}

/**
 * Zip files before uploading to Firebase Storage
 * @param files - Array of files to zip
 * @param applicationId - Application ID to use in filename
 * @returns Promise with the zipped blob
 */
async function zipFiles(files: File[], applicationId: string): Promise<Blob> {
  const zip = new JSZip();
  
  // Add each file to the zip
  for (const file of files) {
    zip.file(file.name, file);
  }
  
  // Generate the zip file
  return zip.generateAsync({ type: 'blob' });
}

/**
 * Upload zipped files to Firebase Storage
 * @param zippedBlob - The zipped blob to upload
 * @param applicationId - Application ID for the storage path
 * @param documentType - Type of document (e.g., "submission", "resubmission")
 * @param documentName - Optional specific document name
 * @returns Promise with the download URL
 */
async function uploadZippedFiles(
  zippedBlob: Blob, 
  applicationId: string, 
  documentType: string,
  documentName?: string
): Promise<string> {
  const storage = getStorage();
  const timestamp = Date.now();
  const version = `v${timestamp}`;
  
  // Create a more conventional filename
  let displayName = "";
  
  switch(documentType.toLowerCase()) {
    case "submission":
      displayName = "Protocol Submission";
      break;
    case "resubmission":
      displayName = "Protocol Resubmission";
      break;
    case "amendments":
      displayName = "Protocol Amendments";
      break;
    case "approval":
      displayName = "Approval Letter";
      break;
    case "review":
      displayName = "Review Notes";
      break;
    default:
      // If documentName is provided, use it directly as a more readable name
      displayName = documentName ? documentName : documentType;
  }
  
  // We still need to maintain internal IDs for proper functionality
  // But we'll use a more conventional display name
  const internalFileName = `${applicationId}_${documentType}_${timestamp}.zip`;
  
  // Create storage path with organized folder structure
  const filePath = `applications/${applicationId}/${documentType}/${internalFileName}`;
  const storageRef = ref(storage, filePath);
  
  // Upload the zip file
  await uploadBytes(storageRef, zippedBlob);
  
  // Get the download URL
  return getDownloadURL(storageRef);
}

/**
 * Store file metadata in Firestore
 * @param applicationId - Application ID
 * @param fileName - Name of the zip file
 * @param storagePath - Path in Firebase Storage
 * @param documentType - Type of document
 * @param fileSize - Size of the zip file
 * @param documentName - Optional specific document name
 * @param version - Version identifier (default: generated from timestamp)
 * @param originalFilenames - Optional mapping of standardized names to original filenames
 */
async function storeFileMetadataInFirestore(
  applicationId: string,
  fileName: string,
  storagePath: string,
  documentType: string,
  fileSize: number,
  documentName?: string,
  version?: string,
  originalFilenames?: Record<string, Record<string, string>>
): Promise<void> {
  const db = getFirestore();
  const timestamp = Date.now();
  const versionId = version || `v${timestamp}`;
  
  // Create a document ID that includes the document name and version if provided
  const documentId = documentName 
    ? `${documentType}_${documentName}_${versionId}`
    : `${documentType}_${timestamp}`;
  
  // Generate a conventional display name
  let displayName = "";
  
  // Document type mapping for user-friendly titles
  const documentTitles: Record<string, string> = {
    // Standard protocol documents
    "form07a": "Form 07A: Protocol Review Application Form",
    "form07b": "Form 07B: Adviser's Certification Form",
    "form07c": "Form 07C: Informed Consent Template",
    "researchProposal": "Research Proposal/Study Protocol",
    "minutesOfProposalDefense": "Minutes of Proposal Defense",
    "questionnaires": "Questionnaires",
    "abstract": "Abstract",
    "curriculumVitae": "Curriculum Vitae of Researchers",
    "technicalReview": "Technical Review Approval",
    
    // Common submission types
    "submission": "Protocol Submission",
    "resubmission": "Protocol Resubmission",
    "amendments": "Protocol Amendments",
    "approval": "Approval Letter",
    "review": "Review Notes",
    "certificate": "Approval Certificate",
    "progress": "Progress Report",
    "final": "Final Report",
    "revision": "Revision Document",
  };
  
  // Try to map the document type to a user-friendly title
  if (documentType.toLowerCase() in documentTitles) {
    displayName = documentTitles[documentType.toLowerCase()];
  } else if (documentName && documentName.toLowerCase() in documentTitles) {
    displayName = documentTitles[documentName.toLowerCase()];
  } else {
    // Look for matches in the original filenames to determine document type
    if (originalFilenames) {
      const allFiles = Object.values(originalFilenames).flatMap(obj => Object.values(obj));
      const firstFileName = allFiles[0]?.toLowerCase() || "";
      
      // Try to guess document type from original filename
      for (const [key, title] of Object.entries(documentTitles)) {
        if (firstFileName.includes(key.toLowerCase())) {
          displayName = title;
          break;
        }
      }
    }
    
    // If still no match, use provided name or fallback to document type
    if (!displayName) {
      displayName = documentName ? documentName : documentType;
    }
  }
  
  // For versioned documents, append version number
  if (versionId.startsWith('v')) {
    const versionNumber = versionId.replace('v', '');
    const date = new Date(parseInt(versionNumber));
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    displayName = `${displayName} (${formattedDate})`;
  }
  
  const metadataRef = doc(db, 'applications', applicationId, 'documents', documentId);
  
  const metadataObject = {
    fileName,
    storagePath,
    documentType,
    documentName: documentName || documentType,
    displayName,  // Add conventional display name
    title: displayName, // Add explicit title field for better searchability
    uploadDate: timestamp,
    version: versionId,
    size: fileSize,
    status: 'submitted'
  };

  // Add original filenames mapping if provided
  if (originalFilenames) {
    Object.assign(metadataObject, { originalFilenames });
  }
  
  await setDoc(metadataRef, metadataObject);
}

/**
 * Store file and metadata in IndexedDB
 * @param id - Unique identifier for the file
 * @param data - File data (blob or array buffer)
 * @param metadata - File metadata
 */
async function storeInIndexedDB(id: string, data: Blob | ArrayBuffer, metadata: FileMetadata): Promise<void> {
  const db = await initDB();
  
  // Store the file data
  await db.put(FILE_STORE, { id, data });
  
  // Store the metadata separately
  await db.put(METADATA_STORE, metadata);
}

/**
 * Get file from IndexedDB if it exists and is valid
 * @param id - File identifier
 * @param currentVersion - Current version to compare for validity
 * @returns The cached file or null if not found or invalid
 */
async function getFromIndexedDB(id: string, currentVersion?: string): Promise<CachedFile | null> {
  const db = await initDB();
  
  // Get the metadata
  const metadata = await db.get(METADATA_STORE, id);
  if (!metadata) return null;
  
  // If version is provided, check if the cached version is current
  if (currentVersion && metadata.version !== currentVersion) {
    return null;
  }
  
  // Get the file data
  const fileData = await db.get(FILE_STORE, id);
  if (!fileData) return null;
  
  return {
    id,
    data: fileData.data,
    metadata
  };
}

/**
 * Unzip a blob containing zipped files
 * @param zipBlob - The zipped blob
 * @returns Promise with a map of filenames to file blobs
 */
async function unzipFiles(zipBlob: Blob): Promise<Map<string, Blob>> {
  const zip = new JSZip();
  const result = new Map<string, Blob>();
  
  // Load the zip file
  const zipContents = await zip.loadAsync(zipBlob);
  
  // Extract each file
  for (const filename of Object.keys(zipContents.files)) {
    if (!zipContents.files[filename].dir) {
      const fileData = await zipContents.files[filename].async('blob');
      result.set(filename, fileData);
    }
  }
  
  return result;
}

/**
 * Fetch file from Firebase Storage, unzip and cache it
 * @param applicationId - Application ID
 * @param documentType - Type of document
 * @param documentId - ID of the document in Firestore
 * @param version - Version of the file
 * @returns Promise with a map of filenames to file blobs
 */
async function fetchAndCacheZippedFiles(
  applicationId: string,
  documentType: string,
  documentId: string,
  version: string
): Promise<Map<string, Blob>> {
  const MAX_RETRIES = 3;
  let retryCount = 0;
  
  const attemptFetch = async (): Promise<Map<string, Blob>> => {
    try {
      const storage = getStorage();
      const db = getFirestore();
      
      // First check the protocolReviewApplications collection for document metadata
      const protocolRef = doc(db, 'protocolReviewApplications', applicationId);
      const protocolSnap = await getDoc(protocolRef);
      
      let data: any;
      let storagePath: string | undefined;
      let documentName: string = documentType; // Initialize with a default value
      
      if (protocolSnap.exists()) {
        // Get documents array from protocol document
        const protocolData = protocolSnap.data();
        const documents = protocolData.documents || [];
        
        // Find the specific document
        const docData = documents.find((doc: any) => 
          doc.documentId === documentId || 
          (doc.documentType === documentType && doc.documentName === documentName)
        );
        
        if (docData) {
          data = docData;
          storagePath = docData.storagePath;
          documentName = docData.displayName || docData.title || docData.documentName || documentType;
        } else {
          // If not found in documents array, check protocolDetails
          storagePath = protocolData.protocolDetails?.zipUrl;
          documentName = protocolData.protocolDetails?.documentName || documentType;
          data = { 
            storagePath,
            documentName,
            displayName: "Protocol Submission"
          };
        }
      }
      
      // If not found in protocolReviewApplications, try the legacy applications collection
      if (!storagePath) {
        const docRef = doc(db, 'applications', applicationId, 'documents', documentId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          console.warn(`No ${documentType} documents found for application ${applicationId}`);
          return new Map<string, Blob>();
        }
        
        data = docSnap.data();
        storagePath = data.storagePath;
        
        if (!storagePath) {
          console.warn(`No storage path found for document ${documentId}`);
          return new Map<string, Blob>();
        }
        
        documentName = data.displayName || data.title || data.documentName || documentType;
      }
      
      // Get the file from Firebase Storage
      const storageRef = ref(storage, storagePath);
      
      try {
        // First check if the file exists and get metadata
        let fileMetadata;
        try {
          fileMetadata = await getMetadata(storageRef);
        } catch (metadataError) {
          console.error(`Error fetching metadata: ${metadataError}`);
          throw new Error(`File not found in storage: ${storagePath}`);
        }
        
        // Get download URL - this might expire quickly
        let downloadUrl;
        try {
          downloadUrl = await getDownloadURL(storageRef);
        } catch (urlError) {
          console.error(`Error getting download URL: ${urlError}`);
          throw new Error(`Could not generate download URL for: ${storagePath}`);
        }
        
        // Log the download URL for debugging
        if (process.env.NODE_ENV === 'development') {
          console.log(`Attempting to fetch from URL: ${downloadUrl}`);
        }
        
        // Use proxy API route to fetch the file instead of direct fetch
        // This avoids CORS issues by making the request server-side
        const encodedUrl = encodeURIComponent(downloadUrl);
        const proxyUrl = `/api/proxy-storage?url=${encodedUrl}`;
        
        console.log(`Using proxy to fetch: ${proxyUrl}`);
        
        // Fetch through our proxy
        let response;
        try {
          response = await fetch(proxyUrl);
          
          if (!response.ok) {
            throw new Error(`HTTP error from proxy: ${response.status}`);
          }
        } catch (error) {
          console.error('Proxy fetch failed:', error);
          throw error;
        }
        
        // Ensure response is defined before accessing blob() method
        if (!response) {
          throw new Error(`No valid response received when fetching ${storagePath}`);
        }
        
        const zipBlob = await response.blob();
        
        // Cache the zipped file with a consistent ID format including document name and version
        // Still use internal naming for cache ID to maintain compatibility
        const cacheId = `${applicationId}_${documentType}_${data.documentName || documentType}_${version}`;
        const metadata: FileMetadata = {
          id: cacheId,
          fileName: data.fileName,
          displayName: documentName, // Add display name to metadata
          title: documentName, // Add explicit title
          contentType: fileMetadata.contentType || 'application/pdf',
          version,
          timestamp: Date.now(),
          size: fileMetadata.size
        };
        
        await storeInIndexedDB(cacheId, zipBlob, metadata);
        
        // Unzip the file
        return unzipFiles(zipBlob);
      } catch (error) {
        console.error(`Error fetching file from storage path ${storagePath}:`, error);
        
        // If we have retries left, try again
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`Retrying fetch (${retryCount}/${MAX_RETRIES})...`);
          
          // Wait a bit before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
          return attemptFetch();
        }
        
        return new Map<string, Blob>();
      }
    } catch (error) {
      console.error(`Error in fetchAndCacheZippedFiles:`, error);
      return new Map<string, Blob>();
    }
  };
  
  return attemptFetch();
}

/**
 * Setup real-time listeners for file metadata changes
 * @param applicationId - Application ID
 * @param documentType - Type of document
 * @param documentName - Optional specific document name
 * @param onUpdate - Callback function when updates occur
 * @returns Unsubscribe function to stop listening
 */
function listenToFileUpdates(
  applicationId: string,
  documentType: string,
  onUpdate: (files: Map<string, Blob>) => void,
  documentName?: string
): () => void {
  const db = getFirestore();
  
  // Listen for changes to the documents collection for this application and type
  const collectionRef = collection(db, 'applications', applicationId, 'documents');
  
  // Use a simpler query that doesn't require a composite index
  // Just filter by documentType without ordering or additional where clauses
  const q = query(collectionRef, where("documentType", "==", documentType));
  
  // Listen for changes to documents
  return onSnapshot(q, async (querySnap) => {
    if (!querySnap.empty) {
      // Process all matching documents
      const files = new Map<string, Blob>();
      
      for (const docSnap of querySnap.docs) {
        // If documentName is specified, filter client-side
        if (documentName && docSnap.data().documentName !== documentName) {
          continue;
        }
        
        const data = docSnap.data();
        const version = data.version;
        const docName = data.documentName || documentType;
        
        // Construct cache ID based on the document name and version
        const cacheId = `${applicationId}_${documentType}_${docName}_${version}`;
        
        try {
          // Try to get from cache first
          const cachedFile = await getFromIndexedDB(cacheId, version);
          
          if (cachedFile) {
            // If cached and up-to-date, unzip from cache
            const zipBlob = cachedFile.data as Blob;
            const fileContent = await unzipFiles(zipBlob);
            
            // Add all files to the result map
            for (const [path, blob] of fileContent.entries()) {
              files.set(path, blob);
            }
          } else {
            // Fetch from Firebase Storage if not in cache
            try {
              const fetchedFiles = await fetchAndCacheZippedFiles(
                applicationId, 
                documentType, 
                docSnap.id, 
                version
              );
              
              // Add all fetched files to the result map
              for (const [path, blob] of fetchedFiles.entries()) {
                files.set(path, blob);
              }
            } catch (error) {
              console.error('Error fetching files:', error);
            }
          }
        } catch (error) {
          console.error('Error processing cached or fetched files:', error);
        }
      }
      
      // Call the update callback with all files
      onUpdate(files);
    } else {
      // If no documents found, return empty map
      onUpdate(new Map());
    }
  });
}

/**
 * Clear old cache entries to prevent storage from growing too large
 * @param maxAge - Maximum age in milliseconds before entry is considered old
 */
async function cleanupCache(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
  const db = await initDB();
  const now = Date.now();
  
  // Get all metadata
  const tx = db.transaction(METADATA_STORE, 'readwrite');
  const store = tx.objectStore(METADATA_STORE);
  const allMetadata = await store.getAll();
  
  // Delete old entries
  for (const metadata of allMetadata) {
    if (now - metadata.timestamp > maxAge) {
      await store.delete(metadata.id);
      await db.delete(FILE_STORE, metadata.id);
    }
  }
  
  await tx.done;
}

export {
  zipFiles,
  uploadZippedFiles,
  storeFileMetadataInFirestore,
  unzipFiles,
  fetchAndCacheZippedFiles,
  listenToFileUpdates,
  cleanupCache,
  getFromIndexedDB,
  storeInIndexedDB,
  initDB,
};

export type { FileMetadata, CachedFile }; 