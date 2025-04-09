/**
 * Types for application-related hooks
 */

/**
 * Status information for tracking application progress
 */
export interface HookApplicationStatus {
  applicationCode: string;
  status: string;
  reviewProgress: {
    submissionCheck: boolean;
    initialReview: boolean;
    resubmission: boolean;
    approved: boolean;
    progressReport: boolean;
    finalReport: boolean;
    archived: boolean;
  };
  lastUpdated: Date;
  recCode: string;
}

/**
 * Simplified application item for listing in the tracker
 */
export interface ApplicationListItem {
  applicationCode: string;
  researchTitle: string;
  principalInvestigator: string;
  submissionDate: string;
  status: 'OR' | 'A' | 'C' | 'T'; // On-going review, Approved, Completed, Terminated
  progress?: string;
  recCode?: string;
}

/**
 * Return type for the useSubmitApplication hook
 */
export interface UseSubmitApplicationResult {
  submitApplication: (formData: any, documents: any) => Promise<{ applicationCode: string; success: boolean }>;
  isSubmitting: boolean;
  error: Error | null;
  result: { applicationCode: string; success: boolean } | null;
}

/**
 * Return type for the useApplicationStatus hook
 */
export interface UseApplicationStatusResult {
  status: HookApplicationStatus | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Return type for the useApplicationDocuments hook
 */
export interface UseApplicationDocumentsResult {
  applicationData: any;
  documents: Map<string, Blob>;
  getDocumentURL: (fileName: string) => string | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Return type for the useUserApplications hook
 */
export interface UseUserApplicationsResult {
  applications: ApplicationListItem[];
  isLoading: boolean;
  error: Error | null;
  refreshApplications: () => void;
  lastRefresh: Date;
} 