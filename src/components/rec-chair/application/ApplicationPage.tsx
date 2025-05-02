"use client";

import { ApplicationDetail } from "./ApplicationDetail";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { ApplicationPageProps } from "@/types/rec-chair";
import { useApplication } from "@/hooks/rec-chair/useApplication";

export function ApplicationPage({ applicationId }: ApplicationPageProps) {
  const router = useRouter();
  const { 
    application, 
    reviewers, 
    loading, 
    error, 
    refreshApplication, 
    updateApplication 
  } = useApplication(applicationId);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleBack = () => {
    router.push("/rec-chair/applications");
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Loading application details...</p>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="p-6 text-center text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
        <p className="font-medium">Error loading application</p>
        <p className="text-sm mt-1">{error?.message || "Application not found"}</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-3 text-red-600 border-red-200 hover:bg-red-50"
          onClick={handleBack}
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ApplicationDetail 
        application={application}
        reviewers={reviewers}
        onAssignReviewers={refreshApplication}
        onAddComment={refreshApplication}
        onUpdateStatus={refreshApplication}
        onUpdateApplication={updateApplication}
      />
    </div>
  );
} 