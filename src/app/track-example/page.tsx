"use client";

import { useState } from "react";
import { ProponentHeader } from "@/components/proponent/shared/ProponentHeader";
import { ApplicationTracker } from "@/components/proponent/tracking-application-example/ApplicationTracker";
import { 
  mockApplication, 
  mockResubmissionApplication, 
  mockApprovedApplication,
  mockProgressReportApplication,
  mockFinalReportApplication,
  mockArchivedApplication,
  mockTerminatedApplication,
  mockMultipleResubmissionApplication
} from "@/components/proponent/tracking-application-example/mockData";
import { Application } from "@/types";
import { Button } from "@/components/ui/button";

export default function TrackExamplePage() {
  // State to track which mock application to display
  const [selectedScenario, setSelectedScenario] = useState<string>("initial-review");
  
  // Map of all available scenarios
  const scenarios: Record<string, { label: string, data: Application }> = {
    "initial-review": { label: "Initial Review", data: mockApplication },
    "resubmission": { label: "Resubmission", data: mockResubmissionApplication },
    "multiple-resubmissions": { label: "Multiple Resubmissions", data: mockMultipleResubmissionApplication },
    "approved": { label: "Approved", data: mockApprovedApplication },
    "progress-report": { label: "Progress Report", data: mockProgressReportApplication },
    "final-report": { label: "Final Report", data: mockFinalReportApplication },
    "archived": { label: "Archived", data: mockArchivedApplication },
    "terminated": { label: "Terminated", data: mockTerminatedApplication },
  };

  // Get the currently selected mock data
  const currentMockData = scenarios[selectedScenario].data;

  return (
    <div className="container mx-auto min-h-screen font-[family-name:var(--font-geist-sans)]">
      <ProponentHeader 
        title="Protocol Application Tracker - Example" 
        subtitle="Demo page showing all tracking functionality" 
        currentPage="Tracker"
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 bg-slate-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Demo Scenarios</h2>
          <p className="mb-4 text-sm text-slate-600">
            Select a scenario to see different stages of the application process:
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(scenarios).map(([key, { label }]) => (
              <Button
                key={key}
                variant={selectedScenario === key ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedScenario(key)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
        
        <ApplicationTracker mockData={currentMockData} />
      </div>
    </div>
  );
}
