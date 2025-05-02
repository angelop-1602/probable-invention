/**
 * Types for protocol application submission
 */

/**
 * Base application form data interface
 */
export interface ApplicationFormData {
  principalInvestigator: string;
  researchTitle: string;
  adviser: string;
  courseProgram: string;
  email: string;
  abstract?: string;  // Optional abstract text
  funding?: string;   // Optional funding type (e.g., 'R' for researcher-funded)
  researchType?: string; // Optional research type (e.g., 'EX' for experimental)
  coResearchers?: string[]; // Optional array of co-researcher names
  _bypassDuplicateCheck?: boolean; // Optional flag to bypass duplicate check
}

/**
 * Extended application form data with required co-researchers array
 */
export interface ExtendedApplicationFormData extends ApplicationFormData {
  coResearchers: string[];
}

/**
 * Base document types that are predefined
 */
export interface BaseDocumentFile {
  form07A: File[] | null;
  form07B: File[] | null;
  form07C: File[] | null;
  researchProposal: File[] | null;
  minutesOfProposalDefense: File[] | null;
  abstract: File[] | null;
  curriculumVitae: File[] | null;
  questionnaires: File[] | null;
  technicalReview: File[] | null;
}

/**
 * Custom documents with dynamic keys
 */
export interface CustomDocuments {
  [key: string]: File[] | null;
}

/**
 * Combined type for all documents
 */
export interface DocumentFiles extends BaseDocumentFile, CustomDocuments {}

/**
 * Result of duplicate application check
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
 * Application submission result
 */
export interface SubmissionResult {
  applicationCode?: string;  // Optional because it may be missing in case of error
  success: boolean;
  message?: string;  // Optional response message
} 