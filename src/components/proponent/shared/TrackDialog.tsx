"use client";
import React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Dialog-based application tracking form for proponents
 * Allows users to input their application code and navigate to the tracking page
 */
export function TrackDialog({ trigger }: { trigger: React.ReactNode }) {
  const router = useRouter();
  const [applicationCode, setApplicationCode] = React.useState("");
  const [error, setError] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!applicationCode.trim()) {
      setError("Please enter your application code");
      return;
    }
    
    // Simple validation for the application code format (RECYYYYRC)
    const codeRegex = /^REC\d{4}[A-Z0-9]{6}$/;
    if (!codeRegex.test(applicationCode)) {
      setError("Invalid application code format. Should be like REC2023ABCDEF");
      return;
    }
    
    // Close dialog and navigate to the track page with the code
    setOpen(false);
    router.push(`/track-application?code=${applicationCode}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-gray-800">
            Track Your Protocol Application
          </DialogTitle>
          <DialogDescription className="text-center">
            Enter your application code to check the status of your submission
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={applicationCode}
                onChange={(e) => {
                  setApplicationCode(e.target.value.toUpperCase());
                  setError("");
                }}
                placeholder="Enter Application Code (e.g., REC2023ABCDEF)"
                className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Application Code"
              />
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between flex flex-col sm:flex-row gap-4 mt-6">
            <div className="text-sm text-gray-500">
              <p>
                Don&apos;t have an application code?{" "}
                <a 
                  href="/submission" 
                  className="text-primary hover:underline"
                >
                  Submit a new protocol
                </a>
              </p>
            </div>
            <button
              type="submit"
              className="bg-primary text-white px-6 py-3 rounded-md hover:bg-primary-dark transition-colors font-medium"
            >
              Track
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 