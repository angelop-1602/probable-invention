/**
 * Utility functions for the REC Chair Application components
 */
import { Document } from "@/types/rec-chair";
import { formatDate as globalFormatDate } from "@/lib/utils";

/**
 * Format date from any timestamp format to a localized date string
 * @deprecated Use formatDate from @/lib/utils instead
 */
export function formatDate(timestamp: any): string {
  return globalFormatDate(timestamp);
}

/**
 * Format document names to be more readable
 */
export function formatDocumentName(fileName: string): string {
  // Remove file extension
  const withoutExtension = fileName.replace(/\.\w+$/, '');
  
  // Map of common document types
  const documentNameMap: Record<string, string> = {
    "form07a": "Form 07A: Protocol Review Application Form",
    "form7a": "Form 07A: Protocol Review Application Form",
    "protocol_review": "Form 07A: Protocol Review Application Form",
    "form07b": "Form 07B: Adviser's Certification Form",
    "form7b": "Form 07B: Adviser's Certification Form",
    "adviser": "Form 07B: Adviser's Certification Form",
    "certification": "Form 07B: Adviser's Certification Form",
    "form07c": "Form 07C: Informed Consent Template",
    "form7c": "Form 07C: Informed Consent Template", 
    "consent": "Form 07C: Informed Consent Template",
    "research_proposal": "Research Proposal/Study Protocol",
    "proposal": "Research Proposal/Study Protocol",
    "protocol": "Research Proposal/Study Protocol",
    "minutes": "Minutes of Proposal Defense",
    "defense": "Minutes of Proposal Defense",
    "questionnaire": "Questionnaires",
    "survey": "Questionnaires",
    "abstract": "Abstract",
    "cv": "Curriculum Vitae of Researchers",
    "curriculum": "Curriculum Vitae of Researchers",
    "vitae": "Curriculum Vitae of Researchers",
    "technical": "Technical Review Approval",
    "review": "Technical Review Approval",
    "approval": "Technical Review Approval",
    "submission": "Protocol Submission",
    "resubmission": "Protocol Resubmission",
    "revision": "Revision Document",
    "amendment": "Protocol Amendment",
    "progress": "Progress Report",
    "final": "Final Report",
    "certificate": "Approval Certificate"
  };
  
  // Check for matches in our mapping
  const lowerFileName = withoutExtension.toLowerCase();
  for (const [key, name] of Object.entries(documentNameMap)) {
    if (lowerFileName.includes(key)) {
      return name;
    }
  }
  
  // Fall back to original formatting if no match found
  const cleanName = withoutExtension
    .replace(/^[A-Z0-9]+_/, '') // Remove application ID prefix
    .replace(/_v\d+$/, '')      // Remove version suffix
    .replace(/\d{10,}/, '')     // Remove timestamps
    .replace(/_+/g, ' ');       // Replace underscores with spaces
    
  // Capitalize each word
  return cleanName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

/**
 * Get a consistent display name for a document
 */
export function getDocumentDisplayName(document: Document): string {
  return document.displayName || 
         document.title || 
         document.name || 
         document.documentName || 
         document.fileName || 
         formatDocumentName(document.type || "Unknown Document");
}

/**
 * Remove undefined values from an object or array deeply
 */
export function removeUndefinedValues<T>(data: T): T {
  if (data === undefined || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => removeUndefinedValues(item)) as unknown as T;
  }

  if (typeof data === 'object') {
    const result: Record<string, any> = {};
    
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key];
        
        if (value !== undefined) {
          result[key] = removeUndefinedValues(value);
        }
      }
    }
    
    return result as T;
  }
  
  return data;
} 