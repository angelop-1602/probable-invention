import React from "react";
import Image from "next/image";
import Link from "next/link";
import { TrackDialog } from "./TrackDialog";

/**
 * Hero section component for the proponent landing page
 * Features a visually appealing banner with a call-to-action button
 */
export function Hero() {
    return (
        <div className="relative bg-primary text-white overflow-hidden">
            {/* Main container with responsive padding */}
            <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-20 flex flex-col-reverse md:flex-row items-center">
                {/* Left content section - text and buttons */}
                <div className="w-full md:w-1/2 text-center md:text-left mt-8 md:mt-0">
                    {/* SPUP title and REC text */}
                    <div className="flex flex-col items-center md:items-start mb-4 sm:mb-6">
                        <div className="text-2xl sm:text-3xl md:text-4xl font-semibold">
                            <div className="old-english text-3xl sm:text-4xl md:text-5xl mb-1">St. Paul University Philippines</div>
                            <div className="text-xl sm:text-2xl md:text-3xl">Research Ethics Committee</div>
                        </div>
                    </div>
                    
                    {/* Subtitle */}
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-4">
                        Protocol Review System
                    </h1>
                    
                    {/* Description text */}
                    <p className="text-sm sm:text-base mb-6 sm:mb-8 max-w-md mx-auto md:mx-0">
                        Submit and track your research protocol applications through our streamlined online system.
                    </p>
                    
                    {/* Call-to-action buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start">
                        <Link
                            href="/submission-application"
                            className="bg-white text-primary hover:bg-gray-100 font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-md transition-colors"
                        >
                            Submit Application
                        </Link>
                        <TrackDialog
                            trigger={
                                <button
                                    className="bg-transparent border-2 border-white hover:bg-white/10 font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-md transition-colors"
                                >
                                    Track Application
                                </button>
                            }
                        />
                    </div>
                </div>
                
                {/* Right section - logo with glow effect */}
                <div className="w-full md:w-1/2 flex justify-center relative">
                    <div className="relative flex justify-center items-center w-full">
                        {/* Glow effect - adaptively sized */}
                        <div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] md:w-[400px] md:h-[400px] pointer-events-none z-0"
                            style={{
                                background: 'radial-gradient(circle, rgba(254,204,7,1) 0%, rgba(254,204,7,0.4) 40%, rgba(254,204,7,0) 70%)',
                                borderRadius: '9999px',
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