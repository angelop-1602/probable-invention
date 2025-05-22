/**
 * Shared types for REC Chair application module
 */

import { ReviewerAssignment } from '@/lib/reviewers/reviewer-assignment.service';

// Document type for protocol documents
export type Document = {
  documentType: string;
  title: string;
  fileName: string;
  status: "accepted" | "rejected" | "pending" | "revision_submitted";
  storagePath: string;
  uploadDate: any;
  version: number;
  comments?: string;
};

// Protocol application type for REC Chair
export type Application = {
  id?: string;
  applicationCode?: string;
  recCode?: string;
  spupRecCode?: string;
  principalInvestigator?: string;
  submissionDate?: any;
  courseProgram?: string;
  title?: string;
  status?: string;
  researchType?: string;
  adviser?: string;
  email?: string;
  funding?: string;
  progress?: string;
  progressDetails?: string;
  reviewType?: string;
  decision?: string;
  coInvestigators?: string[];
  abstract?: string;
  keywords?: string[];
  documents?: Document[];
  documentRequests?: string[];
  additionalDocuments?: Array<{ name: string; requestReason?: string }>;
  reviewers?: ReviewerAssignment[];
  comments?: {
    id: string;
    user: string;
    text: string;
    timestamp: any;
  }[];
};

// Reviewer type
export type Reviewer = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: any;
};

/**
 * Component Props Types
 */

export interface ApplicationPageProps {
  params: {
    id: string;
  };
}

export interface ApplicationPageClientProps {
  applicationId: string;
}

export interface ApplicationsTableProps {
  applications: Application[];
  onApplicationSelected?: (application: Application) => void;
  onApplicationUpdated?: () => void;
}

export interface ApplicationDetailProps {
  application: Application;
  onUpdateApplication?: (updatedApplication: Application) => Promise<void>;
}

export interface ReviewersListProps {
  application: Application;
  onUpdateApplication?: (updatedApplication: Application) => Promise<void>;
}

export interface ProtocolDocumentListProps {
  application: Application;
  onUpdateApplication?: (updatedApplication: Application) => Promise<void>;
}

export interface StatusUpdateParam {
  field: string;
  value: string;
}

export interface ProtocolInformationProps {
  application: Application;
  onUpdateApplication?: (updatedApplication: Application) => Promise<void>;
}

export interface ViewApplicationDialogProps {
  application: Application;
  onApplicationUpdated?: () => void;
}

export interface SpupRecCodeAssignmentProps {
  application: Application;
  onUpdateApplication?: (updatedApplication: Application) => Promise<void>;
}

export interface AddCommentDialogProps {
  applicationId: string;
  onCommentAdded?: () => void;
}

export interface RecChairApplicationChatProps {
  applicationId: string;
  onCommentAdded?: () => void;
} 