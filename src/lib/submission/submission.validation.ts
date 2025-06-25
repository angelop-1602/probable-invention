/**
 * Submission Validation Schemas
 * 
 * Zod validation schemas for the submission system
 */

import { z } from 'zod';

/**
 * Principal Investigator validation schema
 */
const principalInvestigatorSchema = z.object({
  name: z.string().min(2, 'Principal Investigator name is required'),
  position_institution: z.string().min(2, 'Position/Institution is required'),
  address: z.string().min(5, 'Address is required'),
  contact_number: z.string().min(10, 'Valid contact number is required'),
  email: z.string().email('Valid email address is required'),
});

/**
 * Co-researcher validation schema
 */
const coResearcherSchema = z.object({
  name: z.string().min(2, 'Co-researcher name is required'),
});

/**
 * Adviser validation schema
 */
const adviserSchema = z.object({
  name: z.string().min(2, 'Adviser name is required'),
});

/**
 * Study site validation schema
 */
const studySiteSchema = z.object({
  research_within_university: z.boolean(),
  research_outside_university: z.object({
    is_outside: z.boolean(),
    specify: z.string().optional(),
  }).refine((data) => {
    // If research is outside university, specification is required
    if (data.is_outside && (!data.specify || data.specify.trim().length === 0)) {
      return false;
    }
    return true;
  }, {
    message: 'Please specify the external research site',
    path: ['specify'],
  }),
});

/**
 * Source of funding validation schema
 */
const sourceOfFundingSchema = z.object({
  self_funded: z.boolean(),
  institution_funded: z.boolean(),
  government_funded: z.boolean(),
  pharmaceutical_company: z.object({
    is_funded: z.boolean(),
    specify: z.string().optional(),
  }).refine((data) => {
    // If pharmaceutical funded, specification is required
    if (data.is_funded && (!data.specify || data.specify.trim().length === 0)) {
      return false;
    }
    return true;
  }, {
    message: 'Please specify the pharmaceutical company',
    path: ['specify'],
  }),
  scholarship: z.boolean(),
  research_grant: z.boolean(),
  others: z.string().optional(),
}).refine((data) => {
  // At least one funding source must be selected
  const hasFunding = data.self_funded || 
                    data.institution_funded || 
                    data.government_funded || 
                    data.pharmaceutical_company.is_funded || 
                    data.scholarship || 
                    data.research_grant ||
                    (data.others && data.others.trim().length > 0);
  return hasFunding;
}, {
  message: 'Please select at least one funding source',
  path: ['self_funded'], // Point to first option
});

/**
 * Study duration validation schema
 */
const studyDurationSchema = z.object({
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
}).refine((data) => {
  // End date should be after start date
  const startDate = new Date(data.start_date);
  const endDate = new Date(data.end_date);
  return endDate > startDate;
}, {
  message: 'End date must be after start date',
  path: ['end_date'],
});

/**
 * Participants validation schema
 */
const participantsSchema = z.object({
  number_of_participants: z.number().min(1, 'Number of participants must be at least 1'),
  type_and_description: z.string().min(10, 'Participant description is required (minimum 10 characters)'),
});

/**
 * Document checklist validation schema (legacy - no longer used)
 */
// const documentChecklistSchema = z.object({
//   basic_requirements: z.array(z.string()),
//   supplementary_documents: z.array(z.string()),
// });

/**
 * Main submission form validation schema
 */
export const submissionSchema = z.object({
  // General Information
  general_information: z.object({
    spup_rec_code: z.string().optional(), // Auto-generated, not user input
    protocol_title: z.string().min(5, 'Protocol title is required (minimum 5 characters)'),
    principal_investigator: principalInvestigatorSchema,
    co_researchers: z.array(coResearcherSchema).min(0),
    advisers: z.array(adviserSchema).min(1, 'At least one adviser is required'),
  }),

  // Nature and Type of Study
  nature_and_type_of_study: z.object({
    level: z.enum([
      'Undergraduate Thesis',
      'Master\'s Thesis', 
      'Doctoral Dissertation',
      'Faculty/Staff',
      'Funded Research',
      'Others'
    ], {
      required_error: 'Please select the study level',
    }),
    type: z.enum([
      'Social/Behavioral',
      'Public Health Research',
      'Health Operations',
      'Biomedical Studies',
      'Clinical Trials',
      'Others'
    ], {
      required_error: 'Please select the study type',
    }),
  }),

  // Study Site
  study_site: studySiteSchema,

  // Source of Funding
  source_of_funding: sourceOfFundingSchema,

  // Duration
  duration_of_study: studyDurationSchema,

  // Participants
  participants: participantsSchema,

  // Brief Description
  brief_description_of_study: z.string().min(50, 'Brief description is required (minimum 50 characters)'),
});

/**
 * Step 1 validation schema (General Information)
 */
export const step1Schema = z.object({
  general_information: submissionSchema.shape.general_information,
  nature_and_type_of_study: submissionSchema.shape.nature_and_type_of_study,
  study_site: submissionSchema.shape.study_site,
  source_of_funding: submissionSchema.shape.source_of_funding,
  duration_of_study: submissionSchema.shape.duration_of_study,
  participants: submissionSchema.shape.participants,
  brief_description_of_study: submissionSchema.shape.brief_description_of_study,
});

/**
 * Step 2 validation schema (Documents) - No longer needed since documents are handled separately
 */
export const step2Schema = z.object({});

/**
 * Document upload validation schema
 */
export const documentUploadSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Document title is required'),
  file: z.instanceof(File, { message: 'Please select a file' }),
  required: z.boolean(),
  category: z.enum(['basic_requirements', 'supplementary_documents']),
}).refine((data) => {
  // Check file size (max 10MB)
  if (data.file.size > 10 * 1024 * 1024) {
    return false;
  }
  return true;
}, {
  message: 'File size must be less than 10MB',
  path: ['file'],
}).refine((data) => {
  // Check file type (PDF, DOC, DOCX)
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  return allowedTypes.includes(data.file.type);
}, {
  message: 'File must be PDF, DOC, or DOCX format',
  path: ['file'],
});

/**
 * Type inference from schemas
 */
export type SubmissionFormData = z.infer<typeof submissionSchema>;
export type Step1FormData = z.infer<typeof step1Schema>;
export type Step2FormData = z.infer<typeof step2Schema>; // Empty since documents handled separately
export type DocumentUploadData = z.infer<typeof documentUploadSchema>; 