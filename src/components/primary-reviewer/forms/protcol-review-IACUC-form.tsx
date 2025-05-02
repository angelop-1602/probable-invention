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

// Zod schema for IACUC protocol review
const iacucReviewSchema = z.object({
  iacucCode: z.string().min(1, 'Required'),
  submissionDate: z.string().min(1, 'Required'),
  title: z.string().min(1, 'Required'),
  studySite: z.string().min(1, 'Required'),
  principalInvestigator: z.string().min(1, 'Required'),
  sponsor: z.string().min(1, 'Required'),
  typeOfReview: z.enum(['expedited', 'full']),

  scientificValue: z.enum(['yes', 'no', 'unable']),
  scientificValueComments: z.string().optional(),

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
  facilitiesInfrastructure: z.enum(['yes', 'no', 'unable']),
  facilitiesInfrastructureComments: z.string().optional(),
  investigatorQualifications: z.enum(['yes', 'no', 'unable']),
  investigatorQualificationsComments: z.string().optional(),
  privacyConfidentiality: z.enum(['yes', 'no', 'unable']),
  privacyConfidentialityComments: z.string().optional(),
  conflictOfInterest: z.enum(['yes', 'no', 'unable']),
  conflictOfInterestComments: z.string().optional(),

  animalSource: z.enum(['yes', 'no', 'unable']),
  animalSourceComments: z.string().optional(),
  housingCare: z.enum(['yes', 'no', 'unable']),
  housingCareComments: z.string().optional(),
  restraintProcedures: z.enum(['yes', 'no', 'unable']),
  restraintProceduresComments: z.string().optional(),
  anesthesiaAnalgesia: z.enum(['yes', 'no', 'unable']),
  anesthesiaAnalgesiaComments: z.string().optional(),
  postProcedureMonitoring: z.enum(['yes', 'no', 'unable']),
  postProcedureMonitoringComments: z.string().optional(),
  euthanasia: z.enum(['yes', 'no', 'unable']),
  euthanasiaComments: z.string().optional(),
  biologicalAgentCollection: z.enum(['yes', 'no', 'unable']),
  biologicalAgentCollectionComments: z.string().optional(),
  examinationMethods: z.enum(['yes', 'no', 'unable']),
  examinationMethodsComments: z.string().optional(),
  surgicalProcedures: z.enum(['yes', 'no', 'unable']),
  surgicalProceduresComments: z.string().optional(),
  humaneEndpoints: z.enum(['yes', 'no', 'unable']),
  humaneEndpointsComments: z.string().optional(),
  potentialHazards: z.enum(['yes', 'no', 'unable']),
  potentialHazardsComments: z.string().optional(),
  wasteDisposal: z.enum(['yes', 'no', 'unable']),
  wasteDisposalComments: z.string().optional(),

  recommendation: z.enum(['approved', 'minor', 'major', 'disapproved']),
  justification: z.string().optional(),
});

type IACUCFormValues = z.infer<typeof iacucReviewSchema>;

export default function IACUCForm({ readOnly = false }: { readOnly?: boolean }) {
  const form = useForm<IACUCFormValues>({
    resolver: zodResolver(iacucReviewSchema),
    defaultValues: {
      typeOfReview: 'expedited',
      scientificValue: 'unable',
      studyObjectives: 'unable',
      literatureReview: 'unable',
      researchDesign: 'unable',
      dataCollection: 'unable',
      inclusionExclusion: 'unable',
      withdrawalCriteria: 'unable',
      facilitiesInfrastructure: 'unable',
      investigatorQualifications: 'unable',
      privacyConfidentiality: 'unable',
      conflictOfInterest: 'unable',
      animalSource: 'unable',
      housingCare: 'unable',
      restraintProcedures: 'unable',
      anesthesiaAnalgesia: 'unable',
      postProcedureMonitoring: 'unable',
      euthanasia: 'unable',
      biologicalAgentCollection: 'unable',
      examinationMethods: 'unable',
      surgicalProcedures: 'unable',
      humaneEndpoints: 'unable',
      potentialHazards: 'unable',
      wasteDisposal: 'unable',
      recommendation: 'approved',
    },
  });

  const onSubmit = (values: IACUCFormValues) => {
    console.log('Form Data:', values);
    // TODO: integrate with API
  };

  const renderYesNoUnable = (
    name: keyof IACUCFormValues,
    label: string,
    description: string
  ) => (
    <FormField
      name={name as string}
      render={({ field }) => (
        <FormItem className="space-y-1">
          <FormLabel>{label}</FormLabel>
          <p className="text-sm">{description}</p>
          <FormControl>
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="flex space-x-6"
              disabled={readOnly}
            >
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <RadioGroupItem value="yes" />
                </FormControl>
                <FormLabel>Yes</FormLabel>
              </FormItem>
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <RadioGroupItem value="no" />
                </FormControl>
                <FormLabel>No</FormLabel>
              </FormItem>
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <RadioGroupItem value="unable" />
                </FormControl>
                <FormLabel>Unable to assess</FormLabel>
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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">IACUC Review Form</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* I. Protocol Information */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              name="iacucCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SPUP IACUC Protocol Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter IACUC code" {...field} disabled={readOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="submissionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Submission Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} disabled={readOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Protocol Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter protocol title" {...field} disabled={readOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="studySite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Study Site</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter study site" {...field} disabled={readOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="principalInvestigator"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name of Principal Investigator</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter PI name" {...field} disabled={readOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="sponsor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sponsor / CRO / Institution</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter sponsor name" {...field} disabled={readOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="typeOfReview"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type of Review</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex space-x-6"
                      disabled={readOnly}
                    >
                      <FormItem className="flex items-center space-x-2">
                        <FormControl><RadioGroupItem value="expedited" /></FormControl>
                        <FormLabel>Expedited</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl><RadioGroupItem value="full" /></FormControl>
                        <FormLabel>Full Review</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* II. Assessment Points */}
          {renderYesNoUnable('scientificValue', '1. SCIENTIFIC VALUE', 'Does the study have scientific value?')}

          <FormLabel className="text-lg font-semibold">2. SCIENTIFIC SOUNDNESS</FormLabel>
          {renderYesNoUnable('studyObjectives', '2.1 Study Objectives', 'Are the study objectives reasonable?')}
          {renderYesNoUnable('literatureReview', '2.2 Literature Review', 'Is background and rationale adequate?')}
          {renderYesNoUnable('researchDesign', '2.3 Research & Sampling Design', 'Is design and sampling appropriate?')}
          {renderYesNoUnable('dataCollection', '2.4 Specimen/Data Collection', 'Are collection and storage procedures adequate?')}
          {renderYesNoUnable('inclusionExclusion', '2.5 Inclusion/Exclusion Criteria', 'Are population criteria appropriate?')}
          {renderYesNoUnable('withdrawalCriteria', '2.6 Withdrawal Criteria', 'Is withdrawal provision sufficient?')}
          {renderYesNoUnable('facilitiesInfrastructure', '2.7 Facilities/Infrastructure', 'Are facilities and infrastructure adequate?')}
          {renderYesNoUnable('investigatorQualifications', '2.8 Investigator Qualifications', 'Are investigators qualified?')}
          {renderYesNoUnable('privacyConfidentiality', '2.9 Privacy & Confidentiality', 'Are protections sufficient?')}
          {renderYesNoUnable('conflictOfInterest', '2.10 Conflict of Interest', 'Are conflicts managed?')} 

          <FormLabel className="text-lg font-semibold">3. ANIMAL WELFARE</FormLabel>
          {renderYesNoUnable('animalSource', '3.1 Animal Source', 'Is animal source appropriate?')}
          {renderYesNoUnable('housingCare', '3.2 Housing & Care', 'Is housing and care adequate?')}
          {renderYesNoUnable('restraintProcedures', '3.3 Restraint Procedures', 'Are restraint methods appropriate?')}
          {renderYesNoUnable('anesthesiaAnalgesia', '3.4 Anesthesia/Analgesia', 'Are anesthesia methods adequate?')}
          {renderYesNoUnable('postProcedureMonitoring', '3.5 Post-Procedure Monitoring', 'Are monitoring protocols sufficient?')}
          {renderYesNoUnable('euthanasia', '3.6 Euthanasia', 'Are endpoints humane and methods appropriate?')}
          {renderYesNoUnable('biologicalAgentCollection', '3.7 Biological Agent Collection', 'Is collection protocol safe?')}
          {renderYesNoUnable('examinationMethods', '3.8 Examination Methods', 'Are examination methods valid?')}
          {renderYesNoUnable('surgicalProcedures', '3.9 Surgical Procedures', 'Are surgical protocols appropriate?')}
          {renderYesNoUnable('humaneEndpoints', '3.10 Humane Endpoints', 'Are humane endpoints defined?')}
          {renderYesNoUnable('potentialHazards', '3.11 Potential Hazards', 'Are hazards identified and mitigated?')}
          {renderYesNoUnable('wasteDisposal', '3.12 Waste Disposal', 'Are disposal methods safe?')}

          {/* Recommendation */}
          <FormLabel className="font-medium">Recommendation</FormLabel>
          <FormField
            name="recommendation"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex space-x-6"
                    disabled={readOnly}
                  >
                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="approved" /></FormControl><FormLabel>Approved</FormLabel></FormItem>
                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="minor" /></FormControl><FormLabel>Minor Modifications</FormLabel></FormItem>
                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="major" /></FormControl><FormLabel>Major Modifications</FormLabel></FormItem>
                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="disapproved" /></FormControl><FormLabel>Disapproved</FormLabel></FormItem>
                  </RadioGroup>
                </FormControl>
                <FormDescription>Justification</FormDescription>
                <FormControl><Textarea placeholder="Provide justification..." {...form.register('justification')} disabled={readOnly} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!readOnly && <Button type="submit" className="w-full">Submit Review</Button>}
        </form>
      </Form>
    </div>
  );
}
