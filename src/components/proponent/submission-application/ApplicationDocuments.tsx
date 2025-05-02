'use client';

import * as React from "react";
import { useState, useRef } from "react";
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
import { InfoIcon, Plus, Trash2, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

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
}

// Custom document with dynamic keys
interface CustomDocuments {
  [key: string]: File[] | null;
}

// Combined type for all documents
interface DocumentFile extends BaseDocumentFile, CustomDocuments {}

interface ApplicationDocumentsProps {
  onDocumentsChange: (files: DocumentFile) => void;
  isSubmitting: boolean;
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

function ApplicationDocuments({ onDocumentsChange, isSubmitting }: ApplicationDocumentsProps) {
  const [documents, setDocuments] = useState<DocumentFile>({
    form07A: null,
    form07B: null,
    form07C: null,
    researchProposal: null,
    minutesOfProposalDefense: null,
    abstract: null,
    curriculumVitae: null,
    questionnaires: null,
    technicalReview: null,
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
    minutesOfProposalDefense: {
      title: "Minutes of Proposal Defense",
      description: "Records discussions and decisions made during the proposal defense.",
      acceptTypes: { 'application/pdf': ['.pdf'] },
      multiple: false,
      category: 'essential',
    },
    questionnaires: {
      title: "Questionnaires",
      description: "Data collection tools for gathering participant information.",
      acceptTypes: { 'application/pdf': ['.pdf'] },
      multiple: true,
      category: 'essential',
    },
    abstract: {
      title: "Abstract",
      description: "Concise summary of the study's objectives, methods, and key points.",
      acceptTypes: { 'application/pdf': ['.pdf'] },
      multiple: false,
      category: 'additional',
    },
    curriculumVitae: {
      title: "Curriculum Vitae of Researchers",
      description: "Shows qualifications and background of the research team.",
      acceptTypes: { 'application/pdf': ['.pdf'] },
      multiple: true,
      category: 'additional',
    },
    technicalReview: {
      title: "Technical Review Approval",
      description: "Required if the study needs additional technical or specialized review.",
      acceptTypes: { 'application/pdf': ['.pdf'] },
      multiple: false,
      category: 'additional',
    },
  };
  
  // Helper function to get document file name
  const getFileName = (title: string) => {
    return title.split(":")[0].trim().replace(/\s+/g, "_") + ".docx";
  };
  
  // Store custom document info
  const [customDocumentInfo, setCustomDocumentInfo] = useState<Record<string, DocumentInfo>>({});

  const handleFileChange = (key: string, files: File[]) => {
    const newDocuments = { ...documents, [key]: files.length > 0 ? files : null };
    setDocuments(newDocuments);
    
    // Store the document title for use as displayTitle
    // For standard documents use the title from documentInfo
    if (Object.keys(documentInfo).includes(key as keyof BaseDocumentFile)) {
      const title = documentInfo[key as keyof BaseDocumentFile].title;
      // Store this title in localStorage so it can be retrieved during upload
      try {
        const existingTitlesStr = localStorage.getItem('documentTitles') || '{}';
        const existingTitles = JSON.parse(existingTitlesStr);
        localStorage.setItem('documentTitles', JSON.stringify({
          ...existingTitles,
          [key]: title
        }));
      } catch (error) {
        console.error("Error saving document title to localStorage:", error);
      }
    }
    
    // Pass documents and metadata to parent component
    onDocumentsChange(newDocuments);
    
    // Update status
    setStatus(prev => ({
      ...prev,
      [key]: files.length > 0 ? "completed" : "pending"
    }));
  };

  const handleAddDocument = () => {
    if (!newDocumentTitle.trim()) return;
    
    const docKey = `custom_${Date.now()}`;
    
    // Add to custom documents list
    setCustomDocuments([...customDocuments, docKey]);
    
    // Create document info object with the correct type
    const docInfo: DocumentInfo = {
      title: newDocumentTitle,
      description: newDocumentDescription || "Additional document",
      acceptTypes: { 'application/pdf': ['.pdf'] },
      multiple: false,
      category: 'additional',
    };
    
    // Add info for the new document
    setCustomDocumentInfo({
      ...customDocumentInfo,
      [docKey]: docInfo
    });
    
    // Store custom document info in localStorage for retrieval during processing
    try {
      // First try to get existing data
      const existingInfoString = localStorage.getItem('customDocumentInfo');
      const existingInfo = existingInfoString ? JSON.parse(existingInfoString) : {};
      
      // Add the new document info
      const updatedInfo = {
        ...existingInfo,
        [docKey]: {
          title: newDocumentTitle,
          description: newDocumentDescription || "Additional document"
        }
      };
      
      // Save back to localStorage
      localStorage.setItem('customDocumentInfo', JSON.stringify(updatedInfo));
      
      // Also save the title for the displayTitle
      const existingTitlesStr = localStorage.getItem('documentTitles') || '{}';
      const existingTitles = JSON.parse(existingTitlesStr);
      localStorage.setItem('documentTitles', JSON.stringify({
        ...existingTitles,
        [docKey]: newDocumentTitle
      }));
    } catch (error) {
      console.error("Error saving custom document info to localStorage:", error);
    }
    
    // Initialize status and document for this new key
    setStatus({
      ...status,
      [docKey]: "pending"
    });
    
    setDocuments({
      ...documents,
      [docKey]: null
    });
    
    // Reset form and close dialog
    setNewDocumentTitle("");
    setNewDocumentDescription("");
    setIsAddDocumentOpen(false);
  };

  const handleRemoveCustomDocument = (key: string) => {
    // Remove from custom documents list
    setCustomDocuments(customDocuments.filter(k => k !== key));
    
    // Remove from status
    const newStatus = { ...status };
    delete newStatus[key];
    setStatus(newStatus);
    
    // Remove from documents
    const newDocuments = { ...documents };
    delete newDocuments[key];
    setDocuments(newDocuments);
    onDocumentsChange(newDocuments);
    
    // Remove from custom info
    const newCustomInfo = { ...customDocumentInfo };
    delete newCustomInfo[key];
    setCustomDocumentInfo(newCustomInfo);
  };

  const renderDocumentItem = (key: string, info: DocumentInfo, isCustom = false) => {
    return (
      <div className="relative p-4 border rounded-lg bg-card" key={key}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium">{info.title}</h3>
              {status[key] === "completed" && (
                <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">Uploaded</Badge>
              )}
              
              {info.templateUrl && (
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
                          href={info.templateUrl}
                          download={getFileName(info.title)}
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
            <div className="flex items-center mt-1">
              <p className="text-xs text-muted-foreground">{info.description}</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-3 w-3 ml-1 text-muted-foreground hover:text-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      {info.multiple ? 'You can upload multiple files' : 'Upload a single file'}. 
                      Accepted formats: PDF only
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          {isCustom && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 rounded-full" 
              onClick={() => handleRemoveCustomDocument(key)}
            >
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              <span className="sr-only">Remove document</span>
            </Button>
          )}
        </div>
        
        <FileUploader
          id={key}
          accept={info.acceptTypes}
          multiple={info.multiple}
          onFilesSelected={(files) => handleFileChange(key, files)}
          className={`${isSubmitting ? 'opacity-60 pointer-events-none' : ''}`}
        />
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Protocol Review Application Documents</CardTitle>
        <CardDescription>
          Upload documents for your protocol submission. Essential documents are no longer required fields.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="essential" className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="essential">Essential Documents</TabsTrigger>
            <TabsTrigger value="additional">Additional Documents</TabsTrigger>
          </TabsList>
          
          <TabsContent value="essential" className="mt-0">

            <div className="grid gap-4 md:grid-cols-2">
              {Object.keys(documentInfo)
                .filter(key => documentInfo[key as keyof BaseDocumentFile].category === 'essential')
                .map((key) => renderDocumentItem(key, documentInfo[key as keyof BaseDocumentFile]))}
            </div>
          </TabsContent>
          
          <TabsContent value="additional" className="mt-0">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Standard additional documents */}
              {Object.keys(documentInfo)
                .filter(key => documentInfo[key as keyof BaseDocumentFile].category === 'additional')
                .map((key) => renderDocumentItem(key, documentInfo[key as keyof BaseDocumentFile]))}
                
              {/* Custom documents */}
              {customDocuments.map(key => (
                renderDocumentItem(key, customDocumentInfo[key], true)
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
            <Button onClick={handleAddDocument}>
              Add Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default ApplicationDocuments;
