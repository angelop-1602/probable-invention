'use client';

import { useState, useEffect } from "react";
import { ApplicationInformation } from "@/components/proponent/submission-application/ApplicationInformation";
import ApplicationDocuments from "@/components/proponent/submission-application/ApplicationDocuments";
import { SuccessModal } from "@/components/proponent/submission-application/SuccessModal";
import { DuplicateConfirmationModal } from "@/components/proponent/submission-application/DuplicateConfirmationModal";
import { ProponentHeader } from "@/components/proponent/shared/ProponentHeader";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { useProponentAuth } from "@/hooks/use-proponent-auth";
import { SubmissionFormData, SubmissionStatus } from "@/lib/submission/submission.types";
import { SubmissionService } from "@/lib/submission/submission.service";
import { submissionSchema } from "@/lib/submission/submission.validation";
import { validateSubmissionForm, getValidationSummary } from "@/lib/utils";
import { toast } from "sonner";

interface DocumentFile {
  [key: string]: {
    files: File[];
    title: string;
  };
}

interface DuplicateApplication {
  id: string;
  spup_rec_code?: string;
  protocol_title: string;
  principal_investigator_name: string;
  submission_date: string;
  status: string;
}

export default function SubmissionPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<SubmissionFormData>>({});
  const [documents, setDocuments] = useState<DocumentFile>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateApplication[]>([]);
  const [applicationCode, setApplicationCode] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const router = useRouter();
  const { user } = useProponentAuth();

  // Initialize submission service
  const submissionService = SubmissionService.getInstance();

  useEffect(() => {
    // Initialize form data if user is available
    if (user) {
      const initializeData = async () => {
        try {
          const initialized = await submissionService.initializeSubmission(user.uid);
          setFormData(initialized.formData);
        } catch (error) {
          console.error('Failed to initialize submission:', error);
        }
      };

      initializeData();
    }
  }, [user]);

  // Auto-save form data
  useEffect(() => {
    const saveFormData = async () => {
      if (user && Object.keys(formData).length > 0) {
        try {
          await submissionService.saveStepData(user.uid, formData, currentStep, []);
        } catch (error) {
          console.error('Failed to cache form data:', error);
        }
      }
    };

    const timeoutId = setTimeout(saveFormData, 1000); // Debounce save
    return () => clearTimeout(timeoutId);
  }, [formData, user, currentStep]);

  const validateCurrentStep = (): { isValid: boolean; missingFields: string[]; errors: string[] } => {
    const errors: string[] = [];
    const missingFields: string[] = [];
    
    if (currentStep === 1) {
      // Check required fields for Step 1
      const requiredFields = [
        { 
          value: formData.general_information?.protocol_title?.trim(), 
          name: 'Protocol Title',
          field: 'general_information.protocol_title'
        },
        { 
          value: formData.general_information?.principal_investigator?.name?.trim(), 
          name: 'Principal Investigator Name',
          field: 'general_information.principal_investigator.name'
        },
        { 
          value: formData.general_information?.principal_investigator?.email?.trim(), 
          name: 'Principal Investigator Email',
          field: 'general_information.principal_investigator.email'
        },
        { 
          value: formData.general_information?.principal_investigator?.address?.trim(), 
          name: 'Principal Investigator Address',
          field: 'general_information.principal_investigator.address'
        },
        { 
          value: formData.general_information?.principal_investigator?.contact_number?.trim(), 
          name: 'Principal Investigator Contact',
          field: 'general_information.principal_investigator.contact_number'
        },
        { 
          value: formData.general_information?.principal_investigator?.position_institution?.trim(), 
          name: 'Principal Investigator Position',
          field: 'general_information.principal_investigator.position_institution'
        },
        { 
          value: formData.nature_and_type_of_study?.level, 
          name: 'Study Level',
          field: 'nature_and_type_of_study.level'
        },
        { 
          value: formData.nature_and_type_of_study?.type, 
          name: 'Study Type',
          field: 'nature_and_type_of_study.type'
        },
        { 
          value: formData.duration_of_study?.start_date, 
          name: 'Start Date',
          field: 'duration_of_study.start_date'
        },
        { 
          value: formData.duration_of_study?.end_date, 
          name: 'End Date',
          field: 'duration_of_study.end_date'
        },
        { 
          value: formData.participants?.type_and_description?.trim(), 
          name: 'Participant Description',
          field: 'participants.type_and_description'
        },
        { 
          value: formData.brief_description_of_study?.trim(), 
          name: 'Brief Description of Study',
          field: 'brief_description_of_study'
        }
      ];

      // Check for missing required fields
      requiredFields.forEach(field => {
        if (!field.value || (typeof field.value === 'string' && field.value.length === 0)) {
          missingFields.push(field.name);
          errors.push(`${field.name} is required`);
        }
      });

      // Email validation
      const email = formData.general_information?.principal_investigator?.email;
      if (email && !email.includes('@')) {
        missingFields.push('Valid Email Address');
        errors.push('Please enter a valid email address');
      }

      // Participants count validation
      if (!formData.participants?.number_of_participants || formData.participants.number_of_participants <= 0) {
        missingFields.push('Number of Participants');
        errors.push('Number of participants must be at least 1');
      }

      // Adviser validation
      const adviser = formData.general_information?.advisers?.[0]?.name?.trim();
      if (!adviser) {
        missingFields.push('Adviser Name');
        errors.push('At least one adviser is required');
      }

      // Date range validation
      const startDate = formData.duration_of_study?.start_date;
      const endDate = formData.duration_of_study?.end_date;
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end <= start) {
          missingFields.push('Valid Date Range');
          errors.push('End date must be after start date');
        }
      }

    } else if (currentStep === 2) {
      // For step 2, validate basic documents for progression only
      const basicRequiredDocs = [
        { id: 'advisers_certification', name: 'Adviser\'s Certification' },
        { id: 'research_proposal', name: 'Research Proposal' }
      ];

      const missingDocs = basicRequiredDocs.filter(doc => !documents[doc.id]?.files?.length);
      if (missingDocs.length > 0) {
        const docNames = missingDocs.map(doc => doc.name);
        missingFields.push(...docNames);
        errors.push(`Please upload these essential documents: ${docNames.join(', ')}`);
      }
    }

    // Only set global validation errors for step 2
    if (currentStep === 2) {
      setValidationErrors(errors);
    } else {
      setValidationErrors([]); // Clear any previous errors
    }
    
    return {
      isValid: errors.length === 0,
      missingFields,
      errors
    };
  };

  // Comprehensive validation for final submission
  const validateCompleteSubmission = (): boolean => {
    const validationResult = validateSubmissionForm(formData, documents);
    
    if (!validationResult.isValid) {
      const summaryMessage = getValidationSummary(validationResult);
      setValidationErrors(validationResult.errors.map(err => err.message));
      
      // Show detailed toast with all errors
      toast.error(summaryMessage, {
        duration: 10000, // Show for 10 seconds
        description: 'Please complete all required fields and documents before submitting.'
      });
      
      return false;
    }
    
    setValidationErrors([]);
    return true;
  };

  const checkForDuplicates = async (): Promise<DuplicateApplication[]> => {
    // TODO: Implement duplicate checking with Firebase query
    // For now, return empty array to skip duplicate checking
    return [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to submit an application');
      return;
    }

    // Use COMPREHENSIVE validation for final submission
    if (!validateCompleteSubmission()) {
      setError('Please fix all validation errors before submitting');
      toast.error('Please complete all required fields and upload all required documents');
      
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Check for duplicates
      const foundDuplicates = await checkForDuplicates();
      if (foundDuplicates.length > 0) {
        setDuplicates(foundDuplicates);
        setShowDuplicateModal(true);
        return;
      }

      await performSubmission();
      
    } catch (err: any) {
      setError(err.message || 'Failed to submit application. Please try again.');
      toast.error('Submission failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentsChange = (newDocuments: DocumentFile) => {
    setDocuments(newDocuments);
  };

  const performSubmission = async () => {
    setIsSubmitting(true);
    
    try {
      if (!user) {
        throw new Error('User authentication required');
      }

      // Convert DocumentFile format to DocumentUpload format
      const documentUploads: import('@/lib/submission/submission.types').DocumentUpload[] = [];
      
      Object.entries(documents).forEach(([documentId, docInfo]) => {
        docInfo.files.forEach((file, index) => {
          // Determine if it's basic or supplementary document
          const isBasicRequirement = [
            'informed_consent',
            'advisers_certification', 
            'research_proposal',
            'minutes_proposal_defense',
            'curriculum_vitae'
          ].includes(documentId);
          
          const isRequired = [
            'informed_consent',
            'advisers_certification',
            'research_proposal', 
            'minutes_proposal_defense',
            'curriculum_vitae',
            'abstract'
          ].includes(documentId);

          documentUploads.push({
            id: docInfo.files.length > 1 ? `${documentId}_${index}` : documentId,
            title: docInfo.title,
            file: file,
            required: isRequired,
            category: isBasicRequirement ? 'basic_requirements' : 'supplementary_documents'
          });
        });
      });

      // Upload documents first if any exist
      if (documentUploads.length > 0) {
        console.log('Uploading documents:', documentUploads.length);
        
        const uploadResult = await submissionService.uploadDocuments(
          user.uid,
          documentUploads,
          (progress, currentFile) => {
            setUploadProgress(progress);
            console.log(`Upload progress: ${progress}% - ${currentFile}`);
          }
        );

        if (!uploadResult.success) {
          throw new Error(uploadResult.errors?.join(', ') || 'Document upload failed');
        }

        console.log('Documents uploaded successfully');
      }

      // Add submitter UID to form data
      const submissionData: SubmissionFormData = {
        ...formData as SubmissionFormData,
        submitter_uid: user.uid,
        submission_date: new Date().toISOString(),
        status: 'submitted' as SubmissionStatus
      };

      // Update form data in cache with submission info
      await submissionService.saveStepData(user.uid, submissionData, 2, documentUploads);

      // Submit the application
      const result = await submissionService.submitApplication(user.uid);
      
      if (!result.success) {
        throw new Error(result.errors?.join(', ') || 'Submission failed');
      }
      
      setApplicationCode(result.id || result.spup_rec_code || result.applicationCode || '');
      setShowSuccessModal(true);
      
      toast.success('Application submitted successfully!');
      
    } catch (error: any) {
      console.error('Submission error:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleDuplicateConfirm = async () => {
    setShowDuplicateModal(false);
    try {
      await performSubmission();
    } catch (err: any) {
      setError(err.message || 'Failed to submit application. Please try again.');
      toast.error('Submission failed');
    }
  };

  const handleNext = () => {
    const validation = validateCurrentStep();
    
    if (validation.isValid) {
      setCurrentStep(currentStep + 1);
      toast.success('Step completed! Moving to next step.', {
        description: 'All required fields have been filled.',
        duration: 3000
      });
    } else {
      // Show toast with missing fields
      const fieldsList = validation.missingFields.length <= 3 
        ? validation.missingFields.join(', ')
        : `${validation.missingFields.slice(0, 3).join(', ')} and ${validation.missingFields.length - 3} more field(s)`;
        
      toast.error(`Please complete the following required fields:`, {
        description: fieldsList,
        duration: 8000
      });

      // Scroll to top to show validation errors
      window.scrollTo({ 
        top: 0, 
        behavior: 'smooth' 
      });

      // Trigger field highlighting by broadcasting validation event
      // This will cause ApplicationInformation component to show all errors
      const validationEvent = new CustomEvent('highlightRequiredFields', {
        detail: { missingFields: validation.missingFields, errors: validation.errors }
      });
      window.dispatchEvent(validationEvent);
    }
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
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">
              {currentStep === 1 ? "Protocol Review Application Information" : "Protocol Review Application Documents"}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Step {currentStep} of 2</span>
              <Progress value={currentStep * 50} className="w-[100px]" />
            </div>
          </div>
          </div>

        {/* Only show validation summary for final submission, not for inline validation */}
        {validationErrors.length > 0 && currentStep === 2 && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Please complete all required fields</AlertTitle>
            <AlertDescription>
              Some required fields are missing. Please review the form and complete all required information before submitting.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {currentStep === 1 ? (
            <ApplicationInformation
              formData={formData}
              onChange={setFormData}
            />
          ) : (
            <ApplicationDocuments 
              onDocumentsChange={handleDocumentsChange}
              isSubmitting={isSubmitting || isLoading} 
            />
          )}

          {/* Upload Progress */}
          {(isSubmitting || isLoading) && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  Uploading documents...
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          <div className="flex justify-between pt-6">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={isSubmitting || isLoading}
              >
                Previous
              </Button>
            )}
            {currentStep < 2 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="ml-auto"
                disabled={isLoading}
              >
                Next
              </Button>
            ) : (
              <div className="flex flex-col space-y-4 ml-auto">
                {/* Validation Check Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const isValid = validateCompleteSubmission();
                    if (isValid) {
                      toast.success('✅ All required fields and documents are complete! Ready to submit.', {
                        duration: 5000,
                        description: 'Your application passes all validation checks.'
                      });
                    }
                    // Error handling is already done in validateCompleteSubmission
                  }}
                  disabled={isLoading || isSubmitting}
                  className="w-full"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Check Application Completeness
                </Button>
                
                {/* Submit Button */}
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit(e);
                  }}
                  disabled={isLoading || isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Submit Application
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
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
        duplicates={duplicates}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
  