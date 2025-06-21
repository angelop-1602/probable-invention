'use client';

import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface DuplicateApplication {
  applicationCode: string;
  principalInvestigator: string;
  researchTitle: string;
  submissionDate: Date;
}

interface DuplicateConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DuplicateConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
}: DuplicateConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-600">Possible Duplicate Submission</DialogTitle>
          <DialogDescription>
            We found existing application(s) with similar information. Please verify if this is intentional.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2">
          <Button 
            variant="secondary" 
            onClick={onClose}
            className="sm:w-auto w-full"
          >
            Cancel Submission
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            className="sm:w-auto w-full"
          >
            Continue Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 