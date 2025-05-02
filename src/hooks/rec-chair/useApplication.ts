/**
 * Hook for fetching and managing application data
 */
import { useState, useEffect } from "react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Application, Reviewer } from "@/types/rec-chair";

export const useApplication = (applicationId: string) => {
  const [application, setApplication] = useState<Application | null>(null);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFirstView, setIsFirstView] = useState(false);

  // Fetch application and reviewers data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (!applicationId) {
          setError(new Error("Application ID is required"));
          return;
        }

        // Fetch application data
        const applicationRef = doc(db, "protocolReviewApplications", applicationId);
        const applicationSnap = await getDoc(applicationRef);

        if (applicationSnap.exists()) {
          const data = applicationSnap.data();
          const applicationData = {
            id: applicationSnap.id,
            applicationCode: data.applicationCode || applicationSnap.id,
            spupRecCode: data.recCode || "",
            recCode: data.recCode || "",
            principalInvestigator: data.proponent?.name || "",
            submissionDate: data.proponent?.submissionDate || null,
            courseProgram: data.proponent?.courseProgram || "",
            title: data.protocolDetails?.researchTitle || "Untitled Protocol",
            status: data.applicationStatus || "Pending",
            researchType: data.typeOfResearch || "Social/Behavioral Research",
            adviser: data.proponent?.advisor || "",
            email: data.proponent?.email || "",
            funding: data.funding || "",
            progress: data.reviewProgress?.submissionCheck ? 'SC' : 
                     data.reviewProgress?.initialReview ? 'IR' : 
                     data.reviewProgress?.resubmission ? 'RS' :
                     data.reviewProgress?.approved ? 'AP' : 'SC',
            coInvestigators: data.coInvestigators || [],
            abstract: data.abstract || "",
            keywords: data.keywords || [],
            // Map documents - handle different structures
            documents: Array.isArray(data.documents) ? data.documents : 
                      data.attachments ? Object.keys(data.attachments).map(key => ({
                        type: key,
                        name: data.attachments[key].name || key,
                        url: data.attachments[key].url || "",
                        uploadDate: data.attachments[key].timestamp || null,
                        status: data.attachments[key].status || "pending" as "pending"
                      })) : [],
            reviewers: data.reviewers || [],
            comments: data.comments || []
          } as Application;
          
          // Check if this is the first view (no SPUP REC code assigned)
          setIsFirstView(!applicationData.spupRecCode);
          setApplication(applicationData);
        } else {
          setError(new Error(`No application found with ID: ${applicationId}`));
          setApplication(null);
          setIsFirstView(false);
        }

        // Fetch reviewers data
        const reviewersCollection = collection(db, "reviewers");
        const reviewersSnapshot = await getDocs(reviewersCollection);
        
        if (!reviewersSnapshot.empty) {
          const reviewersData = reviewersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Reviewer[];
          
          setReviewers(reviewersData);
        } else {
          setReviewers([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error as Error);
        setApplication(null);
        setReviewers([]);
        setIsFirstView(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [applicationId]);

  // Function to refresh the application data
  const refreshApplication = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!applicationId) {
        setError(new Error("Application ID is required"));
        return;
      }

      const applicationRef = doc(db, "protocolReviewApplications", applicationId);
      const applicationSnap = await getDoc(applicationRef);

      if (applicationSnap.exists()) {
        const data = applicationSnap.data();
        setApplication({
          id: applicationSnap.id,
          applicationCode: data.applicationCode || applicationSnap.id,
          spupRecCode: data.recCode || "",
          recCode: data.recCode || "",
          principalInvestigator: data.proponent?.name || "",
          submissionDate: data.proponent?.submissionDate || null,
          courseProgram: data.proponent?.courseProgram || "",
          title: data.protocolDetails?.researchTitle || "Untitled Protocol",
          status: data.applicationStatus || "Pending",
          researchType: data.typeOfResearch || "Social/Behavioral Research",
          adviser: data.proponent?.advisor || "",
          email: data.proponent?.email || "",
          funding: data.funding || "",
          progress: data.reviewProgress?.submissionCheck ? 'SC' : 
                   data.reviewProgress?.initialReview ? 'IR' : 
                   data.reviewProgress?.resubmission ? 'RS' :
                   data.reviewProgress?.approved ? 'AP' : 'SC',
          coInvestigators: data.coInvestigators || [],
          abstract: data.abstract || "",
          keywords: data.keywords || [],
          documents: Array.isArray(data.documents) ? data.documents : 
                    data.attachments ? Object.keys(data.attachments).map(key => ({
                      type: key,
                      name: data.attachments[key].name || key,
                      url: data.attachments[key].url || "",
                      uploadDate: data.attachments[key].timestamp || null,
                      status: data.attachments[key].status || "pending" as "pending"
                    })) : [],
          reviewers: data.reviewers || [],
          comments: data.comments || []
        } as Application);
      } else {
        setError(new Error(`No application found with ID: ${applicationId}`));
        setApplication(null);
      }
    } catch (error) {
      console.error("Error refreshing application data:", error);
      setError(error as Error);
    } finally {
      setLoading(false);
    }
  };

  // Function to update the application state
  const updateApplication = (updatedApplication: Application) => {
    setApplication(updatedApplication);
  };

  return { 
    application, 
    reviewers, 
    loading, 
    error, 
    isFirstView, 
    refreshApplication, 
    updateApplication 
  };
}; 