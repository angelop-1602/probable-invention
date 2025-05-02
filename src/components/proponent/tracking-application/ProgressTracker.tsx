import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressStatus, ApplicationStatus } from "@/types/protocol-application/tracking";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

// Progress info mapping for display
const progressInfo: Record<string, { name: string; description: string }> = {
  "PENDING": { name: "Pending", description: "Application not yet seen by the REC Chair" },
  "SC": { name: "Submission Check", description: "SPUP REC Code has been assigned" },
  "IR": { name: "Initial Review", description: "Application is now with the primary reviewers" },
  "RS": { name: "Resubmission", description: "REC Chair has requested resubmission" },
  "AP": { name: "Approved", description: "Protocol has been approved" },
  "PR": { name: "Progress Report", description: "Ongoing progress monitoring" },
  "FR": { name: "Final Report", description: "Final report submission" },
  "AR": { name: "Archived", description: "Protocol has been archived" }
};

// Progress color mapping
const progressColors: Record<string, string> = {
  "PENDING": "bg-gray-100 text-gray-800",
  "SC": "bg-blue-100 text-blue-800",
  "IR": "bg-yellow-100 text-yellow-800",
  "RS": "bg-orange-100 text-orange-800",
  "AP": "bg-green-100 text-green-800",
  "PR": "bg-purple-100 text-purple-800",
  "FR": "bg-indigo-100 text-indigo-800",
  "AR": "bg-gray-100 text-gray-800"
};

// Required document types
const REQUIRED_DOCUMENTS = [
  'form07A',
  'form07B',
  'form07C',
  'researchProposal',
  'minutesOfProposalDefense',
  'questionnaires',
  'curriculumVitae',
  'abstract'
];

// Helper function to get progress percentage
const getProgressPercentage = (progress: ProgressStatus | "PENDING"): string => {
  const progressSteps: (ProgressStatus | "PENDING")[] = ["PENDING", "SC", "IR", "RS", "AP", "PR", "FR", "AR"];
  const currentIndex = progressSteps.indexOf(progress);
  if (currentIndex === -1 || progress === "PENDING") return "0%";
  
  // Calculate percentage based on meaningful steps (exclude PENDING from calculation)
  const meaningfulSteps = progressSteps.length - 1; // -1 because PENDING is not counted
  const adjustedIndex = currentIndex - 1; // -1 to skip PENDING
  return `${Math.floor((adjustedIndex / (meaningfulSteps - 1)) * 100)}%`;
};

interface DocumentData {
  displayName?: string;
  displayTitle?: string;
  documentId?: string;
  documentType?: string;
  fileName?: string;
  status?: string;
  storagePath?: string;
  timestamp?: any;
  version?: string;
}

interface ApplicationData {
  applicationCode?: string;
  progress?: string;
  decision?: string;
  documents?: DocumentData[];
  reviewProgress?: {
    approved?: boolean;
    reviewType?: string;
    status?: string;
  };
  form07A?: DocumentData[];
  form07B?: DocumentData[];
  form07C?: DocumentData[];
  researchProposal?: DocumentData[];
  minutesOfProposalDefense?: DocumentData[];
  questionnaires?: DocumentData[];
  curriculumVitae?: DocumentData[];
  abstract?: DocumentData[];
  [key: string]: any; // Allow for any other document type
}

interface ProgressTrackerProps {
  progress?: ProgressStatus;
  status?: ApplicationStatus | string;
  comments?: string;
  documentRequests?: string[];
  fulfilledDocuments?: string[];
  applicationData?: ApplicationData;
}

// Check if all required documents are present and approved
const areDocumentsApproved = (applicationData?: ApplicationData): boolean => {
  if (!applicationData) return false;

  // Check documents array if it exists
  if (applicationData.documents && applicationData.documents.length > 0) {
    // Check if all documents have approved status
    const allApproved = applicationData.documents.every(
      doc => doc.status === 'Accepted' || doc.status === 'approved'
    );
    
    // If specific document types aren't in the documents array, this is a sufficient check
    if (allApproved && applicationData.documents.length >= REQUIRED_DOCUMENTS.length) {
      return true;
    }
  }
  
  // Check each document type directly if available
  return REQUIRED_DOCUMENTS.every(docType => {
    // Check if this document type exists in the application data
    const docs = applicationData[docType] as DocumentData[] | undefined;
    
    // If document type array doesn't exist, check if it might be in documents array instead
    if (!docs || docs.length === 0) {
      if (applicationData.documents) {
        return applicationData.documents.some(
          doc => doc.documentType === docType && 
                (doc.status === 'Accepted' || doc.status === 'approved')
        );
      }
      return false;
    }
    
    // If document type array exists, check the most recent one (assuming sorted by timestamp)
    const latestDoc = docs[docs.length - 1];
    return latestDoc && (latestDoc.status === 'Accepted' || latestDoc.status === 'approved');
  });
};

// Map application statuses to progress steps
const mapStatusToProgress = (status: ApplicationStatus | string): ProgressStatus | "PENDING" => {
  // Built-in statuses (defined in types)
  const statusMap: Record<ApplicationStatus, ProgressStatus | "PENDING"> = {
    'OR': "IR", // Ongoing Review maps to Initial Review
    'A': "AP", // Approved maps to Approved
    'C': "AR", // Completed maps to Archived
    'T': "AP"  // Terminated maps to Approved (or another appropriate status)
  };
  
  // For standard ApplicationStatus values
  if (status in statusMap) {
    return statusMap[status as ApplicationStatus];
  }
  
  // For string-based status values
  switch (status) {
    case "Draft":
    case "Submitted":
      return "PENDING";
    case "SPUP REC Code Assigned":
      return "SC";
    case "Under Review":
      return "IR";
    case "Revisions Required":
      return "RS";
    case "Approved":
      return "AP";
    case "Progress Report Required":
      return "PR";
    case "Final Report Required":
      return "FR";
    case "Completed":
    case "Archived":
      return "AR";
    default:
      return "PENDING";
  }
};

export const ProgressTracker = ({ 
  progress, 
  status,
  comments,
  documentRequests,
  fulfilledDocuments = [],
  applicationData
}: ProgressTrackerProps) => {
  const [currentProgress, setCurrentProgress] = useState<ProgressStatus | "PENDING">("PENDING");
  const [docsApproved, setDocsApproved] = useState(false);
  
  // Check document approval status
  useEffect(() => {
    setDocsApproved(areDocumentsApproved(applicationData));
  }, [applicationData]);
  
  // Update currentProgress based on props
  useEffect(() => {
    // If progress is directly provided, use it
    if (progress) {
      setCurrentProgress(progress);
    }
    // Otherwise check application data and status
    else if (applicationData) {
      // If application has progress field, use it
      if (applicationData.progress && typeof applicationData.progress === 'string') {
        // Handle different progress formats
        const appProgress = applicationData.progress.toUpperCase();
        if (['SC', 'IR', 'RS', 'AP', 'PR', 'FR', 'AR'].includes(appProgress)) {
          setCurrentProgress(appProgress as ProgressStatus);
        } else {
          // Map from review status if exists
          if (applicationData.reviewProgress?.status) {
            setCurrentProgress(mapStatusToProgress(applicationData.reviewProgress.status));
          } else if (status) {
            // Fall back to status prop
            setCurrentProgress(mapStatusToProgress(status));
          }
        }
      } else if (status) {
        // If no progress field, use status prop
        setCurrentProgress(mapStatusToProgress(status));
      } 
      // Set to SC if documents are approved but no other status is set
      else if (docsApproved && applicationData.applicationCode) {
        setCurrentProgress("SC");
      }
    } else if (status) {
      // Fall back to just the status prop
      setCurrentProgress(mapStatusToProgress(status));
    }
  }, [progress, status, applicationData, docsApproved]);

  // Array of all progress steps
  const progressSteps: (ProgressStatus | "PENDING")[] = ["PENDING", "SC", "IR", "RS", "AP", "PR", "FR", "AR"];

  // Filter document requests to show only those that haven't been fulfilled
  const pendingDocumentRequests = documentRequests?.filter(
    docRequest => !fulfilledDocuments.includes(docRequest)
  );

  // Check if documents need attention (show indicator if not approved)
  const documentsNeedAttention = applicationData && !docsApproved;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Application Progress</CardTitle>
        </div>
      </CardHeader>
      <Separator />
      <CardContent>
        <div className="relative">
          <div className="flex justify-between mb-2">
            {progressSteps.map((step) => (
              <div 
                key={step} 
                className={`text-center flex-1 flex flex-col items-center ${step === currentProgress ? 'font-semibold' : ''}`}
              >
                <div className={`
                  rounded-full w-8 h-8 flex items-center justify-center mb-1
                  ${step === currentProgress 
                    ? 'bg-green-500 text-white' 
                    : progressSteps.indexOf(step) <= progressSteps.indexOf("SC") && currentProgress !== "PENDING"
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-200 text-gray-700'
                  }
                  ${step === "SC" && documentsNeedAttention ? 'ring-2 ring-amber-400' : ''}
                `}>
                  {progressSteps.indexOf(step) < progressSteps.indexOf(currentProgress) ? (
                    <CheckCircle className="w-4 h-4 text-green-700" />
                  ) : step === "SC" && documentsNeedAttention ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <span className="text-xs">{step === "PENDING" ? "SC" : step}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Progress line */}
          <div className="h-2 bg-gray-200 rounded-full mb-4 relative overflow-hidden">
            {/* Background progress bar - properly aligned to the current step */}
            <div 
              className="h-full bg-green-500 rounded-full"
              style={{ 
                width: currentProgress === "PENDING" 
                  ? '14.28%'  // Show line up to SC
                  : currentProgress === "SC"
                    ? '14.28%' 
                    : currentProgress === "IR"
                      ? '28.56%'
                      : currentProgress === "RS"
                        ? '42.84%'
                        : currentProgress === "AP"
                          ? '57.12%'
                          : currentProgress === "PR"
                            ? '71.4%'
                            : currentProgress === "FR"
                              ? '85.68%'
                              : '100%'
              }}
            ></div>
            
            {/* Current step indicator line - removed as it's not in the image */}
          </div>
          
          <div className="flex justify-between text-xs mb-6">
            {progressSteps.map((step) => (
              <div 
                key={step} 
                className={`text-center flex-1 ${
                  step === currentProgress 
                    ? 'text-green-700 font-medium' 
                    : progressSteps.indexOf(step) < progressSteps.indexOf(currentProgress)
                      ? 'text-green-600'
                      : 'text-gray-500'
                }`}
              >
                <div className="text-xs">
                  {step === "PENDING" ? "Pending" : progressInfo[step].name}
                </div>
              </div>
            ))}
          </div>
          
          {/* Document approval status indicator */}
          {documentsNeedAttention && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md mb-4 text-sm">
              <div className="flex items-center text-amber-800 font-medium mb-1">
                <AlertCircle className="w-4 h-4 mr-1.5" />
                Document Approval Required
              </div>
              <p className="text-amber-700">
                Some required documents need to be approved by the REC Chair before your application can proceed.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 