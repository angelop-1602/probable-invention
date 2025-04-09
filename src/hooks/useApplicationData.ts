import { useState, useEffect, useCallback } from 'react';
import { 
  submitProtocolApplication, 
  listenToApplicationUpdates, 
  getApplicationByCode, 
  getApplicationsByEmail, 
  trackApplicationStatus,
  checkForDuplicateSubmission,
  cleanupAllCaches
} from '@/lib/enhanced-submission-service';

import {
  ApplicationFormData,
  DocumentFiles,
  HookApplicationStatus,
  UseSubmitApplicationResult,
  UseApplicationStatusResult,
  UseApplicationDocumentsResult,
  UseUserApplicationsResult,
  ApplicationListItem
} from '@/types';

/**
 * Hook for submitting a new protocol application
 * @returns Submission handler, loading state, and results
 */
export function useSubmitApplication(): UseSubmitApplicationResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<{ applicationCode: string; success: boolean } | null>(null);
  
  const submitApplication = useCallback(async (formData: ApplicationFormData, documents: DocumentFiles) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Only check for duplicates if we're not explicitly bypassing the check
      if (!formData._bypassDuplicateCheck) {
        // Check for duplicates first
        const duplicateCheck = await checkForDuplicateSubmission(
          formData.principalInvestigator,
          formData.researchTitle
        );
        
        if (duplicateCheck.isDuplicate) {
          throw new Error('A similar application already exists. Please check the existing applications.');
        }
      }
      
      // Submit the application
      const submitResult = await submitProtocolApplication(formData, documents);
      setResult(submitResult);
      return submitResult;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);
  
  return { submitApplication, isSubmitting, error, result };
}

/**
 * Hook for tracking application status in real-time
 * @param applicationCode The application code to track
 * @returns Current application status and loading state
 */
export function useApplicationStatus(applicationCode: string | null): UseApplicationStatusResult {
  const [status, setStatus] = useState<HookApplicationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (!applicationCode) {
      setStatus(null);
      return;
    }
    
    setIsLoading(true);
    
    // Set up real-time listener for status updates
    const unsubscribe = trackApplicationStatus(applicationCode, (newStatus) => {
      setStatus(newStatus);
      setIsLoading(false);
    });
    
    // Clean up listener on unmount
    return () => {
      unsubscribe();
    };
  }, [applicationCode]);
  
  return { status, isLoading, error };
}

/**
 * Hook for accessing application documents in real-time
 * @param applicationCode The application code
 * @returns Application data, documents as blobs, and loading state
 */
export function useApplicationDocuments(applicationCode: string | null): UseApplicationDocumentsResult {
  const [applicationData, setApplicationData] = useState<any>(null);
  const [documents, setDocuments] = useState<Map<string, Blob>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (!applicationCode) {
      setApplicationData(null);
      setDocuments(new Map());
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Set up real-time listeners for both application data and documents
      const unsubscribes = listenToApplicationUpdates(
        applicationCode,
        (data) => {
          setApplicationData(data);
          setIsLoading(false);
        },
        (files) => {
          setDocuments(files);
        }
      );
      
      // Clean up listeners on unmount
      return () => {
        try {
          unsubscribes.forEach(unsubscribe => unsubscribe());
        } catch (err) {
          console.error("Error cleaning up listeners:", err);
        }
      };
    } catch (err) {
      console.error("Error setting up application listeners:", err);
      setError(err instanceof Error ? err : new Error("Failed to set up document listeners"));
      setIsLoading(false);
      // Return empty cleanup function
      return () => {};
    }
  }, [applicationCode]);
  
  // Get document URLs for rendering
  const getDocumentURL = useCallback((fileName: string) => {
    try {
      const blob = documents.get(fileName);
      if (!blob) return null;
      return URL.createObjectURL(blob);
    } catch (err) {
      console.error("Error creating document URL:", err);
      return null;
    }
  }, [documents]);
  
  return { applicationData, documents, getDocumentURL, isLoading, error };
}

/**
 * Hook for fetching user's applications with caching
 * @param userEmail The user's email
 * @returns User's applications and loading state
 */
export function useUserApplications(userEmail: string | null): UseUserApplicationsResult {
  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  const refreshApplications = useCallback(async (force = false) => {
    if (!userEmail) return;
    
    // If we're not forcing a refresh and we refreshed recently (within 5 minutes), skip
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (!force && lastRefresh > fiveMinutesAgo && applications.length > 0) {
      return; // Use cached data if it's recent enough
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const apps = await getApplicationsByEmail(userEmail);
      // Type the applications properly as ApplicationListItem[]
      const typedApps: ApplicationListItem[] = apps.map(app => ({
        applicationCode: app.applicationCode || app.id,
        researchTitle: app.protocolDetails?.researchTitle || "",
        principalInvestigator: app.proponent?.name || "",
        submissionDate: app.proponent?.submissionDate 
          ? new Date(app.proponent.submissionDate.seconds * 1000).toISOString()
          : new Date().toISOString(),
        status: app.applicationStatus === "On-going review" ? 'OR' :
               app.applicationStatus === "Approved" ? 'A' :
               app.applicationStatus === "Completed" ? 'C' :
               app.applicationStatus === "Terminated" ? 'T' : 'OR',
        progress: app.reviewProgress?.approved ? 'AP' :
                  app.reviewProgress?.resubmission ? 'RS' :
                  app.reviewProgress?.initialReview ? 'IR' : 'SC',
        recCode: app.recCode || ""
      }));
      setApplications(typedApps);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch applications'));
    } finally {
      setIsLoading(false);
    }
  }, [userEmail, lastRefresh, applications.length]);
  
  useEffect(() => {
    refreshApplications();
    
    // Set up automatic refresh at regular intervals if user is logged in
    const refreshInterval = setInterval(() => {
      refreshApplications(true); // Force refresh every 10 minutes
    }, 10 * 60 * 1000);
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [refreshApplications]);
  
  // Clean up old cache entries periodically
  useEffect(() => {
    // Run cleanup every hour
    const cleanupInterval = setInterval(() => {
      cleanupAllCaches()
        .catch(err => console.error('Error cleaning up caches:', err));
    }, 60 * 60 * 1000);
    
    return () => clearInterval(cleanupInterval);
  }, []);
  
  return { 
    applications, 
    isLoading, 
    error, 
    refreshApplications: () => refreshApplications(true), // Expose a way to force refresh
    lastRefresh // Expose last refresh timestamp
  };
} 