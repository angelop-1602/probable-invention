import { ClipboardCheck, FileText, FileCheck } from 'lucide-react';

export default function FeaturesSection() {
  return (
    <div className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Primary Reviewer Features
          </h2>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            As a primary reviewer, you play a critical role in ensuring that research protocols meet ethical standards.
          </p>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                <ClipboardCheck size={30} />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Protocol Review Categories</h3>
              <p className="text-base text-gray-500 text-center">
                Easily navigate between initial reviews, resubmissions, terminations, and other categories in an organized tab interface.
              </p>
            </div>

            <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                <FileText size={30} />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Review Form Access</h3>
              <p className="text-base text-gray-500 text-center">
                Complete the appropriate review form (Full, Expedited, or Exemption) based on the assigned protocol type.
              </p>
            </div>

            <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                <FileCheck size={30} />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Document Review</h3>
              <p className="text-base text-gray-500 text-center">
                View submitted protocol documents alongside your review form with our convenient 80/20 split view layout.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 