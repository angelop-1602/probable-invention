"use client";

import * as React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploader } from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Download, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Define accepted file types
const acceptedTypes = {
  "application/pdf": [".pdf"],
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

// Documents based on submission.json structure
const basicRequirements: DocumentInfo[] = [
  {
    id: "informed_consent",
    title: "Informed Consent Form",
    required: true,
    description: "Upload the completed informed consent form",
    hasTemplate: true,
    templateUrl: "/templates/informed-consent.docx",
  },
  {
    id: "advisers_certification",
    title: "Endorsement Letter/Adviser's Certification",
    required: true,
    description:
      "Upload the signed endorsement letter or adviser's certification",
    hasTemplate: true,
    templateUrl: "/templates/advisers-certification.docx",
  },
  {
    id: "research_proposal",
    title: "Research Proposal/Study Protocol",
    required: true,
    description:
      "Upload your complete research proposal or study protocol document",
  },
  {
    id: "minutes_proposal_defense",
    title: "Minutes of Proposal Defense",
    required: true,
    description: "Upload the official minutes from your proposal defense",
  },
  {
    id: "curriculum_vitae",
    title: "Curriculum Vitae of Researchers",
    required: true,
    description: "Upload CVs of all research team members",
    multiple: true,
  },
];

const supplementaryDocuments: DocumentInfo[] = [
  {
    id: "questionnaire",
    title: "Questionnaire",
    required: false,
    description: "Upload research questionnaires if applicable",
    multiple: true,
  },
  {
    id: "data_collection_forms",
    title: "Data Collection Forms",
    required: false,
    description: "Upload all data collection forms and instruments",
    multiple: true,
  },
  {
    id: "technical_review",
    title: "Technical Review Approval (if applicable)",
    required: false,
    description: "Upload technical review approval if your study requires it",
  },
  {
    id: "abstract",
    title: "Abstract",
    required: true,
    description: "Upload a brief summary of your research (maximum 250 words)",
  },
  {
    id: "payment_proof",
    title: "Proof of Payment of Ethics Review Fee",
    required: false,
    description: "Upload proof of payment for the ethics review fee",
  },
];

export default function ApplicationDocuments({
  onDocumentsChange,
  isSubmitting,
}: ApplicationDocumentsProps) {
  const [documents, setDocuments] = useState<DocumentFile>({});
  const [isAddingDocument, setIsAddingDocument] = useState(false);
  const [newDocumentTitle, setNewDocumentTitle] = useState("");
  const [customDocuments, setCustomDocuments] = useState<DocumentInfo[]>([]);

  const handleFileChange = (documentId: string, files: File[]) => {
    const updatedDocuments = {
      ...documents,
      [documentId]: {
        files,
        title:
          [...basicRequirements, ...supplementaryDocuments].find(
            (doc) => doc.id === documentId
          )?.title ||
          customDocuments.find((doc) => doc.id === documentId)?.title ||
          documentId,
      },
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
      description: "Additional document",
      multiple: false,
    };

    setCustomDocuments((prev) => [...prev, newDoc]);
    setNewDocumentTitle("");
    setIsAddingDocument(false);
  };

  const handleDownload = (templateUrl: string) => {
    // In a real application, this would download the template
    console.log("Downloading template:", templateUrl);
  };


  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-8">
          {/* Basic Requirements */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-700">
              Basic Requirements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {basicRequirements.map((doc) => (
                <div
                  key={doc.id}
                  className="space-y-2 border rounded-lg p-4 bg-blue-50"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm flex items-center">
                      {doc.title}
                      {doc.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                      {documents[doc.id]?.files?.length > 0 && (
                        <span className="ml-2 text-green-600 text-xs">✓</span>
                      )}
                    </h4>
                    {"hasTemplate" in doc && doc.hasTemplate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(doc.templateUrl!)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {doc.description}
                  </p>
                  <FileUploader
                    id={doc.id}
                    accept={acceptedTypes}
                    multiple={"multiple" in doc ? doc.multiple : false}
                    onFilesSelected={(files) => handleFileChange(doc.id, files)}
                    required={doc.required}
                    disabled={isSubmitting}
                    label={`Upload ${
                      "multiple" in doc && doc.multiple ? "files" : "a file"
                    } only PDF`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Supplementary Documents */}
          <div>
            <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold mb-4 text-green-700">
              Supplementary Documents
            </h3>
            <Dialog open={isAddingDocument} onOpenChange={setIsAddingDocument}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Other Documents
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
                  <Button onClick={handleAddCustomDocument}>
                    Add Document
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {supplementaryDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="space-y-2 border rounded-lg p-4 bg-green-50"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm flex items-center">
                      {doc.title}
                      {doc.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                      {documents[doc.id]?.files?.length > 0 && (
                        <span className="ml-2 text-green-600 text-xs">✓</span>
                      )}
                    </h4>
                    {"hasTemplate" in doc && doc.hasTemplate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(doc.templateUrl!)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {doc.description}
                  </p>
                  <FileUploader
                    id={doc.id}
                    accept={acceptedTypes}
                    multiple={"multiple" in doc ? doc.multiple : false}
                    onFilesSelected={(files) => handleFileChange(doc.id, files)}
                    required={doc.required}
                    disabled={isSubmitting}
                    label={`Upload ${
                      "multiple" in doc && doc.multiple ? "files" : "a file"
                    } only PDF`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Custom Documents */}
          {customDocuments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-purple-700">
                Additional Documents
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="space-y-2 border rounded-lg p-4 bg-purple-50"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm flex items-center">
                        {doc.title}
                        {doc.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                        {documents[doc.id]?.files?.length > 0 && (
                          <span className="ml-2 text-green-600 text-xs">✓</span>
                        )}
                      </h4>
                      {"hasTemplate" in doc && doc.hasTemplate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(doc.templateUrl!)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {doc.description}
                    </p>
                    <FileUploader
                      id={doc.id}
                      accept={acceptedTypes}
                      multiple={"multiple" in doc ? doc.multiple : false}
                      onFilesSelected={(files) =>
                        handleFileChange(doc.id, files)
                      }
                      required={doc.required}
                      disabled={isSubmitting}
                      label={`Upload ${
                        "multiple" in doc && doc.multiple ? "files" : "a file"
                      } only PDF`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </CardContent>
    </Card>
  );
}
