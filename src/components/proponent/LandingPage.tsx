import React from "react";
import { Hero } from "./landing/Hero";
import { InfoSection } from "./landing/InfoSection"; 
import { ProcessTracker } from "./landing/ProcessTracker";
import { DocumentLibrary } from "./landing/DocumentLibrary";
import { FAQSection } from "./landing/FAQSection";
import { LandingFooter } from "./landing/LandingFooter";

/**
 * Landing page for proponents of the REC Protocol Review System
 * This component assembles modular sections for the proponent landing page
 */
export function ProponentLandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <InfoSection />
      <ProcessTracker />
      <DocumentLibrary />
      <FAQSection />
      <LandingFooter />
    </div>
  );
}
