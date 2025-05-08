/**
 * Enhanced hook for accessing and managing application data with updated types
 */
import { useState, useEffect, useCallback } from 'react';
import { ApplicationService } from '@/lib/application/application.service';
import { DocumentFiles as LibDocumentFiles } from '@/lib/application/application.types';
import { 
  ApplicationFormData, 
  ExtendedApplicationFormData,
  DocumentFiles,
  SubmissionResult
} from '@/types/protocol-application/submission';

/**
 * Enhanced hook for managing application data
 * @param applicationCode - Optional application code to load data for
 * @returns Object with application data, loading state, and methods
 */
export const useEnhancedApplicationData = (applicationCode?: string) => {
  const [application, setApplication] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | string | null>(null);
  
  // Get application service instance
  const applicationService = ApplicationService.getInstance();
  
  /**
   * Fetch application data by code
   */
  const fetchApplication = useCallback(async (code: string = applicationCode || '') => {
    if (!code) {
      setError('No application code provided');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { application } = await applicationService.fetchApplicationWithDocuments(code);
      setApplication(application);
    } catch (err) {
      console.error('Error fetching application:', err);
      setError(err instanceof Error ? err : 'Failed to fetch application. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [applicationCode, applicationService]);
  
  // Load data when applicationCode changes
  useEffect(() => {
    if (applicationCode) {
      fetchApplication(applicationCode);
    }
  }, [applicationCode, fetchApplication]);

  /**
   * Transform our new application form data structure to the one expected by the service
   */
  const transformFormData = (formData: ExtendedApplicationFormData): any => {
    return {
      principalInvestigator: formData.principalInvestigator,
      email: formData.proponent.email,
      adviser: formData.adviser,
      courseProgram: formData.courseProgram,
      researchTitle: formData.protocolDetails.researchTitle,
      coResearchers: formData.coResearchers,
      _bypassDuplicateCheck: formData._bypassDuplicateCheck,
      // Add additional fields needed by the service
      fundingType: formData.fundingType,
      researchType: formData.researchType,
      faqAcknowledged: formData.faqAcknowledged,
      notificationPreferences: formData.notificationPreferences,
    };
  };

  /**
   * Transform DocumentFiles to match the expected LibDocumentFiles format
   */
  const transformDocumentFiles = (documents: DocumentFiles): LibDocumentFiles => {
    const result: LibDocumentFiles = {};
    
    Object.entries(documents).forEach(([key, value]) => {
      if (value !== null) {
        result[key] = value;
      }
    });
    
    return result;
  };

  /**
   * Submit a new application
   * @param formData - Enhanced application form data
   * @param documents - Document files
   * @returns Application code if successful
   */
  const submitApplication = useCallback(async (
    formData: ExtendedApplicationFormData,
    documents: DocumentFiles = {
      form07A: null,
      form07B: null,
      form07C: null,
      researchProposal: null,
      minutesOfProposalDefense: null,
      abstract: null,
      curriculumVitae: null,
      questionnaires: null,
      technicalReview: null
    }
  ): Promise<SubmissionResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Transform our enhanced form data to what the service expects
      const serviceFormData = transformFormData(formData);
      
      // Transform document files
      const serviceDocuments = transformDocumentFiles(documents);
      
      // Submit the application
      const applicationCode = await applicationService.submitProtocolApplication(
        serviceFormData,
        serviceDocuments
      );
      
      return {
        applicationCode: applicationCode.applicationCode,
        success: true
      };
    } catch (err) {
      console.error('Error submitting application:', err);
      setError(err instanceof Error ? err : 'Failed to submit application. Please try again later.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [applicationService]);

  /**
   * Check for duplicate submissions
   * @param principalInvestigator - Principal investigator name
   * @param researchTitle - Research title
   * @returns Result of duplicate check
   */
  const checkDuplicates = useCallback(async (
    principalInvestigator: string,
    researchTitle: string
  ) => {
    try {
      return await applicationService.checkForDuplicateSubmission(
        principalInvestigator,
        researchTitle
      );
    } catch (err) {
      console.error('Error checking for duplicates:', err);
      setError(err instanceof Error ? err : 'Failed to check for duplicates. Please try again later.');
      throw err;
    }
  }, [applicationService]);

  /**
   * Get applications for a specific user by email
   * @param email - User email
   * @returns List of applications
   */
  const getUserApplications = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      return await applicationService.getApplicationsByEmail(email);
    } catch (err) {
      console.error('Error getting user applications:', err);
      setError(err instanceof Error ? err : 'Failed to get applications. Please try again later.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [applicationService]);

  /**
   * Manually refresh application data
   */
  const refreshApplication = () => {
    if (applicationCode) {
      fetchApplication(applicationCode);
    }
  };

  return {
    application,
    isLoading,
    error,
    fetchApplication,
    submitApplication,
    checkDuplicates,
    getUserApplications,
    refreshApplication
  };
};

export default useEnhancedApplicationData; 