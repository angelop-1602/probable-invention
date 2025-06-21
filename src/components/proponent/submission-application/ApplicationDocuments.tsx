"use client";

import * as React from "react";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileUploader } from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Download, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Define accepted file types
const acceptedTypes = {
  'application/pdf': ['.pdf'],
};

interface DocumentInfo {
  id: string;
  title: string;
  required: boolean;
  description: string;
  hasTemplate?: boolean;
  templateUrl?: string;
  multiple?: boolean;
}

interface DocumentFile {
  [key: string]: {
    files: File[];
    title: string;
  };
}

interface ApplicationDocumentsProps {
  onDocumentsChange: (documents: DocumentFile) => void;
  isSubmitting: boolean;
  applicationCode?: string;
}

const requiredDocuments: DocumentInfo[] = [
  { 
    id: 'form07A', 
    title: 'Form 07A – Protocol Review Application', 
    required: true,
    description: 'Upload the completed Protocol Review Application form',
    hasTemplate: true,
    templateUrl: '/templates/form07A.docx'
  },
  { 
    id: 'form07B', 
    title: 'Form 07B – Adviser\'s Certification', 
    required: true,
    description: 'Upload the signed Adviser\'s Certification form',
    hasTemplate: true,
    templateUrl: '/templates/form07B.docx'
  },
  { 
    id: 'form07C', 
    title: 'Form 07C – Informed Consent Form', 
    required: false,
    description: 'Upload the completed Informed Consent Form',
    hasTemplate: true,
    templateUrl: '/templates/form07C.docx'
  },
  { 
    id: 'researchProposal', 
    title: 'Research Proposal or Study Protocol', 
    required: true,
    description: 'Upload your complete research proposal document'
  },
  { 
    id: 'minutesOfProposalDefense', 
    title: 'Minutes of Proposal Defense', 
    required: false,
    description: 'Upload the official minutes from your proposal defense'
  },
  { 
    id: 'abstract', 
    title: 'Abstract', 
    required: false,
    description: 'Upload a brief summary of your research'
  },
  { 
    id: 'curriculumVitae', 
    title: 'Curriculum Vitae of all researchers', 
    required: false,
    description: 'Upload CVs of all research team members',
    multiple: true
  },
  { 
    id: 'questionnaires', 
    title: 'Questionnaire or Data Collection Tools', 
    required: false,
    description: 'Upload all research instruments and data collection tools',
    multiple: true
  },
  { 
    id: 'technicalReview', 
    title: 'Technical Review Approval', 
    required: false,
    description: 'Upload technical review approval if applicable'
  }
];

export default function ApplicationDocuments({ onDocumentsChange, isSubmitting }: ApplicationDocumentsProps) {
  const [documents, setDocuments] = useState<DocumentFile>({});
  const [isAddingDocument, setIsAddingDocument] = useState(false);
  const [newDocumentTitle, setNewDocumentTitle] = useState('');
  const [customDocuments, setCustomDocuments] = useState<DocumentInfo[]>([]);

  const handleFileChange = (documentId: string, files: File[]) => {
    const updatedDocuments = {
      ...documents,
      [documentId]: {
        files,
        title: requiredDocuments.find(doc => doc.id === documentId)?.title || 
               customDocuments.find(doc => doc.id === documentId)?.title ||
               documentId
      }
    };
    setDocuments(updatedDocuments);
    onDocumentsChange(updatedDocuments);
  };

  const handleAddCustomDocument = () => {
    if (!newDocumentTitle.trim()) return;
    
    const newDocId = `custom-${Date.now()}`;
    const newDoc: DocumentInfo = {
      id: newDocId,
      title: newDocumentTitle,
      required: false,
      description: 'Additional document',
      multiple: false
    };
    
    setCustomDocuments(prev => [...prev, newDoc]);
    setNewDocumentTitle('');
    setIsAddingDocument(false);
  };

  const handleDownload = (templateUrl: string) => {
    // In a real application, this would download the template
    console.log('Downloading template:', templateUrl);
  };

  if (isSubmitting) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-end justify-end">
        <Dialog open={isAddingDocument} onOpenChange={setIsAddingDocument}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Additional Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Additional Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Document Title</Label>
                <Input
                  id="title"
                  value={newDocumentTitle}
                  onChange={(e) => setNewDocumentTitle(e.target.value)}
                  placeholder="Enter document title"
                />
              </div>
              <Button onClick={handleAddCustomDocument}>Add Document</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...requiredDocuments, ...customDocuments].map((doc) => (
            <div key={doc.id} className="space-y-2 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">
                  {doc.title}
                  {doc.required && <span className="text-red-500 ml-1">*</span>}
                </h3>
                {'hasTemplate' in doc && doc.hasTemplate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(doc.templateUrl!)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{doc.description}</p>
              <FileUploader
                id={doc.id}
                accept={acceptedTypes}
                multiple={'multiple' in doc ? doc.multiple : false}
                onFilesSelected={(files) => handleFileChange(doc.id, files)}
                required={doc.required}
                disabled={isSubmitting}
                label={`Upload ${('multiple' in doc && doc.multiple) ? 'files' : 'a file'} only PDF`}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
