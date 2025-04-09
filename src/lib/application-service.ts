import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import JSZip from "jszip";
import { Document, DocumentStatus, Application } from "@/types/protocol-application/tracking";

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
  
  // Try the path for the zip file in protocolReviewApplications
  const possiblePaths = [
    `protocolReviewApplications/${applicationCode}/submission/documents.zip`,
    `applications/${applicationCode}/submission/documents.zip`, // Legacy path
    `applications/${applicationCode}/submission/initial_submission_${applicationCode}.zip`, // Legacy path
  ];
  
  let zipBlob = null;
  
  // Try each path until we find the zip file
  for (const path of possiblePaths) {
    try {
      const zipRef = ref(storage, path);
      const zipUrl = await getDownloadURL(zipRef);
      const response = await fetch(zipUrl);
      zipBlob = await response.blob();
      console.log(`Found zip file at: ${path}`);
      break; // Exit the loop if we found and fetched the zip
    } catch (err) {
      console.log(`No zip file at path: ${path}`);
      // Continue to next path
    }
  }
  
  // Process documents from appData.documents if available
  if (appData.documents && appData.documents.length > 0) {
    // Directly use documents array from protocol document
    documentList = appData.documents.map((doc: any) => ({
      name: doc.displayName || doc.title || doc.documentName || "Document",
      status: (doc.status || "Pending") as DocumentStatus,
      downloadLink: doc.downloadLink || "",
      requestReason: doc.requestReason || doc.comments,
      resubmissionVersion: doc.version
    }));
  }
  // If we found a zip file but no documents in appData, process it
  else if (zipBlob) {
    // Use JSZip to decompress
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(zipBlob);
    
    // Process each file in the zip
    for (const [filename, zipEntry] of Object.entries(zipContent.files)) {
      if (!zipEntry.dir) {
        // Get original filename from metadata if available
        const originalName = getOriginalFilename(appData, filename);
        
        // Create blob URL for the file content
        const content = await zipEntry.async("blob");
        const blobUrl = URL.createObjectURL(content);
        
        documentList.push({
          name: formatDocumentName(originalName || filename),
          status: "Submitted" as DocumentStatus,
          downloadLink: blobUrl
        });
      }
    }
  } else if (appData.filePathMap) {
    // If we have filePathMap from another implementation
    for (const [category, filePaths] of Object.entries(appData.filePathMap)) {
      if (Array.isArray(filePaths)) {
        filePaths.forEach((filePath: string) => {
          const fileName = filePath.split('/').pop() || filePath;
          const originalName = appData.originalFilenameMap?.[category]?.[fileName] || fileName;
          documentList.push({
            name: formatDocumentName(originalName),
            status: "Submitted" as DocumentStatus,
            downloadLink: "" // No download link available
          });
        });
      }
    }
  } else {
    // If we still don't have documents, create at least one placeholder
    documentList = [{
      name: "Application Form",
      status: "Submitted" as DocumentStatus,
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

// Format a filename to be more user-friendly
function formatDocumentName(fileName: string): string {
  // Document type mapping for user-friendly titles
  const documentTitles: Record<string, string> = {
    // Standard protocol documents
    "form07a": "Form 07A: Protocol Review Application Form",
    "form07b": "Form 07B: Adviser's Certification Form",
    "form07c": "Form 07C: Informed Consent Template",
    "research_proposal": "Research Proposal/Study Protocol",
    "minutes": "Minutes of Proposal Defense",
    "questionnaire": "Questionnaires",
    "abstract": "Abstract",
    "curriculum_vitae": "Curriculum Vitae of Researchers",
    "technical_review": "Technical Review Approval",
    
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
  
  // Remove file extension
  const withoutExtension = fileName.replace(/\.\w+$/, '');
  const lowerFileName = withoutExtension.toLowerCase();
  
  // Try to match with document types
  for (const [key, title] of Object.entries(documentTitles)) {
    if (lowerFileName.includes(key)) {
      return title;
    }
  }
  
  // Fall back to cleaning up the filename
  const cleanName = withoutExtension
    .replace(/^[A-Z0-9]+_/, '')
    .replace(/_v\d+$/, '')
    .replace(/\d{10,}/, '')
    .replace(/_+/g, ' ');
    
  // Capitalize each word
  return cleanName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
} 