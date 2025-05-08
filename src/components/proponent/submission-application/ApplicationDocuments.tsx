'use client';

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { FileUploader } from "@/components/ui/file-upload";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { InfoIcon, Plus, Trash2, Download, Upload, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DocumentFiles } from "@/types/protocol-application/submission";
import { useDocumentCache } from '@/hooks/useDocumentCache';
import { DocumentPreview } from "@/components/shared/DocumentPreview";

// Base document types that are predefined
interface BaseDocumentFile {
  form07A: File[] | null;
  form07B: File[] | null;
  form07C: File[] | null;
  researchProposal: File[] | null;
  minutesOfProposalDefense: File[] | null;
  abstract: File[] | null;
  curriculumVitae: File[] | null;
  questionnaires: File[] | null;
  technicalReview: File[] | null;
  proofOfPayment: File[] | null;
}

// Custom document with dynamic keys
interface CustomDocuments {
  [key: string]: File[] | null;
}

// Combined type for all documents
interface DocumentFile extends BaseDocumentFile, CustomDocuments {}

interface ApplicationDocumentsProps {
  onDocumentsChange: (documents: DocumentFiles) => void;
  isSubmitting: boolean;
  applicationCode?: string;
}

type DocumentStatus = {
  [key: string]: "pending" | "completed";
};

type DocumentInfo = {
  title: string;
  description: string;
  acceptTypes: Record<string, string[]>;
  multiple: boolean;
  category: 'essential' | 'additional';
  templateUrl?: string; // URL to download the template
};

// Custom hook to manage document state and logic
function useDocumentSubmission({
  initialDocuments,
  initialStatus,
  onDocumentsChange,
  isSubmitting,
  customDocuments,
  setCustomDocuments,
  customDocumentInfo,
  setCustomDocumentInfo,
  fileErrors,
  setFileErrors,
}: {
  initialDocuments: DocumentFiles;
  initialStatus: Record<string, string>;
  onDocumentsChange: (documents: DocumentFiles) => void;
  isSubmitting: boolean;
  customDocuments: string[];
  setCustomDocuments: React.Dispatch<React.SetStateAction<string[]>>;
  customDocumentInfo: Record<string, DocumentInfo>;
  setCustomDocumentInfo: React.Dispatch<React.SetStateAction<Record<string, DocumentInfo>>>;
  fileErrors: Record<string, string>;
  setFileErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [status, setStatus] = useState(initialStatus);

  // Helper to check if all required documents have a file
  const allDocumentsUploaded = Object.entries(documents)
    .filter(([key]) => !customDocuments.includes(key))
    .every(([key, value]) => value.files && value.files.length === 1);
  const allCustomDocumentsUploaded = customDocuments.every(
    (key) => documents[key]?.files && documents[key]?.files.length === 1
  );
  const canSubmit = allDocumentsUploaded && allCustomDocumentsUploaded;

  // File change handler
  const handleFileChange = (key: string, files: File[]) => {
    if (files.length > 1) return; // Only allow one file
    const newDocuments = {
      ...documents,
      [key]: {
        ...documents[key],
        files: files.length === 1 ? [files[0]] : []
      }
    };
    setDocuments(newDocuments);
    onDocumentsChange(newDocuments);
  };

  // Remove custom document
  const handleRemoveCustomDocument = (key: string) => {
    setCustomDocuments((prev) => prev.filter((k) => k !== key));
    setCustomDocumentInfo((prev) => {
      const newInfo = { ...prev };
      delete newInfo[key];
      return newInfo;
    });
    setDocuments((prev) => {
      const newDocs = { ...prev };
      delete newDocs[key];
      return newDocs;
    });
  };

  return {
    documents,
    setDocuments,
    status,
    setStatus,
    canSubmit,
    handleFileChange,
    handleRemoveCustomDocument,
  };
}

function ApplicationDocuments({ onDocumentsChange, isSubmitting, applicationCode }: ApplicationDocumentsProps) {
  const [documents, setDocuments] = useState<DocumentFiles>({
    form07A: { files: [], title: "Form 07A: Protocol Review Application Form" },
    form07B: { files: [], title: "Form 07B: Adviser's Certification Form" },
    form07C: { files: [], title: "Form 07C: Informed Consent Template" },
    researchProposal: { files: [], title: "Research Proposal/Study Protocol" },
    minutesOfProposalDefense: { files: [], title: "Minutes of Proposal Defense" },
    abstract: { files: [], title: "Abstract" },
    curriculumVitae: { files: [], title: "Curriculum Vitae" },
    questionnaires: { files: [], title: "Questionnaires" },
    technicalReview: { files: [], title: "Technical Review" },
    proofOfPayment: { files: [], title: "Proof of Payment" },
  });

  const [status, setStatus] = useState<DocumentStatus>({
    form07A: "pending",
    form07B: "pending",
    form07C: "pending",
    researchProposal: "pending",
    minutesOfProposalDefense: "pending",
    abstract: "pending",
    curriculumVitae: "pending",
    questionnaires: "pending",
    technicalReview: "pending",
    proofOfPayment: "pending",
  });
  
  // For custom documents
  const [customDocuments, setCustomDocuments] = useState<string[]>([]);
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false);
  const [newDocumentTitle, setNewDocumentTitle] = useState("");
  const [newDocumentDescription, setNewDocumentDescription] = useState("");

  // Base document info with template URLs
  const documentInfo: Record<keyof BaseDocumentFile, DocumentInfo> = {
    form07A: {
      title: "Form 07A: Protocol Review Application Form",
      description: "Provides essential study details and starts the submission process.",
      acceptTypes: { 'application/pdf': ['.pdf'] },
      multiple: false,
      category: 'essential',
      templateUrl: "https://firebasestorage.googleapis.com/v0/b/cprint-72964.firebasestorage.app/o/Forms%2FForm%2007A%20Protocol%20Review%20Application%20Form.docx?alt=media&token=539b8079-da54-472a-bc0f-75e6920c5e5d"
    },
    form07B: {
      title: "Form 07B: Adviser's Certification Form",
      description: "Confirms adviser review and approval.",
      acceptTypes: { 'application/pdf': ['.pdf'] },
      multiple: false,
      category: 'essential',
      templateUrl: "https://firebasestorage.googleapis.com/v0/b/cprint-72964.firebasestorage.app/o/Forms%2FForm%2007B%20Adviser_s%20Certification%20Form.docx?alt=media&token=97b9deb0-974f-4fe0-aa15-e8571a1181eb"
    },
    form07C: {
      title: "Form 07C: Informed Consent Template",
      description: "Template for obtaining participant consent and ensuring ethical standards.",
      acceptTypes: { 'application/pdf': ['.pdf'] },
      multiple: false,
      category: 'essential',
      templateUrl: "https://firebasestorage.googleapis.com/v0/b/cprint-72964.firebasestorage.app/o/Forms%2FForm%2007C%20Informed%20Consent%20Form.docx?alt=media&token=3a3194f0-d2b5-42ee-9185-5a21574e37c0"
    },
    researchProposal: {
      title: "Research Proposal/Study Protocol",
      description: "Detailed document outlining study design, methodology, and analysis plan.",
      acceptTypes: { 'application/pdf': ['.pdf'] },
      multiple: false,
      category: 'essential',
    }, 
    abstract: {
      title: "Abstract",
      description: "Concise summary of the study's objectives, methods, and key points.",
      acceptTypes: { 'application/pdf': ['.pdf'] },
      multiple: false,
      category: 'essential',
    },
    minutesOfProposalDefense: {
      title: "Minutes of Proposal Defense",
      description: "Records discussions and decisions made during the proposal defense.",
      acceptTypes: { 'application/pdf': ['.pdf'] },
      multiple: false,
      category: 'essential',
    },
    curriculumVitae: {
      title: "Curriculum Vitae of Researchers",
      description: "Shows qualifications and background of the research team.",
      acceptTypes: { 'application/pdf': ['.pdf'] },
      multiple: true,
      category: 'essential',
    },
    questionnaires: {
      title: "Questionnaires",
      description: "Data collection tools for gathering participant information.",
      acceptTypes: { 'application/pdf': ['.pdf'] },
      multiple: true,
      category: 'essential',
    },
    technicalReview: {
      title: "Technical Review Approval",
      description: "Required if the study needs additional technical or specialized review.",
      acceptTypes: { 'application/pdf': ['.pdf'] },
      multiple: false,
      category: 'essential',
    },
    proofOfPayment: {
      title: "Proof of Payment",
      description: "Proof of payment of the application fee.",
      acceptTypes: { 'application/pdf': ['.pdf'] },
      multiple: false,
      category: 'essential',
    },
  };
  
  // Helper function to get document file name
  const getFileName = (title: string) => {
    return title.split(":")[0].trim().replace(/\s+/g, "_") + ".docx";
  };
  
  // Store custom document info
  const [customDocumentInfo, setCustomDocumentInfo] = useState<Record<string, DocumentInfo>>({});

  const [fileErrors, setFileErrors] = useState<Record<string, string>>( {} );

  // Use the custom hook for document logic
  const {
    documents: documentsInHook,
    setDocuments: setDocumentsInHook,
    status: statusInHook,
    setStatus: setStatusInHook,
    canSubmit,
    handleFileChange: handleFileChangeInHook,
    handleRemoveCustomDocument,
  } = useDocumentSubmission({
    initialDocuments: {
      form07A: { files: [], title: "Form 07A: Protocol Review Application Form" },
      form07B: { files: [], title: "Form 07B: Adviser's Certification Form" },
      form07C: { files: [], title: "Form 07C: Informed Consent Template" },
      researchProposal: { files: [], title: "Research Proposal/Study Protocol" },
      minutesOfProposalDefense: { files: [], title: "Minutes of Proposal Defense" },
      curriculumVitae: { files: [], title: "Curriculum Vitae" },
      questionnaires: { files: [], title: "Questionnaires" },
      technicalReview: { files: [], title: "Technical Review" },
      proofOfPayment: { files: [], title: "Proof of Payment" },
    },
    initialStatus: {
      form07A: "pending",
      form07B: "pending",
      form07C: "pending",
      researchProposal: "pending",
      minutesOfProposalDefense: "pending",
      curriculumVitae: "pending",
      questionnaires: "pending",
      technicalReview: "pending",
      proofOfPayment: "pending",
    },
    onDocumentsChange,
    isSubmitting,
    customDocuments,
    setCustomDocuments,
    customDocumentInfo,
    setCustomDocumentInfo,
    fileErrors,
    setFileErrors,
  });

  // Add: Use the document cache for subcollection-zip files
  const { isLoading: isZipLoading, error: zipError, fileManifest, getFile } = useDocumentCache(applicationCode);
  const [zipPreviewFile, setZipPreviewFile] = useState<{ title: string; blobUrl: string } | null>(null);
  const [zipPreviewLoading, setZipPreviewLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (zipPreviewFile?.blobUrl) URL.revokeObjectURL(zipPreviewFile.blobUrl);
    };
  }, [zipPreviewFile]);

  // Responsive grid for document uploaders
  const renderDocumentGrid = (docKeys: string[], infoMap: Record<string, DocumentInfo>, isCustom = false) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
      {docKeys.map((key: string) => (
        <div key={key} className="space-y-2 flex justify-center">
          <div className="relative p-4 border rounded-lg bg-card w-full max-w-[450px] min-w-[220px] mx-auto flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium">{infoMap[key].title}</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-3 w-3 ml-1 text-muted-foreground hover:text-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                      <p className="text-xs text-white">{infoMap[key].description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {statusInHook[key] === "completed" && (
                    <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">Uploaded</Badge>
                  )}
                  {infoMap[key].templateUrl && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 p-0" 
                            asChild
                          >
                            <a
                              href={infoMap[key].templateUrl}
                              download={getFileName(infoMap[key].title)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Download className="h-4 w-4 text-blue-500" />
                            </a>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Download template</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>

              </div>
              {isCustom && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 rounded-full" 
                  onClick={() => handleRemoveCustomDocument(key)}
                  disabled={isSubmitting}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  <span className="sr-only">Remove document</span>
                </Button>
              )}
            </div>
            <div className="flex flex-col gap-2 items-center justify-center flex-1">
              <FileUploader
                id={key}
                accept={{ 'application/pdf': ['.pdf'] }}
                multiple={false}
                onFilesSelected={(files) => handleFileChangeInHook(key, files)}
                required={false}
                label={undefined}
                className="w-full"
                disabled={isSubmitting}
              />
              {documentsInHook[key]?.files && documentsInHook[key]?.files.length === 1 && (
                <span className="text-xs text-green-700 dark:text-green-400 font-medium truncate max-w-[200px] md:max-w-[300px]">
                  ✔ {documentsInHook[key]?.files[0].name}
                </span>
              )}
              {fileErrors[key] && (
                <p className="text-sm text-red-500">{fileErrors[key]}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Protocol Review Application Documents</CardTitle>
        <CardDescription>
          Upload documents for your protocol submission. Essential documents are no longer required fields.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Show zip-cached files if available */}
        {isZipLoading && (
          <div className="mb-4 text-sm text-muted-foreground">Loading zipped documents...</div>
        )}
        {zipError && (
          <div className="mb-4 text-sm text-red-500">{zipError}</div>
        )}
        {fileManifest && fileManifest.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold mb-2">All Uploaded Files (Zip Package)</h4>
            <ul className="space-y-2">
              {fileManifest.map((file) => (
                <li key={file.fileName} className="flex items-center justify-between border rounded p-2">
                  <span>{file.originalTitle || file.fileName}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      setZipPreviewLoading(true);
                      const blob = await getFile(file.fileName);
                      if (blob) {
                        const url = URL.createObjectURL(blob);
                        setZipPreviewFile({ title: file.originalTitle || file.fileName, blobUrl: url });
                      }
                      setZipPreviewLoading(false);
                    }}
                    disabled={zipPreviewLoading}
                  >
                    {zipPreviewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Preview'}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <Tabs defaultValue="essential" className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="essential">Essential Documents</TabsTrigger>
            <TabsTrigger value="additional">Additional Documents</TabsTrigger>
          </TabsList>
          
          <TabsContent value="essential" className="mt-0">
            <div className="space-y-6">
              {renderDocumentGrid(Object.keys(documents), documentInfo)}
            </div>
          </TabsContent>
          
          <TabsContent value="additional" className="mt-0">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Standard additional documents */}
              {Object.keys(documentInfo)
                .filter(key => documentInfo[key as keyof BaseDocumentFile].category === 'additional')
                .map((key) => renderDocumentGrid([key], { [key]: documentInfo[key as keyof BaseDocumentFile] }))}
                
              {/* Custom documents */}
              {customDocuments.map(key => (
                renderDocumentGrid([key], { [key]: customDocumentInfo[key] }, true)
              ))}
              
              {/* Add document button */}
              <div className="p-4 border rounded-lg border-dashed bg-card flex flex-col items-center justify-center min-h-[200px]">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddDocumentOpen(true)} 
                  className="h-12 w-12 rounded-full mb-2"
                  disabled={isSubmitting}
                >
                  <Plus className="h-6 w-6" />
                </Button>
                <p className="text-sm font-medium text-center">Add Another Document</p>
                <p className="text-xs text-muted-foreground text-center mt-1">
                  Upload any additional documents related to your protocol
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {/* Add Document Dialog */}
      <Dialog open={isAddDocumentOpen} onOpenChange={setIsAddDocumentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Document</DialogTitle>
            <DialogDescription>
              Create a new document upload field for additional files
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="documentTitle" className="text-sm font-medium">
                Document Title
              </label>
              <Input
                id="documentTitle"
                placeholder="e.g., Ethics Committee Approval"
                value={newDocumentTitle}
                onChange={(e) => setNewDocumentTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="documentDescription" className="text-sm font-medium">
                Description (optional)
              </label>
              <Input
                id="documentDescription"
                placeholder="Brief description of the document"
                value={newDocumentDescription}
                onChange={(e) => setNewDocumentDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDocumentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // Handle adding new document
            }}>
              Add Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Zip DocumentPreview Modal */}
      {zipPreviewFile && (
        <DocumentPreview
          documentTitle={zipPreviewFile.title}
          documentUrl={zipPreviewFile.blobUrl}
          onClose={() => {
            URL.revokeObjectURL(zipPreviewFile.blobUrl);
            setZipPreviewFile(null);
          }}
          showActions={false}
        />
      )}
    </Card>
  );
}

export default ApplicationDocuments;
