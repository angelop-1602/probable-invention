'use client';

import ProtocolReviewForm from '@/components/primary-reviewer/forms/protocol-review-assesment-form';
import ProtocolReviewIACUCForm from '@/components/primary-reviewer/forms/protcol-review-IACUC-form';
import ExemptionChecklistForm from '@/components/primary-reviewer/forms/exemption-checklist-form';
import InformedConsentAssessmentForm from '@/components/primary-reviewer/forms/informed-consent-assesment-form';
import DocumentListPage from '@/components/primary-reviewer/ProtocolDocumentsList';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function Home() {
    return (
        <div className="min-h-screen pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            {/* Page Header */}
            <Card className="mb-8 p-6">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold">Application Study Title</CardTitle>
                    <CardDescription>
                        Review protocols and access related documents seamlessly.
                    </CardDescription>
                </CardHeader>
                <Separator />
                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Left Panel: Forms */}
                    <div className="lg:col-span-3 space-y-8">
                        <ProtocolReviewForm />
                        <Separator />
                        <ProtocolReviewIACUCForm />
                        <Separator />
                        <ExemptionChecklistForm />
                        <Separator />
                        <InformedConsentAssessmentForm />  
                    </div>

                    {/* Right Panel: Document List with left border as vertical separator */}
                    <div className="lg:col-span-2 lg:border-l lg:border-gray-200 lg:pl-8">
                        <div className="sticky top-8 max-h-[calc(100vh-8rem)] overflow-y-auto">
                            <DocumentListPage />
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
