import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { TrackDialog } from "./TrackDialog";

/**
 * Hero section component for the proponent landing page
 * Features a fully responsive banner with a call-to-action button
 */
export function Hero() {
  return (
    <div className="relative bg-primary text-white overflow-hidden mt-16">
      {/* Main container with enhanced responsive padding */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          
          {/* Left content section - text and buttons */}
          <div className="w-full lg:w-1/2 text-center lg:text-left">
            {/* SPUP title and REC text */}
            <div className="mb-4 sm:mb-6">
              <div className="space-y-2 sm:space-y-3">
                <div className="old-english text-1xl sm:text-2xl md:text-3xl lg:text-3xl xl:text-4xl font-semibold leading-tight">
                  St. Paul University Philippines
                </div>
                <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-medium">
                  Research Ethics Committee
                </div>
              </div>
            </div>

            {/* Subtitle */}
            <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-medium mb-2 sm:mb-3">
              Upholding Ethical Integrity in Research
            </h2>
            <h3 className="text-sm sm:text-base italic mb-4 sm:mb-6 text-yellow-200">
              "Committed to safeguarding human dignity, rights, and welfare in research."
            </h3>
            
            {/* Description text */}
            <p className="text-sm sm:text-base md:text-lg leading-relaxed mb-6 sm:mb-8 max-w-2xl mx-auto lg:mx-0 opacity-90">
              At St. Paul University Philippines, the Research Ethics Committee
              (SPUP REC) serves as a guardian of ethical research conduct. Whether
              you're a student, faculty member, or external collaborator, our goal
              is to ensure your research involving human participants adheres to
              national and international ethical standards.
            </p>

            {/* Call-to-action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/auth/sign-in" className="w-full sm:w-auto">
                <Button
                  type="button"
                  className="w-full sm:w-auto text-primary bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-500
                  hover:bg-gradient-to-br shadow-lg shadow-yellow-600/50 dark:shadow-lg dark:shadow-yellow-900/80
                  font-bold rounded-lg text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4
                  transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl"
                >
                  Submit Now!
                </Button>
              </Link>
            </div>
          </div>

          {/* Right section - logo with glow effect */}
          <div className="w-full lg:w-1/2 flex justify-center relative mt-8 lg:mt-0">
            <div className="relative flex justify-center items-center w-full">
              {/* Enhanced glow effect - responsive sizing */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                w-[200px] h-[200px] 
                sm:w-[250px] sm:h-[250px] 
                md:w-[350px] md:h-[350px] 
                lg:w-[400px] lg:h-[400px] 
                xl:w-[450px] xl:h-[450px]
                pointer-events-none z-0"
                style={{
                  background:
                    "radial-gradient(circle, rgba(254,204,7,1) 0%, rgba(254,204,7,0.4) 40%, rgba(254,204,7,0) 70%)",
                  borderRadius: "9999px",
                }}
              />

              {/* Logo Image - enhanced responsive sizing */}
              <div className="relative 
                w-24 h-24 
                sm:w-32 sm:h-32 
                md:w-40 md:h-40 
                lg:w-48 lg:h-48 
                xl:w-56 xl:h-56 
                2xl:w-64 2xl:h-64 
                z-10">
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
    </div>
  );
}
