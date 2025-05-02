'use client';

import * as React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface SuccessModalProps {
  isOpen: boolean;
  applicationCode: string;
  onClose: () => void;
}

function SuccessModal({ isOpen, applicationCode, onClose }: SuccessModalProps) {
  const router = useRouter();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(applicationCode);
  };

  const handleTrackNow = () => {
    router.push(`/track-application/${applicationCode}`);
  };

  const handleGoHome = () => {
    router.push('/');
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
            Your protocol review application has been submitted. Please save your application code for tracking.
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
              Please make sure to save this code. You will need it to track your application status.
              This is not your SPUP REC Code, which will be assigned after the REC Chair reviews your application.
            </p>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            className="sm:w-full"
            onClick={handleTrackNow}
          >
            Track Application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { SuccessModal }; 