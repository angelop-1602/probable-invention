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
import { formatDate } from '@/lib/utils';

interface DuplicateApplication {
  applicationCode: string;
  principalInvestigator: string;
  researchTitle: string;
  submissionDate: Date;
}

interface DuplicateConfirmationModalProps {
  isOpen: boolean;
  duplicates: DuplicateApplication[];
  onClose: () => void;
  onContinue: () => void;
}

export function DuplicateConfirmationModal({
  isOpen,
  duplicates,
  onClose,
  onContinue
}: DuplicateConfirmationModalProps) {
  if (!duplicates.length) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-600">Possible Duplicate Submission</DialogTitle>
          <DialogDescription>
            We found existing application(s) with similar information. Please verify if this is intentional.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[300px] overflow-y-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Duplicate Alert</AlertTitle>
            <AlertDescription>
              The following application(s) match either the principal investigator's name or research title:
            </AlertDescription>
          </Alert>

          {duplicates.map((duplicate) => (
            <div 
              key={duplicate.applicationCode} 
              className="border border-gray-200 rounded-md p-3 bg-gray-50"
            >
              <p className="font-semibold text-sm">Application Code: <span className="font-mono">{duplicate.applicationCode}</span></p>
              <p className="text-sm mt-1">Principal Investigator: {duplicate.principalInvestigator}</p>
              <p className="text-sm mt-1 italic">"{duplicate.researchTitle}"</p>
              <p className="text-xs text-gray-500 mt-1">
                Submitted on: {formatDate(duplicate.submissionDate)}
              </p>
            </div>
          ))}
        </div>

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
            onClick={onContinue}
            className="sm:w-auto w-full"
          >
            Continue Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 