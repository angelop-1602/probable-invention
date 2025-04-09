import React from "react";
import {
  CheckSquare,
  FileSearch,
  Upload,
  CheckCircle,
  FileSymlink,
  FileArchive,
  ArchiveRestore
} from "@/components/ui/Icons";

/**
 * ProcessTracker component for the proponent landing page
 * Displays a visual representation of the application process steps
 */
export function ProcessTracker() {
  const processSteps = [
    {
      step: "SC",
      title: "Submission Check",
      description: "REC Chair checks completeness of your application documents.",
      icon: <CheckSquare className="w-5 h-5" />
    },
    {
      step: "IR",
      title: "Initial Review",
      description: "Primary reviewers assess your protocol application.",
      icon: <FileSearch className="w-5 h-5" />
    },
    {
      step: "RS",
      title: "Resubmission",
      description: "Make necessary revisions based on reviewer feedback (if required).",
      icon: <Upload className="w-5 h-5" />
    },
    {
      step: "AP",
      title: "Approval",
      description: "Receive Certificate of Approval when all requirements are met.",
      icon: <CheckCircle className="w-5 h-5" />
    },
    {
      step: "PR",
      title: "Progress Report",
      description: "Submit periodic updates on your research progress.",
      icon: <FileSymlink className="w-5 h-5" />
    },
    {
      step: "FR",
      title: "Final Report",
      description: "Submit final findings and results at study completion.",
      icon: <FileArchive className="w-5 h-5" />
    },
    {
      step: "AR",
      title: "Archiving",
      description: "REC Chair archives your completed application.",
      icon: <ArchiveRestore className="w-5 h-5" />
    }
  ];

  return (
    <div className="py-16 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800">
            Application Process
          </h2>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Follow your protocol application through these key stages in the review process
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Process Timeline Line */}
          <div className="hidden md:block absolute left-0 right-0 h-1 bg-gray-200 top-5.5 bg-primary transform-translate-y-1/2 z-0" />
          
          <div className="grid md:grid-cols-7 gap-6">
            {processSteps.map((step, index) => (
              <div key={index} className="relative flex flex-col items-center">
                {/* Step Circle */}
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold
                  z-10 mb-4 border-2 border-white
                  ${index === 0 ? 'bg-primary' : 'bg-gray-400'}
                `}>
                  <div className="flex flex-col items-center">
                    <div className="mb-1">{step.icon}</div>
                  </div>
                </div>
                
                {/* Step Content */}
                <div className="text-center">
                  <h3 className="font-semibold text-gray-800">{step.title}</h3>
                  <p className="text-sm text-gray-600 mt-2">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-600 italic">
              You can track your application&apos;s progress through these stages using your Application Code
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 