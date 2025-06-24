import React from "react";
import { Hero } from "./landing/Hero";
import { InfoSection } from "./landing/InfoSection"; 
import { ProcessTracker } from "./landing/ProcessTracker";
import { FAQSection } from "./landing/FAQSection";
import { LandingFooter } from "./landing/LandingFooter";
import Header from "./landing/Header";
import AboutUs from "./landing/AboutUs";

/**
 * Landing page for proponents of the REC Protocol Review System
 * This component assembles modular sections for the proponent landing page
 */
export function ProponentLandingPage() {
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      <Header />
      <main className="flex-1">
        <Hero />
        <InfoSection />
        <AboutUs />
        <ProcessTracker />
        <FAQSection />
      </main>
      <LandingFooter />
    </div>
  );
}
