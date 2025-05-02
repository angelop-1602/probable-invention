'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';

// Zod schema for full protocol review form
const protocolReviewSchema = z.object({
  protocolCode: z.string().min(1, 'Required'),
  submissionDate: z.string().min(1, 'Required'),
  title: z.string().min(1, 'Required'),
  studySite: z.string().min(1, 'Required'),
  principalInvestigator: z.string().min(1, 'Required'),
  sponsor: z.string().min(1, 'Required'),
  typeOfReview: z.enum(['expedited', 'full']),
  socialValue: z.enum(['yes', 'no', 'unable']),
  socialValueComments: z.string().optional(),
  studyObjectives: z.enum(['yes', 'no', 'unable']),
  studyObjectivesComments: z.string().optional(),
  literatureReview: z.enum(['yes', 'no', 'unable']),
  literatureReviewComments: z.string().optional(),
  researchDesign: z.enum(['yes', 'no', 'unable']),
  researchDesignComments: z.string().optional(),
  dataCollection: z.enum(['yes', 'no', 'unable']),
  dataCollectionComments: z.string().optional(),
  inclusionExclusion: z.enum(['yes', 'no', 'unable']),
  inclusionExclusionComments: z.string().optional(),
  withdrawalCriteria: z.enum(['yes', 'no', 'unable']),
  withdrawalCriteriaComments: z.string().optional(),
  facilities: z.enum(['yes', 'no', 'unable']),
  facilitiesComments: z.string().optional(),
  investigatorQualification: z.enum(['yes', 'no', 'unable']),
  investigatorQualificationComments: z.string().optional(),
  privacyConfidentiality: z.enum(['yes', 'no', 'unable']),
  privacyConfidentialityComments: z.string().optional(),
  conflictOfInterest: z.enum(['yes', 'no', 'unable']),
  conflictOfInterestComments: z.string().optional(),
  humanParticipants: z.enum(['yes', 'no', 'unable']),
  humanParticipantsComments: z.string().optional(),
  vulnerablePopulations: z.enum(['yes', 'no', 'unable']),
  vulnerablePopulationsComments: z.string().optional(),
  voluntaryRecruitment: z.enum(['yes', 'no', 'unable']),
  voluntaryRecruitmentComments: z.string().optional(),
  riskBenefit: z.enum(['yes', 'no', 'unable']),
  riskBenefitComments: z.string().optional(),
  informedConsent: z.enum(['yes', 'no', 'unable']),
  informedConsentComments: z.string().optional(),
  communityConsiderations: z.enum(['yes', 'no', 'unable']),
  communityConsiderationsComments: z.string().optional(),
  collaborativeTerms: z.enum(['yes', 'no', 'unable']),
  collaborativeTermsComments: z.string().optional(),
  recommendation: z.enum(['approved', 'minor', 'major', 'disapproved']),
  justification: z.string().optional(),
});

type ProtocolReviewFormValues = z.infer<typeof protocolReviewSchema>;

export default function ProtocolReviewForm({ readOnly = false }: { readOnly?: boolean }) {
  const form = useForm<ProtocolReviewFormValues>({
    resolver: zodResolver(protocolReviewSchema),
    defaultValues: {
      protocolCode: '',
      submissionDate: '',
      title: '',
      studySite: '',
      principalInvestigator: '',
      sponsor: '',
      typeOfReview: 'expedited',
      socialValue: 'unable',
      studyObjectives: 'unable',
      literatureReview: 'unable',
      researchDesign: 'unable',
      dataCollection: 'unable',
      inclusionExclusion: 'unable',
      withdrawalCriteria: 'unable',
      facilities: 'unable',
      investigatorQualification: 'unable',
      privacyConfidentiality: 'unable',
      conflictOfInterest: 'unable',
      humanParticipants: 'unable',
      vulnerablePopulations: 'unable',
      voluntaryRecruitment: 'unable',
      riskBenefit: 'unable',
      informedConsent: 'unable',
      communityConsiderations: 'unable',
      collaborativeTerms: 'unable',
      recommendation: 'approved',
      socialValueComments: '',
      studyObjectivesComments: '',
      literatureReviewComments: '',
      researchDesignComments: '',
      dataCollectionComments: '',
      inclusionExclusionComments: '',
      withdrawalCriteriaComments: '',
      facilitiesComments: '',
      investigatorQualificationComments: '',
      privacyConfidentialityComments: '',
      conflictOfInterestComments: '',
      humanParticipantsComments: '',
      vulnerablePopulationsComments: '',
      voluntaryRecruitmentComments: '',
      riskBenefitComments: '',
      informedConsentComments: '',
      communityConsiderationsComments: '',
      collaborativeTermsComments: '',
      justification: '',
    },
  });

  const onSubmit = (values: ProtocolReviewFormValues) => {
    console.log('Form Data:', values);
    // Integrate with your server or API here
  };

  const renderYesNoUnable = (name: keyof ProtocolReviewFormValues, label: string, description: string) => (
    <FormField name={name} render={({ field }) => (
      <FormItem className="space-y-1">
        <FormLabel>{label}</FormLabel>
        <p className="text-sm">{description}</p>
        <FormControl>
          <RadioGroup 
            value={field.value} 
            onValueChange={field.onChange} 
            disabled={readOnly}
            className="flex space-x-6"
          >
            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="yes" /></FormControl><FormLabel>Yes</FormLabel></FormItem>
            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="no" /></FormControl><FormLabel>No</FormLabel></FormItem>
            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="unable" /></FormControl><FormLabel>Unable to assess</FormLabel></FormItem>
          </RadioGroup>
        </FormControl>
        <FormControl>
          <Textarea 
            placeholder="Comments..." 
            {...form.register(`${name}Comments` as any)} 
            disabled={readOnly}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )} />
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Protocol Review Form</h1>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-4">
        {/* I. Protocol Information */}
        <div className="grid grid-cols-2 gap-4">
          <FormField name="protocolCode" render={({ field }) => (
            <FormItem>
              <FormLabel>SPUP REC Protocol Code</FormLabel>
              <FormControl><Input placeholder="Enter protocol code" {...field} readOnly={readOnly} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="submissionDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Submission Date</FormLabel>
              <FormControl><Input type="date" {...field} readOnly={readOnly} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="title" render={({ field }) => (
            <FormItem>
              <FormLabel>Protocol Title</FormLabel>
              <FormControl><Input placeholder="Enter study title" {...field} readOnly={readOnly} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="studySite" render={({ field }) => (
            <FormItem>
              <FormLabel>Study Site</FormLabel>
              <FormControl><Input placeholder="Enter study site" {...field} readOnly={readOnly} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="principalInvestigator" render={({ field }) => (
            <FormItem>
              <FormLabel>Name of Principal Investigator</FormLabel>
              <FormControl><Input placeholder="Enter PI name" {...field} readOnly={readOnly} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="sponsor" render={({ field }) => (
            <FormItem>
              <FormLabel>Sponsor / CRO / Institution</FormLabel>
              <FormControl><Input placeholder="Enter sponsor or institution" {...field} readOnly={readOnly} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="typeOfReview" render={({ field }) => (
            <FormItem>
              <FormLabel>Type of Review</FormLabel>
              <FormControl>
                <RadioGroup 
                  value={field.value} 
                  onValueChange={field.onChange} 
                  disabled={readOnly}
                  className="flex space-x-6"
                >
                  <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="expedited" /></FormControl><FormLabel>Expedited</FormLabel></FormItem>
                  <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="full" /></FormControl><FormLabel>Full Review</FormLabel></FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* II. Assessment Points */}
        <div className="space-y-6">
          {/* 1. Social Value */}
          {renderYesNoUnable('socialValue', '1. SOCIAL VALUE', 'Does the study have scientific or social value?')}

          {/* 2. Scientific Soundness Subsections */}
          <FormLabel className="text-lg font-semibold">2. SCIENTIFIC SOUNDNESS</FormLabel>
          {renderYesNoUnable('studyObjectives', '2.1 Study Objectives', 'Are the proposal\'s scientific question(s) reasonable?')}
          {renderYesNoUnable('literatureReview', '2.2 Literature Review', 'Does the protocol adequately present informational background and justify the need based on previous studies?')}
          {renderYesNoUnable('researchDesign', '2.3 Research and Sampling Design', 'Is the study design and sampling technique appropriate?')}
          {renderYesNoUnable('dataCollection', '2.4 Specimen/Data Collection, Processing, Storage', 'Are procedures for collecting, processing, and storing data adequate?')}
          {renderYesNoUnable('inclusionExclusion', '2.5 Inclusion/Exclusion Criteria', 'Are the features of the target population appropriate?')}
          {renderYesNoUnable('withdrawalCriteria', '2.6 Withdrawal Criteria', 'Is there provision for participant withdrawal?')}
          {renderYesNoUnable('facilities', '2.7 Facilities/Infrastructure', 'Are research facilities and infrastructure adequate?')}
          {renderYesNoUnable('investigatorQualification', '2.8 Investigator Qualifications', 'Are investigators qualified to conduct the study?')}
          {renderYesNoUnable('privacyConfidentiality', '2.9 Privacy and Confidentiality', 'Are measures to protect privacy and confidentiality sufficient?')}
          {renderYesNoUnable('conflictOfInterest', '2.10 Conflict of Interest', 'Are potential conflicts of interest disclosed and managed?')}
          {renderYesNoUnable('humanParticipants', '2.11 Human Participants', 'Are protections for human participants adequate?')}
          {renderYesNoUnable('vulnerablePopulations', '2.12 Vulnerable Populations', 'Are additional safeguards in place for vulnerable groups?')}
          {renderYesNoUnable('voluntaryRecruitment', '2.13 Voluntary Recruitment', 'Is participant recruitment voluntary and free from coercion?')}
          {renderYesNoUnable('riskBenefit', '2.14 Risk/Benefit Assessment', 'Are risks minimized and benefits justified?')}
          {renderYesNoUnable('informedConsent', '2.15 Informed Consent', 'Is informed consent process adequate?')}
          {renderYesNoUnable('communityConsiderations', '2.16 Community Considerations', 'Are community impacts and considerations addressed?')}
          {renderYesNoUnable('collaborativeTerms', '2.17 Collaborative Terms', 'Are terms of collaboration and data sharing defined?')}
        </div>

        {/* III. Recommendation */}
        <div className="space-y-2">
          <FormLabel className="font-medium">III. RECOMMENDATION</FormLabel>
          <FormField name="recommendation" render={({ field }) => (
            <FormItem className="space-y-2">
              <FormControl>
                <RadioGroup 
                  value={field.value} 
                  onValueChange={field.onChange} 
                  disabled={readOnly}
                  className="flex space-x-6"
                >
                  <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="approved" /></FormControl><FormLabel>Approved</FormLabel></FormItem>
                  <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="minor" /></FormControl><FormLabel>Minor Modifications</FormLabel></FormItem>
                  <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="major" /></FormControl><FormLabel>Major Modifications</FormLabel></FormItem>
                  <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="disapproved" /></FormControl><FormLabel>Disapproved</FormLabel></FormItem>
                </RadioGroup>
              </FormControl>
              <FormDescription>Justification</FormDescription>
              <FormControl>
                <Textarea 
                  placeholder="Provide justification..." 
                  {...form.register('justification')} 
                  disabled={readOnly}
                />
              </FormControl>
            </FormItem>
          )} />
        </div>

        {!readOnly && <Button type="submit" className="w-full">Submit Review</Button>}
      </form>
    </Form>
    </div>
  );
}
