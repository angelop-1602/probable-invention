/**
 * Shared application and document types for consistency across components
 */

export type DocumentStatus = "accepted" | "rejected" | "pending" | "Review Required" | "Revision Submitted" | "Issued" | "Submitted";

export type Document = {
  type?: string;
  name?: string;
  title?: string;
  displayName?: string;
  displayTitle?: string;
  fileName?: string;
  documentName?: string;
  documentType?: string;
  url?: string;
  storagePath?: string;
  downloadLink?: string;
  uploadDate?: any;
  status?: DocumentStatus;
  reviewComment?: string;
  comments?: string;
  requestReason?: string;
  resubmissionVersion?: number;
  version?: string;
  nameMapping?: Record<string, string>;
};

export type Application = {
  id?: string;
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
  coInvestigators?: string[];
  abstract?: string;
  keywords?: string[];
  documents?: Document[];
  documentRequests?: string[];
  reviewers?: {
    id: string;
    name: string;
    assignDate: any;
    status: string;
    reviewForm?: string;
  }[];
  comments?: {
    id: string;
    user: string;
    text: string;
    timestamp: any;
  }[];
};

// Status badge variants for consistent UI
export const getStatusBadgeClass = (status: string = "pending"): string => {
  const statusKey = status.toLowerCase();
  
  switch (statusKey) {
    case "approved":
    case "accepted":
      return "bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800";
    
    case "rejected":
      return "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800";
    
    case "pending":
      return "text-orange-500 border-orange-500";
    
    case "under review":
    case "on-going review":
    case "or":
      return "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800";
    
    case "resubmission required":
    case "rs":
    case "review required":
      return "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800";
    
    case "submission check":
    case "sc":
      return "bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800";
    
    case "revision submitted":
      return "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800";
    
    case "issued":
      return "bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800";
    
    case "submitted":
      return "bg-gray-100 dark:bg-gray-950 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-800";
    
    default:
      return "";
  }
};

// Shared type definitions used across multiple components

export interface Comment {
  text: string;
  date: Date;
  status?: string;
  author: string;
}

export interface DocumentDetail {
  id: string;
  name: string;
  url: string;
  type: string;
  status?: string;
  uploadDate: Date;
  reviewStatus?: string;
  reviewComments?: string;
  reviewDate?: Date;
  reviewer?: string;
}

export interface Reviewer {
  id: string;
  name: string;
  email: string;
  department?: string;
  dateAssigned?: Date;
  reviewForm?: string;
  status?: string;
}

export interface ApplicationDetail {
  id?: string;
  protocolTitle?: string;
  submittedBy?: string;
  submittedDate?: Date;
  department?: string;
  status?: string;
  progress?: string;
  spupRecCode?: string;
  reviewType?: string;
  documents?: DocumentDetail[];
  reviewers?: Reviewer[];
  comments?: Comment[];
  lastUpdated?: Date;
} 