import { Application, Document } from './types';

// Mock document for initial review additional document requested
const additionalRequestedDocuments: Document[] = [
  { 
    name: "Ethics Training Certificate", 
    status: "Review Required", 
    downloadLink: "#",
    requestReason: "The REC chair has requested proof of ethics training for all investigators involved in this study."
  },
  { 
    name: "Data Management Plan", 
    status: "Pending", 
    downloadLink: "#",
    requestReason: "Please provide a detailed plan for how participant data will be stored, managed, and eventually disposed of."
  }
];

// Basic mock application in "Initial Review" stage
export const mockApplication: Application = {
  applicationCode: "REC2023ABC123",
  spupRecCode: "SPUP_2023_0001_SR_JD",
  principalInvestigator: "Juan Dela Cruz",
  submissionDate: "2023-05-15",
  researchTitle: "The Impact of Technology on Rural Communities in the Philippines",
  adviser: "Dr. Maria Santos",
  courseProgram: "BSN",
  emailAddress: "juan.delacruz@email.com",
  progress: "IR", 
  status: "OR", 
  funding: "I", 
  typeOfResearch: "SR",
  initialReview: {
    date: "2023-05-25",
    decision: "Minor Modifications Required",
    feedback: "The methodology section needs clarification on participant selection criteria. Please also address how cultural sensitivities will be handled during the research.",
    additionalDocumentsRequested: additionalRequestedDocuments
  },
  resubmission: {
    date: "",
    count: 0,
    status: "",
    decision: ""
  },
  approved: {
    date: ""
  },
  progressReport: {
    date: ""
  },
  finalReport: {
    date: ""
  },
  archiving: {
    date: ""
  },
  documents: [
    { name: "Form 07A: Protocol Review Application", status: "Accepted", downloadLink: "#" },
    { name: "Form 07C: Informed Consent Template", status: "Accepted", downloadLink: "#" },
    { name: "Form 07B: Adviser's Certification Form", status: "Accepted", downloadLink: "#" },
    { name: "Research Proposal/Study Protocol", status: "Accepted", downloadLink: "#" },
    { name: "Minutes of Proposal Defense", status: "Accepted", downloadLink: "#" },
    { name: "Abstract", status: "Accepted", downloadLink: "#" },
    { name: "Curriculum Vitae of Researchers", status: "Accepted", downloadLink: "#" },
    { name: "Questionnaires", status: "Review Required", downloadLink: "#", 
      requestReason: "Please revise questions 5-8 to use more neutral language that won't bias participant responses." },
  ],
  hasAdditionalDocumentsRequest: true
};

// Application in "Resubmission" stage
export const mockResubmissionApplication: Application = {
  ...mockApplication,
  applicationCode: "REC2023DEF456",
  spupRecCode: "SPUP_2023_0002_SR_MT",
  principalInvestigator: "Maria Torres",
  researchTitle: "Psychological Impact of Remote Learning on College Students",
  progress: "RS",
  status: "OR",
  initialReview: {
    date: "2023-06-10",
    decision: "Major Modifications Required",
    feedback: "The committee has significant concerns about the psychological assessment tools being used. Please revise to include validated instruments and clarify your data analysis approach.",
    additionalDocumentsRequested: []
  },
  resubmission: {
    date: "2023-06-25",
    count: 1,
    status: "Under Review",
    decision: ""
  },
  documents: [
    { name: "Form 07A: Protocol Review Application", status: "Accepted", downloadLink: "#" },
    { name: "Form 07C: Informed Consent Template", status: "Revision Submitted", downloadLink: "#" },
    { name: "Form 07B: Adviser's Certification Form", status: "Accepted", downloadLink: "#" },
    { name: "Research Proposal/Study Protocol", status: "Revision Submitted", downloadLink: "#" },
    { name: "Form 08A: Resubmission Form", status: "Submitted", downloadLink: "#" },
    { name: "Minutes of Proposal Defense", status: "Accepted", downloadLink: "#" },
    { name: "Abstract", status: "Revision Submitted", downloadLink: "#" },
    { name: "Curriculum Vitae of Researchers", status: "Accepted", downloadLink: "#" },
    { name: "Questionnaires", status: "Revision Submitted", downloadLink: "#" },
  ],
  hasAdditionalDocumentsRequest: false
};

// Application with Multiple Resubmissions
export const mockMultipleResubmissionApplication: Application = {
  applicationCode: "REC2023XYZ789",
  spupRecCode: "SPUP_2023_0011_SR_RV",
  principalInvestigator: "Rebecca Valencia",
  submissionDate: "2023-03-10",
  researchTitle: "Effects of Social Media on Adolescent Mental Health and Academic Performance",
  adviser: "Dr. Emmanuel Cruz",
  courseProgram: "MA-Psych",
  emailAddress: "r.valencia@email.com",
  progress: "RS", 
  status: "OR", 
  funding: "I", 
  typeOfResearch: "SR",
  
  initialReview: {
    date: "2023-03-20",
    decision: "Major Modifications Required",
    feedback: "The Ethics Committee has significant concerns about the methodology and data collection procedures. The consent forms need substantial revision to ensure participants fully understand the research risks. Additionally, the data privacy protocols are insufficient for handling sensitive psychological data from minors.",
    additionalDocumentsRequested: [
      { 
        name: "Parental Consent Form", 
        status: "Pending", 
        downloadLink: "#",
        requestReason: "Required for all participants under 18 years of age."
      },
      { 
        name: "Data Privacy Protocol", 
        status: "Pending", 
        downloadLink: "#",
        requestReason: "Detailed plans for data storage, encryption, and eventual disposal needed."
      }
    ]
  },
  
  // Resubmission information - now includes history of all resubmissions
  resubmission: {
    date: "2023-05-20", // Date of most recent resubmission
    count: 3, // Total number of resubmissions
    status: "Under Review", // Current status of the latest resubmission
    decision: "", // Decision on latest resubmission (empty if still under review)
    // Custom property to store resubmission history
    history: [
      {
        date: "2023-04-01",
        status: "Submitted",
        decision: "Further Revisions Needed",
        feedback: "While the revised methodology is improved, there are still significant concerns about the psychological assessment tools. The parental consent form has been submitted but requires additional clarity on data usage. The Committee recommends consulting with Dr. Santos regarding appropriate assessment tools for this age group."
      },
      {
        date: "2023-04-25",
        status: "Submitted",
        decision: "Minor Modifications Required",
        feedback: "The psychological assessment tools are now appropriate, but the data analysis plan needs further refinement. Please clarify how you will analyze different age groups separately, and provide more detail on your qualitative coding methodology."
      },
      {
        date: "2023-05-20",
        status: "Under Review",
        decision: "",
        feedback: ""
      }
    ]
  },
  
  approved: {
    date: ""
  },
  progressReport: {
    date: ""
  },
  finalReport: {
    date: ""
  },
  archiving: {
    date: ""
  },
  
  // Documents showing multiple revisions
  documents: [
    { name: "Form 07A: Protocol Review Application", status: "Accepted", downloadLink: "#" },
    { name: "Form 07B: Adviser's Certification Form", status: "Accepted", downloadLink: "#" },
    { name: "Form 07C: Informed Consent Template", status: "Revision Submitted", downloadLink: "#", requestReason: "Third revision: Please ensure all technical terms are explained in language accessible to participants" },
    { name: "Research Proposal/Study Protocol", status: "Revision Submitted", downloadLink: "#", requestReason: "Third revision: Data analysis plan needs further clarification" },
    { name: "Minutes of Proposal Defense", status: "Accepted", downloadLink: "#" },
    { name: "Abstract", status: "Accepted", downloadLink: "#" },
    { name: "Curriculum Vitae of Researchers", status: "Accepted", downloadLink: "#" },
    { name: "Questionnaires", status: "Revision Submitted", downloadLink: "#", requestReason: "Third revision: Questions 12-15 need to be reworded to avoid bias" },
    { name: "Parental Consent Form", status: "Revision Submitted", downloadLink: "#", requestReason: "Second revision: Improve clarity on data retention policy" },
    { name: "Data Privacy Protocol", status: "Revision Submitted", downloadLink: "#", requestReason: "Second revision: Add details on third-party access restrictions" },
    { name: "Form 08A: Resubmission Form (1st)", status: "Submitted", downloadLink: "#", requestReason: "First resubmission - April 1, 2023" },
    { name: "Form 08A: Resubmission Form (2nd)", status: "Submitted", downloadLink: "#", requestReason: "Second resubmission - April 25, 2023" },
    { name: "Form 08A: Resubmission Form (3rd)", status: "Submitted", downloadLink: "#", requestReason: "Third resubmission - May 20, 2023" },
  ],
  hasAdditionalDocumentsRequest: true
};

// Application in "Approved" stage
export const mockApprovedApplication: Application = {
  ...mockApplication,
  applicationCode: "REC2023GHI789",
  spupRecCode: "SPUP_2023_0003_SR_AL",
  principalInvestigator: "Antonio Lopez",
  researchTitle: "Nutritional Assessment of School Feeding Programs in Urban Areas",
  progress: "AP",
  status: "A",
  initialReview: {
    date: "2023-04-15",
    decision: "Approved with Minor Revisions",
    feedback: "The protocol is generally sound. Please make minor edits to the consent form as suggested.",
    additionalDocumentsRequested: []
  },
  resubmission: {
    date: "2023-04-25",
    count: 1,
    status: "Completed",
    decision: "Approved"
  },
  approved: {
    date: "2023-05-01",
    certificateUrl: "#"
  },
  documents: [
    { name: "Form 07A: Protocol Review Application", status: "Accepted", downloadLink: "#" },
    { name: "Form 07C: Informed Consent Template", status: "Accepted", downloadLink: "#" },
    { name: "Form 07B: Adviser's Certification Form", status: "Accepted", downloadLink: "#" },
    { name: "Research Proposal/Study Protocol", status: "Accepted", downloadLink: "#" },
    { name: "Minutes of Proposal Defense", status: "Accepted", downloadLink: "#" },
    { name: "Abstract", status: "Accepted", downloadLink: "#" },
    { name: "Curriculum Vitae of Researchers", status: "Accepted", downloadLink: "#" },
    { name: "Questionnaires", status: "Accepted", downloadLink: "#" },
    { name: "Certificate of Approval", status: "Issued", downloadLink: "#" },
  ],
  hasAdditionalDocumentsRequest: false
};

// Application in "Progress Report" stage
export const mockProgressReportApplication: Application = {
  ...mockApprovedApplication,
  applicationCode: "REC2023JKL101",
  spupRecCode: "SPUP_2023_0004_SR_RD",
  principalInvestigator: "Rosa Diaz",
  researchTitle: "Effectiveness of Community-Based Rehabilitation Programs",
  progress: "PR",
  progressReport: {
    date: "2023-07-15",
    submissionCount: 1,
    lastReportUrl: "#"
  },
  documents: [
    ...mockApprovedApplication.documents,
    { name: "Form 09B: Progress Report", status: "Submitted", downloadLink: "#" },
  ],
};

// Application in "Final Report" stage
export const mockFinalReportApplication: Application = {
  ...mockProgressReportApplication,
  applicationCode: "REC2023MNO112",
  spupRecCode: "SPUP_2023_0005_SR_CS",
  principalInvestigator: "Carlos Santiago",
  researchTitle: "Traditional Medicine Practices in Rural Communities",
  progress: "FR",
  finalReport: {
    date: "2023-09-10",
    reportUrl: "#"
  },
  documents: [
    ...mockProgressReportApplication.documents,
    { name: "Form 14A: Final Report", status: "Submitted", downloadLink: "#" },
  ],
};

// Application in "Archived" stage
export const mockArchivedApplication: Application = {
  ...mockFinalReportApplication,
  applicationCode: "REC2023PQR123",
  spupRecCode: "SPUP_2023_0006_SR_EM",
  principalInvestigator: "Elena Magtanggol",
  researchTitle: "Sustainable Farming Practices Among Indigenous Communities",
  progress: "AR",
  status: "C",
  archiving: {
    date: "2023-10-15",
  },
};

// Application that was terminated early
export const mockTerminatedApplication: Application = {
  ...mockApprovedApplication,
  applicationCode: "REC2023STU456",
  spupRecCode: "SPUP_2023_0007_SR_FM",
  principalInvestigator: "Fernando Mendoza",
  researchTitle: "Impact of Exercise on Mental Health Among College Students",
  progress: "AP", // Progress is still at Approved stage
  status: "T", // But status is Terminated
  termination: {
    date: "2023-06-30",
    reason: "Insufficient funding to continue the research as planned",
    formUrl: "#"
  },
  documents: [
    ...mockApprovedApplication.documents,
    { name: "Form 15: Early Termination Form", status: "Submitted", downloadLink: "#" },
  ],
}; 