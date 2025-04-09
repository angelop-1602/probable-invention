import { ProgressMap, StatusMap, FundingMap, ResearchTypeMap, ColorMap } from "./types";

// Progress status mapping (SC=Screening, IR=Initial Review, RS=Resubmission, AP=Approved, PR=Progress Report, FR=Final Report, AR=Archived)
export const progressStatusMap: ProgressMap = {
  'SC': { name: 'Screening', description: 'Initial assessment by the REC Chair' },
  'IR': { name: 'Initial Review', description: 'Under review by the Ethics Committee' },
  'RS': { name: 'Resubmission', description: 'Revisions required and resubmission' },
  'AP': { name: 'Approved', description: 'Protocol approved for implementation' },
  'PR': { name: 'Progress Report', description: 'Ongoing with progress reports' },
  'FR': { name: 'Final Report', description: 'Research completed with final report' },
  'AR': { name: 'Archived', description: 'Protocol archived after completion' }
};

// Application status mapping (OR=Ongoing Review, A=Approved, C=Completed, T=Terminated)
export const statusMap: StatusMap = {
  'OR': 'Ongoing Review',
  'A': 'Approved',
  'C': 'Completed',
  'T': 'Terminated'
};

// Funding source mapping (R=Research Funding, I=Industry, A=Academic, D=Departmental, O=Others)
export const fundingSourceMap: FundingMap = {
  'R': 'Research Grant',
  'I': 'Industry Funded',
  'A': 'Academic Institution',
  'D': 'Departmental',
  'O': 'Others'
};

// Research type mapping (EX=Experimental, SR=Systematic Review)
export const researchTypeMap: ResearchTypeMap = {
  'EX': 'Experimental Study',
  'SR': 'Systematic Review'
};

// Progress status color mapping
export const progressColorMap: ColorMap = {
  'SC': 'bg-gray-100',
  'IR': 'bg-blue-100',
  'RS': 'bg-amber-100',
  'AP': 'bg-green-100',
  'PR': 'bg-cyan-100',
  'FR': 'bg-purple-100',
  'AR': 'bg-slate-100'
}; 