/**
 * Types for protocol application submission
 */

/**
 * Base application form data interface
 */
export interface ApplicationFormData {
  // Basic Information
  applicationCode?: string;
  spupRecCode?: string;
  applicationStatus?: string;
  createdAt?: Date;
  updatedAt?: Date;

  // Principal Investigator Information
  principalInvestigator: string;
  adviser: string;
  courseProgram: string;
  fundingType?: "Researcher-funded" | "Institution-funded" | "Agency-funded" | "Pharmaceutical-funded" | "Other";
  researchType?: "Experimental" | "Social/Behavioral";

  // Protocol Details
  protocolDetails: {
    researchTitle: string;
  };

  // Proponent Information
  proponent: {
    name: string;
  email: string;
    advisor: string;
    courseProgram: string;
    submissionDate?: Date;
  };

  // Notification Preferences
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
  };

  // Additional Fields
  lastNotifiedAt?: Date;
  faqAcknowledged?: boolean;

  // Arrays and Maps
  resubmissions?: Array<{
    version: string;
    submittedDate: Date;
    documents: string[];
    reviewDecision: "Approved" | "Minor Revisions" | "Major Revisions" | "Rejected";
    decisionDate: Date;
  }>;

  progressReports?: Array<{
    reportDate: Date;
    formUrl: string;
  }>;

  finalReport?: {
    submittedDate: Date;
    formUrl: string;
  };

  archiving?: {
    date: Date;
    notificationUrl: string;
  };

  termination?: {
    date: Date;
    reason: string;
    formUrl: string;
  };

  // For submission process
  _bypassDuplicateCheck?: boolean;
}

/**
 * Extended application form data with required co-researchers array
 */
export interface ExtendedApplicationFormData extends ApplicationFormData {
  coResearchers: string[];
}

/**
 * Form values for the application form
 */
export interface ApplicationFormValues {
  principalInvestigator: string;
  adviser: string;
  courseProgram: string;
  fundingType: "Researcher-funded" | "Institution-funded" | "Agency-funded" | "Pharmaceutical-funded" | "Other";
  researchType: "Experimental" | "Social/Behavioral";
  researchTitle: string;
  proponentName: string;
  proponentEmail: string;
  proponentAdvisor: string;
  proponentCourseProgram: string;
  notificationEmail: boolean;
  notificationSms: boolean;
  faqAcknowledged: boolean;
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
 * Document files structure for uploading
 */
export interface DocumentFiles {
  [key: string]: {
    files: File[];
    title: string;
  };
}

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
  applicationCode: string;
  success: boolean;
  message?: string;
} 