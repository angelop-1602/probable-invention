"use client";

import { useState } from "react";
import { ProponentHeader } from "@/components/proponent/shared/ProponentHeader";
import { ProtocolInformation } from "@/components/proponent/tracking-application/ProtocolInformation";
import { ProtocolDocuments } from "@/components/proponent/tracking-application/ProtocolDocuments";
import { MessageSection } from "@/components/proponent/tracking-application/MessageSection";
import { Decision } from "@/components/proponent/tracking-application/Decision";
import { ReportsSection } from "@/components/proponent/tracking-application/ReportsSection";
import { ReportSubmissionDialog } from "@/components/proponent/tracking-application/ReportSubmissionDialog";
import TitleSection from "@/components/proponent/tracking-application/TitleSection";
import { toast } from "sonner";

// Mock data for UI demonstration
const mockData = {
  applicationCode: "SPUP_2025_00254_SR_CA",
  submissionDate: "July 16, 2025",
  title:
    "Tracer Study Of Bachelor Of Science In Social Work Alumni From Sy 2018-2019 To Sy 2023-2024",
  protocolInformation: {
    principalInvestigator: "Angel Peralta",
    courseProgram: "BSCE",
    adviser: "Engr. Luigie U. Cagurangan",
    email: "andreideguzman001@gmail.com",
    typeOfReview: "Expedited",
    studySite: "Tuguegarao City",
    status: "Approved", // Changed to Approved for demo
  },
  protocolDocuments: [
    { name: "Protocol Review Application", status: "Approved" },
    { name: "Adviser's Certification", status: "Approved" },
    { name: "Minutes of the Proposal Defense", status: "Approved" },
    { name: "Research Proposal", status: "Approved" },
    { name: "Informed Consent of the Study", status: "Approved" },
    { name: "Questionnaire", status: "Approved" },
    { name: "Curriculum Vitae of Researchers", status: "Approved" },
    { name: "Proof of payment", status: "Approved" },
  ],
  // Added mock data for reports
  progressReports: [
    {
      reportDate: new Date("2025-08-16"),
      formUrl: "https://example.com/progress-report-1",
      status: "approved" as const,
    },
    {
      reportDate: new Date("2025-09-16"),
      formUrl: "https://example.com/progress-report-2",
      status: "pending" as const,
    },
  ],
  finalReport: {
    submittedDate: new Date("2025-10-16"),
    formUrl: "https://example.com/final-report",
    status: "pending" as const,
  },
  archiving: undefined, // Will be set after final report approval
  decision: {
    status: "Approved",
    type: "Expedited Review",
    date: "July 20, 2025",
    comments:
      "The research protocol has been reviewed and approved. Please proceed with your study following the approved protocol.",
    nextSteps: [
      "Download and save your Certificate of Approval",
      "Begin data collection following approved protocol",
      "Submit progress reports every 3 months",
      "Report any deviations or adverse events immediately",
      "Submit final report upon study completion",
    ],
    documents: [
      {
        name: "Certificate of Approval",
        status: "approved",
        dueDate: "July 20, 2025",
      },
    ],
  },
};

export default function TrackApplication({
  params,
}: {
  params: { code: string };
}) {
  const [isProgressReportDialogOpen, setIsProgressReportDialogOpen] =
    useState(false);
  const [isFinalReportDialogOpen, setIsFinalReportDialogOpen] = useState(false);

  const handleSubmitProgressReport = () => {
    setIsProgressReportDialogOpen(true);
  };

  const handleSubmitFinalReport = () => {
    setIsFinalReportDialogOpen(true);
  };

  const handleReportSubmission = async (formData: FormData) => {
    try {
      // TODO: Implement actual file upload logic
      const type = formData.get("type");
      const file = formData.get("file") as File;
      const comments = formData.get("comments");

      console.log("Submitting report:", {
        type,
        fileName: file.name,
        comments,
      });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success(
        type === "progress"
          ? "Progress report submitted successfully"
          : "Final report submitted successfully"
      );

      // Close the appropriate dialog
      if (type === "progress") {
        setIsProgressReportDialogOpen(false);
      } else {
        setIsFinalReportDialogOpen(false);
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Failed to submit report. Please try again.");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <ProponentHeader
        title="Track Application"
        subtitle="Track your application status and progress"
      />

      <div className="grid grid-cols-5 gap-4 mt-6">
        <div className="col-span-5">
          <TitleSection
            title={mockData.title}
            applicationCode={mockData.applicationCode}
            submissionDate={mockData.submissionDate}
          />
        </div>
        <div className="col-span-3">
          <ProtocolInformation data={mockData.protocolInformation} />
        </div>
        <div className="col-span-3">
          <ProtocolDocuments documents={mockData.protocolDocuments} />
        </div>
        <div className="col-span-2 col-start-4 row-start-2">
          <MessageSection />
        </div>
        <div className="col-span-2 col-start-4 row-start-3">
          <Decision decision={mockData.decision} />
        </div>
        <div className="col-span-5">
          <ReportsSection
            progressReports={mockData.progressReports}
            finalReport={mockData.finalReport}
            archiving={mockData.archiving}
            onSubmitProgressReport={handleSubmitProgressReport}
            onSubmitFinalReport={handleSubmitFinalReport}
            isApproved={mockData.protocolInformation.status === "Approved"}
            isCompleted={false}
          />
        </div>
      </div>

      <ReportSubmissionDialog
        isOpen={isProgressReportDialogOpen}
        onClose={() => setIsProgressReportDialogOpen(false)}
        onSubmit={handleReportSubmission}
        type="progress"
      />

      <ReportSubmissionDialog
        isOpen={isFinalReportDialogOpen}
        onClose={() => setIsFinalReportDialogOpen(false)}
        onSubmit={handleReportSubmission}
        type="final"
      />
    </div>
  );
}
