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

// Zod schema for Exemption Checklist
const exemptionSchema = z.object({
  protocolCode: z.string().min(1, 'Required'),
  submissionDate: z.string().min(1, 'Required'),
  title: z.string().min(1, 'Required'),
  studySite: z.string().min(1, 'Required'),
  principalInvestigator: z.string().min(1, 'Required'),
  sponsor: z.string().min(1, 'Required'),

  // Section 1: Scope of Exemption
  involvesHumanParticipants: z.enum(['yes', 'no']),
  involvesHumanParticipantsComments: z.string().optional(),
  involvesNonIdentifiableTissue: z.enum(['yes', 'no']),
  involvesNonIdentifiableTissueComments: z.string().optional(),
  involvesPublicData: z.enum(['yes', 'no']),
  involvesPublicDataComments: z.string().optional(),
  involvesInteraction: z.enum(['yes', 'no']),
  involvesInteractionComments: z.string().optional(),

  // Section 2: Type of Research
  qualityAssurance: z.enum(['yes', 'no']),
  qualityAssuranceComments: z.string().optional(),
  publicServiceEvaluation: z.enum(['yes', 'no']),
  publicServiceEvaluationComments: z.string().optional(),
  publicHealthSurveillance: z.enum(['yes', 'no']),
  publicHealthSurveillanceComments: z.string().optional(),
  educationalEvaluation: z.enum(['yes', 'no']),
  educationalEvaluationComments: z.string().optional(),
  consumerAcceptability: z.enum(['yes', 'no']),
  consumerAcceptabilityComments: z.string().optional(),

  // Section 3: Data Collection Methods
  surveysQuestionnaire: z.enum(['yes', 'no']),
  surveysQuestionnaireComments: z.string().optional(),
  interviewsFocusGroup: z.enum(['yes', 'no']),
  interviewsFocusGroupComments: z.string().optional(),
  publicObservations: z.enum(['yes', 'no']),
  publicObservationsComments: z.string().optional(),
  existingData: z.enum(['yes', 'no']),
  existingDataComments: z.string().optional(),
  audioVideo: z.enum(['yes', 'no']),
  audioVideoComments: z.string().optional(),

  // Section 4: Data Anonymization and Risk
  dataAnonymization: z.enum(['anonymized', 'identifiable', 'de-identified']),
  foreseeableRisk: z.enum(['yes', 'no']),
  foreseeableRiskComments: z.string().optional(),

  // Section 5: Additional Risk Categories
  riskVulnerableGroups: z.enum(['yes', 'no']),
  riskVulnerableGroupsComments: z.string().optional(),
  riskSensitiveTopics: z.enum(['yes', 'no']),
  riskSensitiveTopicsComments: z.string().optional(),
  riskUseOfDrugs: z.enum(['yes', 'no']),
  riskUseOfDrugsComments: z.string().optional(),
  riskInvasiveProcedure: z.enum(['yes', 'no']),
  riskInvasiveProcedureComments: z.string().optional(),
  riskPhysicalDistress: z.enum(['yes', 'no']),
  riskPhysicalDistressComments: z.string().optional(),
  riskPsychologicalDistress: z.enum(['yes', 'no']),
  riskPsychologicalDistressComments: z.string().optional(),
  riskDeception: z.enum(['yes', 'no']),
  riskDeceptionComments: z.string().optional(),
  riskAccessData: z.enum(['yes', 'no']),
  riskAccessDataComments: z.string().optional(),
  riskConflictInterest: z.enum(['yes', 'no']),
  riskConflictInterestComments: z.string().optional(),
  riskOtherDilemmas: z.enum(['yes', 'no']),
  riskOtherDilemmasComments: z.string().optional(),
  riskBloodSampling: z.enum(['yes', 'no']),
  riskBloodSamplingComments: z.string().optional(),

  // Decision
  decision: z.enum(['qualified', 'unqualified']),
  decisionJustification: z.string().min(1, 'Required'),
});

type ExemptionFormValues = z.infer<typeof exemptionSchema>;

export default function ExemptionChecklistForm({ readOnly = false }: { readOnly?: boolean }) {
  const form = useForm<ExemptionFormValues>({
    resolver: zodResolver(exemptionSchema),
    defaultValues: {
      involvesHumanParticipants: 'no',
      involvesNonIdentifiableTissue: 'no',
      involvesPublicData: 'no',
      involvesInteraction: 'no',
      qualityAssurance: 'no',
      publicServiceEvaluation: 'no',
      publicHealthSurveillance: 'no',
      educationalEvaluation: 'no',
      consumerAcceptability: 'no',
      surveysQuestionnaire: 'no',
      interviewsFocusGroup: 'no',
      publicObservations: 'no',
      existingData: 'no',
      audioVideo: 'no',
      dataAnonymization: 'anonymized',
      foreseeableRisk: 'no',
      riskVulnerableGroups: 'no',
      riskSensitiveTopics: 'no',
      riskUseOfDrugs: 'no',
      riskInvasiveProcedure: 'no',
      riskPhysicalDistress: 'no',
      riskPsychologicalDistress: 'no',
      riskDeception: 'no',
      riskAccessData: 'no',
      riskConflictInterest: 'no',
      riskOtherDilemmas: 'no',
      riskBloodSampling: 'no',
      decision: 'qualified',
      decisionJustification: '',
    },
  });

  const onSubmit = (values: ExemptionFormValues) => {
    console.log('Exemption Form Data:', values);
    // TODO: integrate with API
  };

  const renderYesNo = (
    name: keyof ExemptionFormValues,
    label: string,
    description?: string
  ) => (
    <FormField
      name={name as string}
      render={({ field }) => (
        <FormItem className="space-y-1">
          <FormLabel>{label}</FormLabel>
          {description && <p className="text-sm">{description}</p>}
          <FormControl>
            <RadioGroup value={field.value} onValueChange={field.onChange} className="flex space-x-6" disabled={readOnly}>
              <FormItem className="flex items-center space-x-2">
                <FormControl><RadioGroupItem value="yes" /></FormControl>
                <FormLabel>Yes</FormLabel>
              </FormItem>
              <FormItem className="flex items-center space-x-2">
                <FormControl><RadioGroupItem value="no" /></FormControl>
                <FormLabel>No</FormLabel>
              </FormItem>
            </RadioGroup>
          </FormControl>
          <FormControl>
            <Textarea placeholder="Comments..." {...form.register(`${name}Comments`)} disabled={readOnly} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const renderThreeOptions = (
    name: keyof ExemptionFormValues,
    label: string,
    options: Array<{ value: string; label: string }>,
    readOnly: boolean
  ) => (
    <FormField
      name={name as string}
      render={({ field }) => (
        <FormItem className="space-y-1">
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <RadioGroup value={field.value} onValueChange={field.onChange} className="flex space-x-6" disabled={readOnly}>
              {options.map(opt => (
                <FormItem key={opt.value} className="flex items-center space-x-2">
                  <FormControl><RadioGroupItem value={opt.value as any} /></FormControl>
                  <FormLabel>{opt.label}</FormLabel>
                </FormItem>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Exemption Checklist Form</h1>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-4">
        {/* I. Protocol Information */}
        <div className="grid grid-cols-2 gap-4">
          <FormField name="protocolCode" render={({ field }) => (
            <FormItem>
              <FormLabel>Protocol Code</FormLabel>
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
              <FormControl><Input placeholder="Enter title" {...field} readOnly={readOnly} /></FormControl>
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
              <FormLabel>Principal Investigator</FormLabel>
              <FormControl><Input placeholder="Enter PI name" {...field} readOnly={readOnly} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="sponsor" render={({ field }) => (
            <FormItem>
              <FormLabel>Sponsor / CRO / Institution</FormLabel>
              <FormControl><Input placeholder="Enter sponsor" {...field} readOnly={readOnly} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* II. Exemption Checklist Sections */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">1. Scope of Exemption</h2>
          {renderYesNo('involvesHumanParticipants', '1.1 Involvement of Human Participants',
            'Does the project involve human participants?')}
          {renderYesNo('involvesNonIdentifiableTissue', '1.2 Use of Non-Identifiable Tissue Samples')}
          {renderYesNo('involvesPublicData', '1.3 Use of Publicly Available Data')}
          {renderYesNo('involvesInteraction', '1.4 Interaction with Subjects')}

          <h2 className="text-lg font-semibold">2. Type of Research</h2>
          {renderYesNo('qualityAssurance', '2.1 Quality Assurance or Improvement Activities')}
          {renderYesNo('publicServiceEvaluation', '2.2 Public Service Program Evaluations')}
          {renderYesNo('publicHealthSurveillance', '2.3 Public Health Surveillance')}
          {renderYesNo('educationalEvaluation', '2.4 Evaluation of Educational Practices')}
          {renderYesNo('consumerAcceptability', '2.5 Consumer Acceptability Studies')}

          <h2 className="text-lg font-semibold">3. Data Collection Methods</h2>
          {renderYesNo('surveysQuestionnaire', '3.1 Surveys or Questionnaires')}
          {renderYesNo('interviewsFocusGroup', '3.2 Interviews or Focus Groups')}
          {renderYesNo('publicObservations', '3.3 Public Observations')}
          {renderYesNo('existingData', '3.4 Use of Existing Data')}
          {renderYesNo('audioVideo', '3.5 Audio/Video Recording in Public Settings')}

          <h2 className="text-lg font-semibold">4. Data Anonymization and Risk</h2>
          {renderThreeOptions('dataAnonymization', '4.1 Data Anonymization', [
            { value: 'anonymized', label: 'Anonymized' },
            { value: 'identifiable', label: 'Identifiable' },
            { value: 'de-identified', label: 'De-identified' },
          ], readOnly)}
          {renderYesNo('foreseeableRisk', '4.2 Foreseeable Risks')}

          <h2 className="text-lg font-semibold">5. Additional Risk Categories</h2>
          {renderYesNo('riskVulnerableGroups', '5.1 Vulnerable Populations')}
          {renderYesNo('riskSensitiveTopics', '5.2 Sensitive Topics')}
          {renderYesNo('riskUseOfDrugs', '5.3 Use of Drugs')}
          {renderYesNo('riskInvasiveProcedure', '5.4 Invasive Procedures')}
          {renderYesNo('riskPhysicalDistress', '5.5 Physical Distress')}
          {renderYesNo('riskPsychologicalDistress', '5.6 Psychological Distress')}
          {renderYesNo('riskDeception', '5.7 Deception')}
          {renderYesNo('riskAccessData', '5.8 Access to Private Data')}
          {renderYesNo('riskConflictInterest', '5.9 Conflict of Interest')}
          {renderYesNo('riskOtherDilemmas', '5.10 Other Ethical Dilemmas')}
          {renderYesNo('riskBloodSampling', '5.11 Blood Sampling')}
        </div>

        {/* III. Decision */}
        <div className="space-y-2">
          <FormLabel className="font-medium text-lg">Decision</FormLabel>
          <FormField name="decision" render={({ field }) => (
            <FormItem className="space-y-1">
              <FormControl>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="flex space-x-6" disabled={readOnly}>
                  <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="qualified" /></FormControl><FormLabel>Qualified for Exemption</FormLabel></FormItem>
                  <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="unqualified" /></FormControl><FormLabel>Not Exempt</FormLabel></FormItem>
                </RadioGroup>
              </FormControl>
              <FormDescription>Provide justification for decision</FormDescription>
              <FormControl><Textarea placeholder="Enter justification" {...form.register('decisionJustification')} disabled={readOnly} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {!readOnly && <Button type="submit" className="w-full">Submit Exemption Review</Button>}
      </form>
    </Form>
    </div>
  );
}
