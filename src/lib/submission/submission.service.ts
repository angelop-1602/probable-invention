/**
 * Submission Service
 * 
 * Main service that orchestrates all submission operations including
 * form handling, file uploads, caching, and Firebase operations
 */

import { getFirestore, collection, addDoc, doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
import { SubmissionFormData, SubmissionResult, SubmissionStatus, DocumentUpload, SubmissionProgress } from './submission.types';
import { SubmissionCache } from './submission.cache';
import { EnhancedSubmissionCache } from './submission.cache.enhanced';
import { SubmissionStorage } from './submission.storage';
import { CostOptimizationService } from './cost-optimization.service';
import { 
  generateApplicationCode, 
  validateSubmissionData, 
  calculateSubmissionProgress 
} from './submission.utils';
import { removeUndefinedValues } from '../rec-chair/utils';
import { submissionSchema, step1Schema, step2Schema } from './submission.validation';

export class SubmissionService {
  private static instance: SubmissionService;
  private firestore = getFirestore();
  private cache = SubmissionCache.getInstance();
  private enhancedCache = EnhancedSubmissionCache.getInstance();
  private storage = SubmissionStorage.getInstance();
  private costOptimizer = CostOptimizationService.getInstance();
  private readonly SUBMISSIONS_COLLECTION = 'submissions';

  private constructor() {}

  public static getInstance(): SubmissionService {
    if (!SubmissionService.instance) {
      SubmissionService.instance = new SubmissionService();
    }
    return SubmissionService.instance;
  }

  /**
   * Initialize a new submission for a user
   */
  public async initializeSubmission(userId: string): Promise<{
    formData: Partial<SubmissionFormData>;
    documents: DocumentUpload[];
    step: number;
    progress: SubmissionProgress;
  }> {
    try {
      // Try to load existing cached data
      const cachedData = await this.cache.loadFormData(userId);
      
      if (cachedData) {
        const progress = calculateSubmissionProgress(
          cachedData.formData,
          cachedData.documents,
          cachedData.step
        );
        
        return {
          formData: cachedData.formData,
          documents: cachedData.documents,
          step: cachedData.step,
          progress
        };
      }

      // Initialize new submission with default values
      const defaultFormData: Partial<SubmissionFormData> = {
        general_information: {
          spup_rec_code: '', // Will be generated on submission
          protocol_title: '',
          principal_investigator: {
            name: '',
            position_institution: '',
            address: '',
            contact_number: '',
            email: ''
          },
          co_researchers: [],
          advisers: []
        },
        nature_and_type_of_study: {
          level: '',
          type: ''
        },
        study_site: {
          research_within_university: true,
          research_outside_university: {
            is_outside: false,
            specify: ''
          }
        },
        source_of_funding: {
          self_funded: false,
          institution_funded: false,
          government_funded: false,
          pharmaceutical_company: {
            is_funded: false,
            specify: ''
          },
          scholarship: false,
          research_grant: false,
          others: ''
        },
        duration_of_study: {
          start_date: '',
          end_date: ''
        },
        participants: {
          number_of_participants: 0,
          type_and_description: ''
        },
        brief_description_of_study: ''
      };

      const documents: DocumentUpload[] = [];
      const step = 1;
      
      // Save initial state to cache
      await this.cache.saveFormData(userId, defaultFormData, documents, step);
      
      const progress = calculateSubmissionProgress(defaultFormData, documents, step);
      
      return {
        formData: defaultFormData,
        documents,
        step,
        progress
      };
      
    } catch (error) {
      console.error('Error initializing submission:', error);
      throw new Error('Failed to initialize submission');
    }
  }

  /**
   * Save form data for a specific step
   */
  public async saveStepData(
    userId: string,
    stepData: Partial<SubmissionFormData>,
    step: number,
    documents: DocumentUpload[] = []
  ): Promise<{
    success: boolean;
    errors?: string[];
    progress: SubmissionProgress;
  }> {
    try {
      // Load existing data
      const existingData = await this.cache.loadFormData(userId);
      const currentFormData = existingData?.formData || {};
      
      // Merge with new step data
      const updatedFormData = { ...currentFormData, ...stepData };
      
      // Validate step data
      let validationResult;
      if (step === 1) {
        validationResult = step1Schema.safeParse(stepData);
      } else if (step === 2) {
        validationResult = step2Schema.safeParse(stepData);
      } else {
        validationResult = submissionSchema.safeParse(updatedFormData);
      }
      
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(err => err.message);
        return {
          success: false,
          errors,
          progress: calculateSubmissionProgress(updatedFormData, documents, step)
        };
      }
      
      // Save to cache
      await this.cache.saveFormData(userId, updatedFormData, documents, step);
      
      // Calculate progress
      const progress = calculateSubmissionProgress(updatedFormData, documents, step);
      
      return {
        success: true,
        progress
      };
      
    } catch (error) {
      console.error('Error saving step data:', error);
      return {
        success: false,
        errors: ['Failed to save form data'],
        progress: calculateSubmissionProgress({}, [], step)
      };
    }
  }

  /**
   * Upload documents for a submission
   */
  public async uploadDocuments(
    userId: string,
    documents: DocumentUpload[],
    onProgress?: (progress: number, currentFile: string) => void
  ): Promise<{
    success: boolean;
    results: Record<string, any>;
    errors?: string[];
  }> {
    try {
      // Generate application code for file organization
      const applicationCode = generateApplicationCode();
      
            // Upload documents
      const uploadResults = await this.storage.uploadDocuments(
        documents,
        applicationCode,
        onProgress
      );

      // Update documents with upload results
      const updatedDocuments = documents.map(doc => {
        const result = uploadResults[doc.id];
        
        return {
          ...doc,
          uploadedUrl: result?.downloadUrl,
          storagePath: result?.storagePath,
          error: result?.error
        };
      });
      
      // Load existing form data and update with documents
      const existingData = await this.cache.loadFormData(userId);
      const formData = existingData?.formData || {};
      const step = existingData?.step || 2;
      
      // Update form data with application code (NOT SPUP REC code)
      const updatedFormData: Partial<SubmissionFormData> = {
        ...formData,
        general_information: formData.general_information ? {
          ...formData.general_information,
          application_code: applicationCode // This is the application code, not SPUP REC code
        } : {
          application_code: applicationCode, // Application code for tracking
          protocol_title: '',
          principal_investigator: {
            name: '',
            position_institution: '',
            address: '',
            contact_number: '',
            email: ''
          },
          co_researchers: [],
          advisers: []
        }
      };
      
      // Save updated data to cache
      await this.cache.saveFormData(userId, updatedFormData, updatedDocuments, step);
      
      // Check for upload errors
      const errors = Object.values(uploadResults)
        .filter(result => !result.success)
        .map(result => result.error || 'Upload failed');
      
      return {
        success: errors.length === 0,
        results: uploadResults,
        errors: errors.length > 0 ? errors : undefined
      };
      
    } catch (error) {
      console.error('Error uploading documents:', error);
      return {
        success: false,
        results: {},
        errors: ['Failed to upload documents']
      };
    }
  }

  /**
   * Submit the complete application
   */
  public async submitApplication(userId: string): Promise<SubmissionResult> {
          console.log('Starting application submission for user:', userId);
    
    try {
      // Load cached data
      const cachedData = await this.cache.loadFormData(userId);
      if (!cachedData || !cachedData.formData) {
        console.error('No cached form data found for user:', userId);
        return {
          success: false,
          id: '',
          errors: ['No form data found. Please complete the application form first.']
        };
      }

      console.log('Raw form data before processing:', JSON.stringify(cachedData.formData, null, 2));

      // Validate submission data
      const validation = validateSubmissionData(cachedData.formData);
      if (!validation.isValid) {
        console.error('Validation failed:', validation.errors);
        return {
          success: false,
          id: '',
          errors: validation.errors,
          warnings: validation.warnings
        };
      }

      // Get or generate application code
      const applicationCode = cachedData.formData.general_information?.application_code || generateApplicationCode();
      
      console.log('Submitting application with code:', applicationCode);
      
      // Note: No longer saving checklist_of_documents as it's redundant with documents array

      // Prepare submission data for Firestore with proper defaults
      const rawSubmissionData = {
        // Core form data with defaults for any missing optional fields
        general_information: {
          application_code: applicationCode,
          protocol_title: cachedData.formData.general_information?.protocol_title || '',
          principal_investigator: {
            name: cachedData.formData.general_information?.principal_investigator?.name || '',
            position_institution: cachedData.formData.general_information?.principal_investigator?.position_institution || '',
            address: cachedData.formData.general_information?.principal_investigator?.address || '',
            contact_number: cachedData.formData.general_information?.principal_investigator?.contact_number || '',
            email: cachedData.formData.general_information?.principal_investigator?.email || ''
          },
          co_researchers: cachedData.formData.general_information?.co_researchers || [],
          advisers: cachedData.formData.general_information?.advisers || []
        },
        nature_and_type_of_study: {
          level: cachedData.formData.nature_and_type_of_study?.level || '',
          type: cachedData.formData.nature_and_type_of_study?.type || ''
        },
        study_site: {
          research_within_university: cachedData.formData.study_site?.research_within_university ?? true,
          research_outside_university: {
            is_outside: cachedData.formData.study_site?.research_outside_university?.is_outside ?? false,
            specify: cachedData.formData.study_site?.research_outside_university?.specify || ''
          }
        },
        source_of_funding: {
          self_funded: cachedData.formData.source_of_funding?.self_funded ?? false,
          institution_funded: cachedData.formData.source_of_funding?.institution_funded ?? false,
          government_funded: cachedData.formData.source_of_funding?.government_funded ?? false,
          pharmaceutical_company: {
            is_funded: cachedData.formData.source_of_funding?.pharmaceutical_company?.is_funded ?? false,
            specify: cachedData.formData.source_of_funding?.pharmaceutical_company?.specify || ''
          },
          scholarship: cachedData.formData.source_of_funding?.scholarship ?? false,
          research_grant: cachedData.formData.source_of_funding?.research_grant ?? false,
          others: cachedData.formData.source_of_funding?.others || ''
        },
        duration_of_study: {
          start_date: cachedData.formData.duration_of_study?.start_date || '',
          end_date: cachedData.formData.duration_of_study?.end_date || ''
        },
        participants: {
          number_of_participants: cachedData.formData.participants?.number_of_participants || 0,
          type_and_description: cachedData.formData.participants?.type_and_description || ''
        },
        brief_description_of_study: cachedData.formData.brief_description_of_study || '',
        
        // System fields
        id: applicationCode,
        submitter_uid: userId,
        submission_date: new Date().toISOString(),
        
        // Documents array
        documents: cachedData.documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          downloadUrl: doc.uploadedUrl || null,
          storagePath: doc.storagePath || null,
          required: doc.required || false,
          category: doc.category,
          uploadedAt: Timestamp.now()
        })),
        
        // Firestore metadata
        status: 'submitted' as SubmissionStatus,
        submittedBy: userId,
        submittedAt: Timestamp.now(),
        lastModified: Timestamp.now(),
        version: 1,
        applicationStatus: 'Submission Check',
        progress: 'SC'
      };
      
      // Sanitize data to remove undefined values before Firestore submission
      const submissionData = removeUndefinedValues(rawSubmissionData);
      
      console.log('Sanitized submission data:', submissionData);
      
      // Save to Firestore using application code as document ID
      const docRef = doc(this.firestore, this.SUBMISSIONS_COLLECTION, applicationCode);
      await import('firebase/firestore').then(({ setDoc }) => setDoc(docRef, submissionData));
      
      // Clear cached data after successful submission
      await this.cache.clearFormData(userId);
      
      console.log('Application submitted successfully:', {
        applicationCode,
        documentId: docRef.id,
        userId
      });
      
      return {
        success: true,
        id: applicationCode,
        applicationCode // Return application code for tracking
        // spup_rec_code will be assigned later
      };
      
    } catch (error) {
      console.error('Error submitting application:', error);
      return {
        success: false,
        id: '',
        errors: ['Failed to submit application. Please try again.']
      };
    }
  }

  /**
   * Get submission progress
   */
  public async getSubmissionProgress(userId: string): Promise<SubmissionProgress | null> {
    try {
      const cachedData = await this.cache.loadFormData(userId);
      if (!cachedData) {
        return null;
      }
      
      return calculateSubmissionProgress(
        cachedData.formData,
        cachedData.documents,
        cachedData.step
      );
      
    } catch (error) {
      console.error('Error getting submission progress:', error);
      return null;
    }
  }
} 