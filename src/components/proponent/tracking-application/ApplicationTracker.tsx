import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AlertCircle, Upload, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Import our optimized hooks
import { useApplicationStatus, useApplicationDocuments } from "@/hooks/useApplicationData";

// Import types from centralized location
import { 
  Application, 
  Document, 
  DocumentStatus,
} from "@/types/protocol-application/tracking";
import { HookApplicationStatus } from "@/types/protocol-application/hooks";

// We'll create these components next
import { ProgressTracker } from "./ProgressTracker";
import { ApplicationDetails } from "./ApplicationDetails";
import { DocumentList } from "./DocumentList";
import { ApplicationProgressTabs } from "./ApplicationProgressTabs";
import { TrackNotes } from "./TrackNotes";

// Add this import at the top with other imports
import { ApplicationDocuments } from "@/components/proponent/submission-application/ApplicationDocuments";

interface ApplicationTrackerProps {
  applicationCode?: string;
  userEmail?: string;
}

export const ApplicationTracker = ({ applicationCode, userEmail }: ApplicationTrackerProps) => {
  // State for the application data
  const [application, setApplication] = useState<Application | null>(null);

  // Real-time status updates with our optimized hooks
  const { 
    status: applicationStatus, 
    isLoading: statusLoading, 
    error: statusError 
  } = useApplicationStatus(applicationCode || null);

  // Real-time document updates with our optimized hooks
  const { 
    applicationData, 
    documents, 
    getDocumentURL, 
    isLoading: docsLoading, 
    error: docsError 
  } = useApplicationDocuments(applicationCode || null);

  const [isTerminationDialogOpen, setIsTerminationDialogOpen] = useState(false);
  const [showTerminationForm, setShowTerminationForm] = useState(false);
  const [fileErrors, setFileErrors] = useState<Record<string, string | null>>({});

  // Combine the data from our real-time hooks
  useEffect(() => {
    // If we have real application data from our cached hooks, use it
    if (applicationData && !statusLoading && !docsLoading) {
      // Prepare the mapped documents
      const mappedDocuments: Document[] = Array.from(documents.entries()).map(([key, blob]) => {
        // Extract the file path and find corresponding metadata in applicationData
        const fileName = key.split('/').pop() || key;
        
        // Try to find metadata with displayName for this document
        const documentMetadata = applicationData.documents?.find((doc: any) => 
          doc.fileName === fileName || doc.storagePath?.includes(fileName)
        );
        
        // Use the displayName if available, otherwise format the filename for better readability
        const displayName = documentMetadata?.displayName || 
          formatDocumentName(fileName);
        
        return {
          name: displayName, // Use the display name instead of the filename
          originalName: fileName, // Keep the original filename for reference
          status: "Submitted" as DocumentStatus,
          downloadLink: getDocumentURL(key) || "",
          // Add optional properties if needed
          requestReason: undefined,
          resubmissionVersion: undefined
        };
      });
      
      // Transform the data format to match Application type
      const transformedApplication: Application = {
        applicationCode: applicationCode || "",
        spupRecCode: applicationData.recCode || "",
        principalInvestigator: applicationData.proponent?.name || "",
        submissionDate: applicationData.proponent?.submissionDate 
          ? new Date(applicationData.proponent.submissionDate.seconds * 1000).toISOString() 
          : new Date().toISOString(),
        researchTitle: applicationData.protocolDetails?.researchTitle || "",
        adviser: applicationData.proponent?.advisor || "",
        courseProgram: applicationData.proponent?.courseProgram || "",
        emailAddress: applicationData.proponent?.email || "",
        progress: applicationStatus?.reviewProgress?.submissionCheck ? 'SC' : 
                applicationStatus?.reviewProgress?.initialReview ? 'IR' : 
                applicationStatus?.reviewProgress?.resubmission ? 'RS' : 
                applicationStatus?.reviewProgress?.approved ? 'AP' : 
                applicationStatus?.reviewProgress?.progressReport ? 'PR' : 
                applicationStatus?.reviewProgress?.finalReport ? 'FR' : 
                applicationStatus?.reviewProgress?.archived ? 'AR' : 'SC',
        status: applicationData.applicationStatus === "On-going review" ? 'OR' :
               applicationData.applicationStatus === "Approved" ? 'A' :
               applicationData.applicationStatus === "Completed" ? 'C' :
               applicationData.applicationStatus === "Terminated" ? 'T' : 'OR',
        funding: applicationData.funding || 'R', // Default to R if not specified
        typeOfResearch: applicationData.typeOfResearch || 'EX', // Default to EX if not specified
        documents: mappedDocuments,
        initialReview: {
          date: applicationData.reviewDates?.initialReview 
            ? new Date(applicationData.reviewDates.initialReview.seconds * 1000).toISOString()
            : "",
          decision: applicationData.reviewDecisions?.initialReview || "",
          feedback: applicationData.reviewFeedback?.initialReview || "",
          additionalDocumentsRequested: applicationData.additionalDocuments?.map((doc: any) => ({
            name: doc.name,
            status: "Review Required" as DocumentStatus,
            downloadLink: "",
            requestReason: doc.reason
          })) || []
        },
        resubmission: {
          date: applicationData.reviewDates?.resubmission 
            ? new Date(applicationData.reviewDates.resubmission.seconds * 1000).toISOString()
            : "",
          count: applicationData.resubmissionCount || 0,
          status: applicationData.resubmissionStatus || "",
          decision: applicationData.reviewDecisions?.resubmission || "",
          history: applicationData.resubmissionHistory?.map((item: any) => ({
            date: item.date ? new Date(item.date.seconds * 1000).toISOString() : "",
            status: item.status || "",
            decision: item.decision || "",
            feedback: item.feedback || ""
          })) || []
        },
        approved: {
          date: applicationData.reviewDates?.approved
            ? new Date(applicationData.reviewDates.approved.seconds * 1000).toISOString()
            : "",
          certificateUrl: applicationData.certificateUrl || "",
        },
        progressReport: {
          date: applicationData.reportDates?.progress
            ? new Date(applicationData.reportDates.progress.seconds * 1000).toISOString()
            : "",
          reportUrl: applicationData.reportUrls?.progress || "",
          submissionCount: applicationData.progressReportCount || 0,
          lastReportUrl: applicationData.lastProgressReportUrl || ""
        },
        finalReport: {
          date: applicationData.reportDates?.final
            ? new Date(applicationData.reportDates.final.seconds * 1000).toISOString()
            : "",
          reportUrl: applicationData.reportUrls?.final || ""
        },
        archiving: {
          date: applicationData.reviewDates?.archived
            ? new Date(applicationData.reviewDates.archived.seconds * 1000).toISOString()
            : ""
        },
        termination: applicationData.terminationDetails ? {
          date: applicationData.terminationDetails.date
            ? new Date(applicationData.terminationDetails.date.seconds * 1000).toISOString()
            : "",
          reason: applicationData.terminationDetails.reason || "",
          formUrl: applicationData.terminationDetails.formUrl || ""
        } : undefined,
        hasAdditionalDocumentsRequest: 
          (applicationData.additionalDocuments && applicationData.additionalDocuments.length > 0) || false
      };
      
      setApplication(transformedApplication);
    }
  }, [applicationData, applicationStatus, documents, applicationCode, statusLoading, docsLoading, getDocumentURL]);

  const validateFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldId: string) => {
    const newErrors = { ...fileErrors };
    newErrors[fieldId] = null;
    setFileErrors(newErrors);

    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        newErrors[fieldId] = "Only PDF files are accepted. Please upload a PDF document.";
        setFileErrors(newErrors);
        e.target.value = ""; // Clear the input
      }
    }
  };

  const handleContinueClick = () => {
    setShowTerminationForm(true);
  };
  
  // Handle document uploads by calling the appropriate API
  const handleDocumentUploaded = (documentName: string) => {
    // In a real implementation, this would call an API to update the document status
    console.log(`Document ${documentName} uploaded successfully`);
    
    // Update local state to reflect the change
    if (application) {
      const updatedDocuments = application.documents.map(doc => 
        doc.name === documentName 
          ? { ...doc, status: "Revision Submitted" as DocumentStatus }
          : doc
      );
      
      // Check if there are any documents still needing action
      const documentsNeedingAction = updatedDocuments.filter(
        doc => doc.status === "Review Required" || doc.status === "Pending"
      );
      
      // If all requested documents have been addressed, remove the flag
      setApplication({ 
        ...application,
        documents: updatedDocuments,
        hasAdditionalDocumentsRequest: documentsNeedingAction.length > 0
      });
    }
  };

  // If loading or error, show appropriate UI
  const isLoading = statusLoading || docsLoading;
  const error = statusError?.message || docsError?.message || null;

  if (isLoading && !application) return <div className="p-8 text-center">Loading application data...</div>;
  if (error && !application) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!application) return <div className="p-8 text-center">No application found. Please check the application code.</div>;

  // Verify user access (if userEmail is provided)
  const hasAccess = !userEmail || 
    !applicationData || 
    applicationData.proponent?.email === userEmail;

  if (!hasAccess) {
    return (
      <div className="p-8 text-center bg-red-100 text-red-800 rounded-md">
        <AlertCircle className="h-6 w-6 mx-auto mb-2" />
        <h3 className="font-semibold text-lg">Access Denied</h3>
        <p>You do not have permission to view this application.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-10"> 
      
      {/* Show real-time update indicator if data has been updated */}
      {applicationStatus && applicationStatus.lastUpdated && (
        <div className="bg-blue-50 p-3 rounded-md text-blue-800 text-sm">
          <p>Last updated: {new Date(applicationStatus.lastUpdated).toLocaleString()}</p>
        </div>
      )}
      
      <ProgressTracker 
        progress={application.progress} 
        status={application.status} 
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ApplicationProgressTabs application={application} />
          
          <DocumentList 
            documents={application.documents} 
            hasAdditionalDocumentsRequest={application.hasAdditionalDocumentsRequest}
            additionalDocumentsRequested={application.initialReview.additionalDocumentsRequested}
            onDocumentUploaded={handleDocumentUploaded}
            currentResubmissionCount={application.resubmission.count}
          />
        </div>
        
        <div className="space-y-6">
          <ApplicationDetails application={application} />
          <TrackNotes application={application} />
          
          {/* Early Termination section (only visible if application is approved) */}
          {application.approved.date && application.status !== "T" && (
            <div className="mt-8 pt-4 border-t border-gray-200">
              <Dialog open={isTerminationDialogOpen} onOpenChange={setIsTerminationDialogOpen}>
                <DialogTrigger asChild>
                  <button className="text-red-600 text-sm underline hover:text-red-800 font-medium">
                    Request Early Termination
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-red-600">Request Early Termination</DialogTitle>
                    <DialogDescription>
                      This action will initiate the early termination process for your protocol.
                    </DialogDescription>
                  </DialogHeader>
                  
                  {!showTerminationForm ? (
                    <div className="space-y-4">
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <h4 className="font-medium text-red-700">Important Notice</h4>
                        <p className="text-sm mt-1">
                          Early termination should only be considered in specific circumstances such as:
                        </p>
                        <ul className="text-sm mt-2 list-disc pl-5 space-y-1">
                          <li>Negative effects on participants</li>
                          <li>Unforeseen ethical violations or risks</li>
                          <li>Funding or logistical challenges</li>
                          <li>Regulatory or institutional directives</li>
                        </ul>
                      </div>
                      <Button variant="destructive" onClick={handleContinueClick}>
                        Continue with Termination
                      </Button>
                      <Button variant="outline" onClick={() => setIsTerminationDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Upload Form 15: Early Termination Form
                          </label>
                          <Input
                            type="file"
                            id="terminationForm"
                            accept=".pdf"
                            onChange={(e) => validateFileUpload(e, 'terminationForm')}
                          />
                          {fileErrors['terminationForm'] && (
                            <p className="text-red-500 text-xs mt-1">{fileErrors['terminationForm']}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Upload Progress Report
                          </label>
                          <Input
                            type="file"
                            id="progressReport"
                            accept=".pdf"
                            onChange={(e) => validateFileUpload(e, 'progressReport')}
                          />
                          {fileErrors['progressReport'] && (
                            <p className="text-red-500 text-xs mt-1">{fileErrors['progressReport']}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Upload Certificate of Approval
                          </label>
                          <Input
                            type="file"
                            id="certificateOfApproval"
                            accept=".pdf"
                            onChange={(e) => validateFileUpload(e, 'certificateOfApproval')}
                          />
                          {fileErrors['certificateOfApproval'] && (
                            <p className="text-red-500 text-xs mt-1">{fileErrors['certificateOfApproval']}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Reason for Termination</label>
                          <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            rows={4}
                            placeholder="Please explain why you are requesting early termination..."
                          ></textarea>
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowTerminationForm(false)}>
                          Back
                        </Button>
                        <Button type="submit" variant="destructive">
                          Submit Termination Request
                        </Button>
                      </DialogFooter>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Format filenames to be more readable using the document configuration
const formatDocumentName = (fileName: string): string => {
  // Remove file extension
  const withoutExtension = fileName.replace(/\.\w+$/, '');
  
  // Try to find a matching document type in our config
  const lowerFileName = withoutExtension.toLowerCase();
  
  // Map of common document types (copied from ApplicationDocuments.tsx)
  const documentNameMap: Record<string, string> = {
    "form07a": "Form 07A: Protocol Review Application Form",
    "form7a": "Form 07A: Protocol Review Application Form",
    "protocol_review": "Form 07A: Protocol Review Application Form",
    "form07b": "Form 07B: Adviser's Certification Form",
    "form7b": "Form 07B: Adviser's Certification Form",
    "adviser": "Form 07B: Adviser's Certification Form",
    "certification": "Form 07B: Adviser's Certification Form",
    "form07c": "Form 07C: Informed Consent Template",
    "form7c": "Form 07C: Informed Consent Template", 
    "consent": "Form 07C: Informed Consent Template",
    "research_proposal": "Research Proposal/Study Protocol",
    "proposal": "Research Proposal/Study Protocol",
    "protocol": "Research Proposal/Study Protocol",
    "minutes": "Minutes of Proposal Defense",
    "defense": "Minutes of Proposal Defense",
    "questionnaire": "Questionnaires",
    "survey": "Questionnaires",
    "abstract": "Abstract",
    "cv": "Curriculum Vitae of Researchers",
    "curriculum": "Curriculum Vitae of Researchers",
    "vitae": "Curriculum Vitae of Researchers",
    "technical": "Technical Review Approval",
    "review": "Technical Review Approval",
    "approval": "Technical Review Approval",
    "submission": "Protocol Submission",
    "resubmission": "Protocol Resubmission",
    "revision": "Revision Document",
    "amendment": "Protocol Amendment",
    "progress": "Progress Report",
    "final": "Final Report",
    "certificate": "Approval Certificate"
  };
  
  // Check for matches in our mapping
  for (const [key, name] of Object.entries(documentNameMap)) {
    if (lowerFileName.includes(key)) {
      return name;
    }
  }
  
  // Fall back to original formatting if no match found
  // Remove application IDs, timestamps, and other technical prefixes
  const cleanName = withoutExtension
    .replace(/^[A-Z0-9]+_/, '') // Remove application ID prefix
    .replace(/_v\d+$/, '')      // Remove version suffix
    .replace(/\d{10,}/, '')     // Remove timestamps
    .replace(/_+/g, ' ');       // Replace underscores with spaces
    
  // Capitalize each word
  return cleanName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
} 