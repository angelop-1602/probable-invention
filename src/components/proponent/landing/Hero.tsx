import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { TrackDialog } from "./TrackDialog";

/**
 * Hero section component for the proponent landing page
 * Features a visually appealing banner with a call-to-action button
 */
export function Hero() {
  return (
    <div className="relative bg-primary text-white overflow-hidden mt-16">
      {/* Main container with responsive padding */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-20 flex flex-col-reverse md:flex-row items-center">
        {/* Left content section - text and buttons */}
        <div className="w-full md:w-1/2 text-center md:text-left mt-8 md:mt-0">
          {/* SPUP title and REC text */}
          <div className="flex flex-col items-center md:items-start mb-1 sm:mb-2">
            <div className="text-2xl sm:text-3xl md:text-4xl font-semibold">
              <div className="old-english text-3xl sm:text-4xl md:text-5xl mb-1">
                St. Paul University Philippines
              </div>
              <div className="text-xl sm:text-2xl md:text-5xl">
                Research Ethics Committee
              </div>
            </div>
          </div>

          {/* Subtitle */}
          <h2 className="text-lg sm:text-xl md:text-1xl">
            Upholding Ethical Integrity in Research
          </h2>
          <h3 className="text-sm italic mb-2 sm:mb-4">
            “Committed to safeguarding human dignity, rights, and welfare in
            research.”
          </h3>
          {/* Description text */}
          <p className="text-[12px] mb-6">
            At St. Paul University Philippines, the Research Ethics Committee
            (SPUP REC) serves as a guardian of ethical research conduct. Whether
            you’re a student, faculty member, or external collaborator, our goal
            is to ensure your research involving human participants adheres to
            national and international ethical standards.
          </p>

          {/* Call-to-action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start">
            <Button
              type="button"
              className="animate-bounceOnce text-primary bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-500
    hover:bg-gradient-to-br shadow-lg shadow-yellow-600/50 dark:shadow-lg dark:shadow-yellow-900/80
    font-medium rounded-lg text-[1.1rem] px-5 py-2.5 text-center me-2 mb-2
    transition-all duration-300 ease-in-out transform hover:scale-105 w-50 h-12 hover:font-bold"
            >
              Submit Now!
            </Button>
          </div>
        </div>

        {/* Right section - logo with glow effect */}
        <div className="w-full md:w-1/2 flex justify-center relative">
          <div className="relative flex justify-center items-center w-full">
            {/* Glow effect - adaptively sized */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] md:w-[400px] md:h-[400px] pointer-events-none z-0"
              style={{
                background:
                  "radial-gradient(circle, rgba(254,204,7,1) 0%, rgba(254,204,7,0.4) 40%, rgba(254,204,7,0) 70%)",
                borderRadius: "9999px",
              }}
            />

            {/* Logo Image - responsive sizing */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 z-10">
              <Image
                src="/SPUP-final-logo.png"
                alt="SPUP Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
