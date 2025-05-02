import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { doc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase-config';
import { toast } from 'sonner';

interface UpdateStatusDialogProps {
  applicationId: string;
  currentStatus: string;
  trigger: React.ReactNode;
  onStatusUpdated?: () => void;
}

export function UpdateStatusDialog({ applicationId, currentStatus, trigger, onStatusUpdated }: UpdateStatusDialogProps) {
  const [status, setStatus] = useState<string>(currentStatus);
  const [comments, setComments] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (!status) {
      toast.error('Please select a status');
      return;
    }

    setIsSubmitting(true);

    try {
      const applicationRef = doc(db, 'protocolReviewApplications', applicationId);
      
      // Add status history entry
      const statusHistoryEntry = {
        status: status,
        comments: comments,
        timestamp: serverTimestamp(),
        updatedBy: 'REC Chair'
      };

      // Add a new timeline entry
      const timelineEvent = {
        id: `timeline-${Date.now()}`,
        title: `Status updated to ${status}`,
        description: comments || 'Status updated by REC Chair',
        date: serverTimestamp(),
        type: 'status_change',
      };

      // Update the document
      await updateDoc(applicationRef, {
        applicationStatus: status,
        updatedAt: serverTimestamp(),
        statusHistory: arrayUnion(statusHistoryEntry),
      });

      toast.success(`The application status has been updated to ${status}`);

      // Close dialog and notify parent
      setOpen(false);
      setComments('');
      
      if (onStatusUpdated) {
        onStatusUpdated();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Application Status</DialogTitle>
          <DialogDescription>
            Change the status of this protocol application. This will notify the applicant.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select
              value={status}
              onValueChange={setStatus}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="comments" className="text-right">
              Comments
            </Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add any comments about this status change"
              className="col-span-3"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 