'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileUploader } from '@/components/ui/file-upload';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, Loader2 } from 'lucide-react';

interface ReportSubmissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  type: 'progress' | 'final';
}

export function ReportSubmissionDialog({
  isOpen,
  onClose,
  onSubmit,
  type
}: ReportSubmissionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [comments, setComments] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('comments', comments);
      formData.append('type', type);
      
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const acceptedTypes = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Submit {type === 'progress' ? 'Progress Report' : 'Final Report'}
          </DialogTitle>
          <DialogDescription>
            {type === 'progress' 
              ? 'Upload your progress report using Form 09B to update the REC on your research progress.'
              : 'Upload your final report using Form 14A to complete your research protocol.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label>Upload Report Form</Label>
            <FileUploader
              accept={acceptedTypes}
              multiple={false}
              onFilesSelected={(files: File[]) => setSelectedFile(files[0] || null)}
              required
              disabled={isSubmitting}
              label={`Upload ${type === 'progress' ? 'Form 09B' : 'Form 14A'} (PDF, DOC, or DOCX)`}
            />
          </div>

          <div className="space-y-2">
            <Label>Additional Comments</Label>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add any additional comments or notes for the REC..."
              className="min-h-[100px]"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedFile || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Submit Report
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 