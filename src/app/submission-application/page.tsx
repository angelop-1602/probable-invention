'use client';

import { useState } from "react";
import { ApplicationInformation } from "@/components/proponent/submission-application/ApplicationInformation";
import ApplicationDocuments from "@/components/proponent/submission-application/ApplicationDocuments";
import { SuccessModal } from "@/components/proponent/submission-application/SuccessModal";
import { DuplicateConfirmationModal } from "@/components/proponent/submission-application/DuplicateConfirmationModal";
import { ProponentHeader } from "@/components/proponent/shared/ProponentHeader";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";

// Mock types for UI demonstration
interface ExtendedApplicationFormData {
  principalInvestigator: string;
  adviser: string;
  courseProgram: string;
  protocolDetails: {
    researchTitle: string;
  };
  proponent: {
    email: string;
  };
}

export default function SubmissionPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ExtendedApplicationFormData>({
    principalInvestigator: '',
    adviser: '',
    courseProgram: '',
    protocolDetails: {
      researchTitle: ''
    },
    proponent: {
      email: ''
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [applicationCode, setApplicationCode] = useState("");

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder for submission logic
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setApplicationCode("DEMO123");
      setShowSuccessModal(true);
    }, 2000);
  };

  const handleDuplicateConfirm = () => {
    setShowDuplicateModal(false);
    // Placeholder for duplicate confirmation logic
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <ProponentHeader 
        title="Submit Protocol for Review" 
        subtitle="Complete the application form and upload required documents"
      />

      {error && (
        <Alert variant="destructive" className="mb-6 mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-8 pt-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {currentStep === 1 ? "Protocol Review Application Information" : "Protocol Review Application Documents"}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Step {currentStep} of 2</span>
            <Progress value={currentStep * 50} className="w-[100px]" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {currentStep === 1 ? (
            <ApplicationInformation
              formData={formData}
              onChange={(data) => setFormData(data)}
            />
          ) : (
            <ApplicationDocuments onDocumentsChange={function (documents: Document): void {
                throw new Error("Function not implemented.");
              } } isSubmitting={false} />
          )}

          <div className="flex justify-between pt-6">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                Previous
              </Button>
            )}
            {currentStep < 2 ? (
              <Button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="ml-auto"
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                className="ml-auto"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            )}
          </div>
        </form>
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        applicationCode={applicationCode}
      />

      <DuplicateConfirmationModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        onConfirm={handleDuplicateConfirm}
      />
    </div>
  );
}
  