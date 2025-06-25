"use client";

import { ProtocolStatusBadge } from "@/components/ui/ProtocolStatusBadge";
import { SpupRecCodeAssignment } from "./SpupRecCodeAssignment";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { ProtocolInformation } from "./ProtocolInformation";
import { ReviewersList } from "./ReviewersList";
import { RecChairApplicationChat } from "./RecChairApplicationChat";
import { Application, Reviewer } from "@/types/rec-chair";

interface ApplicationDetailProps {
  application: Application;
  reviewers?: Reviewer[];
  progress?: string;
  onAssignReviewers?: () => void;
  onAddComment?: () => void;
  onUpdateStatus?: () => void;
  onUpdateApplication?: (updatedApplication: Application) => void;
  isFirstView?: boolean;
}

export function ApplicationDetail({
  application,
  reviewers = [],
  progress = "SC",
  onAssignReviewers,
  onAddComment,
  onUpdateStatus,
  onUpdateApplication,
  isFirstView = false
}: ApplicationDetailProps) {
  // Handle status updated
  const handleStatusUpdated = () => {
    if (onUpdateStatus) {
      onUpdateStatus();
    }
  };

  // Handle application update with Promise wrapper
  const handleUpdateApplication = async (updatedApp: Application) => {
    if (onUpdateApplication) {
      onUpdateApplication(updatedApp);
    }
    return Promise.resolve();
  };

  // Handle code saved
  const handleCodeSaved = (code: string) => {
    // Update the application locally
    const updatedApplication = {
      ...application,
      spupRecCode: code,
      ...(isFirstView && {
        status: "Submission Check",
        progress: "SC"
      })
    };

    // Notify parent component if callback is provided
    if (onUpdateApplication) {
      onUpdateApplication(updatedApplication);
    }
  };

  // Add a placeholder component
  function DocumentPlaceholder() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-muted-foreground">
            Document functionality has been removed. Please implement your custom solution.
          </p>
        </CardContent>
      </Card>
    );
  }

  // If no SPUP REC code assigned, only show the code assignment and basic details
  if (!application.spupRecCode) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold mb-2">{application.title || "Untitled Protocol"}</h2>
        <SpupRecCodeAssignment
          applicationId={application.id}
          principalInvestigator={application.principalInvestigator}
          researchType={application.researchType}
          currentCode={application.spupRecCode}
          isFirstView={true}
          onCodeSaved={handleCodeSaved}
        />

        <ProtocolInformation
          application={application}
        />
        <DocumentPlaceholder />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">{application.title || "Untitled Protocol"}</h2>
        <div>
        </div>
        <SpupRecCodeAssignment
          applicationId={application.id}
          principalInvestigator={application.principalInvestigator}
          researchType={application.researchType}
          currentCode={application.spupRecCode}
          isFirstView={false}
          onCodeSaved={handleCodeSaved}
        />
      </div>

      {/* Display ProtocolInformation and ProtocolDocumentList side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProtocolInformation
          application={application}
        />
        <ReviewersList
          application={application}
          reviewers={reviewers}
          onUpdateApplication={handleUpdateApplication}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <DocumentPlaceholder />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <RecChairApplicationChat application={application} />
        </div>
      </div>
    </div >
  );
} 