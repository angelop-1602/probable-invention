/**
 * DEPRECATED: This file is maintained for backward compatibility.
 * Please import directly from the following modules instead:
 * - @/lib/ui for UI utilities (cn)
 * - @/lib/application for application utilities
 * - @/lib/theme for theme utilities
 */

export { cn } from './ui';
export { formatDate, formatDateTime } from './application/application.utils';

// Re-export any other utilities that were used from the old utils.ts

// Form validation utilities
export interface ValidationError {
  field: string;
  message: string;
}

export interface SubmissionValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  missingRequiredFields: string[];
  missingRequiredDocuments: string[];
}

export function validateSubmissionForm(formData: any, documents: any): SubmissionValidationResult {
  const errors: ValidationError[] = [];
  const missingRequiredFields: string[] = [];
  const missingRequiredDocuments: string[] = [];

  // Required fields validation
  const requiredFields = [
    { path: 'general_information.protocol_title', label: 'Protocol Title' },
    { path: 'general_information.principal_investigator.name', label: 'Principal Investigator Name' },
    { path: 'general_information.principal_investigator.email', label: 'Principal Investigator Email' },
    { path: 'general_information.advisers', label: 'Advisers' },
    { path: 'nature_and_type_of_study.level', label: 'Study Level' },
    { path: 'nature_and_type_of_study.type', label: 'Study Type' },
    { path: 'nature_and_type_of_study.site', label: 'Study Site' },
    { path: 'study_duration.duration_from', label: 'Study Start Date' },
    { path: 'study_duration.duration_to', label: 'Study End Date' },
    { path: 'participants_information.expected_number', label: 'Expected Number of Participants' },
    { path: 'participants_information.description', label: 'Participants Description' },
    { path: 'funding_sources', label: 'Funding Sources' },
    { path: 'brief_study_description', label: 'Brief Study Description' },
  ];

  requiredFields.forEach(field => {
    const value = getNestedValue(formData, field.path);
    
    if (field.path === 'general_information.advisers') {
      // Special check for advisers array
      if (!value || !Array.isArray(value) || value.length === 0 || !value[0]?.name?.trim()) {
        errors.push({ field: field.path, message: `${field.label} is required` });
        missingRequiredFields.push(field.label);
      }
    } else if (field.path === 'funding_sources') {
      // Special check for funding sources
      if (!value || !Array.isArray(value) || value.length === 0) {
        errors.push({ field: field.path, message: `${field.label} is required` });
        missingRequiredFields.push(field.label);
      }
    } else if (!value || (typeof value === 'string' && !value.trim())) {
      errors.push({ field: field.path, message: `${field.label} is required` });
      missingRequiredFields.push(field.label);
    }
  });

  // Email validation
  const email = getNestedValue(formData, 'general_information.principal_investigator.email');
  if (email && !isValidEmail(email)) {
    errors.push({ 
      field: 'general_information.principal_investigator.email', 
      message: 'Please enter a valid email address' 
    });
  }

  // Required documents validation
  const requiredDocuments = [
    { id: 'informed_consent', label: 'Informed Consent Form' },
    { id: 'advisers_certification', label: 'Endorsement Letter/Adviser\'s Certification' },
    { id: 'research_proposal', label: 'Research Proposal/Study Protocol' },
    { id: 'minutes_proposal_defense', label: 'Minutes of Proposal Defense' },
    { id: 'curriculum_vitae', label: 'Curriculum Vitae of Researchers' },
    { id: 'abstract', label: 'Abstract' },
  ];

  requiredDocuments.forEach(doc => {
    if (!documents[doc.id] || !documents[doc.id].files || documents[doc.id].files.length === 0) {
      errors.push({ field: doc.id, message: `${doc.label} is required` });
      missingRequiredDocuments.push(doc.label);
    }
  });

  // Date validation
  const startDate = getNestedValue(formData, 'study_duration.duration_from');
  const endDate = getNestedValue(formData, 'study_duration.duration_to');
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      errors.push({
        field: 'study_duration.duration_to',
        message: 'End date must be after start date'
      });
    }
  }

  // Participants count validation
  const participantsCount = getNestedValue(formData, 'participants_information.expected_number');
  if (participantsCount && (isNaN(participantsCount) || participantsCount <= 0)) {
    errors.push({
      field: 'participants_information.expected_number',
      message: 'Please enter a valid number of participants'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    missingRequiredFields,
    missingRequiredDocuments,
  };
}

// Helper function to get nested object values
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Generate validation summary message
export function getValidationSummary(validation: SubmissionValidationResult): string {
  if (validation.isValid) {
    return 'All required fields and documents are complete!';
  }

  const messages: string[] = [];
  
  if (validation.missingRequiredFields.length > 0) {
    messages.push(`Missing required fields: ${validation.missingRequiredFields.join(', ')}`);
  }
  
  if (validation.missingRequiredDocuments.length > 0) {
    messages.push(`Missing required documents: ${validation.missingRequiredDocuments.join(', ')}`);
  }

  return messages.join('\n');
} 