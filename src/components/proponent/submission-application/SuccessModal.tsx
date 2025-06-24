'use client';

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SuccessModalProps {
  isOpen: boolean;
  applicationCode: string;
  onClose: () => void;
}

export function SuccessModal({ isOpen, applicationCode, onClose }: SuccessModalProps) {
  const router = useRouter();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(applicationCode);
  };

  const handleTrackNow = () => {
    router.push(`/track-application/${applicationCode}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <DialogTitle className="text-center text-xl">Application Submitted Successfully!</DialogTitle>
          <DialogDescription className="text-center">
            Your protocol review application has been submitted and is now being processed.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center p-4">
          <div className="text-center mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Your Application Code</h3>
            <div className="mt-2 p-3 bg-muted rounded-md flex items-center justify-between">
              <span className="text-xl font-mono font-bold">{applicationCode}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopyCode}
                className="ml-2"
              >
                Copy
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              <strong>Important:</strong> Save this Application Code to track your submission. 
              Use this code to check your application status and communicate with the REC.
            </p>
          </div>
          
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Note:</strong> This is your Application Code for tracking purposes. 
              Your official SPUP REC Code will be assigned by the REC Chair after the initial review 
              and will be visible in your application tracker.
            </AlertDescription>
          </Alert>
        </div>
        
        <DialogFooter>
          <Button 
            className="w-full"
            onClick={handleTrackNow}
          >
            Track Application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 