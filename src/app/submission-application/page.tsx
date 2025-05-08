'use client';

import { useState, useEffect } from "react";
import { ApplicationInformation } from "@/components/proponent/submission-application/ApplicationInformation";
import ApplicationDocuments from "@/components/proponent/submission-application/ApplicationDocuments";
import { SuccessModal } from "@/components/proponent/submission-application/SuccessModal";
import { DuplicateConfirmationModal } from "@/components/proponent/submission-application/DuplicateConfirmationModal";
import { ProponentHeader } from "@/components/proponent/shared/ProponentHeader";
import { Button } from "@/components/ui/button";
import useApplicationData from '@/hooks/application/useApplicationData';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { filterFilledDocuments } from "@/lib/documents/document-utils";
import { 
  ExtendedApplicationFormData,
  ApplicationFormValues
} from "@/types";
import type { UseApplicationDataResult } from '@/hooks/application/useApplicationData';
import type { ApplicationFormData, DocumentFiles, DuplicateCheckResult } from '@/lib/application/application.types';

function toApplicationFormData(formData: ExtendedApplicationFormData): ApplicationFormData {
  return {
    principalInvestigator: formData.principalInvestigator,
    email: formData.proponent.email,
    adviser: formData.adviser,
    courseProgram: formData.courseProgram,
    researchTitle: formData.protocolDetails.researchTitle,
    _bypassDuplicateCheck: formData._bypassDuplicateCheck,
    // Add any other flat fields as needed
  };
}

export default function SubmissionPage() {
  const [formValues, setFormValues] = useState<ApplicationFormValues>({
    principalInvestigator: "",
    adviser: "",
    courseProgram: "",
    fundingType: "Researcher-funded",
    researchType: "Experimental",
    researchTitle: "",
    proponentName: "",
    proponentEmail: "",
    proponentAdvisor: "",
    proponentCourseProgram: "",
    notificationEmail: true,
    notificationSms: false,
    faqAcknowledged: false,
    coResearchers: [],
  });

  const [formData, setFormData] = useState<ExtendedApplicationFormData>({
    // Basic Information
    applicationStatus: "Draft",
    createdAt: new Date(),
    updatedAt: new Date(),

    // Principal Investigator Information
    principalInvestigator: formValues.principalInvestigator,
    adviser: formValues.adviser,
    courseProgram: formValues.courseProgram,
    fundingType: formValues.fundingType,
    researchType: formValues.researchType,

    // Protocol Details
    protocolDetails: {
      researchTitle: formValues.researchTitle,
    },

    // Proponent Information
    proponent: {
      name: formValues.proponentName,
      email: formValues.proponentEmail,
      advisor: formValues.proponentAdvisor,
      courseProgram: formValues.proponentCourseProgram,
      submissionDate: new Date(),
    },

    // Notification Preferences
    notificationPreferences: {
      email: formValues.notificationEmail,
      sms: formValues.notificationSms,
    },

    // Additional Fields
    faqAcknowledged: formValues.faqAcknowledged,

    // Required for ExtendedApplicationFormData
    coResearchers: formValues.coResearchers,
  });

  const [documentFiles, setDocumentFiles] = useState<DocumentFiles>({
    form07A: { files: [], title: "Form 07A: Protocol Review Application Form" },
    form07B: { files: [], title: "Form 07B: Adviser's Certification Form" },
    form07C: { files: [], title: "Form 07C: Informed Consent Template" },
    researchProposal: { files: [], title: "Research Proposal/Study Protocol" },
    minutesOfProposalDefense: { files: [], title: "Minutes of Proposal Defense" },
    abstract: { files: [], title: "Abstract" },
    curriculumVitae: { files: [], title: "Curriculum Vitae" },
    questionnaires: { files: [], title: "Questionnaires" },
    technicalReview: { files: [], title: "Technical Review" }
  });

  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  // Use our optimized hook for submission
  const {
    submitApplication,
    isLoading: isSubmitting,
    error: submissionError
  } = useApplicationData();
  
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [applicationCode, setApplicationCode] = useState("");
  const [duplicateApplications, setDuplicateApplications] = useState<DuplicateCheckResult["existingApplications"]>([]);
  
  // Upload progress
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  const [progressStep, setProgressStep] = useState<string>("");


  // Update formData when formValues change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      principalInvestigator: formValues.principalInvestigator,
      adviser: formValues.adviser,
      courseProgram: formValues.courseProgram,
      fundingType: formValues.fundingType,
      researchType: formValues.researchType,
      protocolDetails: {
        researchTitle: formValues.researchTitle,
      },
      proponent: {
        name: formValues.proponentName,
        email: formValues.proponentEmail,
        advisor: formValues.proponentAdvisor,
        courseProgram: formValues.proponentCourseProgram,
        submissionDate: new Date(),
      },
      notificationPreferences: {
        email: formValues.notificationEmail,
        sms: formValues.notificationSms,
      },
      faqAcknowledged: formValues.faqAcknowledged,
      coResearchers: formValues.coResearchers,
    }));
  }, [formValues]);

  const handleFormDataChange = (data: ApplicationFormValues) => {
    setFormValues(data);
  };

  const handleDocumentsChange = (newDocuments: DocumentFiles) => {
    setDocumentFiles(newDocuments);
  };

  const handleSubmit = async () => {
    setError(null);
    setUploadProgress(0);
    setUploadStatus("");
    setProgressStep("Validating files...");
    
    // Validate required form fields
    if (!formData.principalInvestigator || !formData.adviser || !formData.courseProgram || !formData.protocolDetails.researchTitle) {
      setError("Please fill in all required fields: Principal Investigator, Adviser, Course Program, and Research Title");
      return;
    }

    // Check for PDF only
    for (const [key, value] of Object.entries(documentFiles)) {
      const files = value.files || [];
      for (const file of files) {
        if (file.type !== 'application/pdf') {
          setError(`All files must be PDF. Problem with: ${value.title || key}`);
          return;
        }
      }
    }

    // 3. Progress: Zipping
    setProgressStep("Zipping documents...");
    setUploadStatus("Zipping documents...");
    setUploadProgress(10);

    // Use filterFilledDocuments to get only filled documents
    const documentFilesWithTitles = filterFilledDocuments(documentFiles);

    try {
      setProgressStep("Uploading to secure storage...");
      setUploadStatus("Uploading to secure storage...");
      setUploadProgress(40);

      // Transform formData to ApplicationFormData
      const appFormData: ApplicationFormData = toApplicationFormData(formData);

      // Pass this to the submission function
      const applicationCode = await submitApplication(
        appFormData,
        documentFilesWithTitles,
        (step: string, percent: number) => {
          setProgressStep(step);
          setUploadStatus(step);
          setUploadProgress(percent);
        }
      );

      setProgressStep("Saving application...");
      setUploadStatus("Saving application...");
      setUploadProgress(80);

      setUploadProgress(100);
      setUploadStatus("Submission complete!");
      setProgressStep("Submission complete!");
      setTimeout(() => {
        setApplicationCode(applicationCode);
        setIsSuccessModalOpen(true);
      }, 500);
    } catch (err) {
      setUploadProgress(0);
      setProgressStep("");
      setUploadStatus("");
      setError(err instanceof Error ? err.message : "An unexpected error occurred during submission");
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
      // Use filterFilledDocuments for forced submission as well
      const documentFilesWithTitles = filterFilledDocuments(documentFiles);
      
      // Force submission by bypassing duplicate check
      const appFormData: ApplicationFormData = {
        ...toApplicationFormData(formData),
        _bypassDuplicateCheck: true
      };
      const applicationCode = await submitApplication(appFormData, documentFilesWithTitles);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus("Submission complete!");
      setTimeout(() => {
        setApplicationCode(applicationCode);
        setIsSuccessModalOpen(true);
      }, 500);
    } catch (err) {
      clearInterval(progressInterval);
      setError(typeof err === 'object' && err !== null && 'message' in err 
        ? (err as any).message 
        : "An unexpected error occurred during forced submission");
    }
  };

  // Function to handle user's decision to cancel the submission
  const handleCancelSubmission = () => {
    setIsDuplicateModalOpen(false);
  };

  // Show error from either local state or from the submission hook
  const displayError = error || (typeof submissionError === 'object' && submissionError && 'message' in submissionError
    ? (submissionError as any).message
    : submissionError);


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
  