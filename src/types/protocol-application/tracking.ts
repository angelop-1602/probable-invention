/**
 * Types for protocol application tracking
 */

/**
 * Status types
 */
export type ProgressStatus = 'SC' | 'IR' | 'RS' | 'AP' | 'PR' | 'FR' | 'AR';
export type ApplicationStatus = 'OR' | 'A' | 'C' | 'T';
export type FundingSource = 'R' | 'I' | 'A' | 'D' | 'O';
export type ResearchType = 'EX' | 'SR';
export type DocumentStatus = 'Accepted' | 'Review Required' | 'Pending' | 'Rejected' | 
                            'Revision Submitted' | 'Submitted' | 'Issued';

/**
 * Document interface for protocol application
 */
export interface Document {
  name: string;
  status: DocumentStatus;
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
 * Termination information
 */
export interface Termination {
  date: string;
  reason: string;
  formUrl: string;
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
  progress: ProgressStatus;
  status: ApplicationStatus;
  funding: FundingSource;
  typeOfResearch: ResearchType;
  initialReview: ReviewDecision;
  resubmission: Resubmission;
  approved: DateRecord;
  progressReport: DateRecord;
  finalReport: DateRecord;
  archiving: DateRecord;
  termination?: Termination; // Optional termination information
  documents: Document[];
  hasAdditionalDocumentsRequest?: boolean; // Flag to show if there are additional document requests
}

/**
 * Progress information
 */
export interface ProgressInfo {
  name: string;
  description: string;
}

/**
 * Mapping interfaces
 */
export interface ProgressMap {
  [key: string]: ProgressInfo;
}

export interface StatusMap {
  [key: string]: string;
}

export interface FundingMap {
  [key: string]: string;
}

export interface ResearchTypeMap {
  [key: string]: string;
}

export interface ColorMap {
  [key: string]: string;
} 