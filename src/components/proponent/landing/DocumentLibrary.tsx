import React from "react";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * DocumentLibrary component for the proponent landing page
 * Provides downloadable forms and templates for protocol submission
 */
export function DocumentLibrary() {
  // Document categories with their respective forms
  const documentCategories = [
    {
      title: "Protocol Submission Forms",
      documents: [
        { 
          name: "Form 07A: Protocol Review Application Form", 
          link: "https://firebasestorage.googleapis.com/v0/b/cprint-72964.firebasestorage.app/o/Forms%2FForm%2007A%20Protocol%20Review%20Application%20Form.docx?alt=media&token=539b8079-da54-472a-bc0f-75e6920c5e5d"
        },
        { 
          name: "Form 07B: Adviser's Certification Form", 
          link: "https://firebasestorage.googleapis.com/v0/b/cprint-72964.firebasestorage.app/o/Forms%2FForm%2007B%20Adviser_s%20Certification%20Form.docx?alt=media&token=97b9deb0-974f-4fe0-aa15-e8571a1181eb"
        },
        { 
          name: "Form 07C: Informed Consent Template", 
          link: "https://firebasestorage.googleapis.com/v0/b/cprint-72964.firebasestorage.app/o/Forms%2FForm%2007C%20Informed%20Consent%20Form.docx?alt=media&token=3a3194f0-d2b5-42ee-9185-5a21574e37c0"
        },
        { 
          name: "Form 08A Protocol Resubmission Form", 
          link: "https://firebasestorage.googleapis.com/v0/b/cprint-72964.firebasestorage.app/o/Forms%2FForm%2008A%20Protocol%20Resubmission%20Form.docx?alt=media&token=9ed98f97-24be-4a17-967a-5da7aa187319"
        }
      ]
    },
    {
      title: "Progress & Completion Forms",
      documents: [
        { 
          name: "Form 09B: Progress Report Form", 
          link: "https://firebasestorage.googleapis.com/v0/b/cprint-72964.firebasestorage.app/o/Forms%2FForm%2009B%20Progress%20Report%20Application%20Form.docx?alt=media&token=9ac531b7-3f18-47c4-a6d4-e4f1807141cf"
        },
        { 
          name: "Form 14A: Final Report Form", 
          link: "https://firebasestorage.googleapis.com/v0/b/cprint-72964.firebasestorage.app/o/Forms%2FForm%2014A%20Final%20Report%20Form%20.docx?alt=media&token=630cb2e3-aef0-49ac-bfd8-02b100198ed5"
        },
        { 
          name: "Form 15: Early Termination Form", 
          link: "https://firebasestorage.googleapis.com/v0/b/cprint-72964.firebasestorage.app/o/Forms%2FForm%2015%20Early%20Study%20Termination%20Report%20Application%20.docx?alt=media&token=88f4feb9-bcb7-4022-afd1-4d6006894b42" // No link provided for this form yet
        },
      ]
    }
  ];

  // Helper function to get document file name from URL for download attribute
  const getFileName = (name: string) => {
    return name.split(":")[0].trim().replace(/\s+/g, "_") + ".docx";
  };

  return (
    <div className="py-16 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800">
            Document Library
          </h2>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Download all necessary forms and templates for your protocol submission
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {documentCategories.map((category, categoryIndex) => (
            <div 
              key={categoryIndex} 
              className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden"
            >
              <div className="bg-primary/10 p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800">{category.title}</h3>
              </div>
              
              <div className="p-4">
                <ul className="space-y-4">
                  {category.documents.map((doc, docIndex) => (
                    <li key={docIndex} className="flex items-center justify-between group">
                      <a 
                        href={doc.link}
                        className="flex items-center text-gray-700 hover:text-primary transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                        download={getFileName(doc.name)}
                      >
                        <FileText className="w-5 h-5 mr-2 flex-shrink-0" />
                        <span className="text-sm">{doc.name}</span>
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a
                          href={doc.link}
                          download={getFileName(doc.name)}
                          aria-label={`Download ${doc.name}`}
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <p className="text-gray-600 text-sm">
            All forms must be completed according to the guidelines before submission
          </p>
        </div>
      </div>
    </div>
  );
} 