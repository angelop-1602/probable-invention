import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ProgressTracker } from "./ProgressTracker";
import { ApplicationDetails } from "./ApplicationDetails";
import { DocumentList } from "./DocumentList";
import { ApplicationProgressTabs } from "./ApplicationProgressTabs";
import { ProponentHeader } from "../shared/ProponentHeader";
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
import { mockApplication } from "./mockData";
import { TrackNotes } from "./TrackNotes";

// Import our optimized hooks
import { useApplicationStatus, useApplicationDocuments } from "@/hooks/useApplicationData";

// Import types from centralized location
import { 
  Application, 
  Document, 
  DocumentStatus,
  HookApplicationStatus
} from "@/types";

interface ApplicationTrackerProps {
  applicationCode?: string;
  mockData?: Application;
  userEmail?: string;
}

export const ApplicationTracker = ({ applicationCode, mockData, userEmail }: ApplicationTrackerProps) => {
  // State for the application data using our cached version
  const [application, setApplication] = useState<Application | null>(mockData || null);

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

  // Combine the data from our real-time hooks with the mock data or existing app data
  useEffect(() => {
    if (mockData) {
      setApplication(mockData);
      return;
    }

    // If we have real application data from our cached hooks, use it
    if (applicationData && !statusLoading && !docsLoading) {
      // Prepare the mapped documents
      const mappedDocuments: Document[] = Array.from(documents.entries()).map(([key, blob]) => ({
        name: key.split('/').pop() || key,
        status: "Submitted" as DocumentStatus,
        downloadLink: getDocumentURL(key) || "",
        // Add optional properties if needed
        requestReason: undefined,
        resubmissionVersion: undefined
      }));
      
      // Transform the data format to match Application type
      const transformedApplication: Application = {
        ...application as Application, // Keep existing properties
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
        funding: 'R', // Default value, should be updated with actual data
        typeOfResearch: 'EX', // Default value, should be updated with actual data
        documents: mappedDocuments,
        initialReview: application?.initialReview || { date: "", decision: "" },
        resubmission: application?.resubmission || { date: "", count: 0, status: "", decision: "" },
        approved: application?.approved || { date: "" },
        progressReport: application?.progressReport || { date: "" },
        finalReport: application?.finalReport || { date: "" },
        archiving: application?.archiving || { date: "" },
        hasAdditionalDocumentsRequest: false, // Default value
      };
      
      setApplication(transformedApplication);
    }
  }, [applicationData, applicationStatus, documents, mockData, applicationCode, statusLoading, docsLoading, getDocumentURL, application]);

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
    <div className="space-y-6"> 
      
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
                          <li>Regulatory or institutional directives requiring cessation</li>
                        </ul>
                      </div>
                      <div className="flex justify-end">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsTerminationDialogOpen(false)}
                          className="mr-2"
                        >
                          Cancel
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={handleContinueClick}
                        >
                          Continue
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h4 className="font-medium">Upload Required Documents</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Form 15: Early Termination Form</label>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" /> Download Template
                            </Button>
                            <Input 
                              type="file" 
                              id="termination-form" 
                              className="max-w-xs" 
                              accept=".pdf"
                              onChange={(e) => validateFileUpload(e, "termination-form")}
                            />
                          </div>
                          {fileErrors["termination-form"] && (
                            <Alert variant="destructive" className="mt-2">
                              <AlertCircle className="h-4 w-4 mr-2" />
                              <AlertDescription>
                                {fileErrors["termination-form"]}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Progress Report</label>
                          <Input 
                            type="file" 
                            id="termination-progress" 
                            className="max-w-xs" 
                            accept=".pdf"
                            onChange={(e) => validateFileUpload(e, "termination-progress")}
                          />
                          {fileErrors["termination-progress"] && (
                            <Alert variant="destructive" className="mt-2">
                              <AlertCircle className="h-4 w-4 mr-2" />
                              <AlertDescription>
                                {fileErrors["termination-progress"]}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Certificate of Approval</label>
                          <Input 
                            type="file" 
                            id="termination-certificate" 
                            className="max-w-xs" 
                            accept=".pdf"
                            onChange={(e) => validateFileUpload(e, "termination-certificate")}
                          />
                          {fileErrors["termination-certificate"] && (
                            <Alert variant="destructive" className="mt-2">
                              <AlertCircle className="h-4 w-4 mr-2" />
                              <AlertDescription>
                                {fileErrors["termination-certificate"]}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowTerminationForm(false);
                            setFileErrors({});
                          }}
                        >
                          Back
                        </Button>
                        <Button 
                          variant="destructive"
                        >
                          Submit Request
                        </Button>
                      </DialogFooter>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          )}
          
          {/* Display Termination Status if already terminated */}
          {application.status === "T" && application.termination && (
            <div className="mt-8 pt-4 border-t border-gray-200">
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <h4 className="font-medium text-red-700">Protocol Terminated</h4>
                <p className="text-sm mt-1">
                  This protocol has been terminated. No further actions are required.
                </p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Termination Date</h4>
                    <p>{application.termination.date}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Reason</h4>
                    <p>{application.termination.reason}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};