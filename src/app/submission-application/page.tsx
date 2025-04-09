'use client';

import { useState, useEffect } from "react";
import { ApplicationInformation } from "@/components/proponent/submission-application/ApplicationInformation";
import { ApplicationDocuments } from "@/components/proponent/submission-application/ApplicationDocuments";
import { SuccessModal } from "@/components/proponent/submission-application/SuccessModal";
import { DuplicateConfirmationModal } from "@/components/proponent/submission-application/DuplicateConfirmationModal";
import { ProponentHeader } from "@/components/proponent/shared/ProponentHeader";
import { Button } from "@/components/ui/button";
import { useSubmitApplication } from "@/hooks/useApplicationData";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { 
  ApplicationFormData, 
  DocumentFiles,
  DuplicateCheckResult,
  ExtendedApplicationFormData
} from "@/types";

export default function SubmissionPage() {
  const [formData, setFormData] = useState<ExtendedApplicationFormData>({
    principalInvestigator: "",
    researchTitle: "",
    adviser: "",
    courseProgram: "",
    email: "",
    coResearchers: [],
  });

  const [documentFiles, setDocumentFiles] = useState<DocumentFiles>({
    form07A: null,
    form07B: null,
    form07C: null,
    researchProposal: null,
    minutesOfProposalDefense: null,
    abstract: null,
    curriculumVitae: null,
    questionnaires: null,
    technicalReview: null,
  });

  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  // Use our optimized hook for submission
  const { submitApplication, isSubmitting, error: submissionError, result } = useSubmitApplication();
  
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [applicationCode, setApplicationCode] = useState("");
  const [duplicateApplications, setDuplicateApplications] = useState<DuplicateCheckResult["existingApplications"]>([]);
  
  // Upload progress
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  // Check authentication status
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserEmail(user.email);
        setIsLoggedIn(true);
        
        // Pre-fill email field if available
        if (user.email && !formData.email) {
          setFormData(prev => ({
            ...prev,
            email: user.email || ""
          }));
        }
      } else {
        setUserEmail(null);
        setIsLoggedIn(false);
        // Redirect to login if not authenticated
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router, formData.email]);

  const handleFormDataChange = (data: ExtendedApplicationFormData) => {
    setFormData(data);
  };

  const handleDocumentsChange = (files: DocumentFiles) => {
    setDocumentFiles(files);
  };

  const handleSubmit = async () => {
    // Reset any previous errors and progress
    setError(null);
    setUploadProgress(0);
    setUploadStatus("");

    // Validate required fields
    if (!formData.principalInvestigator || 
        !formData.researchTitle || 
        !formData.adviser || 
        !formData.courseProgram || 
        !formData.email) {
      setError("Please fill in all required information fields.");
      return;
    }

    // Validate required documents
    if (!documentFiles.form07A || 
        !documentFiles.form07B || 
        !documentFiles.form07C || 
        !documentFiles.researchProposal || 
        !documentFiles.minutesOfProposalDefense || 
        !documentFiles.questionnaires) {
      setError("Please upload all required documents (Form 07A, Form 07B, Form 07C, Research Proposal, Minutes of Proposal Defense, and Questionnaires).");
      return;
    }

    // Simulate upload progress for better user experience
    setUploadStatus("Preparing files...");
    
    // Start progress animation
    let progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return prev;
        }
        
        // Update status messages based on progress
        if (prev === 10) setUploadStatus("Zipping documents...");
        else if (prev === 30) setUploadStatus("Uploading to secure storage...");
        else if (prev === 60) setUploadStatus("Processing submission...");
        else if (prev === 85) setUploadStatus("Finalizing application...");
        
        return prev + 5;
      });
    }, 500);

    // Directly proceed with submission - duplicate check is handled by the hook
    try {
      const result = await submitApplication(formData, documentFiles);
      
      // If we got here, submission was successful
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus("Submission complete!");
      
      // Short delay before showing success modal for UX
      setTimeout(() => {
        setApplicationCode(result.applicationCode);
        setIsSuccessModalOpen(true);
      }, 500);
    } catch (err) {
      // Clear the progress interval
      clearInterval(progressInterval);
      
      // Check if this is a duplicate error from the hook
      if (err instanceof Error && err.message.includes("similar application already exists")) {
        // This is a duplicate error
        setIsDuplicateModalOpen(true);
      } else {
        // Other errors are handled by the submission hook and displayed via submissionError
        console.error("Error submitting application:", err);
      }
    }
  };

  // Function to handle user's decision to continue despite duplicates
  const handleContinueAnyway = async () => {
    setIsDuplicateModalOpen(false);
    setUploadProgress(0);
    setUploadStatus("Preparing forced submission...");
    
    // Start progress animation
    let progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 5;
      });
    }, 300);
    
    try {
      // Force submission by bypassing duplicate check
      const result = await submitApplication({
        ...formData,
        _bypassDuplicateCheck: true // Special flag to bypass duplicate check
      }, documentFiles);
      
      // Clear interval and complete progress
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus("Submission complete!");
      
      // Short delay before showing success modal
      setTimeout(() => {
        setApplicationCode(result.applicationCode);
        setIsSuccessModalOpen(true);
      }, 500);
    } catch (err) {
      // Clear the progress interval
      clearInterval(progressInterval);
      console.error("Error during forced submission:", err);
      setError("An error occurred while submitting your application. Please try again.");
    }
  };

  // Function to handle user's decision to cancel the submission
  const handleCancelSubmission = () => {
    setIsDuplicateModalOpen(false);
  };

  // Show error from either local state or from the submission hook
  const displayError = error || (submissionError?.message || null);

  if (!isLoggedIn) {
    return <div className="p-8 text-center">Redirecting to login...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <ProponentHeader 
        title="Protocol Review Application" 
        subtitle="Submit your research protocol for ethics review"
        currentPage="Submission"
      />

      {displayError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-8">
        <ApplicationInformation 
          onFormDataChange={handleFormDataChange} 
          isSubmitting={isSubmitting || isChecking}
        />
        
        <ApplicationDocuments 
          onDocumentsChange={handleDocumentsChange} 
          isSubmitting={isSubmitting || isChecking}
        />
        
        {(isSubmitting || uploadProgress > 0) && (
          <div className="space-y-2">
            <Progress value={uploadProgress} className="h-2 w-full" />
            <p className="text-sm text-muted-foreground text-center">{uploadStatus}</p>
          </div>
        )}
        
        <div className="flex justify-end">
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || isChecking} 
            size="lg"
            className="px-8"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </div>
      </div>

      <SuccessModal 
        isOpen={isSuccessModalOpen}
        applicationCode={applicationCode}
        onClose={() => setIsSuccessModalOpen(false)}
      />

      <DuplicateConfirmationModal
        isOpen={isDuplicateModalOpen}
        duplicates={duplicateApplications || []}
        onClose={handleCancelSubmission}
        onContinue={handleContinueAnyway}
      />
    </div>
  );
}
  