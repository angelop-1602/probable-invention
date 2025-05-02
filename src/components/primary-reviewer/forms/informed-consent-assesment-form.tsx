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

// Zod schema for Informed Consent Assessment
const informedConsentSchema = z.object({
  // I. Protocol Information
  protocolCode: z.string().min(1, 'Required'),
  submissionDate: z.string().min(1, 'Required'),
  principalInvestigator: z.string().min(1, 'Required'),
  title: z.string().min(1, 'Required'),
  studySite: z.string().min(1, 'Required'),
  sponsor: z.string().min(1, 'Required'),

  // II. Guide Questions 1-17
  q1: z.enum(['yes', 'no', 'unable']), q1Comments: z.string().optional(),
  q2: z.enum(['yes', 'no', 'unable']), q2Comments: z.string().optional(),
  q3: z.enum(['yes', 'no', 'unable']), q3Comments: z.string().optional(),
  q4: z.enum(['yes', 'no', 'unable']), q4Comments: z.string().optional(),
  q5: z.enum(['yes', 'no', 'unable']), q5Comments: z.string().optional(),
  q6: z.enum(['yes', 'no', 'unable']), q6Comments: z.string().optional(),
  q7: z.enum(['yes', 'no', 'unable']), q7Comments: z.string().optional(),
  q8: z.enum(['yes', 'no', 'unable']), q8Comments: z.string().optional(),
  q9: z.enum(['yes', 'no', 'unable']), q9Comments: z.string().optional(),
  q10: z.enum(['yes', 'no', 'unable']), q10Comments: z.string().optional(),
  q11: z.enum(['yes', 'no', 'unable']), q11Comments: z.string().optional(),
  q12: z.enum(['yes', 'no', 'unable']), q12Comments: z.string().optional(),
  q13: z.enum(['yes', 'no', 'unable']), q13Comments: z.string().optional(),
  q14: z.enum(['yes', 'no', 'unable']), q14Comments: z.string().optional(),
  q15: z.enum(['yes', 'no', 'unable']), q15Comments: z.string().optional(),
  q16: z.enum(['yes', 'no', 'unable']), q16Comments: z.string().optional(),
  q17: z.enum(['yes', 'no', 'unable']), q17Comments: z.string().optional(),

  // Recommendation
  recommendation: z.enum([
    'Approved',
    'Minor Modifications Required',
    'Major Modifications Required',
    'Disapproved',
  ]),
  recommendationJustification: z.string().min(1, 'Required'),
});

type InformedConsentFormValues = z.infer<typeof informedConsentSchema>;

export default function InformedConsentForm({ readOnly = false }: { readOnly?: boolean }) {
  const form = useForm<InformedConsentFormValues>({
    resolver: zodResolver(informedConsentSchema),
    defaultValues: {
      protocolCode: '', submissionDate: '', principalInvestigator: '', title: '', studySite: '', sponsor: '',
      q1: 'unable', q2: 'unable', q3: 'unable', q4: 'unable', q5: 'unable', q6: 'unable', q7: 'unable', q8: 'unable', q9: 'unable',
      q10: 'unable', q11: 'unable', q12: 'unable', q13: 'unable', q14: 'unable', q15: 'unable', q16: 'unable', q17: 'unable',
      recommendation: 'Approved', recommendationJustification: '',
    },
  });

  const onSubmit = (values: InformedConsentFormValues) => {
    console.log('Informed Consent Assessment:', values);
  };

  const renderYesNoUnable = (
    name: keyof InformedConsentFormValues,
    label: string,
    description?: string
  ) => (
    <FormField name={name as string} render={({ field }) => (
      <FormItem className="space-y-1">
        <FormLabel>{label}</FormLabel>
        {description && <p className="text-sm">{description}</p>}
        <FormControl>
          <RadioGroup value={field.value} onValueChange={field.onChange} className="flex space-x-6" disabled={readOnly}>
            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="yes"/></FormControl><FormLabel>Yes</FormLabel></FormItem>
            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="no"/></FormControl><FormLabel>No</FormLabel></FormItem>
            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="unable"/></FormControl><FormLabel>Unable to assess</FormLabel></FormItem>
          </RadioGroup>
        </FormControl>
        <FormControl><Textarea placeholder="Comments..." {...form.register(name + 'Comments' as any)} disabled={readOnly} /></FormControl>
        <FormMessage />
      </FormItem>
    )} />
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Informed Consent Assessment Form</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* I. Protocol Information */}
          <div className="grid grid-cols-2 gap-4">
            <FormField name="protocolCode" render={({ field }) => (
              <FormItem>
                <FormLabel>SPUP REC Protocol Code</FormLabel>
                <FormControl><Input {...field} placeholder="Enter protocol code" disabled={readOnly} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="submissionDate" render={({ field }) => (
              <FormItem>
                <FormLabel>Submission Date</FormLabel>
                <FormControl><Input type="date" {...field} disabled={readOnly}/></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="principalInvestigator" render={({ field }) => (
              <FormItem>
                <FormLabel>Principal Investigator</FormLabel>
                <FormControl><Input {...field} placeholder="Enter PI name" disabled={readOnly}/></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Protocol Title</FormLabel>
                <FormControl><Input {...field} placeholder="Enter title" disabled={readOnly}/></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="studySite" render={({ field }) => (
              <FormItem>
                <FormLabel>Study Site</FormLabel>
                <FormControl><Input {...field} placeholder="Enter study site" disabled={readOnly}/></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="sponsor" render={({ field }) => (
              <FormItem>
                <FormLabel>Sponsor / CRO / Institution</FormLabel>
                <FormControl><Input {...field} placeholder="Enter sponsor" disabled={readOnly}/></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          {/* II. Guide Questions */}
          {renderYesNoUnable('q1', '1. Procedures primarily intended for research', 'Does the Informed Consent document state that procedures are primarily intended for research?')}
          {renderYesNoUnable('q2', '2. Consent procedures appropriate', 'Are procedures for obtaining informed consent appropriate?')}
          {renderYesNoUnable('q3', '3. Comprehensive information', 'Does the document contain comprehensive and relevant information?')}
          {renderYesNoUnable('q4', '4. Consistency with protocol', 'Is the information provided consistent with the protocol?')}
          {renderYesNoUnable('q5', '5. Voluntary participation', 'Does it include statements on voluntary participation and right to withdraw?')}
          {renderYesNoUnable('q6', '6. No penalty for refusal', 'Does it specify refusal will not affect subject\'s relationship with the institution?')}
          {renderYesNoUnable('q7', '7. Foreseeable risks', 'Does it explain foreseeable risks and discomforts?')}
          {renderYesNoUnable('q8', '8. Potential benefits', 'Does it describe potential benefits to subjects or others?')}
          {renderYesNoUnable('q9', '9. Alternatives', 'Does it include alternatives to participation?')}
          {renderYesNoUnable('q10', '10. Confidentiality protections', 'Does it detail confidentiality protections?')}
          {renderYesNoUnable('q11', '11. Compensation for injury', 'Does it explain compensation for research-related injury?')}
          {renderYesNoUnable('q12', '12. Contact for study questions', 'Does it provide contact info for questions about the study?')}
          {renderYesNoUnable('q13', '13. Contact for rights questions', 'Does it provide contact info for questions about research subject rights?')}
          {renderYesNoUnable('q14', '14. Duration of participation', 'Does it include duration of participation?')}
          {renderYesNoUnable('q15', '15. New findings notification', 'Does it describe procedures for informing subjects of new findings?')}
          {renderYesNoUnable('q16', '16. Understandable language', 'Is language understandable to the target population?')}
          {renderYesNoUnable('q17', '17. Description of benefits', 'Does it describe the benefits of participating?')}

          {/* Recommendation */}
          <FormField name="recommendation" render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel>Recommendation</FormLabel>
              <FormControl>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="flex flex-col space-y-2" disabled={readOnly}>
                  {['Approved','Minor Modifications Required','Major Modifications Required','Disapproved'].map(opt => (
                    <FormItem key={opt} className="flex items-center space-x-2">
                      <FormControl><RadioGroupItem value={opt as any} /></FormControl>
                      <FormLabel>{opt}</FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormDescription>Justification for the Recommendation</FormDescription>
              <FormControl><Textarea placeholder="Enter justification" {...form.register('recommendationJustification')} disabled={readOnly} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {!readOnly && <Button type="submit" className="w-full">Submit Assessment</Button>}
        </form>
      </Form>
    </div>
  );
}
