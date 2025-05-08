/**
 * Types for protocol application documents
 */

/**
 * Document interface for subcollection-based storage
 */
export interface SubcollectionDocument {
  documentId?: string; // Firestore auto-generated ID
  title: string; // Human-readable document title
  fileName: string; // Name of the uploaded file
  documentType: string; // e.g., 'submission', 'requested', 'resubmission'
  status: 'pending' | 'submitted' | 'revision_submitted' | 'accepted' | 'rejected';
  storagePath: string; // Path in Firebase Storage
  uploadDate: number; // Timestamp (ms since epoch)
  version: number; // Version number (start at 1)
  downloadLink?: string; // Direct download URL
  requestReason?: string; // Reason for request (if requested by REC Chair)
  reviewComment?: string; // (Optional) comment if ever needed in future
  fieldKey?: string; // Key for the document field (e.g., form07A, researchProposal)
}
