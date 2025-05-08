/**
 * Centralized fetcher for tracking applications
 * 
 * This utility provides a single point of access for fetching and transforming
 * protocol review application data for tracking purposes.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApplicationService } from '@/lib/application/application.service';
import { useEnhancedApplicationData } from '@/hooks/application/useEnhancedApplicationData';
import { useDocumentTracking } from '@/hooks/application/useDocumentTracking';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { addDocument, getDocuments, uploadDocument, updateDocumentStatus, deleteDocument as deleteDocumentFromSubcollection } from '@/lib/documents/document-subcollection';
import type { SubcollectionDocument } from '@/types/protocol-application/documents';

// Type for fetching options
interface FetchOptions {
  transformData?: boolean;
  includeDocuments?: boolean;
  includePrimaryReviewers?: boolean;
  includeHistory?: boolean;
}

// Result type for tracked application
interface TrackedApplicationResult {
  application: any | null;
  documents: SubcollectionDocument[];
  documentBlobs: Map<string, Blob>;
  isLoading: boolean;
  error: string | Error | null;
  getDocumentURL: (path: string) => string;
  refreshData: () => Promise<void>;
  uploadDocument: (documentName: string, file: File, description?: string) => Promise<void>;
  updateDocumentStatus: (document: SubcollectionDocument, status: SubcollectionDocument['status'], comment?: string) => Promise<void>;
  downloadDocument: (document: SubcollectionDocument) => Promise<void>;
  addDocument: (documentName: string, file: File, description?: string) => Promise<void>;
  deleteDocument: (document: SubcollectionDocument) => Promise<void>;
}

/**
 * Format a document name for display
 */
export const formatDocumentName = (fileName: string): string => {
  if (!fileName) return 'Document';
  
  // Remove extension
  let displayName = fileName.split('.')[0] || fileName;
  
  // Replace underscores and hyphens with spaces
  displayName = displayName.replace(/[_-]/g, ' ');
  
  // Title case (capitalize first letter of each word)
  displayName = displayName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  return displayName;
};

/**
 * Get a standardized document title
 */
export const getStandardizedDocumentTitle = (doc: SubcollectionDocument): string => {
  const displayName = doc.title || '';
  const lowerName = displayName.toLowerCase();
  
  // If it doesn't match any known type, return the original name
  return displayName;
};

/**
 * Hook for accessing and tracking application data
 * @param applicationCode - The application code to track
 * @param options - Options for fetching the data
 * @returns The tracked application data
 */
export const useTrackApplication = (
  applicationCode: string | null | undefined,
  options: FetchOptions = {
    transformData: true,
    includeDocuments: true,
    includePrimaryReviewers: false,
    includeHistory: false,
  }
): TrackedApplicationResult => {
  const { 
    application: appData, 
    isLoading: appLoading, 
    error: appError,
    refreshApplication
  } = useEnhancedApplicationData(applicationCode || undefined);
  
  const {
    documents: docsData,
    isLoading: docsLoading,
    error: docsError,
    refreshDocuments
  } = useDocumentTracking(applicationCode || undefined);
  
  const [application, setApplication] = useState<any | null>(null);
  const [documents, setDocuments] = useState<SubcollectionDocument[]>([]);
  const [documentBlobs, setDocumentBlobs] = useState<Map<string, Blob>>(new Map());
  const [documentURLs, setDocumentURLs] = useState<Map<string, string>>(new Map());
  
  const getDocumentURL = useCallback((path: string): string => {
    if (!path) return '';
    return documentURLs.get(path) || '';
  }, [documentURLs]);

  const refreshData = useCallback(async () => {
    if (applicationCode) {
      await Promise.all([
        refreshApplication(),
        refreshDocuments()
      ]);
    }
  }, [applicationCode, refreshApplication, refreshDocuments]);

  const uploadDocument = useCallback(async (
    documentName: string, 
    file: File, 
    description?: string
  ) => {
    if (!applicationCode) return;
    try {
      await addDocument(applicationCode, {
        title: documentName,
        file,
        documentType: 'submission',
        requestReason: description
      });
        await refreshData();
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }, [applicationCode, refreshData]);

  const updateDocumentStatusHandler = useCallback(async (
    document: SubcollectionDocument, 
    status: SubcollectionDocument['status'], 
    comment?: string
  ) => {
    if (!applicationCode || !document.documentId) return;
    try {
      await updateDocumentStatus(applicationCode, document.documentId, status);
      // Optionally update reviewComment if needed
      if (comment) {
        const docRef = doc(db, 'protocolReviewApplications', applicationCode, 'documents', document.documentId);
        await updateDoc(docRef, { reviewComment: comment, reviewedAt: Timestamp.now() });
      }
      await refreshData();
    } catch (error) {
      console.error('Error updating document status:', error);
      throw error;
    }
  }, [applicationCode, refreshData]);

  const downloadDocument = useCallback(async (document: SubcollectionDocument) => {
    if (!document.storagePath && !document.downloadLink) return;
    try {
      if (document.downloadLink) {
        window.open(document.downloadLink, '_blank');
        return;
      }
      const storage = getStorage();
      const storageRef = ref(storage, document.storagePath!);
      const downloadURL = await getDownloadURL(storageRef);
      window.open(downloadURL, '_blank');
    } catch (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
  }, []);

  const addDocumentHandler = useCallback(async (
    documentName: string, 
    file: File, 
    description?: string
  ) => {
    if (!applicationCode) return;
    try {
      await uploadDocument(documentName, file, description);
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  }, [applicationCode, uploadDocument]);

  const deleteDocument = useCallback(async (document: SubcollectionDocument) => {
    if (!applicationCode || !document.documentId) return;
    try {
      await deleteDocumentFromSubcollection(applicationCode, document.documentId);
          await refreshData();
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }, [applicationCode, refreshData]);

  useEffect(() => {
    if (!appLoading && !docsLoading && appData) {
      setApplication({
        ...appData,
        principalInvestigator: appData.principalInvestigator || appData.proponent?.name || "",
        adviser: appData.adviser || appData.proponent?.advisor || "",
        courseProgram: appData.courseProgram || appData.proponent?.courseProgram || "",
        emailAddress: appData.email || appData.proponent?.email || "",
        researchTitle: appData.researchTitle || appData.protocolDetails?.researchTitle || "",
        submissionDate: appData.submissionDate || appData.proponent?.submissionDate || "",
      });
        if (options.includeDocuments && docsData && docsData.length > 0) {
        setDocuments(docsData as SubcollectionDocument[]);
      } else {
        setDocuments([]);
      }
    }
  }, [appData, docsData, appLoading, docsLoading, options.includeDocuments]);
  
  useEffect(() => {
    const storage = getStorage();
    const newDocumentURLs = new Map<string, string>();
    const newDocumentBlobs = new Map<string, Blob>();
    documents.forEach(async (doc) => {
      if (doc.storagePath) {
        try {
          const docRef = ref(storage, doc.storagePath);
          try {
            const url = await getDownloadURL(docRef);
            newDocumentURLs.set(doc.storagePath, url);
          } catch (urlError) {
            console.error(`Error getting download URL for ${doc.storagePath}:`, urlError);
          }
        } catch (error) {
          console.error(`Error processing document ${doc.storagePath}:`, error);
        }
      } else if (doc.downloadLink) {
        newDocumentURLs.set(doc.storagePath || doc.title, doc.downloadLink);
      }
    });
    setDocumentURLs(newDocumentURLs);
    setDocumentBlobs(newDocumentBlobs);
  }, [documents]);

  const error = useMemo(() => appError || docsError, [appError, docsError]);
  const isLoading = useMemo(() => appLoading || docsLoading, [appLoading, docsLoading]);

  return {
    application,
    documents,
    documentBlobs,
    isLoading,
    error,
    getDocumentURL,
    refreshData,
    uploadDocument,
    updateDocumentStatus: updateDocumentStatusHandler,
    downloadDocument,
    addDocument: addDocumentHandler,
    deleteDocument
  };
};

/**
 * Class-based service for tracking applications
 */
export class TrackingService {
  private static instance: TrackingService;
  
  private constructor() {}
  
  /**
   * Get the singleton instance of the TrackingService
   */
  public static getInstance(): TrackingService {
    if (!TrackingService.instance) {
      TrackingService.instance = new TrackingService();
    }
    return TrackingService.instance;
  }
  
  /**
   * Get application data
   */
  public async getApplication(applicationCode: string): Promise<any> {
    const applicationService = ApplicationService.getInstance();
    const { application } = await applicationService.fetchApplicationWithDocuments(applicationCode);
    
    // Transform the data to match our Application type
    return {
      applicationCode: applicationCode,
      spupRecCode: application.spupRecCode || '',
      principalInvestigator: application.proponent?.name || application.principalInvestigator || '',
      submissionDate: application.proponent?.submissionDate 
        ? new Date(application.proponent.submissionDate.seconds * 1000).toISOString() 
        : application.submissionDate || new Date().toISOString(),
      researchTitle: application.protocolDetails?.researchTitle || application.researchTitle || '',
      adviser: application.proponent?.advisor || application.adviser || '',
      courseProgram: application.proponent?.courseProgram || application.courseProgram || '',
      emailAddress: application.proponent?.email || application.emailAddress || '',
      progress: application.progress || 'SC',
      status: application.applicationStatus === 'On-going review' ? 'OR' :
             application.applicationStatus === 'Approved' ? 'A' :
             application.applicationStatus === 'Completed' ? 'C' :
             application.applicationStatus === 'Terminated' ? 'T' : 'OR',
      funding: application.fundingType === 'Researcher-funded' ? 'R' :
              application.fundingType === 'Institution-funded' ? 'I' :
              application.fundingType === 'Agency-funded' ? 'A' :
              application.fundingType === 'Pharmaceutical-funded' ? 'D' :
              'O',
      typeOfResearch: application.researchType === 'Experimental' ? 'EX' : 'SR',
      documents: application.documents?.map((doc: any) => ({
        name: doc.displayName || doc.name || formatDocumentName(doc.fileName || ''),
        status: doc.status as SubcollectionDocument['status'] || 'Submitted',
        downloadLink: doc.downloadLink || '',
        requestReason: doc.requestReason || '',
        fileName: doc.fileName || '',
        storagePath: doc.storagePath || '',
        documentId: doc.documentId || '',
        version: doc.version || '',
        displayName: doc.displayName || doc.name || formatDocumentName(doc.fileName || '')
      })) || [],
      initialReview: {
        date: application.reviewDates?.initialReview 
          ? new Date(application.reviewDates.initialReview.seconds * 1000).toISOString()
          : '',
        decision: application.reviewDecisions?.initialReview || '',
        feedback: application.reviewFeedback?.initialReview || '',
        additionalDocumentsRequested: application.additionalDocuments?.map((doc: any) => ({
          name: doc.name,
          status: 'Review Required' as SubcollectionDocument['status'],
          downloadLink: '',
          requestReason: doc.reason || doc.requestReason
        })) || []
      },
      resubmission: {
        date: application.reviewDates?.resubmission 
          ? new Date(application.reviewDates.resubmission.seconds * 1000).toISOString()
          : '',
        count: application.resubmissionCount || 0,
        status: application.resubmissionStatus || '',
        decision: application.reviewDecisions?.resubmission || '',
        history: application.resubmissionHistory?.map((item: any) => ({
          date: item.date ? new Date(item.date.seconds * 1000).toISOString() : '',
          status: item.status || '',
          decision: item.decision || '',
          feedback: item.feedback || ''
        })) || []
      },
      approved: {
        date: application.reviewDates?.approved
          ? new Date(application.reviewDates.approved.seconds * 1000).toISOString()
          : '',
        certificateUrl: application.certificateUrl || '',
      },
      progressReport: {
        date: application.reportDates?.progress
          ? new Date(application.reportDates.progress.seconds * 1000).toISOString()
          : '',
        reportUrl: application.reportUrls?.progress || '',
        submissionCount: application.progressReportCount || 0,
        lastReportUrl: application.lastProgressReportUrl || ''
      },
      finalReport: {
        date: application.reportDates?.final
          ? new Date(application.reportDates.final.seconds * 1000).toISOString()
          : '',
        reportUrl: application.reportUrls?.final || ''
      },
      archiving: {
        date: application.reviewDates?.archived
          ? new Date(application.reviewDates.archived.seconds * 1000).toISOString()
          : '',
        notificationUrl: application.notificationUrls?.archived || ''
      },
      hasAdditionalDocumentsRequest: application.hasAdditionalDocumentsRequest || false
    };
  }
}

// Export singleton instance
export const trackingService = TrackingService.getInstance(); 