import React from "react";
import { 
  ClipboardCheck, 
  Clock,
  ShieldCheck,
  Users 
} from "@/components/ui/Icons";

/**
 * InfoSection component for the proponent landing page
 * Displays key information about the protocol review system and its benefits
 */
export function InfoSection() {
  const features = [
    {
      icon: <ClipboardCheck className="w-8 h-8 text-primary" />,
      title: "Streamlined Submissions",
      description: "Submit your research protocols online with clear guidelines and templates for required documents."
    },
    {
      icon: <Clock className="w-8 h-8 text-primary" />,
      title: "Real-time Tracking",
      description: "Track the status of your submission throughout the review process with real-time updates."
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-primary" />,
      title: "Ethics Compliance",
      description: "Ensure your research meets all ethical standards and requirements with guided submissions."
    },
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      title: "Expert Review",
      description: "Have your protocol reviewed by qualified experts in research ethics and your field of study."
    }
  ];

  return (
    <div className="py-12 sm:py-16 bg-white scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">
            Simplifying Research Ethics Reviews
          </h2>
          <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Our system streamlines the protocol review process, helping researchers obtain ethical clearance efficiently while maintaining high standards.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-gray-50 p-6 rounded-lg hover:shadow-md transition-shadow border border-gray-100"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 