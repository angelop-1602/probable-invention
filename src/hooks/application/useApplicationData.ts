/**
 * Hook for accessing and managing application data
 */
import { useState, useEffect, useCallback } from 'react';
import { ApplicationService } from '@/lib/application/application.service';
import { Application, DocumentFiles, ApplicationFormData } from '@/lib/application/application.types';

export interface UseApplicationDataResult {
  application: Application | null;
  isLoading: boolean;
  error: string | null;
  fetchApplication: (code?: string) => Promise<void>;
  submitApplication: (
    formData: ApplicationFormData,
    documents?: DocumentFiles,
    onProgress?: (step: string, percent: number) => void
  ) => Promise<string>;
  checkDuplicates: (principalInvestigator: string, researchTitle: string) => Promise<any>;
  getUserApplications: (email: string) => Promise<any[]>;
  refreshApplication: () => void;
}

/**
 * Hook for managing application data
 * @param applicationCode - Optional application code to load data for
 * @returns Object with application data, loading state, and methods
 */
export const useApplicationData = (applicationCode?: string): UseApplicationDataResult => {
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
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
      setApplication(application as Application);
    } catch (err) {
      console.error('Error fetching application:', err);
      setError('Failed to fetch application. Please try again later.');
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
   * Submit a new application
   * @param formData - Application form data
   * @param documents - Document files
   * @param onProgress - Optional progress callback (step, percent)
   * @returns Application code if successful
   */
  const submitApplication = useCallback(async (
    formData: ApplicationFormData,
    documents: DocumentFiles = {},
    onProgress?: (step: string, percent: number) => void
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (onProgress) onProgress('Zipping documents...', 10);
      // The actual zipping/uploading logic will call onProgress at each step
      const result = await applicationService.submitProtocolApplication(formData, documents, onProgress);
      return result.applicationCode;
    } catch (err) {
      console.error('Error submitting application:', err);
      setError('Failed to submit application. Please try again later.');
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
      setError('Failed to check for duplicates. Please try again later.');
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
      setError('Failed to get applications. Please try again later.');
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
    submitApplication: submitApplication as (
      formData: ApplicationFormData,
      documents?: DocumentFiles,
      onProgress?: (step: string, percent: number) => void
    ) => Promise<string>,
    checkDuplicates,
    getUserApplications,
    refreshApplication
  };
};

export default useApplicationData; 