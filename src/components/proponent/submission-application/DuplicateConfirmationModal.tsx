'use client';

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, User, FileText, Calendar } from "lucide-react";
import { formatDate } from "@/lib/application/application.utils";

interface DuplicateApplication {
  id: string;
  spup_rec_code?: string;
  protocol_title: string;
  principal_investigator_name: string;
  submission_date: string;
  status: string;
}

interface DuplicateConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  duplicates: DuplicateApplication[];
  isSubmitting: boolean;
}

export const DuplicateConfirmationModal: React.FC<DuplicateConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  duplicates,
  isSubmitting
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-amber-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Potential Duplicate Application Detected
          </DialogTitle>
          <DialogDescription>
            We found {duplicates.length} existing application{duplicates.length > 1 ? 's' : ''} with similar details. 
            Please review the information below and confirm if you want to proceed with your submission.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {duplicates.map((duplicate, index) => (
            <div key={duplicate.id} className="border rounded-lg p-4 bg-amber-50">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-600">
                    Match #{index + 1}
                  </span>
                  {duplicate.spup_rec_code && (
                    <Badge variant="outline" className="ml-2">
                      {duplicate.spup_rec_code}
                    </Badge>
                  )}
                </div>
                <Badge 
                  variant={
                    duplicate.status === 'approved' ? 'default' :
                    duplicate.status === 'pending' ? 'secondary' :
                    duplicate.status === 'rejected' ? 'destructive' :
                    'outline'
                  }
                >
                  {duplicate.status}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-start">
                  <FileText className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Protocol Title</p>
                    <p className="text-sm text-gray-600">{duplicate.protocol_title}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <User className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Principal Investigator</p>
                    <p className="text-sm text-gray-600">{duplicate.principal_investigator_name}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Calendar className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Submission Date</p>
                    <p className="text-sm text-gray-600">{formatDate(duplicate.submission_date)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Important Notes:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Duplicate submissions may delay the review process</li>
            <li>• Please ensure your application contains new or significantly different research</li>
            <li>• Contact the REC office if you have questions about existing applications</li>
          </ul>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={isSubmitting}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isSubmitting ? "Submitting..." : "Proceed Anyway"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 