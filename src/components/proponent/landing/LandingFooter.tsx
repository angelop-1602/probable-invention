import React from "react";
import Link from "next/link";
import Image from "next/image";

/**
 * LandingFooter component for the proponent landing page
 * Displays footer information, links, and copyright
 */
export function LandingFooter() {
  // Current year for copyright
  const currentYear = new Date().getFullYear();
  
  // Footer sections with links
  const footerSections = [
    {
      title: "Quick Links",
      links: [
        { name: "Submit Protocol", href: "/submission" },
        { name: "Track Application", href: "/track" },
        { name: "Document Library", href: "#document-library" },
        { name: "FAQs", href: "#faqs" },
      ]
    },
    {
      title: "Resources",
      links: [
        { name: "Guidelines & Policies", href: "/resources/guidelines" },
        { name: "Ethics Code", href: "/resources/ethics-code" },
        { name: "Research Handbook", href: "/resources/handbook" },
        { name: "Contact Support", href: "/contact" },
      ]
    },
    {
      title: "Legal",
      links: [
        { name: "Terms of Use", href: "/legal/terms" },
        { name: "Privacy Policy", href: "/legal/privacy" },
        { name: "Data Protection", href: "/legal/data-protection" },
      ]
    }
  ];

  return (
    <footer className="text-white pt-8 sm:pt-12 pb-6" style={{ backgroundColor: '#013D1F' }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Logo and Institutional Info */}
          <div className="md:col-span-2 text-center md:text-left">
            <div className="flex justify-center md:justify-start items-center mb-4">
                <Image 
                  src="/SPUP-REC-logo-footer.png" 
                  alt="SPUP Logo"
                  width={250}
                  height={250}
                  className="w-auto h-16 sm:h-20"
                />
            </div>
            <p className="text-gray-300 mb-4 max-w-md mx-auto md:mx-0 text-sm sm:text-base">
              The Research Ethics Committee (REC) ensures ethical compliance for all research 
              protocols at St. Paul University Philippines.
            </p>
            <address className="text-gray-300 not-italic text-sm sm:text-base">
              <p>Mabini St., Tuguegarao City</p>
              <p>Cagayan, Philippines 3500</p>
              <p>Email: rec@spup.edu.ph</p>
            </address>
          </div>
          
          {/* Footer Link Sections
          {footerSections.map((section, index) => (
            <div key={index}>
              <h4 className="font-semibold text-lg mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link, i) => (
                  <li key={i}>
                    <Link 
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))} */}
        </div>
        
        <div className="border-t border-gray-700 pt-4 sm:pt-6 text-center text-gray-400 text-xs sm:text-sm">
          <p className="mb-2">© {currentYear} St. Paul University Philippines Research Ethics Committee. All rights reserved.</p>
          <p className="opacity-50">
            Developed by Angelo Peralta
          </p>
        </div>
      </div>
    </footer>
  );
} 