/**
 * Submission Types
 * 
 * Type definitions for the submission system based on submission.json
 */

/**
 * Principal Investigator information
 */
export interface PrincipalInvestigator {
  name: string;
  position_institution: string;
  address: string;
  contact_number: string;
  email: string;
}

/**
 * Co-researcher information
 */
export interface CoResearcher {
  name: string;
}

/**
 * Adviser information
 */
export interface Adviser {
  name: string;
}

/**
 * Study site configuration
 */
export interface StudySite {
  research_within_university: boolean;
  research_outside_university: {
    is_outside: boolean;
    specify: string;
  };
}

/**
 * Source of funding configuration
 */
export interface SourceOfFunding {
  self_funded: boolean;
  institution_funded: boolean;
  government_funded: boolean;
  pharmaceutical_company: {
    is_funded: boolean;
    specify: string;
  };
  scholarship: boolean;
  research_grant: boolean;
  others: string;
}

/**
 * Study duration
 */
export interface StudyDuration {
  start_date: string;
  end_date: string;
}

/**
 * Participants information
 */
export interface Participants {
  number_of_participants: number;
  type_and_description: string;
}

/**
 * Document checklist
 */
export interface DocumentChecklist {
  basic_requirements: string[];
  supplementary_documents: string[];
}

/**
 * Complete submission form data structure
 */
export interface SubmissionFormData {
  // General Information
  general_information: {
    application_code?: string; // Auto-generated application code for tracking
    spup_rec_code?: string; // Will be assigned later by REC Chair
    protocol_title: string;
    principal_investigator: PrincipalInvestigator;
    co_researchers: CoResearcher[];
    advisers: Adviser[];
  };

  // Nature and Type of Study
  nature_and_type_of_study: {
    level: string; // From predefined options
    type: string;  // From predefined options
  };

  // Study Site
  study_site: StudySite;

  // Source of Funding
  source_of_funding: SourceOfFunding;

  // Duration
  duration_of_study: StudyDuration;

  // Participants
  participants: Participants;

  // Brief Description
  brief_description_of_study: string;

  // Document Checklist
  checklist_of_documents: DocumentChecklist;

  // System fields
  submitter_uid?: string;
  submission_date?: string;
  status?: SubmissionStatus;
}

/**
 * Document upload information
 */
export interface DocumentUpload {
  id: string;
  title: string;
  file: File;
  required: boolean;
  category: 'basic_requirements' | 'supplementary_documents';
  uploadProgress?: number;
  uploadedUrl?: string;
  error?: string;
}

/**
 * Document requirement definition
 */
export interface DocumentRequirement {
  id: string;
  title: string;
  description: string;
  required: boolean;
  category: 'basic_requirements' | 'supplementary_documents';
  acceptedFormats: string[];
  hasTemplate?: boolean;
  templateUrl?: string;
}

/**
 * Submission status types
 */
export type SubmissionStatus = 
  | 'draft'
  | 'validating'
  | 'uploading'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'revision_required';

/**
 * Submission result
 */
export interface SubmissionResult {
  success: boolean;
  id: string;
  spup_rec_code?: string;
  applicationCode?: string;
  errors?: string[];
  warnings?: string[];
}

/**
 * Cached submission data
 */
export interface CachedSubmissionData {
  formData: Partial<SubmissionFormData>;
  documents: DocumentUpload[];
  lastModified: number;
  step: number;
}

/**
 * Submission progress information
 */
export interface SubmissionProgress {
  currentStep: number;
  totalSteps: number;
  completedFields: number;
  totalFields: number;
  uploadedDocuments: number;
  requiredDocuments: number;
  isValid: boolean;
  canProceed: boolean;
} 