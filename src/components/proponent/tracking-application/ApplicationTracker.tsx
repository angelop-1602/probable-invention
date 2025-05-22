import { useState } from "react";
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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// Import types from centralized location
import { 
  Application, 
  ProgressStatus
} from "@/types/protocol-application/tracking";

// We'll use these components
import { ProgressTracker } from "./ProgressTracker";
import { ApplicationDetails } from "./ApplicationDetails";
import { ApplicationProgressTabs } from "./ApplicationProgressTabs";
import { ProponentChat } from "./ProponentChat";

interface ApplicationTrackerProps {
  applicationCode?: string;
  mockData?: Application;
}

// Placeholder for document list
function DocumentPlaceholder() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Document functionality has been removed. Please implement your custom solution.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export const ApplicationTracker = ({ applicationCode, mockData }: ApplicationTrackerProps) => {
  // Mock state for UI structure
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [application, setApplication] = useState<Application | null>(mockData || null);
  
  const [isTerminationDialogOpen, setIsTerminationDialogOpen] = useState(false);
  const [showTerminationForm, setShowTerminationForm] = useState(false);
  const [terminationReason, setTerminationReason] = useState("");
  const [terminationFile, setTerminationFile] = useState<File | null>(null);
  const [fileErrors, setFileErrors] = useState<Record<string, string | null>>({});

  // Validation for file uploads
  const validateFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldId: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setFileErrors({ ...fileErrors, [fieldId]: "Please select a file" });
      return false;
    }

    const file = files[0];
    if (file.size > 10 * 1024 * 1024) { // 10MB max
      setFileErrors({ ...fileErrors, [fieldId]: "File size must be less than 10MB" });
      return false;
    }

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setFileErrors({ ...fileErrors, [fieldId]: "Only PDF, JPEG, and PNG files are allowed" });
      return false;
    }

    setFileErrors({ ...fileErrors, [fieldId]: null });
    return true;
  };

  // Handle termination submission continuation
  const handleContinueClick = () => {
    setShowTerminationForm(true);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading application data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error.message || 'An error occurred while loading application data'}
        </AlertDescription>
      </Alert>
    );
  }

  // Show no data state
  if (!application) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold mb-4">No Application Found</h2>
        <p className="text-muted-foreground mb-6">
          We couldn't find an application with the provided code. Please check the application code and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Application Status Banner */}
      <div className="bg-muted p-4 rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">{application.researchTitle}</h2>
            <p className="text-muted-foreground text-sm">
              Submitted on {new Date(application.submissionDate).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {application.status !== 'T' && application.status === 'A' && (
              <Dialog open={isTerminationDialogOpen} onOpenChange={setIsTerminationDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10">
                    Request Termination
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Application Termination</DialogTitle>
                    <DialogDescription>
                      {showTerminationForm ? (
                        "Please provide a reason for termination and upload the signed termination form."
                      ) : (
                        "Terminating your application will permanently stop the review process. This action cannot be undone."
                      )}
                    </DialogDescription>
                  </DialogHeader>
                  
                  {showTerminationForm ? (
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label htmlFor="reason" className="text-sm font-medium">
                          Reason for Termination
                        </label>
                        <Input
                          id="reason"
                          value={terminationReason}
                          onChange={(e) => setTerminationReason(e.target.value)}
                          placeholder="Please provide detailed reason for termination"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="terminationFile" className="text-sm font-medium">
                          Upload Termination Form
                        </label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="terminationFile"
                            type="file"
                            onChange={(e) => {
                              if (validateFileUpload(e, 'terminationFile')) {
                                setTerminationFile(e.target.files?.[0] || null);
                              }
                            }}
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="flex-1"
                          />
                          <Button size="icon" variant="outline" disabled={!terminationFile}>
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                        {fileErrors['terminationFile'] && (
                          <p className="text-sm text-destructive">{fileErrors['terminationFile']}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-4">
                      <p className="mb-4">
                        Before proceeding, please make sure:
                      </p>
                      <ul className="list-disc list-inside space-y-2 mb-4">
                        <li>You've discussed termination with your adviser</li>
                        <li>You understand all ongoing research activities must stop</li>
                        <li>You have the signed termination form ready to upload</li>
                      </ul>
                      <p className="text-sm text-muted-foreground">
                        Once submitted, the research ethics committee will review your termination request.
                      </p>
                    </div>
                  )}

                  <DialogFooter>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsTerminationDialogOpen(false);
                        setShowTerminationForm(false);
                        setTerminationReason("");
                        setTerminationFile(null);
                        setFileErrors({});
                      }}
                    >
                      Cancel
                    </Button>

                    {showTerminationForm ? (
                      <Button
                        variant="destructive"
                        onClick={() => {
                          // Termination logic removed
                          setIsTerminationDialogOpen(false);
                          setShowTerminationForm(false);
                        }}
                        disabled={!terminationReason || !terminationFile}
                      >
                        Submit Termination
                      </Button>
                    ) : (
                      <Button variant="destructive" onClick={handleContinueClick}>
                        Continue
                      </Button>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {application.archiving?.date && (
              <Button variant="default">
                <Download className="h-4 w-4 mr-2" />
                Download Archive
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Tracker */}
      <ProgressTracker
        progress={application.progress as ProgressStatus}
        status={application.status}
      />
      
      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
        <div className="md:col-span-2 space-y-6">
          <ApplicationProgressTabs application={application} />
          <DocumentPlaceholder />
        </div>
        <div className="space-y-6">
          <ApplicationDetails application={application} />
          <ProponentChat application={application} />
        </div>
      </div>
    </div>
  );
};