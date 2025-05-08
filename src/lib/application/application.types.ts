import { DocumentStatus } from "@/types/protocol-application/tracking";

/**
 * Document files structure for uploading
 */
export interface DocumentFiles {
  [key: string]: {
    files: File[];
    title: string;
  };
}

/**
 * Application form data for submission
 */
export interface ApplicationFormData {
  principalInvestigator: string;
  email: string;
  adviser: string;
  courseProgram: string;
  researchTitle: string;
  _bypassDuplicateCheck?: boolean;
  [key: string]: any; // Allow other fields
}

/**
 * Result of duplicate submission check
 */
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingApplications: {
    applicationCode: string;
    principalInvestigator: string;
    researchTitle: string;
    submissionDate: Date;
  }[];
}

/**
 * Result of submitting an application
 */
export interface SubmissionResult {
  applicationCode: string;
  success: boolean;
}

/**
 * Custom document type definitions
 */
export interface CustomDocuments {
  [key: string]: {
    title: string;
    description?: string;
  };
}

/**
 * Document interface for protocol application
 */
export interface Document {
  name: string;
  status: DocumentStatus | string;
  downloadLink: string;
  requestReason?: string; // Reason for document revision/additional request
  resubmissionVersion?: number; // Which resubmission this document version belongs to
  fileType?: string; // MIME type of the document
  fileName?: string; // Original filename of the document
  documentType?: string; // Type of document (e.g., "submission", "resubmission")
  documentId?: string; // ID of the document in Firestore
  version?: string; // Version of the document (e.g., "v1", "v1650489321")
  storagePath?: string; // Path to the file in Firebase Storage
  displayName?: string; // User-friendly display name
  displayTitle?: string; // Display title for the document
}

/**
 * Review decision from the ethics committee
 */
export interface ReviewDecision {
  date: string;
  decision: string;
  feedback?: string; // Detailed feedback from reviewers
  additionalDocumentsRequested?: Document[]; // Additional documents requested by the REC chair
}

/**
 * Resubmission information
 */
export interface Resubmission {
  date: string;
  count: number;
  status: string;
  decision: string;
  history?: ResubmissionHistoryItem[]; // Optional history of resubmissions
}

/**
 * History item for resubmissions
 */
export interface ResubmissionHistoryItem {
  date: string;
  status: string;
  decision: string;
  feedback?: string;
}

/**
 * Date record for various application stages
 */
export interface DateRecord {
  date: string;
  certificateUrl?: string; // URL to download the certificate (for approvals)
  reportUrl?: string; // URL to download reports
  submissionCount?: number; // Count of reports submitted (for progress reports)
  lastReportUrl?: string; // URL to the last report submitted
}

/**
 * Complete application data structure
 */
export interface Application {
  applicationCode: string;
  spupRecCode: string;
  principalInvestigator: string;
  submissionDate: string;
  researchTitle: string;
  adviser: string;
  courseProgram: string;
  emailAddress: string;
  progress: string;
  status: string;
  funding: string;
  typeOfResearch: string;
  initialReview: ReviewDecision;
  resubmission: Resubmission;
  approved: DateRecord;
  progressReport: DateRecord;
  finalReport: DateRecord;
  archiving: DateRecord;
  termination?: {
    date: string;
    reason: string;
    formUrl: string;
  }; // Optional termination information
  documents: Document[];
  hasAdditionalDocumentsRequest?: boolean; // Flag to show if there are additional document requests
} 