'use client';

import ReviewerAuth from '@/components/primary-reviewer/ReviewerAuth';
import FeaturesSection from '@/components/primary-reviewer/FeaturesSection';
import Footer from '@/components/primary-reviewer/Footer';
import ProtocolFormPreview from '@/components/primary-reviewer/ProtocolFormPreview';

export default function PrimaryReviewerPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <ReviewerAuth />
      <FeaturesSection />
      <ProtocolFormPreview />
      <Footer />
    </div>
  );
}
