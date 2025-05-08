import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

export interface ReviewForm {
  id: string;
  name: string;
  code: string;
  description: string;
  component: string;
}

export class ReviewFormService {
  private static instance: ReviewFormService;
  private forms: ReviewForm[] = [
    {
      id: 'form-06a',
      name: 'Protocol Review',
      code: 'Form 06A',
      description: 'Comprehensive protocol evaluation including methodology assessment, risk-benefit analysis, ethical compliance, and scientific merit.',
      component: 'ProtocolReviewForm'
    },
    {
      id: 'form-06c',
      name: 'Informed Consent Review',
      code: 'Form 06C',
      description: 'Consent document clarity assessment including document readability, participant clarity, voluntariness, and regulatory adherence.',
      component: 'InformedConsentForm'
    },
    {
      id: 'form-06b',
      name: 'Protocol IACUC Review',
      code: 'Form 06B',
      description: 'Animal welfare protocol review including welfare considerations, 3Rs principle, humane endpoints, and justification of use.',
      component: 'IACUCForm'
    },
    {
      id: 'form-04a',
      name: 'Exemption Checklist',
      code: 'Form 04A',
      description: 'Exemption qualification check including criteria validation, minimal risk assessment, compliance check, and classification.',
      component: 'ExemptionChecklistForm'
    }
  ];

  private constructor() {}

  public static getInstance(): ReviewFormService {
    if (!ReviewFormService.instance) {
      ReviewFormService.instance = new ReviewFormService();
    }
    return ReviewFormService.instance;
  }

  /**
   * Get all available review forms
   */
  public getForms(): ReviewForm[] {
    return this.forms;
  }

  /**
   * Get a specific form by its code
   */
  public getFormByCode(code: string): ReviewForm | undefined {
    return this.forms.find(form => form.code === code);
  }

  /**
   * Get a specific form by its ID
   */
  public getFormById(id: string): ReviewForm | undefined {
    return this.forms.find(form => form.id === id);
  }

  /**
   * Get forms by type (e.g., protocol, consent, iacuc, exemption)
   */
  public getFormsByType(type: string): ReviewForm[] {
    return this.forms.filter(form => form.id.includes(type));
  }

  /**
   * Update the reviewer's form assignment in Firestore
   */
  public async updateReviewerForm(
    applicationId: string,
    reviewerId: string,
    formCode: string
  ): Promise<void> {
    try {
      const applicationRef = doc(db, 'protocolReviewApplications', applicationId);
      const form = this.getFormByCode(formCode);
      
      if (!form) {
        throw new Error('Invalid form code');
      }

      await updateDoc(applicationRef, {
        [`reviewers.${reviewerId}.reviewForm`]: formCode,
        [`reviewers.${reviewerId}.formId`]: form.id,
        [`reviewers.${reviewerId}.formName`]: form.name,
        updatedAt: serverTimestamp()
      });

      toast.success('Review form assigned successfully');
    } catch (error) {
      console.error('Error assigning review form:', error);
      toast.error('Failed to assign review form');
      throw error;
    }
  }

  /**
   * Get the component name for a form
   */
  public getFormComponent(formCode: string): string | undefined {
    const form = this.getFormByCode(formCode);
    return form?.component;
  }
} 