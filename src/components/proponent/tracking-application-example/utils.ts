import { ProgressMap, StatusMap, FundingMap, ResearchTypeMap, ColorMap, ProgressStatus, ApplicationStatus, FundingSource, ResearchType } from './types';

// Helper function to map progress codes to full names and descriptions
export const getProgressInfo = (code: ProgressStatus | string): { name: string; description: string } => {
  const progressMap: ProgressMap = {
    SC: { name: "Submission Check", description: "REC Chair checks completeness before initial review" },
    IR: { name: "Initial Review", description: "Submitted by the primary reviewers" },
    RS: { name: "Resubmission", description: "Proponent integrates corrections and suggestions" },
    AP: { name: "Approved", description: "All requirements met" },
    PR: { name: "Progress Report", description: "Submitted as per REC Chair instructions" },
    FR: { name: "Final Report", description: "Submitted when the study is finished" },
    AR: { name: "Archiving", description: "Application has been archived" }
  };
  return progressMap[code as ProgressStatus] || { name: "Unknown", description: "Unknown status" };
};

// Helper function to get status in full text
export const getStatusText = (code: ApplicationStatus | string): string => {
  const statusMap: StatusMap = {
    OR: "On-going review",
    A: "Approved and on-going",
    C: "Completed",
    T: "Terminated"
  };
  return statusMap[code as ApplicationStatus] || "Unknown";
};

// Helper function to get funding source in full text
export const getFundingText = (code: FundingSource | string): string => {
  const fundingMap: FundingMap = {
    R: "Researcher-funded",
    I: "Institution-funded",
    A: "Agency other than institution",
    D: "Pharmaceutical companies",
    O: "Others"
  };
  return fundingMap[code as FundingSource] || "Unknown";
};

// Helper function to get research type in full text
export const getResearchTypeText = (code: ResearchType | string): string => {
  const typeMap: ResearchTypeMap = {
    EX: "Experimental Research",
    SR: "Social/Behavioral Research"
  };
  return typeMap[code as ResearchType] || "Unknown";
};

// Helper function to get color for progress badge
export const getProgressColor = (progress: ProgressStatus | string): string => {
  const colorMap: ColorMap = {
    SC: "bg-blue-100 text-blue-800",
    IR: "bg-yellow-100 text-yellow-800",
    RS: "bg-orange-100 text-orange-800",
    AP: "bg-green-100 text-green-800",
    PR: "bg-purple-100 text-purple-800",
    FR: "bg-indigo-100 text-indigo-800",
    AR: "bg-gray-100 text-gray-800"
  };
  return colorMap[progress as ProgressStatus] || "bg-gray-100 text-gray-800";
};

// Calculate progress percentage based on progress stage
export const getProgressPercentage = (progress: ProgressStatus): string => {
  const percentages = {
    SC: "14%",
    IR: "28%",
    RS: "42%",
    AP: "56%",
    PR: "70%",
    FR: "85%",
    AR: "100%"
  };
  return percentages[progress] || "0%";
}; 