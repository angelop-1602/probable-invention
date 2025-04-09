"use client";

import { use } from "react";
import { ProponentHeader } from "@/components/proponent/shared/ProponentHeader";
import { ApplicationTracker } from "@/components/proponent/tracking-application/ApplicationTracker";

export default function TrackApplicationPage({ params }: { params: Promise<{ code: string }> }) {
  // Unwrap params with React.use()
  const unwrappedParams = use(params);
  const applicationCode = unwrappedParams.code;
  
  return (
    <div className="container mx-auto min-h-screen font-[family-name:var(--font-geist-sans)]">
      <ProponentHeader 
        title="Protocol Application Tracker" 
        subtitle="Track your protocol application status" 
        currentPage="Tracker"
      />
      <ApplicationTracker
        applicationCode={applicationCode}
        userEmail={undefined}
      />
    </div>
  );
}
