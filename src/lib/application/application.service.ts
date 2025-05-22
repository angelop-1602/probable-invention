import { getFirestore, doc, getDoc, collection, query, where, getDocs, setDoc, Timestamp, onSnapshot } from "firebase/firestore";
import { 
  DocumentFiles,
  ApplicationFormData, 
  SubmissionResult,
  DuplicateCheckResult,
} from './application.types';
import { generateApplicationCode } from "./application.utils";
import {
  getCollectionWithCache,
  listenToDocumentWithCache,
  cleanupCache as cleanupDataCache
} from "@/lib/firebase/firestore-cache";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Application service for handling protocol review applications
 */
export class ApplicationService {
  private static instance: ApplicationService;
  private db: any;
  
  private constructor() {
    this.db = getFirestore();
  }
  
  /**
   * Get the singleton instance of the ApplicationService
   */
  public static getInstance(): ApplicationService {
    if (!ApplicationService.instance) {
      ApplicationService.instance = new ApplicationService();
    }
    return ApplicationService.instance;
  }

  /**
   * Check if a principal investigator or research title already exists in the database
   * @param principalInvestigator Principal investigator name
   * @param researchTitle Research title
   * @returns Result with flag indicating if duplicate exists and details of matching applications
   */
  public async checkForDuplicateSubmission(
    principalInvestigator: string,
    researchTitle: string
  ): Promise<DuplicateCheckResult> {
    try {
      const result: DuplicateCheckResult = {
        isDuplicate: false,
        existingApplications: []
      };

      // Use caching service to query for duplicates
      // Get by name
      const nameData = await getCollectionWithCache(
        "protocolReviewApplications",
        (ref: any) => {
          return query(ref, where("proponent.name", "==", principalInvestigator));
        }
      );
      
      // Get by title
      const titleData = await getCollectionWithCache(
        "protocolReviewApplications",
        (ref: any) => {
          return query(ref, where("protocolDetails.researchTitle", "==", researchTitle));
        }
      );

      // Process name query results
      nameData.forEach((doc: any) => {
        result.existingApplications.push({
          applicationCode: doc.id,
          principalInvestigator: doc.proponent.name,
          researchTitle: doc.protocolDetails.researchTitle,
          submissionDate: new Date(doc.proponent.submissionDate.seconds * 1000)
        });
      });

      // Process title query results
      titleData.forEach((doc: any) => {
        // Check if we've already added this result from the name query
        const alreadyAdded = result.existingApplications.some(
          app => app.applicationCode === doc.id
        );
        
        if (!alreadyAdded) {
          result.existingApplications.push({
            applicationCode: doc.id,
            principalInvestigator: doc.proponent.name,
            researchTitle: doc.protocolDetails.researchTitle,
            submissionDate: new Date(doc.proponent.submissionDate.seconds * 1000)
          });
        }
      });

      // If we found any matches, set isDuplicate to true
      if (result.existingApplications.length > 0) {
        result.isDuplicate = true;
      }

      return result;
    } catch (error) {
      console.error("Error checking for duplicate submission:", error);
      throw error;
    }
  }

  /**
   * Submit a protocol application with documents
   * @param formData Form data for the application
   * @param documents Object containing document files
   * @param onProgress Optional progress callback (step, percent)
   * @returns Result with application code
   */
  public async submitProtocolApplication(
    formData: ApplicationFormData,
    documents: DocumentFiles = {},
    onProgress?: (step: string, percent: number) => void
  ): Promise<SubmissionResult> {
    try {
      const submissionDate = Timestamp.now();
      const applicationCode = await generateApplicationCode();
      
      // Create application document
      const applicationData = {
        applicationCode,
        applicationStatus: "", // e.g. "pending", "under_review", etc.
        createdAt: submissionDate,
        updatedAt: submissionDate,
        decision: "",
        funding: "",
        hasMessages: false,
        lastMessageAt: null,
        progress: "",
        progressDetails: "",
        submittedBy: formData.email || "",
        currentTab: "Initial",
        archived: false,
        proponent: {
          name: formData.principalInvestigator || "",
          email: formData.email || "",
          advisor: formData.adviser || "",
          courseProgram: formData.courseProgram || "",
          submissionDate,
        },
        protocolDetails: {
          researchTitle: formData.researchTitle || "",
          recCode: "",
          researchType: formData.researchType || "",
        },
        reviewProgress: {
          submissionCheck: "",
          reviewType: "",
          status: "",
          updatedAt: submissionDate,
        }
      };
      
      // Save application data to Firestore
      const applicationRef = doc(this.db, "protocolReviewApplications", applicationCode);
      await setDoc(applicationRef, applicationData);
      
      // Create and upload zip file for each document
      if (documents && Object.keys(documents).length > 0) {
        if (onProgress) onProgress("Zipping and uploading documents...", 10);
        const storage = getStorage();
        for (const [fieldKey, value] of Object.entries(documents)) {
          if (value && value.files && value.files.length > 0) {
            const file = value.files[0];
            // Create a ZIP for this document
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();
            zip.file(file.name, file);
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const zipFileName = `${fieldKey}.zip`;
            const storagePath = `protocolReviewApplications/${applicationCode}/documents/${zipFileName}`;
            const storageRef = ref(storage, storagePath);
            await uploadBytes(storageRef, zipBlob);
            const downloadUrl = await getDownloadURL(storageRef);
            // Save Firestore metadata for this document
            const docMeta: any = {
              title: value.title || fieldKey,
              fileName: file.name,
              documentType: 'submission_zip',
              storagePath,
              downloadLink: downloadUrl,
              fieldKey,
              status: 'pending',
              version: 1,
            };
            await addDocumentReference(applicationCode, docMeta);
      }
        }
      }
      if (onProgress) onProgress("Finalizing...", 90);
      return {
        applicationCode,
        success: true
      };
    } catch (error) {
      console.error("Error submitting protocol application:", error);
      throw error;
    }
  }

  /**
   * Listen to application updates
   * @param applicationCode - Application code
   * @param onDataUpdate - Callback for data updates
   * @param onDocumentsUpdate - Callback for document updates
   * @returns Array of unsubscribe functions
   */
  public listenToApplicationUpdates(
    applicationCode: string,
    onDataUpdate: (data: any) => void,
    onDocumentsUpdate: (files: Map<string, Blob>) => void
  ): (() => void)[] {
    const unsubscribers: (() => void)[] = [];
    
    // Listen to application data updates using cache
    const dataUnsubscribe = listenToDocumentWithCache(
      `protocolReviewApplications/${applicationCode}`,
      onDataUpdate
    );
    unsubscribers.push(dataUnsubscribe);
    
    // Listen to documents subcollection
    const documentsRef = collection(this.db, 'protocolReviewApplications', applicationCode, 'documents');
    const documentsListener = onSnapshot(documentsRef, async (snapshot) => {
      const files = new Map<string, Blob>();
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.storagePath) {
          try {
            const response = await fetch(data.downloadLink);
            const blob = await response.blob();
            files.set(data.storagePath, blob);
            } catch (error) {
            console.error("Error fetching document file:", error);
          }
        }
      }
      
      onDocumentsUpdate(files);
    });
    
    unsubscribers.push(documentsListener);
    
    return unsubscribers;
  }

  /**
   * Get application by code
   * @param applicationCode Application code to fetch
   * @returns Application data
   */
  public async getApplicationByCode(applicationCode: string): Promise<any> {
    try {
      const applicationRef = doc(this.db, "protocolReviewApplications", applicationCode);
      const applicationSnap = await getDoc(applicationRef);
      
      if (applicationSnap.exists()) {
        return { id: applicationSnap.id, ...applicationSnap.data() };
      }
      
      throw new Error(`Application with code ${applicationCode} not found`);
    } catch (error) {
      console.error(`Error getting application with code ${applicationCode}:`, error);
      throw error;
    }
  }

  /**
   * Get applications by email address
   * @param email Email address of the proponent
   * @returns Array of application data
   */
  public async getApplicationsByEmail(email: string): Promise<any[]> {
    try {
      const applicationsRef = collection(this.db, "protocolReviewApplications");
      const applicationsQuery = query(applicationsRef, where("proponent.email", "==", email));
      const applicationsSnap = await getDocs(applicationsQuery);
      
      const applications = applicationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return applications;
    } catch (error) {
      console.error(`Error getting applications for email ${email}:`, error);
      throw error;
    }
  }

  /**
   * Clean up all caches
   * @param maxAge - Maximum age of cache entries in milliseconds
   */
  public async cleanupCaches(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      // Clean up the data cache
      await cleanupDataCache(maxAge);
    } catch (error) {
      console.error("Error cleaning up caches:", error);
    }
  }

  /**
   * Track application status for real-time updates
   * @param applicationCode Application code to track
   * @param onUpdate Callback for status updates
   * @returns Unsubscribe function
   */
  public trackApplicationStatus(
    applicationCode: string,
    onUpdate: (status: any) => void
  ): () => void {
    const applicationRef = doc(this.db, "protocolReviewApplications", applicationCode);
    
    // Listen for application updates
    return onSnapshot(applicationRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Extract status information
        const statusInfo = {
          status: data.applicationStatus || "On-going review",
          progress: data.reviewProgress || {},
          initialReview: data.initialReview || null,
          resubmission: data.resubmission || null,
          approved: data.approved || null,
          documents: data.documents || []
        };
        
        onUpdate(statusInfo);
      } else {
        console.error(`Application ${applicationCode} not found`);
      }
    });
  }

  /**
   * Fetch application data and documents from Firebase
   * @param applicationCode - The unique application code
   * @returns Object containing application and documents data
   */
  public async fetchApplicationWithDocuments(applicationCode: string) {
    try {
      // Get application data from Firestore
    const applicationRef = doc(this.db, "protocolReviewApplications", applicationCode);
      const applicationDoc = await getDoc(applicationRef);
    
      if (!applicationDoc.exists()) {
        throw new Error("Application not found");
      }

      const appData = applicationDoc.data();
    
      // Get documents from subcollection
      const documents = await getDocuments(applicationCode);
        
        return {
        application: appData,
        documents
      };
    } catch (error) {
      console.error("Error fetching application with documents:", error);
      throw error;
    }
  }
} 