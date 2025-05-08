/**
 * Hook for checking document approval status
 */
import { useState, useEffect, useMemo } from 'react';
// Removed: import { DocumentService } from '@/lib/documents/document.service';
// Removed: import { ApplicationData } from '@/lib/documents/document.types';

/**
 * Hook for checking if all required documents in an application have been approved
 * @param applicationData - Application data object
 * @returns Object containing approval status and loading state
 */
export const useDocumentApproval = (applicationData?: any) => {
  const [isApproved, setIsApproved] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkApproval = async () => {
      setIsChecking(true);
      if (!applicationData || !Array.isArray(applicationData.documents)) {
        setIsApproved(false);
        setIsChecking(false);
        return;
      }
      try {
        // All documents must have status 'accepted' to be approved
        const approved = applicationData.documents.length > 0 && applicationData.documents.every((doc: any) => doc.status === 'accepted');
        setIsApproved(approved);
      } catch (error) {
        console.error('Error checking document approval:', error);
        setIsApproved(false);
      } finally {
        setIsChecking(false);
      }
    };
    checkApproval();
  }, [applicationData]);

  return { isApproved, isChecking };
};

export default useDocumentApproval;
