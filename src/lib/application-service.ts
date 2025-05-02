import { getStorage, ref, getDownloadURL, StorageReference, uploadBytes } from "firebase/storage";
import { getFirestore, doc, getDoc, collection, query, where, getDocs, setDoc, Timestamp, updateDoc, arrayUnion, onSnapshot } from "firebase/firestore";
import JSZip from "jszip";
import { Document, DocumentStatus, Application } from "@/types/protocol-application/tracking";
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

// Types for application submission
export interface ApplicationFormData {
  principalInvestigator: string;
  email: string;
  adviser: string;
  courseProgram: string;
  researchTitle: string;
  _bypassDuplicateCheck?: boolean;
  [key: string]: any; // Allow other fields
}

export interface DocumentFiles {
  [key: string]: File[];
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingApplications: {
    applicationCode: string;
    principalInvestigator: string;
    researchTitle: string;
    submissionDate: Date;
  }[];
}

export interface SubmissionResult {
  applicationCode: string;
  success: boolean;
}

export interface CustomDocuments {
  [key: string]: {
    title: string;
    description?: string;
  };
}

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
      (ref: any) => {
        return query(ref, where("proponent.name", "==", principalInvestigator));
      }
    );
    
    // Get by title
    const titleData = await getCollectionWithCache(
      "protocolReviewApplications",
      (ref: any) => {
        return query(ref, where("protocolDetails.researchTitle", "==", researchTitle));
      }
    );

    // Process name query results
    nameData.forEach((doc: any) => {
      result.existingApplications.push({
        applicationCode: doc.id,
        principalInvestigator: doc.proponent.name,
        researchTitle: doc.protocolDetails.researchTitle,
        submissionDate: new Date(doc.proponent.submissionDate.seconds * 1000)
      });
    });

    // Process title query results
    titleData.forEach((doc: any) => {
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
 * Store file metadata in protocol application document
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
 * Process and upload document files for application
 * @param applicationCode Application code/ID
 * @param documents Document files to upload
 */
async function processAndUploadDocuments(
  applicationCode: string,
  documents: DocumentFiles
): Promise<void> {
  try {
    // Retrieve document titles from localStorage for displayTitle
    let documentTitles: Record<string, string> = {};
    try {
      const titlesStr = localStorage.getItem('documentTitles');
      if (titlesStr) {
        documentTitles = JSON.parse(titlesStr);
      }
    } catch (error) {
      console.error("Error retrieving document titles from localStorage:", error);
    }
    
    // Process each document category
    for (const [category, files] of Object.entries(documents)) {
      // Skip if files is null, undefined, or empty array
      if (!files || !Array.isArray(files) || files.length === 0) {
        console.log(`Skipping category ${category}: No valid files array`);
        continue;
      }
      
      // For each category, get document info for titles
      let documentInfo = null;
      try {
        documentInfo = await getCustomDocumentInfo(category);
      } catch (err) {
        console.error(`Error getting document info for ${category}:`, err);
      }
      
      // Prepare document types mapping
      const documentTypes: Record<number, { title: string }> = {};
      
      if (documentInfo) {
        // If we have document info, use it for all files in this category
        files.forEach((_, index) => {
          documentTypes[index] = { title: documentInfo.title };
        });
      } else {
        // Otherwise, use category name as fallback
        files.forEach((_, index) => {
          documentTypes[index] = { title: category };
        });
      }
      
      // Zip the files with standardized names
      const { blob: zippedBlob, nameMapping } = await zipFiles(files, applicationCode, documentTypes);
      
      // Upload the zipped files to Firebase Storage
      const documentType = category;
      
      // Get document title for displayTitle - prefer the one from localStorage
      let documentName = documentInfo?.title || category;
      let displayTitle = documentTitles[category] || documentName;
      
      // Get application data to include researchTitle with the upload
      const db = getFirestore();
      const appRef = doc(db, "protocolReviewApplications", applicationCode);
      const appSnap = await getDoc(appRef);
      
      if (appSnap.exists()) {
        const appData = appSnap.data();
        // Include the research title in the upload metadata if available
        if (appData.protocolDetails?.researchTitle) {
          // Keep the original title as displayTitle
          // This keeps the title from the document definition rather than appending researchTitle
        }
      }
      
      await uploadZippedFiles(
        zippedBlob,
        applicationCode,
        documentType,
        displayTitle, // Use enhanced display title that includes document title
        nameMapping,
        displayTitle // Pass display title again as the explicit displayTitle parameter
      );
    }
    
    // Clear stored document titles after successful upload
    try {
      localStorage.removeItem('documentTitles');
    } catch (error) {
      console.error("Error clearing document titles from localStorage:", error);
    }
  } catch (error) {
    console.error("Error processing and uploading documents:", error);
    throw error;
  }
}

/**
 * Get information about a custom document type
 * @param documentTypeId Document type ID
 * @returns Document information if found
 */
async function getCustomDocumentInfo(documentTypeId: string): Promise<{ title: string; description?: string } | null> {
  try {
    // Get the custom document type information from Firestore
    const db = getFirestore();
    const docRef = doc(db, "protocolSystemSettings", "documentTypes");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists() && docSnap.data().customDocuments) {
      const customDocs = docSnap.data().customDocuments as CustomDocuments;
      return customDocs[documentTypeId] || null;
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting custom document info for ${documentTypeId}:`, error);
    return null;
  }
}

/**
 * Submit a protocol application with documents
 * @param formData Form data for the application
 * @param documents Object containing document files
 * @returns Result with application code
 */
export async function submitProtocolApplication(
  formData: ApplicationFormData,
  documents: DocumentFiles = {} // Provide default empty object
): Promise<SubmissionResult> {
  try {
    // Validate documents object to prevent null reference errors
    const validatedDocuments: DocumentFiles = {};
    
    // Only include categories with valid file arrays
    if (documents && typeof documents === 'object') {
      Object.entries(documents).forEach(([category, files]) => {
        if (files && Array.isArray(files) && files.length > 0) {
          validatedDocuments[category] = files;
        } else {
          console.log(`Skipping invalid document category: ${category}`);
        }
      });
    }
    
    // Generate a unique application code
    const applicationCode = await generateApplicationCode();
    
    // Format submission date
    const submissionDate = Timestamp.now();
    
    // Create application document
    const applicationData = {
      applicationCode,
      proponent: {
        name: formData.principalInvestigator,
        email: formData.email,
        advisor: formData.adviser,
        courseProgram: formData.courseProgram,
        submissionDate
      },
      protocolDetails: {
        researchTitle: formData.researchTitle,
      },
      documents: [],
      applicationStatus: "On-going review",
      reviewProgress: {
        submission: true,
        initialReview: false,
        resubmission: false,
        approved: false
      },
      
      // Add timestamps
      createdAt: submissionDate,
      updatedAt: submissionDate
    };
    
    // Save application data to Firestore
    const db = getFirestore();
    const applicationRef = doc(db, "protocolReviewApplications", applicationCode);
    await setDoc(applicationRef, applicationData);
    
    // Upload documents
    if (Object.keys(validatedDocuments).length > 0) {
      await processAndUploadDocuments(applicationCode, validatedDocuments);
    }
    
    return {
      applicationCode,
      success: true
    };
  } catch (error) {
    console.error("Error submitting protocol application:", error);
    throw error;
  }
}

/**
 * Setup listeners for application data and document updates
 * @param applicationCode Application code to listen for
 * @param onDataUpdate Callback when application data updates
 * @param onDocumentsUpdate Callback when documents update
 * @returns Array of unsubscribe functions
 */
export function listenToApplicationUpdates(
  applicationCode: string,
  onDataUpdate: (data: any) => void,
  onDocumentsUpdate: (files: Map<string, Blob>) => void
): (() => void)[] {
  const unsubscribers: (() => void)[] = [];
  
  try {
    // Listen for changes to the application document
    const db = getFirestore();
    const applicationRef = doc(db, "protocolReviewApplications", applicationCode);
    
    // Set up application data listener with cache support
    const dataUnsubscribe = listenToDocumentWithCache(
      `protocolReviewApplications/${applicationCode}`,
      (data) => {
        if (data) {
          onDataUpdate(data);
        }
      }
    );
    unsubscribers.push(dataUnsubscribe);
    
    // Listen for document files updates
    const fileUnsubscribe = listenToFileUpdates(
      applicationCode,
      "submission",
      onDocumentsUpdate
    );
    unsubscribers.push(fileUnsubscribe);
    
    return unsubscribers;
  } catch (error) {
    console.error("Error setting up application listeners:", error);
    // Clean up any listeners that were set up
    unsubscribers.forEach(unsub => unsub());
    throw error;
  }
}

/**
 * Get application by code
 * @param applicationCode Application code to fetch
 * @returns Application data
 */
export async function getApplicationByCode(applicationCode: string): Promise<any> {
  try {
    const db = getFirestore();
    const applicationRef = doc(db, "protocolReviewApplications", applicationCode);
    const applicationSnap = await getDoc(applicationRef);
    
    if (applicationSnap.exists()) {
      return { id: applicationSnap.id, ...applicationSnap.data() };
    }
    
    throw new Error(`Application with code ${applicationCode} not found`);
  } catch (error) {
    console.error(`Error getting application with code ${applicationCode}:`, error);
    throw error;
  }
}

/**
 * Get applications by email address
 * @param email Email address of the proponent
 * @returns Array of application data
 */
export async function getApplicationsByEmail(email: string): Promise<any[]> {
  try {
    const db = getFirestore();
    const applicationsRef = collection(db, "protocolReviewApplications");
    const applicationsQuery = query(applicationsRef, where("proponent.email", "==", email));
    const applicationsSnap = await getDocs(applicationsQuery);
    
    const applications = applicationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return applications;
  } catch (error) {
    console.error(`Error getting applications for email ${email}:`, error);
    throw error;
  }
}

/**
 * Clean up all caches (both document storage and firestore data)
 * @param maxAge Maximum age for cache entries in milliseconds
 */
export async function cleanupAllCaches(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
  try {
    await Promise.all([
      cleanupFileCache(maxAge),
      cleanupDataCache(maxAge)
    ]);
  } catch (error) {
    console.error("Error cleaning up caches:", error);
    throw error;
  }
}

/**
 * Track application status for real-time updates
 * @param applicationCode Application code to track
 * @param onUpdate Callback for status updates
 * @returns Unsubscribe function
 */
export function trackApplicationStatus(
  applicationCode: string,
  onUpdate: (status: any) => void
): () => void {
  const db = getFirestore();
  const applicationRef = doc(db, "protocolReviewApplications", applicationCode);
  
  // Listen for application updates
  return onSnapshot(applicationRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Extract status information
      const statusInfo = {
        status: data.applicationStatus || "On-going review",
        progress: data.reviewProgress || {},
        initialReview: data.initialReview || null,
        resubmission: data.resubmission || null,
        approved: data.approved || null,
        documents: data.documents || []
      };
      
      onUpdate(statusInfo);
    } else {
      console.error(`Application ${applicationCode} not found`);
    }
  });
}

/**
 * Fetch application data and documents from Firebase
 * @param applicationCode - The unique application code
 * @returns Object containing application and documents data
 */
export async function fetchApplicationWithDocuments(applicationCode: string) {
  // Initialize return variables
  let documentList: Document[] = [];
  let transformedApplication: Application | null = null;
  
  // Initialize Firebase services
  const db = getFirestore();
  const storage = getStorage();
  
  // Try to get application from protocolReviewApplications collection
  const applicationRef = doc(db, "protocolReviewApplications", applicationCode);
  let applicationSnap = await getDoc(applicationRef);
  
  // If not found directly, try searching by applicationCode field
  if (!applicationSnap.exists()) {
    // Check protocolReviewApplications by applicationCode field
    const protocolRef = collection(db, "protocolReviewApplications");
    const protocolQuery = query(
      protocolRef, 
      where("applicationCode", "==", applicationCode)
    );
    const protocolSnapshot = await getDocs(protocolQuery);
    
    if (!protocolSnapshot.empty) {
      applicationSnap = protocolSnapshot.docs[0];
    } else {
      throw new Error("Application not found");
    }
  }
  
  if (!applicationSnap.exists()) {
    throw new Error("Application not found");
  }
  
  const appData = applicationSnap.data();
  
  // Process documents primarily from appData.documents metadata
  if (appData.documents && appData.documents.length > 0) {
    // Directly use documents array from protocol document
    documentList = appData.documents.map((doc: any) => {
      // Extract information needed for DocumentPreview component
      const displayName = doc.displayTitle || doc.displayName || doc.title || doc.documentName || "Document";
      const documentType = doc.documentType || "submission";
      const documentId = doc.fileName || doc.documentId || "";
      const version = doc.version || "v1";
      
      return {
        name: displayName,
        status: (doc.status || "Pending") as DocumentStatus,
        // Instead of a direct download link, provide properties required by DocumentPreview
        documentType,
        documentId,
        version,
        storagePath: doc.storagePath,
        fileName: doc.fileName,
        displayName: displayName,
        displayTitle: doc.displayTitle, // Explicitly include display title
        // Keep these for backward compatibility
        downloadLink: "",
        requestReason: doc.requestReason || doc.comments,
        resubmissionVersion: doc.version,
      };
    });
  } 
  // Keep the fallback for filePathMap (another potential legacy or alternative structure)
  else if (appData.filePathMap) {
    // If we have filePathMap from another implementation
    for (const [category, filePaths] of Object.entries(appData.filePathMap)) {
      if (Array.isArray(filePaths)) {
        filePaths.forEach((filePath: string) => {
          const fileName = filePath.split('/').pop() || filePath;
          const originalName = appData.originalFilenameMap?.[category]?.[fileName] || fileName;
          const displayName = formatDocumentName(originalName);
          
          documentList.push({
            name: displayName,
            status: "Submitted" as DocumentStatus,
            // Add properties required by DocumentPreview
            documentType: category,
            documentId: fileName,
            version: "v1",
            storagePath: filePath,
            fileName: fileName,
            displayName: displayName,
            // Keep this for backward compatibility  
            downloadLink: ""
          });
        });
      }
    }
  } else {
    // If we still don't have documents, create at least one placeholder
    documentList = [{
      name: "Application Form",
      status: "Submitted" as DocumentStatus,
      documentType: "submission",
      documentId: `${applicationCode}_submission`,
      version: "v1",
      storagePath: `protocolReviewApplications/${applicationCode}/submission`,
      fileName: "application_form.pdf",
      displayName: "Application Form",
      downloadLink: ""
    }];
  }
  
  // Construct an application object that matches the expected structure for ApplicationTracker
  transformedApplication = {
    applicationCode: applicationCode,
    spupRecCode: appData.recCode || appData.spupRecCode || "",
    principalInvestigator: appData.proponent?.name || appData.principalInvestigator || "",
    submissionDate: appData.proponent?.submissionDate 
      ? new Date(appData.proponent.submissionDate.seconds * 1000).toISOString() 
      : appData.submissionDate || new Date().toISOString(),
    researchTitle: appData.protocolDetails?.researchTitle || appData.researchTitle || "",
    adviser: appData.proponent?.advisor || appData.adviser || "",
    courseProgram: appData.proponent?.courseProgram || appData.courseProgram || "",
    emailAddress: appData.proponent?.email || appData.emailAddress || "",
    progress: appData.progress || 'SC',
    status: appData.status || (appData.applicationStatus === "On-going review" ? 'OR' :
            appData.applicationStatus === "Approved" ? 'A' :
            appData.applicationStatus === "Completed" ? 'C' :
            appData.applicationStatus === "Terminated" ? 'T' : 'OR'),
    funding: appData.funding || 'R',
    typeOfResearch: appData.typeOfResearch || 'EX',
    documents: documentList,
    hasAdditionalDocumentsRequest: appData.hasAdditionalDocumentsRequest || false,
    initialReview: appData.initialReview || {
      date: "",
      decision: "",
      feedback: "",
      additionalDocumentsRequested: []
    },
    resubmission: appData.resubmission || {
      date: "",
      count: 0,
      status: "",
      decision: "",
      history: []
    },
    approved: appData.approved || {
      date: "",
      certificateUrl: ""
    },
    progressReport: appData.progressReport || {
      date: "",
      reportUrl: "",
      submissionCount: 0,
      lastReportUrl: ""
    },
    finalReport: appData.finalReport || {
      date: "",
      reportUrl: ""
    },
    archiving: appData.archiving || {
      date: ""
    }
  };
  
  return { 
    application: transformedApplication,
    documents: documentList
  };
}

/**
 * Get the MIME type for a file extension
 * @param extension - File extension without the dot (e.g., 'pdf')
 * @returns The MIME type string
 */
function getMimeType(extension: string): string {
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
    'txt': 'text/plain',
    'csv': 'text/csv',
    'rtf': 'application/rtf',
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

// Helper function to get original filename from application data
function getOriginalFilename(appData: any, filename: string): string | null {
  // Check if we have originalFilenameMap
  if (appData.originalFilenameMap) {
    for (const category in appData.originalFilenameMap) {
      if (appData.originalFilenameMap[category][filename]) {
        return appData.originalFilenameMap[category][filename];
      }
    }
  }
  
  // Check if we have documents array with originalFilenames
  if (appData.documents && Array.isArray(appData.documents)) {
    for (const doc of appData.documents) {
      if (doc.originalFilenames) {
        for (const category in doc.originalFilenames) {
          if (doc.originalFilenames[category][filename]) {
            return doc.originalFilenames[category][filename];
          }
        }
      }
    }
  }
  
  return null;
}

/**
 * Format a document name for display
 * @param fileName Original file name
 * @returns Formatted document name
 */
function formatDocumentName(fileName: string): string {
  // Remove file extension
  let name = fileName.replace(/\.[^/.]+$/, "");
  
  // Replace underscores and hyphens with spaces
  name = name.replace(/[_-]/g, " ");
  
  // Capitalize each word
  name = name.replace(/\b\w/g, char => char.toUpperCase());
  
  // Special case for common form names
  if (name.match(/form\s*07a/i)) {
    return "Protocol Review Application Form";
  } else if (name.match(/form\s*07b/i)) {
    return "Adviser's Certification Form";
  } else if (name.match(/form\s*07c/i)) {
    return "Informed Consent Template";
  } else if (name.match(/research\s*proposal/i) || name.match(/protocol/i)) {
    return "Research Proposal / Study Protocol";
  } else if (name.match(/minutes/i) || name.match(/defense/i)) {
    return "Minutes of Proposal Defense";
  } else if (name.match(/questionnaire/i) || name.match(/survey/i)) {
    return "Questionnaires / Survey Forms";
  } else if (name.match(/cv/i) || name.match(/curriculum/i) || name.match(/vitae/i)) {
    return "Curriculum Vitae";
  } else if (name.match(/technical/i) || name.match(/review/i)) {
    return "Technical Review Approval";
  } else if (name.match(/abstract/i)) {
    return "Abstract";
  }
  
  return name;
}

/**
 * Find the storage location for application files
 * @param applicationCode Application code
 * @returns Storage reference or null if not found
 */
function findFileLocation(applicationCode: string): StorageReference | null {
  const storage = getStorage();
  
  // Create the standard path
  return ref(storage, `protocolReviewApplications/${applicationCode}/submission`);
} 