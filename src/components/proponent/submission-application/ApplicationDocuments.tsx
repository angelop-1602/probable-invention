"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileUploader } from "@/components/ui/file-upload";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  InfoIcon,
  Plus,
  Trash2,
  Download,
  Upload,
  Loader2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DocumentFiles } from "@/types/protocol-application/submission";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Base document types that are predefined
interface BaseDocumentFile {
  form07A: File[];
  form07B: File[];
  form07C: File[];
  researchProposal: File[];
  minutesOfProposalDefense: File[];
  abstract: File[];
  curriculumVitae: File[];
  questionnaires: File[];
  technicalReview: File[];
  proofOfPayment: File[];
}

/**
 * Custom documents with dynamic keys
 */
interface CustomDocuments {
  [key: string]: File[];
}

// Combined document type
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
  category: "essential" | "additional";
  templateUrl?: string; // URL to download the template
};

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
  setCustomDocumentInfo: React.Dispatch<
    React.SetStateAction<Record<string, DocumentInfo>>
  >;
  fileErrors: Record<string, string>;
  setFileErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  // Initialize document state with provided initial values
  const [documents, setDocuments] = useState<DocumentFiles>(initialDocuments);
  const [documentStatus, setDocumentStatus] =
    useState<Record<string, string>>(initialStatus);

  // Handle file change for a specific document type
  const handleFileChange = (key: string, files: File[]) => {
    // Update documents state
    setDocuments((prev) => ({
      ...prev,
      [key]: {
        files,
        title: customDocumentInfo[key]?.title || key,
      },
    }));

    // Update document status
    setDocumentStatus((prev) => ({
      ...prev,
      [key]: files.length > 0 ? "completed" : "pending",
    }));

    // Call the parent onChange handler
    onDocumentsChange({
      ...documents,
      [key]: {
        files,
        title: customDocumentInfo[key]?.title || key,
      },
    });
  };

  // Handle removing a custom document
  const handleRemoveCustomDocument = (key: string) => {
    // Remove from documents state
    const newDocuments = { ...documents };
    delete newDocuments[key];
    setDocuments(newDocuments);

    // Remove from status state
    const newStatus = { ...documentStatus };
    delete newStatus[key];
    setDocumentStatus(newStatus);

    // Remove from custom documents list
    setCustomDocuments((prev) => prev.filter((k) => k !== key));

    // Remove from custom document info
    const newInfo = { ...customDocumentInfo };
    delete newInfo[key];
    setCustomDocumentInfo(newInfo);

    // Call the parent onChange handler
    onDocumentsChange(newDocuments);
  };

  return {
    documents,
    documentStatus,
    handleFileChange,
    handleRemoveCustomDocument,
  };
}

function ApplicationDocuments({
  onDocumentsChange,
  isSubmitting,
  applicationCode,
}: ApplicationDocumentsProps) {
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false);
  const [customDocuments, setCustomDocuments] = useState<string[]>([]);
  const [customDocumentInfo, setCustomDocumentInfo] = useState<
    Record<string, DocumentInfo>
  >({});

  // Initialize documents with empty arrays instead of null
  const [documents, setDocuments] = useState<DocumentFiles>({
    form07A: { files: [], title: "Form 07A: Protocol Review Application" },
    form07B: { files: [], title: "Form 07B: Informed Consent Form" },
    form07C: { files: [], title: "Form 07C: Assent Form" },
    researchProposal: { files: [], title: "Research Proposal" },
    minutesOfProposalDefense: {
      files: [],
      title: "Minutes of Proposal Defense",
    },
    abstract: { files: [], title: "Abstract" },
    curriculumVitae: { files: [], title: "Curriculum Vitae" },
    questionnaires: { files: [], title: "Questionnaires/Interview Guide" },
    technicalReview: { files: [], title: "Technical Review" },
    proofOfPayment: { files: [], title: "Proof of Payment" },
  });

  const [newDocumentTitle, setNewDocumentTitle] = useState("");
  const [newDocumentDescription, setNewDocumentDescription] = useState("");
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});

  // Document info
  const documentInfo: Record<keyof BaseDocumentFile, DocumentInfo> = {
    form07A: {
      title: "Form 07A: Protocol Review Application",
      description: "Main application form for protocol review",
      acceptTypes: { "application/pdf": [".pdf"] },
      multiple: false,
      category: "essential",
      templateUrl:
        "https://firebasestorage.googleapis.com/v0/b/cprint-72964.firebasestorage.app/o/Forms%2FForm%2007A%20Protocol%20Review%20Application%20Form.docx?alt=media&token=539b8079-da54-472a-bc0f-75e6920c5e5d",
    },
    form07B: {
      title: "Form 07B: Informed Consent Form",
      description: "Consent form for research participants",
      acceptTypes: { "application/pdf": [".pdf"] },
      multiple: false,
      category: "essential",
      templateUrl:
        "https://firebasestorage.googleapis.com/v0/b/cprint-72964.firebasestorage.app/o/Forms%2FForm%2007C%20Informed%20Consent%20Form.docx?alt=media&token=3a3194f0-d2b5-42ee-9185-5a21574e37c0",
    },
    form07C: {
      title: "Form 07C: Assent Form",
      description: "Assent form for minors or those unable to consent",
      acceptTypes: { "application/pdf": [".pdf"] },
      multiple: false,
      category: "essential",
      templateUrl:
        "https://firebasestorage.googleapis.com/v0/b/cprint-72964.firebasestorage.app/o/Forms%2FForm%2007B%20Adviser_s%20Certification%20Form.docx?alt=media&token=97b9deb0-974f-4fe0-aa15-e8571a1181eb",
    },
    researchProposal: {
      title: "Research Proposal",
      description: "Full research proposal document",
      acceptTypes: { "application/pdf": [".pdf"] },
      multiple: false,
      category: "essential",
    },
    minutesOfProposalDefense: {
      title: "Minutes of Proposal Defense",
      description: "Documentation of proposal defense proceedings",
      acceptTypes: { "application/pdf": [".pdf"] },
      multiple: false,
      category: "essential",
    },
    abstract: {
      title: "Abstract",
      description: "Research abstract document",
      acceptTypes: { "application/pdf": [".pdf"] },
      multiple: false,
      category: "essential",
    },
    curriculumVitae: {
      title: "Curriculum Vitae",
      description: "CV of principal investigator",
      acceptTypes: { "application/pdf": [".pdf"] },
      multiple: false,
      category: "essential",
    },
    questionnaires: {
      title: "Questionnaires/Interview Guide",
      description: "Research instruments",
      acceptTypes: { "application/pdf": [".pdf"] },
      multiple: true,
      category: "additional",
    },
    technicalReview: {
      title: "Technical Review",
      description: "Technical review documentation",
      acceptTypes: { "application/pdf": [".pdf"] },
      multiple: false,
      category: "additional",
    },
    proofOfPayment: {
      title: "Proof of Payment",
      description: "Receipt or proof of application fee payment",
      acceptTypes: {
        "application/pdf": [".pdf"],
        "image/*": [".jpg", ".jpeg", ".png"],
      },
      multiple: false,
      category: "additional",
    },
  };

  // Use custom hook for document submission
  const {
    documents: documentsInHook,
    documentStatus,
    handleFileChange: handleFileChangeInHook,
    handleRemoveCustomDocument,
  } = useDocumentSubmission({
    initialDocuments: documents,
    initialStatus: {
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

  const getFileName = (title: string) => {
    return title.toLowerCase().replace(/\s+/g, "_") + ".docx";
  };

  const handleAddCustomDocument = () => {
    if (!newDocumentTitle.trim()) return;

    const key = `custom_${Date.now()}`;

    // Add to custom documents list
    setCustomDocuments((prev) => [...prev, key]);

    // Add document info
    setCustomDocumentInfo((prev) => ({
      ...prev,
      [key]: {
        title: newDocumentTitle,
        description: newDocumentDescription || "Additional document",
        acceptTypes: { "application/pdf": [".pdf"] },
        multiple: false,
        category: "additional",
      },
    }));

    // Initialize document state
    handleFileChangeInHook(key, []);

    // Reset form
    setNewDocumentTitle("");
    setNewDocumentDescription("");
    setIsAddDocumentOpen(false);
  };

  const renderDocumentGrid = (
    docKeys: string[],
    infoMap: Record<string, DocumentInfo>,
    isCustom = false
  ) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {docKeys.map((key) => (
        <div key={key} className="border rounded-lg p-4 bg-card w-full">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <div className="text-sm font-medium text-primary mb-2">
                <h3 className="text-sm font-medium">
                  {infoMap[key]?.title || key}
                  {infoMap[key]?.templateUrl && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full"
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = infoMap[key].templateUrl!;
                            link.download = getFileName(infoMap[key].title);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          disabled={isSubmitting}
                        >
                          <Download className="h-4 w-4 text-primary" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Download template</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                </h3>
                {infoMap[key]?.description && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {infoMap[key]!.description}
                  </p>
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
              accept={{ "application/pdf": [".pdf"] }}
              multiple={false}
              onFilesSelected={(files) => handleFileChangeInHook(key, files)}
              required={false}
              label={undefined}
              className="w-full"
              disabled={isSubmitting}
            />
            {documentsInHook[key]?.files &&
              documentsInHook[key]?.files.length === 1 && (
                <span className="text-xs text-green-700 dark:text-green-400 font-medium truncate max-w-[200px] md:max-w-[300px]">
                  ✔ {documentsInHook[key]?.files[0].name}
                </span>
              )}
            {fileErrors[key] && (
              <p className="text-sm text-red-500">{fileErrors[key]}</p>
            )}
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
          Upload documents for your protocol submission.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                .filter(
                  (key) =>
                    documentInfo[key as keyof BaseDocumentFile].category ===
                    "additional"
                )
                .map((key) =>
                  renderDocumentGrid([key], {
                    [key]: documentInfo[key as keyof BaseDocumentFile],
                  })
                )}

              {/* Custom documents */}
              {customDocuments.map((key) =>
                renderDocumentGrid(
                  [key],
                  { [key]: customDocumentInfo[key] },
                  true
                )
              )}

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
                <p className="text-sm font-medium text-center">
                  Add Another Document
                </p>
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
              <label
                htmlFor="documentDescription"
                className="text-sm font-medium"
              >
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
            <Button
              variant="outline"
              onClick={() => setIsAddDocumentOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddCustomDocument}>Add Document</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default ApplicationDocuments;
