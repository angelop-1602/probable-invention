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

// Application type for protocol applications
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
  applicationId: string;
}

export interface ApplicationPageClientProps {
  applicationId: string;
}

export interface ApplicationsTableProps {
  title?: string;
  caption?: string;
  data?: Application[];
  hidePagination?: boolean;
  onRefresh?: () => void;
}

export interface ApplicationDetailProps {
  application: Application;
  reviewers?: Reviewer[];
  onAssignReviewers?: () => void;
  onAddComment?: () => void;
  onUpdateStatus?: () => void;
  onUpdateApplication?: (updatedApplication: Application) => void;
  isFirstView?: boolean;
}

export interface ReviewersListProps {
  application: Application;
  reviewers: Reviewer[];
  onUpdateApplication?: (updatedApplication: Application) => void;
}

export interface ProtocolDocumentListProps {
  application: {
    id?: string;
    documents?: Document[];
    status?: string;
    progress?: string;
    progressDetails?: string;
    additionalDocuments?: Array<{ name: string; requestReason?: string }>;
  };
  onUpdateApplication?: (updatedApplication: any) => void;
}

export interface StatusUpdateParam {
  field: string;
  value: string;
}

export interface ProtocolInformationProps {
  application: Application;
  onStatusUpdated?: (update: StatusUpdateParam) => void;
}

export interface ViewApplicationDialogProps {
  application: Application;
  onApplicationUpdated?: () => void;
}

export interface SpupRecCodeAssignmentProps {
  applicationId?: string;
  principalInvestigator?: string;
  researchType?: string;
  currentCode?: string;
  isFirstView?: boolean;
  onCodeSaved: (code: string) => void;
}

export interface AddCommentDialogProps {
  applicationId: string;
  onCommentAdded?: () => void;
}

export interface DocumentPreviewProps {
  documentTitle: string;
  documentUrl?: string;
  storagePath?: string;
  onApprove?: () => void;
  onReject?: () => void;
  onClose?: () => void;
  showActions?: boolean;
  isFullScreen?: boolean;
  onDownload?: () => void;
  rejectionComment?: string;
  isRevision?: boolean;
  revisionVersion?: number;
  revisionDate?: any;
  documents?: Document[];
  currentDocumentIndex?: number;
  onNavigateDocument?: (index: number) => void;
} 