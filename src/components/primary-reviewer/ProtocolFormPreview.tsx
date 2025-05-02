import { useState, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClipboardCheck, FileText, FileCheck, Shield } from 'lucide-react';

// Dynamic imports for each form preview
const ProtocolReviewForm = dynamic(
  () => import('@/components/primary-reviewer/forms/protocol-review-assesment-form'),
  { loading: () => <p>Loading Protocol Form...</p> }
);
const InformedConsentForm = dynamic(
  () => import('@/components/primary-reviewer/forms/informed-consent-assesment-form'),
  { loading: () => <p>Loading Consent Form...</p> }
);
const ExemptionChecklistForm = dynamic(
  () => import('@/components/primary-reviewer/forms/exemption-checklist-form'),
  { loading: () => <p>Loading Exemption Form...</p> }
);
const IACUCForm = dynamic(
  () => import('@/components/primary-reviewer/forms/protcol-review-IACUC-form'),
  { loading: () => <p>Loading IACUC Form...</p> }
);

// Configuration for each preview card
interface FormPreviewConfig {
  key: string;
  title: string;
  description: string;
  details: string[];
  icon: React.ComponentType<any>;
}

const FORM_PREVIEWS: FormPreviewConfig[] = [
  {
    key: 'protocol-review',
    title: 'Protocol Review',
    description: 'Comprehensive protocol evaluation.',
    details: [
      'Methodology assessment',
      'Risk–benefit analysis',
      'Ethical compliance',
      'Scientific merit'
    ],
    icon: ClipboardCheck
  },
  {
    key: 'informed-consent',
    title: 'Informed Consent',
    description: 'Consent document clarity.',
    details: [
      'Document readability',
      'Participant clarity',
      'Voluntariness',
      'Regulatory adherence'
    ],
    icon: FileText
  },
  {
    key: 'exemption',
    title: 'Exemption Checklist',
    description: 'Exemption qualification check.',
    details: [
      'Criteria validation',
      'Minimal risk',
      'Compliance check',
      'Classification'
    ],
    icon: FileCheck
  },
  {
    key: 'iacuc',
    title: 'IACUC Review',
    description: 'Animal welfare protocol review.',
    details: [
      'Welfare considerations',
      '3Rs principle',
      'Humane endpoints',
      'Justification of use'
    ],
    icon: Shield
  }
];

export default function PrimaryReviewerPage() {
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [isOpen, setOpen] = useState(false);

  // Map each key to its dynamic form component
  const formsMap: Record<string, React.ComponentType<any>> = {
    'protocol-review': ProtocolReviewForm,
    'informed-consent': InformedConsentForm,
    exemption: ExemptionChecklistForm,
    iacuc: IACUCForm
  };

  const openPreview = (key: string) => {
    setPreviewKey(key);
    setOpen(true);
  };
  const closePreview = () => setOpen(false);

  // Generate the cards
  const cards = useMemo(
    () => FORM_PREVIEWS.map(({ key, title, description, details, icon: Icon }) => (
      <Card
        key={key}
        className="flex flex-col w-80 bg-white hover:shadow-lg transition-shadow"
      >
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Icon size={24} className="text-primary-600" />
            <CardTitle className="text-base font-medium">{title}</CardTitle>
          </div>
          <CardDescription className="text-sm text-gray-500">{description}</CardDescription>
        </CardHeader>

        <Separator />

        <CardContent className="flex-1">
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
            {details.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </CardContent>

        <CardFooter>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => openPreview(key)}
          >
            Preview
          </Button>
        </CardFooter>
      </Card>
    )),
    []
  );

  const PreviewComponent = previewKey ? formsMap[previewKey] : null;
  const currentForm = FORM_PREVIEWS.find(form => form.key === previewKey);

  return (
    <section aria-labelledby="form-preview-heading" className="py-12 bg-gray-50">
      <div className="mx-auto px-6">
        <header className="text-center mb-8">
          <h2 id="form-preview-heading" className="text-2xl font-extrabold">Review Form Previews</h2>
          <p className="mt-2 text-gray-600">Get a quick look at each review form.</p>
        </header>

        {/* Flex row with equal-height, centered cards */}
        <div className="flex justify-center overflow-x-auto gap-6 items-stretch pb-4">
          {cards}
        </div>
      </div>

      {isOpen && PreviewComponent && (
        <Dialog open={isOpen} onOpenChange={closePreview}>
          <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>{currentForm?.title} Form Preview</DialogTitle>
            </DialogHeader>
            <Suspense fallback={<p>Loading...</p>}>
              <PreviewComponent readOnly={true} />
            </Suspense>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}
