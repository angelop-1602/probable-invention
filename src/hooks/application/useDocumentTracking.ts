/**
 * Hook for tracking document status and updates
 */
import { useState, useEffect, useCallback } from 'react';
import { ApplicationService } from '@/lib/application/application.service';
import type { SubcollectionDocument } from '@/types/protocol-application/documents';

/**
 * Hook for tracking document status in an application
 * @param applicationCode - Application code to track documents for
 * @returns Object containing document status information and loading state
 */
export const useDocumentTracking = (applicationCode?: string) => {
  const [documents, setDocuments] = useState<SubcollectionDocument[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAdditionalRequests, setHasAdditionalRequests] = useState<boolean>(false);
  const [pendingDocuments, setPendingDocuments] = useState<SubcollectionDocument[]>([]);
  
  // Get the application service instance
  const applicationService = ApplicationService.getInstance();
  
  /**
   * Fetch application documents
   */
  const fetchDocuments = useCallback(async () => {
    if (!applicationCode) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { application, documents } = await applicationService.fetchApplicationWithDocuments(applicationCode);
      
      setDocuments(documents as SubcollectionDocument[]);
      setHasAdditionalRequests(application.hasAdditionalDocumentsRequest || false);
      
      // Identify pending documents
      const pending = (documents as SubcollectionDocument[]).filter(doc => 
        doc.status === 'pending' || 
        doc.status === 'submitted' || 
        doc.status === 'rejected'
      );
      
      setPendingDocuments(pending);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to fetch documents. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [applicationCode, applicationService]);
  
  // Setup document tracking
  useEffect(() => {
    if (!applicationCode) return;
    
    // Initial fetch
    fetchDocuments();
    
    // Set up listener for changes
    const unsubscribe = applicationService.trackApplicationStatus(
      applicationCode,
      (statusData) => {
        if (statusData.documents) {
          setDocuments(statusData.documents as SubcollectionDocument[]);
          
          // Update pending documents
          const pending = (statusData.documents as SubcollectionDocument[]).filter((doc: SubcollectionDocument) => 
            doc.status === 'pending' || 
            doc.status === 'submitted' || 
            doc.status === 'rejected'
          );
          
          setPendingDocuments(pending);
        }
        
        // Check for additional document requests
        setHasAdditionalRequests(!!statusData.hasAdditionalDocumentsRequest);
      }
    );
    
    // Clean up on unmount
    return () => {
      unsubscribe();
    };
  }, [applicationCode, applicationService, fetchDocuments]);
  
  /**
   * Manually refresh documents
   */
  const refreshDocuments = () => {
    fetchDocuments();
  };
  
  /**
   * Filter documents by status
   * @param status - Status to filter by
   * @returns Filtered documents
   */
  const getDocumentsByStatus = useCallback((status: string | string[]): SubcollectionDocument[] => {
    if (Array.isArray(status)) {
      return documents.filter(doc => status.includes(doc.status));
    }
    return documents.filter(doc => doc.status === status);
  }, [documents]);
  
  return {
    documents,
    isLoading,
    error,
    hasAdditionalRequests,
    pendingDocuments,
    refreshDocuments,
    getDocumentsByStatus
  };
};

export default useDocumentTracking; 