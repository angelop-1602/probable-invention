"use client";

import { useState, useEffect, use } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProponentHeader } from "@/components/proponent/shared/ProponentHeader";
import { ProtocolInformation } from "@/components/proponent/tracking-application/ProtocolInformation";
import { ProtocolDocuments } from "@/components/proponent/tracking-application/ProtocolDocuments";
import { MessageSection } from "@/components/proponent/tracking-application/MessageSection";
import { Decision } from "@/components/proponent/tracking-application/Decision";
import { ReportsSection } from "@/components/proponent/tracking-application/ReportsSection";
import { ReportSubmissionDialog } from "@/components/proponent/tracking-application/ReportSubmissionDialog";
import TitleSection from "@/components/proponent/tracking-application/TitleSection";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

// Helper function to detect code type
function detectCodeType(code: string): 'application' | 'spup' | 'unknown' {
  // Application code format: RECYYYYRC (e.g., REC2024AB3C5D)
  if (/^REC\d{4}[A-Z0-9]{6}$/.test(code)) {
    return 'application';
  }
  
  // SPUP REC code format: SPUP_YYYY_NNNN_TR_FL (e.g., SPUP_2024_0001_SR_AB)
  if (/^SPUP_\d{4}_\d{4}_[A-Z]{2}_[A-Z]{2}$/.test(code)) {
    return 'spup';
  }
  
  return 'unknown';
}

// Function to fetch application data from Firebase
async function fetchApplicationFromFirebase(code: string, codeType: 'application' | 'spup' | 'unknown'): Promise<any | null> {
  try {
    console.log(`Searching for application with ${codeType} code:`, code);

    if (codeType === 'application') {
      // For application codes, search in submissions collection first (where new submissions are stored)
      let docRef = doc(db, "submissions", code);
      let docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        console.log("Found application in submissions collection by document ID");
        return { id: docSnap.id, ...docSnap.data() } as any;
      }

      // Also try protocolReviewApplications collection (for processed applications)
      docRef = doc(db, "protocolReviewApplications", code);
      docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        console.log("Found application in protocolReviewApplications by document ID");
        return { id: docSnap.id, ...docSnap.data() } as any;
      }

      // Search by application_code field in submissions collection
      let applicationsRef = collection(db, "submissions");
      let q = query(applicationsRef, where("general_information.application_code", "==", code));
      let querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        console.log("Found application in submissions by application_code field");
        return { id: doc.id, ...doc.data() } as any;
      }

      // Search by application_code field in protocolReviewApplications collection
      applicationsRef = collection(db, "protocolReviewApplications");
      q = query(applicationsRef, where("general_information.application_code", "==", code));
      querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        console.log("Found application in protocolReviewApplications by application_code field");
        return { id: doc.id, ...doc.data() } as any;
      }
    } else if (codeType === 'spup') {
      // For SPUP REC codes, search in protocolReviewApplications collection
      const applicationsRef = collection(db, "protocolReviewApplications");
      
      // Try searching by general_information.spup_rec_code
      let q = query(applicationsRef, where("general_information.spup_rec_code", "==", code));
      let querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        console.log("Found application by spup_rec_code field");
        return { id: doc.id, ...doc.data() } as any;
      }

      // Try searching by recCode field (used by REC Chair)
      q = query(applicationsRef, where("recCode", "==", code));
      querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        console.log("Found application by recCode field");
        return { id: doc.id, ...doc.data() } as any;
      }
    }

    console.log("No application found with the provided code");
    return null;
  } catch (error) {
    console.error("Error fetching application:", error);
    throw error;
  }
}

export default function TrackApplication({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  // Unwrap params using React.use() for Next.js 15
  const resolvedParams = use(params);
  const code = resolvedParams.code;

  const [isLoading, setIsLoading] = useState(true);
  const [applicationData, setApplicationData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [codeType, setCodeType] = useState<'application' | 'spup' | 'unknown'>('unknown');
  const [isProgressReportDialogOpen, setIsProgressReportDialogOpen] = useState(false);
  const [isFinalReportDialogOpen, setIsFinalReportDialogOpen] = useState(false);

  useEffect(() => {
    const fetchApplicationData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Detect code type
        const detectedType = detectCodeType(code);
        setCodeType(detectedType);
        
        if (detectedType === 'unknown') {
          throw new Error('Invalid code format');
        }

        // Fetch application data from Firebase
        const applicationDoc = await fetchApplicationFromFirebase(code, detectedType);
        
        if (!applicationDoc) {
          throw new Error('Application not found');
        }

        // Transform the data for the UI
        const transformedData = {
          id: applicationDoc.id,
          title: applicationDoc.general_information?.protocol_title || applicationDoc.protocolDetails?.researchTitle || 'Untitled Protocol',
          applicationCode: applicationDoc.general_information?.application_code || applicationDoc.id,
          spupRecCode: applicationDoc.general_information?.spup_rec_code || applicationDoc.recCode,
          submissionDate: applicationDoc.submittedAt || applicationDoc.proponent?.submissionDate,
          protocolInformation: {
            principalInvestigator: applicationDoc.general_information?.principal_investigator?.name || applicationDoc.proponent?.name || 'Unknown',
            email: applicationDoc.general_information?.principal_investigator?.email || applicationDoc.proponent?.email || 'Unknown',
            courseProgram: applicationDoc.general_information?.principal_investigator?.position_institution || applicationDoc.proponent?.courseProgram || 'Unknown',
            adviser: applicationDoc.general_information?.advisers?.[0]?.name || applicationDoc.proponent?.advisor || 'Unknown',
            status: applicationDoc.applicationStatus || applicationDoc.status || 'Submitted',
            progress: applicationDoc.progress || 'SC',
            
            // Additional detailed information from submission form
            position: applicationDoc.general_information?.principal_investigator?.position_institution,
            address: applicationDoc.general_information?.principal_investigator?.address,
            contactNumber: applicationDoc.general_information?.principal_investigator?.contact_number,
            coResearchers: applicationDoc.general_information?.co_researchers?.map((r: any) => r.name).filter(Boolean) || [],
            
            // Study details
            studyLevel: applicationDoc.nature_and_type_of_study?.level,
            studyType: applicationDoc.nature_and_type_of_study?.type || applicationDoc.researchType || applicationDoc.typeOfResearch,
            typeOfReview: applicationDoc.nature_and_type_of_study?.type || applicationDoc.researchType,
            
            // Study site information
            studySite: (() => {
              const site = applicationDoc.study_site;
              if (!site) return 'Not specified';
              
              const siteInfo = [];
              if (site.research_within_university) siteInfo.push('Within University');
              if (site.research_outside_university?.is_outside) {
                siteInfo.push(`Outside University: ${site.research_outside_university.specify || 'Location not specified'}`);
              }
              return siteInfo.length > 0 ? siteInfo.join('; ') : 'Not specified';
            })(),
            
            // Duration
            startDate: applicationDoc.duration_of_study?.start_date,
            endDate: applicationDoc.duration_of_study?.end_date,
            
            // Participants
            participantCount: applicationDoc.participants?.number_of_participants,
            participantDescription: applicationDoc.participants?.type_and_description,
            
            // Funding information
            funding: applicationDoc.funding || (() => {
              const funding = applicationDoc.source_of_funding;
              if (!funding) return 'Unknown';
              
              const sources = [];
              if (funding.self_funded) sources.push('Self-funded');
              if (funding.institution_funded) sources.push('Institution-funded');
              if (funding.government_funded) sources.push('Government-funded');
              if (funding.pharmaceutical_company?.is_funded) sources.push('Pharmaceutical Company');
              if (funding.scholarship) sources.push('Scholarship');
              if (funding.research_grant) sources.push('Research Grant');
              if (funding.others) sources.push(funding.others);
              
              return sources.length > 0 ? sources.join(', ') : 'Unknown';
            })(),
            fundingDetails: applicationDoc.source_of_funding,
            
            // Brief description
            briefDescription: applicationDoc.brief_description_of_study
          },
          protocolDocuments: (() => {
            // Transform documents array to the expected format
            const docs = applicationDoc.documents || [];
            return docs.map((doc: any) => ({
              name: doc.title || doc.fileName || doc.name || 'Untitled Document',
              status: doc.status || 'Submitted',
              downloadUrl: doc.downloadUrl || doc.downloadLink || doc.url,
              id: doc.id || doc.documentId,
              title: doc.title || doc.fileName || doc.name,
              category: doc.category || 'submission',
              uploadDate: doc.uploadedAt || doc.uploadDate,
              version: doc.version || 1
            }));
          })(),
          decision: {
            status: applicationDoc.applicationStatus || 'Under Review',
            date: applicationDoc.lastModified || applicationDoc.submittedAt,
            comments: applicationDoc.comments || []
          },
          progressReports: applicationDoc.progressReports || [],
          finalReport: applicationDoc.finalReport || null,
          archiving: applicationDoc.archiving || null
        };

        setApplicationData(transformedData);
        
      } catch (err) {
        console.error("Error fetching application:", err);
        setError(err instanceof Error ? err.message : 'Failed to load application data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplicationData();
  }, [code]);

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

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <ProponentHeader
          title="Track Application"
          subtitle="Track your application status and progress"
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-green-900"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    const getErrorMessage = () => {
      switch (codeType) {
        case 'application':
          return {
            title: "Application Not Found",
            message: `We couldn't find an application with the Application Code "${code}".`,
            format: "Application Codes have the format RECYYYYRC (e.g., REC2024AB3C5D)",
            note: "If your application was recently submitted, please allow a few minutes for processing."
          };
        case 'spup':
          return {
            title: "Application Not Found",
            message: `We couldn't find an application with the SPUP REC Code "${code}".`,
            format: "SPUP REC Codes have the format SPUP_YYYY_NNNN_TR_FL (e.g., SPUP_2024_0001_SR_AB)",
            note: "SPUP REC Codes are assigned by the REC Chair after initial review."
          };
        default:
          return {
            title: "Invalid Code Format",
            message: `The code "${code}" doesn't match any recognized format.`,
            format: "Valid formats are:",
            note: "• Application Code: RECYYYYRC (e.g., REC2024AB3C5D)\n• SPUP REC Code: SPUP_YYYY_NNNN_TR_FL (e.g., SPUP_2024_0001_SR_AB)"
          };
      }
    };

    const errorInfo = getErrorMessage();

    return (
      <div className="container mx-auto py-8 px-4">
        <ProponentHeader
          title="Track Application"
          subtitle="Track your application status and progress"
        />
        <Card className="mt-6">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">{errorInfo.title}</h2>
              <p className="text-gray-600">{errorInfo.message}</p>
              <p className="text-sm text-gray-500">{errorInfo.format}</p>
              <p className="text-xs text-gray-400 whitespace-pre-line">{errorInfo.note}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If we have data, render the full application tracking interface
  if (applicationData) {
    return (
      <div className="container mx-auto py-8 px-4">
        <ProponentHeader
          title="Track Application"
          subtitle="Track your application status and progress"
        />

        <div className="grid grid-cols-5 gap-4 mt-6">
          <div className="col-span-5">
            <TitleSection
              title={applicationData.title}
              protocolCode={applicationData.applicationCode || applicationData.spupRecCode}
              date={applicationData.submissionDate}
            />
          </div>
          <div className="col-span-3">
            <ProtocolInformation data={applicationData.protocolInformation} />
          </div>
          <div className="col-span-3">
            <ProtocolDocuments documents={applicationData.protocolDocuments} />
          </div>
          <div className="col-span-2 col-start-4 row-start-2">
            <MessageSection />
          </div>
          <div className="col-span-2 col-start-4 row-start-3">
            <Decision decision={applicationData.decision} />
          </div>
          <div className="col-span-5">
            <ReportsSection
              progressReports={applicationData.progressReports}
              finalReport={applicationData.finalReport}
              archiving={applicationData.archiving}
              onSubmitProgressReport={handleSubmitProgressReport}
              onSubmitFinalReport={handleSubmitFinalReport}
              isApproved={applicationData.protocolInformation.status === "Approved"}
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

  return null;
}
