import JSZip from 'jszip';
import { openDB, IDBPDatabase } from 'idb';
import { getStorage, ref, uploadBytes, getDownloadURL, getMetadata, StorageReference } from 'firebase/storage';
import { doc, getFirestore, setDoc, getDoc, updateDoc, onSnapshot, collection, where, orderBy, limit, query, arrayUnion, Timestamp, getDocs } from 'firebase/firestore';
import { storage } from '@/lib/firebase';

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
  displayName?: string;  // Human-readable name
  title?: string;        // Official title
  originalFileName?: string; // The original file name before standardization
  standardizedName?: string; // The standardized file name (e.g., ProtocolReviewApplicationForm_20240521)
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
 * Format date in YYYYMMDD format
 * @param date - Date object or timestamp
 * @returns Formatted date string
 */
function formatDateYYYYMMDD(date: Date | number): string {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Standardize file name based on document title
 * @param title - Document title (e.g., "Form 07A: Protocol Review Application Form")
 * @param originalFileName - Original file name
 * @returns Standardized file name
 */
function standardizeFileName(title: string, originalFileName: string): string {
  // Extract the base name from the title (before any colon)
  let baseName = title.split(':')[0].trim();
  
  // Remove any form numbers or special prefixes, keep only the descriptive part
  baseName = baseName.replace(/^Form\s+\d+[A-Z]?\s*:?\s*/i, '');
  
  // Convert to camel case for readability
  const camelCaseName = baseName
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word, index) => {
      if (index === 0) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join('');
  
  // Extract file extension from original file name
  const fileExtension = originalFileName.split('.').pop() || 'pdf';
  
  // Add current date in YYYYMMDD format
  const dateSuffix = formatDateYYYYMMDD(Date.now());
  
  // Construct standardized name
  return `${camelCaseName}_${dateSuffix}.${fileExtension}`;
}

/**
 * Zip files before uploading to Firebase Storage
 * @param files - Array of files to zip
 * @param applicationId - Application ID to use in filename
 * @param documentTypes - Object mapping file index to document type/title
 * @returns Promise with the zipped blob and mapping of original to standardized names
 */
async function zipFiles(
  files: File[], 
  applicationId: string, 
  documentTypes?: Record<number, { title: string; }>
): Promise<{ blob: Blob, nameMapping: Record<string, string> }> {
  const zip = new JSZip();
  const nameMapping: Record<string, string> = {};
  
  // Validation - ensure files is an array and not empty
  if (!files || !Array.isArray(files) || files.length === 0) {
    console.warn('No valid files provided to zip');
    // Return an empty zip file with just a README to prevent errors
    zip.file("README.txt", "No files were provided for this submission.");
    const blob = await zip.generateAsync({ type: 'blob' });
    return { blob, nameMapping };
  }
  
  // Add each file to the zip with standardized names if documentTypes is provided
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Skip null/undefined files
    if (!file) {
      console.warn(`Skipping null/undefined file at index ${i}`);
      continue;
    }
    
    const documentInfo = documentTypes?.[i];
    
    if (documentInfo?.title) {
      // Create standardized file name if title is available
      const standardizedName = standardizeFileName(documentInfo.title, file.name);
      nameMapping[file.name] = standardizedName;
      zip.file(standardizedName, file);
    } else {
      // Use original file name if no title info is available
      zip.file(file.name, file);
      nameMapping[file.name] = file.name;
    }
  }
  
  // Generate the zip file
  const blob = await zip.generateAsync({ type: 'blob' });
  return { blob, nameMapping };
}

/**
 * Upload a zipped file to Firebase Storage and update related Firestore documents
 * @param zipBlob - Blob containing the zipped file
 * @param applicationId - Application ID
 * @param documentType - Type of document
 * @param documentName - Name of the document
 * @param nameMapping - Optional mapping of original to standardized filenames
 * @param displayTitle - Optional display title for the document
 * @returns Storage reference and download URL
 */
async function uploadZippedFiles(
  zipBlob: Blob,
  applicationId: string,
  documentType: string,
  documentName?: string,
  nameMapping?: Record<string, string>,
  displayTitle?: string
): Promise<{ storageRef: StorageReference; downloadUrl: string }> {
  
  try {
    // Generate a date-based filename
    const date = new Date();
    const formattedDate = date.toISOString().split('T')[0].replace(/-/g, '');
    const fileName = `${applicationId}_${documentType}_${formattedDate}.zip`;
    
    // Create a reference to the storage location
    const storagePath = `protocolReviewApplications/${applicationId}/${documentType}/${fileName}`;
    const storageRef = ref(storage, storagePath);
    
    // Upload the file
    await uploadBytes(storageRef, zipBlob);
    
    // Get the download URL
    const downloadUrl = await getDownloadURL(storageRef);
    
    // Store metadata in Firestore
    await storeFileMetadataInFirestore(
      applicationId,
      fileName,
      storagePath,
      documentType,
      zipBlob.size,
      documentName,
      undefined, // Let system generate version
      nameMapping,
      displayTitle // Pass explicit display title
    );
    
    // Return reference and url
    return { storageRef, downloadUrl };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
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
 * @param nameMapping - Optional mapping of original to standardized filenames
 * @param displayTitle - Optional display title for the document
 */
async function storeFileMetadataInFirestore(
  applicationId: string,
  fileName: string,
  storagePath: string,
  documentType: string,
  fileSize: number,
  documentName?: string,
  version?: string,
  nameMapping?: Record<string, string>,
  displayTitle?: string
): Promise<void> {
  const db = getFirestore();
  const timestamp = Date.now();
  const versionId = version || `v${timestamp}`;
  
  // Create a document ID that includes the document type and version
  // Sanitize document type and name to avoid invalid paths with spaces or special characters
  const sanitizedDocType = documentType.replace(/[\/\s.#$]/g, '_');
  const sanitizedDocName = documentName ? documentName.replace(/[\/\s.#$]/g, '_') : '';
  
  const documentId = sanitizedDocName 
    ? `${sanitizedDocType}_${sanitizedDocName}_${versionId}`
    : `${sanitizedDocType}_${timestamp}`;
  
  // Document type mapping for user-friendly titles
  const documentTitles: Record<string, string> = {
    // Standard protocol documents
    "form07a": "Form 07A: Protocol Review Application Form",
    "form07b": "Form 07B: Adviser's Certification Form",
    "form07c": "Form 07C: Informed Consent",
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
  
  // Determine official title and display name
  let officialTitle = "";
  let displayName = "";
  
  // Try to map the document type to a user-friendly title
  if (documentType.toLowerCase() in documentTitles) {
    officialTitle = documentTitles[documentType.toLowerCase()];
    displayName = officialTitle;
  } else if (documentName && documentName.toLowerCase() in documentTitles) {
    officialTitle = documentTitles[documentName.toLowerCase()];
    displayName = officialTitle;
  } else {
    // If no match, use provided name or fallback to document type
    officialTitle = documentName ? documentName : documentType;
    displayName = officialTitle;
  }
  
  // For versioned documents, append version number to display name but not to official title
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
  
  // Use provided displayTitle or generate one based on mapped titles
  const finalDisplayTitle = displayTitle || officialTitle;
  
  // Create document metadata with reduced redundancy
  const documentMetadata = {
    // Core file information
    fileName,
    storagePath,
    contentType: 'application/zip',
    size: fileSize,
    timestamp: Timestamp.fromMillis(timestamp),
    version: versionId,
    
    // Display information
    title: officialTitle,                  // Standard title without date
    displayName,                           // Title with date for UI display
    displayTitle: finalDisplayTitle,       // Custom or standard title for consistent naming
    
    // Document identification
    documentType,
    documentId: fileName,                  // Use fileName as the unique ID
    
    // Status tracking
    status: 'Submitted',
    
    // File mapping for extraction
    nameMapping,
    
    // Reference
    applicationId
  };
  
  // Store metadata in Firestore - use a safe path
  const metadataRef = doc(db, `protocolReviewApplications/${applicationId}/documents`, documentId);
  await setDoc(metadataRef, documentMetadata);
  
  // Also update the application document with a reference to this file
  const applicationRef = doc(db, 'protocolReviewApplications', applicationId);
  const documentField = `documentReferences.${sanitizedDocType}`;
  
  // Create a streamlined reference with only essential fields
  const documentReference = {
    documentId,
    displayName,
    displayTitle: finalDisplayTitle,
    storagePath,
    timestamp: Timestamp.fromMillis(timestamp),
    version: versionId,
    fileName,
    documentType
  };
  
  // Update the document references field
  await updateDoc(applicationRef, {
    [documentField]: arrayUnion(documentReference)
  });
  
  // Also add to the documents array for direct access with only necessary fields
  // This is the main list that will be used for document display
  const documentListItem = {
    displayName,
    title: officialTitle,
    displayTitle: finalDisplayTitle,
    fileName,
    storagePath,
    timestamp: Timestamp.fromMillis(timestamp),
    version: versionId,
    documentType,
    documentId: fileName,
    status: 'Submitted',
    uploadDate: timestamp,
    nameMapping
  };
  
  await updateDoc(applicationRef, {
    documents: arrayUnion(documentListItem)
  });
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
 * @returns Promise with a map of filenames to file blobs with correct content types
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
      
      // Determine the proper MIME type based on file extension
      const contentType = getMimeType(filename);
      
      // Create a new blob with the correct content type
      const typedBlob = new Blob([fileData], { type: contentType });
      
      result.set(filename, typedBlob);
    }
  }
  
  return result;
}

/**
 * Get the MIME type based on file extension
 * @param filename - The filename
 * @returns The MIME type
 */
function getMimeType(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  // Map of common file extensions to MIME types
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'svg': 'image/svg+xml',
    'txt': 'text/plain',
    'html': 'text/html',
    'htm': 'text/html',
    'css': 'text/css',
    'js': 'text/javascript',
    'json': 'application/json',
    'xml': 'application/xml',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    'tar': 'application/x-tar',
    'mp3': 'audio/mpeg',
    'mp4': 'video/mp4',
    'wav': 'audio/wav',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'wmv': 'video/x-ms-wmv',
    'csv': 'text/csv',
    'md': 'text/markdown',
    'rtf': 'application/rtf',
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
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
  
  console.log('fetchAndCacheZippedFiles called with:', {
    applicationId,
    documentType,
    documentId,
    version
  });
  
  const attemptFetch = async (): Promise<Map<string, Blob>> => {
    try {
      const storage = getStorage();
      const db = getFirestore();
      
      // Sanitize document type to ensure consistent path lookup
      const sanitizedDocType = documentType.replace(/[\/\s.#$]/g, '_');
      
      // First check the protocolReviewApplications collection for document metadata
      const protocolRef = doc(db, 'protocolReviewApplications', applicationId);
      const protocolSnap = await getDoc(protocolRef);
      
      let data: any;
      let storagePath: string | undefined;
      let documentName: string = documentType; // Initialize with a default value
      
      console.log('Fetching metadata for document:', { 
        applicationId, documentType, documentId, version,
        exists: protocolSnap.exists()
      });

      // Try multiple approaches to find the document metadata and storage path

      // First attempt: Look in the application's 'documents' array
      if (protocolSnap.exists()) {
        const protocolData = protocolSnap.data();
        
        console.log('Protocol data found:', { 
          hasDocuments: !!protocolData.documents,
          documentCount: protocolData.documents?.length
        });
        
        // Look for document in the documents array
        if (protocolData.documents && Array.isArray(protocolData.documents)) {
          // Find the specific document by ID, type+name, or just type
          const docData = protocolData.documents.find((doc: any) => 
            doc.documentId === documentId || 
            doc.fileName === documentId ||
            (doc.documentType === documentType && doc.documentName === documentName) ||
            doc.documentType === documentType
          );
          
          if (docData) {
            console.log('Found document in application documents array:', docData);
            data = docData;
            storagePath = docData.storagePath;
            documentName = docData.documentName || documentName;
          }
        }
        
        // Second attempt: Look in documentReferences field
        if (!data && protocolData.documentReferences) {
          console.log('Looking in documentReferences:', { 
            refs: Object.keys(protocolData.documentReferences)
          });
          
          // Try to find the document reference in each documentType group
          for (const [refType, refs] of Object.entries(protocolData.documentReferences)) {
            if (Array.isArray(refs)) {
              const docRef = refs.find((ref: any) => 
                ref.documentId === documentId || 
                ref.version === version
              );
              
              if (docRef) {
                console.log('Found document in documentReferences:', docRef);
                data = docRef;
                storagePath = docRef.storagePath;
                documentName = docRef.documentName || documentName;
                break;
              }
            }
          }
        }
      }
      
      // If still no data found, check the document subcollection
      if (!data) {
        console.log('No document found in application, checking subcollection');
        
        // Try to find document in the subcollection
        const documentCollectionRef = collection(db, `protocolReviewApplications/${applicationId}/documents`);
        const documentQuery = query(documentCollectionRef, where("documentType", "==", documentType));
        const documentsSnap = await getDocs(documentQuery);
        
        if (!documentsSnap.empty) {
          console.log(`Found ${documentsSnap.size} documents in subcollection`);
          
          // Look for exact document ID match first
          let foundDoc = documentsSnap.docs.find(d => d.id === documentId);
          
          // If not found by ID, look by version
          if (!foundDoc) {
            foundDoc = documentsSnap.docs.find(d => d.data().version === version);
          }
          
          // If still not found, just use the first one
          if (!foundDoc && documentsSnap.docs.length > 0) {
            foundDoc = documentsSnap.docs[0];
            console.log('Using first document from subcollection as fallback');
          }
          
          if (foundDoc) {
            data = foundDoc.data();
            storagePath = data.storagePath;
            documentName = data.documentName || documentName;
            console.log('Using document from subcollection:', { id: foundDoc.id, data });
          }
        }
      }
      
      // If still no data, try legacy paths
      if (!data || !storagePath) {
        console.log('No metadata found, trying legacy storage paths');
        
        // Try standard storage paths as fallbacks
        storagePath = `protocolReviewApplications/${applicationId}/${sanitizedDocType}/${applicationId}_${sanitizedDocType}.zip`;
        
        // Check if the file exists in storage
        try {
          const storageRef = ref(storage, storagePath);
          await getMetadata(storageRef);
          console.log('Found file at legacy path:', storagePath);
        } catch (e) {
          // Try additional legacy paths
          const alternativePaths = [
            `protocolReviewApplications/${applicationId}/submission/${applicationId}_submission.zip`,
            `protocolReviewApplications/${applicationId}/documents/${documentId}.zip`,
            `protocolReviewApplications/${applicationId}/${documentType}/${documentId}.zip`
          ];
          
          let foundPath = false;
          for (const path of alternativePaths) {
            try {
              const altRef = ref(storage, path);
              await getMetadata(altRef);
              storagePath = path;
              foundPath = true;
              console.log('Found file at alternative path:', path);
              break;
            } catch (e) {
              // Try next path
            }
          }
          
          if (!foundPath) {
            console.error('Could not find file in any storage location');
            throw new Error(`Document ${documentId} not found in storage`);
          }
        }
      }
      
      // Final checks before download
      if (!storagePath) {
        console.error('No storage path found for document');
        throw new Error(`No storage path found for document ${documentId}`);
      }
      
      console.log('Attempting to download from storage path:', storagePath);
      
      // Get a reference to the file in Firebase Storage
      const storageRef = ref(storage, storagePath);
      
      try {
        // First, try to get the download URL
        const downloadUrl = await getDownloadURL(storageRef);
        
        // Instead of fetching directly from Firebase Storage, use our proxy API
        // This avoids CORS issues when running in development
        const proxyUrl = `/api/proxy-storage?url=${encodeURIComponent(downloadUrl)}`;
        console.log('Using proxy URL:', proxyUrl);
        
        // Download the zip file through our proxy
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
          console.error(`Failed to fetch file through proxy: ${response.status} ${response.statusText}`);
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        
        const zipBlob = await response.blob();
        
        // Cache the zip blob in IndexedDB
        const cacheId = `${applicationId}_${sanitizedDocType}_${documentId}_${version}`;
        
        // Create minimal metadata for caching
        const metadata: FileMetadata = {
          id: cacheId,
          fileName: documentId,
          contentType: 'application/zip',
          version: version,
          timestamp: Date.now(),
          size: zipBlob.size,
          displayName: documentName,
          title: documentName
        };
        
        // Store in IndexedDB
        await storeInIndexedDB(cacheId, zipBlob, metadata);
        
        // Unzip files
        const files = await unzipFiles(zipBlob);
        
        console.log(`Successfully fetched and cached file with ${files.size} entries`);
        return files;
      } catch (directFetchError) {
        console.error('Error downloading file directly:', directFetchError);
        
        // Fallback to server-side proxy with path instead of URL
        console.log('Falling back to server-side path-based proxy...');
        
        const pathProxyUrl = `/api/proxy-storage/path?path=${encodeURIComponent(storagePath)}`;
        const pathResponse = await fetch(pathProxyUrl);
        
        if (!pathResponse.ok) {
          console.error(`Failed to fetch file through path proxy: ${pathResponse.status} ${pathResponse.statusText}`);
          throw new Error(`Failed to fetch file through proxies`);
        }
        
        const zipBlob = await pathResponse.blob();
        
        // Cache and process as before
        const cacheId = `${applicationId}_${sanitizedDocType}_${documentId}_${version}`;
        const metadata: FileMetadata = {
          id: cacheId,
          fileName: documentId,
          contentType: 'application/zip',
          version: version,
          timestamp: Date.now(),
          size: zipBlob.size,
          displayName: documentName,
          title: documentName
        };
        
        await storeInIndexedDB(cacheId, zipBlob, metadata);
        const files = await unzipFiles(zipBlob);
        
        console.log(`Successfully fetched and cached file with path proxy: ${files.size} entries`);
        return files;
      }
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.log(`Retry attempt ${retryCount} of ${MAX_RETRIES}`);
        return attemptFetch();
      }
      console.error(`Error in fetchAndCacheZippedFiles:`, error);
      throw error;
    }
  };
  
  return attemptFetch();
}

/**
 * Setup real-time listeners for file metadata changes
 * @param applicationId - Application ID
 * @param documentType - Type of document
 * @param onUpdate - Callback function when updates occur
 * @param documentName - Optional specific document name
 * @returns Unsubscribe function to stop listening
 */
function listenToFileUpdates(
  applicationId: string,
  documentType: string,
  onUpdate: (files: Map<string, Blob>) => void,
  documentName?: string
): () => void {
  const db = getFirestore();
  
  // Sanitize document type and name for consistent paths
  const sanitizedDocType = documentType.replace(/[\/\s.#$]/g, '_');
  const sanitizedDocName = documentName ? documentName.replace(/[\/\s.#$]/g, '_') : undefined;
  
  // Listen for changes to the documents collection for this application
  const collectionRef = collection(db, `protocolReviewApplications/${applicationId}/documents`);
  
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
        const data = docSnap.data();
        
        if (sanitizedDocName && data.documentName !== documentName) {
          continue;
        }
        
        const version = data.version;
        const docName = data.documentName || documentType;
        const safeDocName = docName.replace(/[\/\s.#$]/g, '_');
        
        // Construct cache ID based on the document name and version
        const cacheId = `${applicationId}_${sanitizedDocType}_${safeDocName}_${version}`;
        
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