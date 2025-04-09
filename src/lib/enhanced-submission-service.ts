import { db, storage } from "@/lib/firebase";
import { collection, doc, setDoc, Timestamp, getFirestore, where, CollectionReference, query, Query, updateDoc, arrayUnion } from "firebase/firestore";
import { ref, getStorage } from "firebase/storage";
import { generateApplicationCode } from "@/lib/application-code";
import { 
  zipFiles, 
  uploadZippedFiles, 
  unzipFiles,
  fetchAndCacheZippedFiles,
  listenToFileUpdates,
  cleanupCache as cleanupFileCache
} from "@/lib/document-storage";
import {
  getCollectionWithCache,
  listenToDocumentWithCache,
  listenToCollectionWithCache,
  cleanupCache as cleanupDataCache
} from "@/lib/firestore-cache";
import {
  ApplicationFormData,
  DocumentFiles,
  DuplicateCheckResult,
  SubmissionResult,
  CustomDocuments
} from "@/types";

// Re-export types for backwards compatibility
export type { ApplicationFormData, DuplicateCheckResult, SubmissionResult };

// Re-export the custom documents interface
export type { CustomDocuments };

/**
 * Check if a principal investigator or research title already exists in the database
 * @param principalInvestigator Principal investigator name
 * @param researchTitle Research title
 * @returns Result with flag indicating if duplicate exists and details of matching applications
 */
export async function checkForDuplicateSubmission(
  principalInvestigator: string,
  researchTitle: string
): Promise<DuplicateCheckResult> {
  try {
    const result: DuplicateCheckResult = {
      isDuplicate: false,
      existingApplications: []
    };

    // Use caching service to query for duplicates
    // Get by name
    const nameData = await getCollectionWithCache(
      "protocolReviewApplications",
      (ref: CollectionReference) => {
        return query(ref, where("proponent.name", "==", principalInvestigator));
      }
    );
    
    // Get by title
    const titleData = await getCollectionWithCache(
      "protocolReviewApplications",
      (ref: CollectionReference) => {
        return query(ref, where("protocolDetails.researchTitle", "==", researchTitle));
      }
    );

    // Process name query results
    nameData.forEach((doc) => {
      result.existingApplications.push({
        applicationCode: doc.id,
        principalInvestigator: doc.proponent.name,
        researchTitle: doc.protocolDetails.researchTitle,
        submissionDate: new Date(doc.proponent.submissionDate.seconds * 1000)
      });
    });

    // Process title query results
    titleData.forEach((doc) => {
      // Check if we've already added this result from the name query
      const alreadyAdded = result.existingApplications.some(
        app => app.applicationCode === doc.id
      );
      
      if (!alreadyAdded) {
        result.existingApplications.push({
          applicationCode: doc.id,
          principalInvestigator: doc.proponent.name,
          researchTitle: doc.protocolDetails.researchTitle,
          submissionDate: new Date(doc.proponent.submissionDate.seconds * 1000)
        });
      }
    });

    // If we found any matches, set isDuplicate to true
    if (result.existingApplications.length > 0) {
      result.isDuplicate = true;
    }

    return result;
  } catch (error) {
    console.error("Error checking for duplicate submission:", error);
    throw error;
  }
}

/**
 * Store zipped file metadata in the protocol review application document 
 * instead of a separate applications collection
 * @param applicationId - Application ID
 * @param fileName - Name of the zip file
 * @param storagePath - Path in Firebase Storage
 * @param documentType - Type of document
 * @param fileSize - Size of the zip file
 * @param documentName - Optional specific document name
 * @param version - Version identifier (default: generated from timestamp)
 * @param originalFilenames - Optional mapping of standardized names to original filenames
 */
async function storeFileMetadataInProtocol(
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
  
  // Create document metadata
  const documentMetadata = {
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
    Object.assign(documentMetadata, { originalFilenames });
  }
  
  // Get reference to the protocol document
  const protocolRef = doc(db, "protocolReviewApplications", applicationId);
  
  // Update the protocol document with the document metadata
  await updateDoc(protocolRef, {
    documents: arrayUnion(documentMetadata)
  });
}

/**
 * Submit a protocol application with zipping/caching improvements
 * @param formData Application form data
 * @param documents Document files to upload
 * @returns Generated application code and success status
 */
export async function submitProtocolApplication(
  formData: ApplicationFormData,
  documents: DocumentFiles
): Promise<SubmissionResult> {
  try {
    // Generate a unique application code
    const applicationCode = generateApplicationCode();
    
    // Prepare documents for zipping
    const allFiles: File[] = [];
    const filePathMap: Record<string, string[]> = {}; // Maps file category to array of filenames
    const originalFilenameMap: Record<string, Record<string, string>> = {}; // Maps standardized names to original names
    
    // Generate timestamp for versioning all files
    const timestamp = Date.now();
    const version = `v${timestamp}`;
    
    // Collect all files for zipping and rename them
    for (const [key, files] of Object.entries(documents)) {
      if (files && files.length > 0) {
        filePathMap[key] = [];
        originalFilenameMap[key] = {};
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          // Extract file extension
          const extension = file.name.split('.').pop() || 'pdf';
          
          // Create standardized filename with doc type, application code, version and index
          const standardizedName = `${key}_${applicationCode}_${version}_${i+1}.${extension}`;
          
          // Add a prefix folder to organize files in the zip and use standardized name
          const filePathInZip = `${key}/${standardizedName}`;
          filePathMap[key].push(filePathInZip);
          
          // Store mapping of standardized name to original name
          originalFilenameMap[key][standardizedName] = file.name;
          
          // Create a new file with the prefixed path and standardized name
          const newFile = new File([file], filePathInZip, { type: file.type });
          allFiles.push(newFile);
        }
      }
    }
    
    // Zip all files
    const zippedBlob = await zipFiles(allFiles, applicationCode);
    
    // Create document name from application code to make it unique
    const documentName = `initial_submission_${applicationCode}`;
    
    // Upload zipped file to Firebase Storage with document name
    const downloadUrl = await uploadZippedFiles(
      zippedBlob, 
      applicationCode, 
      "submission",
      documentName
    );
    
    // Create Firestore document for the application
    const protocolRef = doc(collection(db, "protocolReviewApplications"), applicationCode);
    
    // Only include non-empty co-researchers in the document
    const filteredCoResearchers = formData.coResearchers?.filter(name => name.trim() !== '') || [];
    
    // Create a sanitized version of formData without internal flags
    const { _bypassDuplicateCheck, ...sanitizedFormData } = formData;
    
    // List of documents that will be added to the application
    const documentsList = [
      {
        fileName: `${applicationCode}_${documentName}_${version}.zip`,
        storagePath: downloadUrl,
        documentType: "submission",
        documentName: documentName,
        displayName: "Protocol Submission",
        title: "Protocol Submission",
        uploadDate: Date.now(),
        version: version,
        size: zippedBlob.size,
        status: 'submitted',
        originalFilenames: originalFilenameMap
      }
    ];
    
    await setDoc(protocolRef, {
      applicationCode, // Explicitly include applicationCode field for searchability
      proponent: {
        name: sanitizedFormData.principalInvestigator,
        email: sanitizedFormData.email,
        advisor: sanitizedFormData.adviser,
        courseProgram: sanitizedFormData.courseProgram,
        submissionDate: Timestamp.now(),
        coResearchers: filteredCoResearchers,
      },
      protocolDetails: {
        researchTitle: sanitizedFormData.researchTitle,
        // Instead of storing individual file URLs, store the zip URL and file structure
        zipUrl: downloadUrl,
        filePathMap: filePathMap,
        originalFilenameMap: originalFilenameMap,
        documentName: documentName,
        version: version
      },
      applicationStatus: "On-going review",
      reviewProgress: {
        submissionCheck: false,
        initialReview: false,
        resubmission: false,
        approved: false,
        progressReport: false,
        finalReport: false,
        archived: false,
      },
      recCode: "",
      documents: documentsList, // Store documents directly in the protocol document
    });
    
    return { applicationCode, success: true };
  } catch (error) {
    console.error("Error submitting protocol application:", error);
    throw error;
  }
}

/**
 * Set up real-time listening for application data and document updates
 * @param applicationCode The application code to listen for
 * @param onDataUpdate Callback when application data updates
 * @param onDocumentsUpdate Callback when documents update
 * @returns Unsubscribe functions array
 */
export function listenToApplicationUpdates(
  applicationCode: string,
  onDataUpdate: (data: any) => void,
  onDocumentsUpdate: (files: Map<string, Blob>) => void
): (() => void)[] {
  let documentUnsubscribe: (() => void) | null = null;

  // Set up listener for application data
  const dataUnsubscribe = listenToDocumentWithCache(
    `protocolReviewApplications/${applicationCode}`,
    (data) => {
      onDataUpdate(data);
      
      try {
        // If we have document name and version information, use it
        if (data?.protocolDetails?.documentName && data?.protocolDetails?.version) {
          // Clean up previous document listener if exists
          if (documentUnsubscribe) {
            documentUnsubscribe();
          }
          
          // Set up a document-specific listener with the proper document name
          documentUnsubscribe = listenToFileUpdates(
            applicationCode,
            "submission",
            onDocumentsUpdate,
            data.protocolDetails.documentName
          );
        } else if (!documentUnsubscribe) {
          // If no document name/version but we don't have a listener yet,
          // set up a generic one
          documentUnsubscribe = listenToFileUpdates(
            applicationCode,
            "submission",
            onDocumentsUpdate
          );
        }
      } catch (error) {
        console.error("Error setting up document listeners:", error);
        // Create an empty map to avoid breaking UI when document fetching fails
        onDocumentsUpdate(new Map<string, Blob>());
      }
    }
  );
  
  // Return an unsubscribe function array
  return [
    dataUnsubscribe,
    // Add a function that calls documentUnsubscribe if it exists
    () => { if (documentUnsubscribe) documentUnsubscribe(); }
  ];
}

/**
 * Get application by code with caching
 * @param applicationCode The application code
 * @returns The application data or null
 */
export async function getApplicationByCode(applicationCode: string): Promise<any> {
  // This uses the Firestore cache to get the application data
  return new Promise((resolve, reject) => {
    const unsubscribe = listenToDocumentWithCache(
      `protocolReviewApplications/${applicationCode}`,
      (data) => {
        unsubscribe(); // Stop listening after first fetch
        resolve(data);
      }
    );
    
    // Handle timeout
    setTimeout(() => {
      unsubscribe();
      reject(new Error("Timeout fetching application data"));
    }, 10000);
  });
}

/**
 * Get all applications by principal investigator's email with caching
 * @param email The principal investigator's email
 * @returns Array of application data
 */
export async function getApplicationsByEmail(email: string): Promise<any[]> {
  return getCollectionWithCache(
    "protocolReviewApplications",
    (ref: CollectionReference) => {
      return query(ref, where("proponent.email", "==", email));
    }
  );
}

/**
 * Clean up old cache to prevent storage from growing too large
 * @param maxAge Maximum age of cache entries to keep (in milliseconds)
 */
export async function cleanupAllCaches(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
  await Promise.all([
    cleanupFileCache(maxAge),
    cleanupDataCache(maxAge)
  ]);
}

/**
 * Get status tracking information for an application
 * @param applicationCode The application code
 * @param onUpdate Callback when status updates
 * @returns Unsubscribe function
 */
export function trackApplicationStatus(
  applicationCode: string,
  onUpdate: (status: any) => void
): () => void {
  return listenToDocumentWithCache(
    `protocolReviewApplications/${applicationCode}`,
    (data) => {
      if (data) {
        // Extract just the status information to provide a cleaner interface
        const statusInfo = {
          applicationCode,
          status: data.applicationStatus,
          reviewProgress: data.reviewProgress,
          lastUpdated: data.lastUpdated || new Date(),
          recCode: data.recCode || "",
        };
        onUpdate(statusInfo);
      } else {
        onUpdate(null);
      }
    }
  );
} 