/**
 * Submission Module
 * 
 * Centralized module for all submission-related functionality including
 * form handling, file management, caching, and Firebase operations.
 */

// Core submission services
export { SubmissionService } from './submission.service';
export { SubmissionCache } from './submission.cache';
export { EnhancedSubmissionCache } from './submission.cache.enhanced';
export { SubmissionStorage } from './submission.storage';
export { CostOptimizationService } from './cost-optimization.service';

// Types and interfaces
export type { 
  SubmissionFormData,
  DocumentUpload,
  SubmissionResult,
  SubmissionStatus,
  DocumentRequirement
} from './submission.types';

// Form validation schemas
export { submissionSchema } from './submission.validation';

// Utilities
export { 
  generateApplicationCode,
  validateSubmissionData,
  formatDocumentName,
  calculateSubmissionProgress
} from './submission.utils'; 