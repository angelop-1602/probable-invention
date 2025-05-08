/**
 * Types for protocol applications
 */
import { Document, DateRecord, ReviewDecision, Resubmission } from './tracking';

/**
 * Application submission form data
 */
export interface ApplicationSubmissionData {
  principalInvestigator: string;
  email: string;
  adviser: string;
  courseProgram: string;
  researchTitle: string;
  _bypassDuplicateCheck?: boolean;
  [key: string]: any; // Allow other fields
}

/**
 * Application status and progress types
 */
export type ApplicationStatus = 'Draft' | 'Submitted' | 'Under Review' | 'Revisions Required' | 'Approved' | 'Completed' | 'Archived';
export type ApplicationProgress = 'Submission' | 'Initial Review' | 'Resubmission' | 'Approval' | 'Progress Report' | 'Final Report' | 'Archiving';

/**
 * Application proponent information
 */
export interface Proponent {
  name: string;
  email: string;
  advisor: string;
  courseProgram: string;
  submissionDate: any; // Firebase Timestamp or ISO string
}

/**
 * Protocol details
 */
export interface ProtocolDetails {
  researchTitle: string;
  fundingSource?: string;
  researchType?: string;
  description?: string;
  keywords?: string[];
  [key: string]: any; // Allow other custom fields
}

/**
 * Review progress tracking
 */
export interface ReviewProgress {
  submission: boolean;
  initialReview: boolean;
  resubmission: boolean;
  approved: boolean;
  progressReport?: boolean;
  finalReport?: boolean;
  archived?: boolean;
  [key: string]: any; // Allow other status flags
}

/**
 * Complete protocol review application
 */
export interface ProtocolApplication {
  applicationCode: string;
  recCode?: string;
  spupRecCode?: string;
  proponent: Proponent;
  protocolDetails: ProtocolDetails;
  documents: Document[];
  applicationStatus: string;
  reviewProgress: ReviewProgress;
  initialReview?: ReviewDecision;
  resubmission?: Resubmission;
  approved?: DateRecord;
  progressReport?: DateRecord;
  finalReport?: DateRecord;
  archiving?: DateRecord;
  hasAdditionalDocumentsRequest?: boolean;
  createdAt: any; // Firebase Timestamp or ISO string
  updatedAt: any; // Firebase Timestamp or ISO string
  [key: string]: any; // Allow other fields for extensibility
}

/**
 * Application submission options
 */
export interface SubmissionOptions {
  skipDuplicateCheck?: boolean;
  draftOnly?: boolean;
  notifyReviewers?: boolean;
  immediateReview?: boolean;
}

/**
 * Application submission result
 */
export interface SubmissionResult {
  applicationCode: string;
  success: boolean;
  message?: string;
  applicationId?: string;
  errors?: string[];
}

/**
 * Status update for an application
 */
export interface StatusUpdate {
  status: string;
  comment?: string;
  updatedBy?: string;
  timestamp?: any; // Firebase Timestamp or number
}

/**
 * Application user permissions
 */
export interface ApplicationPermissions {
  canView: boolean;
  canEdit: boolean;
  canSubmit: boolean;
  canReview: boolean;
  canApprove: boolean;
} 