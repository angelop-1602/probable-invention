/**
 * Submission Utilities
 * 
 * Utility functions for the submission system
 */

import { SubmissionFormData, SubmissionProgress, DocumentUpload } from './submission.types';

/**
 * Generate a unique application code for tracking purposes
 * Format: RECYYYYRC where:
 * - REC: Starting label
 * - YYYY: Current year
 * - RC: Random 6 characters (letters and numbers)
 * 
 * This is different from SPUP REC Code which is assigned by the admin later
 */
export function generateApplicationCode(): string {
  const year = new Date().getFullYear();
  
  // Generate 6 random characters (letters and numbers)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomChars = '';
  for (let i = 0; i < 6; i++) {
    randomChars += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `REC${year}${randomChars}`;
}

/**
 * Validate submission data completeness
 */
export function validateSubmissionData(data: Partial<SubmissionFormData>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check general information
  if (!data.general_information?.protocol_title) {
    errors.push('Protocol title is required');
  }
  
  if (!data.general_information?.principal_investigator?.name) {
    errors.push('Principal investigator name is required');
  }
  
  if (!data.general_information?.principal_investigator?.email) {
    errors.push('Principal investigator email is required');
  }
  
  if (!data.general_information?.advisers?.length) {
    errors.push('At least one adviser is required');
  }

  // Check nature and type
  if (!data.nature_and_type_of_study?.level) {
    errors.push('Study level is required');
  }
  
  if (!data.nature_and_type_of_study?.type) {
    errors.push('Study type is required');
  }

  // Check funding
  const funding = data.source_of_funding;
  if (funding) {
    const hasFunding = funding.self_funded || 
                      funding.institution_funded || 
                      funding.government_funded || 
                      funding.pharmaceutical_company?.is_funded || 
                      funding.scholarship || 
                      funding.research_grant ||
                      (funding.others && funding.others.trim().length > 0);
    
    if (!hasFunding) {
      errors.push('At least one funding source must be selected');
    }
  }

  // Check duration
  if (!data.duration_of_study?.start_date) {
    errors.push('Study start date is required');
  }
  
  if (!data.duration_of_study?.end_date) {
    errors.push('Study end date is required');
  }

  // Check participants
  if (!data.participants?.number_of_participants || data.participants.number_of_participants < 1) {
    errors.push('Number of participants must be at least 1');
  }

  // Check description
  if (!data.brief_description_of_study || data.brief_description_of_study.length < 50) {
    errors.push('Brief description must be at least 50 characters');
  }

  // Warnings for optional but recommended fields
  if (!data.general_information?.co_researchers?.length) {
    warnings.push('Consider adding co-researchers if applicable');
  }
  
  if (data.study_site?.research_outside_university?.is_outside && 
      !data.study_site.research_outside_university.specify) {
    warnings.push('Please specify the external research site');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Format document name for display and storage
 */
export function formatDocumentName(originalName: string, documentTitle?: string): string {
  // Use document title if provided, otherwise clean up original name
  if (documentTitle && documentTitle.trim()) {
    return documentTitle.trim();
  }
  
  // Clean up original filename
  const nameWithoutExtension = originalName.replace(/\.[^/.]+$/, '');
  
  // Replace underscores and hyphens with spaces
  const cleaned = nameWithoutExtension
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Capitalize first letter of each word
  return cleaned
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Calculate submission progress
 */
export function calculateSubmissionProgress(
  formData: Partial<SubmissionFormData>,
  documents: DocumentUpload[],
  currentStep: number
): SubmissionProgress {
  const totalSteps = 2;
  
  // Count completed fields
  let completedFields = 0;
  let totalFields = 0;
  
  // General information fields (8 required fields)
  totalFields += 8;
  if (formData.general_information?.protocol_title) completedFields++;
  if (formData.general_information?.principal_investigator?.name) completedFields++;
  if (formData.general_information?.principal_investigator?.email) completedFields++;
  if (formData.general_information?.principal_investigator?.position_institution) completedFields++;
  if (formData.general_information?.principal_investigator?.address) completedFields++;
  if (formData.general_information?.principal_investigator?.contact_number) completedFields++;
  if (formData.general_information?.advisers?.length) completedFields++;
  if (formData.brief_description_of_study) completedFields++;
  
  // Nature and type fields (2 required fields)
  totalFields += 2;
  if (formData.nature_and_type_of_study?.level) completedFields++;
  if (formData.nature_and_type_of_study?.type) completedFields++;
  
  // Study site (1 required field)
  totalFields += 1;
  if (formData.study_site?.research_within_university !== undefined) completedFields++;
  
  // Funding (1 required field - at least one source)
  totalFields += 1;
  const funding = formData.source_of_funding;
  if (funding) {
    const hasFunding = funding.self_funded || 
                      funding.institution_funded || 
                      funding.government_funded || 
                      funding.pharmaceutical_company?.is_funded || 
                      funding.scholarship || 
                      funding.research_grant ||
                      (funding.others && funding.others.trim().length > 0);
    if (hasFunding) completedFields++;
  }
  
  // Duration (2 required fields)
  totalFields += 2;
  if (formData.duration_of_study?.start_date) completedFields++;
  if (formData.duration_of_study?.end_date) completedFields++;
  
  // Participants (2 required fields)
  totalFields += 2;
  if (formData.participants?.number_of_participants && formData.participants.number_of_participants > 0) completedFields++;
  if (formData.participants?.type_and_description) completedFields++;
  
  // Count required documents
  const requiredDocuments = [
    'Endorsement Letter/Adviser\'s Certification',
    'Research Proposal/Study Protocol',
    'Proof of payment of ethics review fee'
  ];
  
  const uploadedDocuments = documents.filter(doc => 
    doc.uploadedUrl && requiredDocuments.includes(doc.title)
  ).length;
  
  // Validation
  const validation = validateSubmissionData(formData);
  const isValid = validation.isValid && uploadedDocuments >= requiredDocuments.length;
  
  // Can proceed to next step?
  const canProceed = currentStep === 1 ? 
    (completedFields >= totalFields * 0.8) : // 80% of fields for step 1
    isValid; // All validation passed for final submission
  
  return {
    currentStep,
    totalSteps,
    completedFields,
    totalFields,
    uploadedDocuments,
    requiredDocuments: requiredDocuments.length,
    isValid,
    canProceed
  };
}

/**
 * Generate file hash for deduplication
 */
export async function generateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Sanitize filename for storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove or replace invalid characters
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    .toLowerCase();
}

/**
 * Check if file type is allowed
 */
export function isAllowedFileType(file: File): boolean {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  return allowedTypes.includes(file.type);
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
} 