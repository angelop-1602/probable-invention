import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, FileText, Upload, PenSquare, Eye, Plus, XCircle } from "lucide-react";
import { Document } from "./types";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { DocumentText } from "lucide-react";

interface DocumentListProps {
  documents: Document[];
  hasAdditionalDocumentsRequest?: boolean;
  additionalDocumentsRequested?: Array<{name: string; requestReason?: string}>;
  onDocumentUploaded?: (documentName: string) => void;
  currentResubmissionCount?: number;
}

export const DocumentList = ({ 
  documents, 
  hasAdditionalDocumentsRequest, 
  additionalDocumentsRequested,
  onDocumentUploaded,
  currentResubmissionCount = 0
}: DocumentListProps) => {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isAddDocumentDialogOpen, setIsAddDocumentDialogOpen] = useState(false);
  const [selectedUploadTitle, setSelectedUploadTitle] = useState<string>("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [addFileError, setAddFileError] = useState<string | null>(null);
  const [actualDocuments, setActualDocuments] = useState<Document[]>(documents);
  const [showAlert, setShowAlert] = useState<boolean>(hasAdditionalDocumentsRequest || false);

  useEffect(() => {
    setActualDocuments(documents);
    setShowAlert(hasAdditionalDocumentsRequest || false);
  }, [documents, hasAdditionalDocumentsRequest]);

  // Check if there are any documents still needing action
  const documentsNeedingAction = actualDocuments.filter(doc => 
    doc.status === "Review Required" || doc.status === "Pending"
  );

  // When all requested documents are uploaded, don't show the alert anymore
  useEffect(() => {
    if (documentsNeedingAction.length === 0 && additionalDocumentsRequested?.length === 0) {
      setShowAlert(false);
    } else {
      setShowAlert(true);
    }
  }, [documentsNeedingAction.length, additionalDocumentsRequested?.length]);

  const handleViewRequest = (doc: Document) => {
    setSelectedDocument(doc);
    setIsDialogOpen(true);
  };

  const handleUploadDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setIsUploadDialogOpen(true);
    setFileError(null);
  };
  
  const handleAddDocument = (documentName: string) => {
    setSelectedUploadTitle(documentName);
    setIsAddDocumentDialogOpen(true);
    setAddFileError(null);
  };

  const validateFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setFileError("Only PDF files are accepted. Please upload a PDF document.");
        e.target.value = ""; // Clear the input
      }
    }
  };

  const validateAddFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddFileError(null);
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setAddFileError("Only PDF files are accepted. Please upload a PDF document.");
        e.target.value = ""; // Clear the input
      }
    }
  };

  // Function to handle document upload submission
  const handleSubmitDocument = (documentName: string) => {
    // Update local state
    setActualDocuments(prevDocs => 
      prevDocs.map(doc => 
        doc.name === documentName 
          ? { ...doc, status: "Revision Submitted", resubmissionVersion: currentResubmissionCount + 1 }
          : doc
      )
    );
    
    // Close dialog
    setIsUploadDialogOpen(false);
    
    // Call parent callback if available
    if (onDocumentUploaded) {
      onDocumentUploaded(documentName);
    }
  };

  // Function to handle adding a new requested document
  const handleAddNewDocument = () => {
    // Update local state to remove the document from requested list
    const requestedDocName = selectedUploadTitle;
    
    // Add the document to the documents list with Revision Submitted status
    const newDocument: Document = {
      name: requestedDocName,
      status: "Revision Submitted",
      downloadLink: "#",
      resubmissionVersion: currentResubmissionCount + 1
    };
    
    setActualDocuments(prevDocs => [...prevDocs, newDocument]);
    
    // Close dialog
    setIsAddDocumentDialogOpen(false);
    
    // Call parent callback if available
    if (onDocumentUploaded) {
      onDocumentUploaded(requestedDocName);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Accepted":
        return "default";
      case "Review Required":
        return "destructive";
      case "Pending":
        return "secondary";
      case "Revision Submitted":
        return "destructive";
      case "Submitted":
        return "destructive";
      case "Issued":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Protocol Review Application Documents</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent>
          {showAlert && documentsNeedingAction.length > 0 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <h4 className="font-medium flex items-center text-amber-700">
                <AlertCircle className="h-4 w-4 mr-2" />
                Action Required
              </h4>
              <p className="text-sm mt-1">
                The REC Chair has requested additional documents or revisions. Please review the 
                items marked as "Review Required" or "Pending" and upload the necessary documents.
              </p>
            </div>
          )}
          
          {/* Show additional documents requested if any */}
          {additionalDocumentsRequested && additionalDocumentsRequested.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Additional Documents Requested</h4>
              <ul className="space-y-2">
                {additionalDocumentsRequested.map((doc, idx) => (
                  <li key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="font-medium text-sm">{doc.name}</p>
                    <p className="text-xs text-gray-600 mt-1">{doc.requestReason}</p>
                    <div className="mt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleAddDocument(doc.name)}
                        className="flex items-center text-xs"
                      >
                        <Upload className="h-3 w-3 mr-1" /> Upload This Document
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {actualDocuments.map((doc, index) => (
              <div key={doc.name || index} className="flex flex-col md:flex-row border-b p-3 last:border-0">
                <div className="flex-1">
                  <h3 className="font-medium text-sm flex items-center">
                    <DocumentText className="h-4 w-4 text-primary mr-2" strokeWidth={2} />
                    {doc.displayTitle || doc.displayName || doc.name || "Document"}
                  </h3>
                  <div className="flex items-center mt-1">
                    <Badge variant={getStatusVariant(doc.status || "Pending")} className="mr-2">
                      {doc.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  {(doc.status === "Review Required" || doc.status === "Pending") && doc.requestReason && (
                    <Button variant="ghost" size="sm" onClick={() => handleViewRequest(doc)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  {(doc.status === "Review Required" || doc.status === "Pending") && (
                    <Button variant="ghost" size="sm" onClick={() => handleUploadDocument(doc)}>
                      <Upload className="h-4 w-4" />
                    </Button>
                  )}
                  {doc.status === "Accepted" && doc.name.includes("Form 07A") && (
                    <Button variant="ghost" size="sm">
                      <PenSquare className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog for viewing document revision request */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Document Review Required</DialogTitle>
            <DialogDescription>
              {selectedDocument?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 border rounded-md bg-gray-50">
            <h4 className="text-sm font-medium mb-2">REC Chair Comments:</h4>
            <p className="text-sm">{selectedDocument?.requestReason}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Close</Button>
            <Button onClick={() => {
              setIsDialogOpen(false);
              setIsUploadDialogOpen(true);
            }}>
              Upload Revision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for uploading document revision */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              {selectedDocument?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Select revised document to upload
              </label>
              <Input 
                type="file" 
                accept=".pdf" 
                onChange={validateFileUpload} 
              />
              {fileError && (
                <Alert variant="destructive" className="mt-2">
                  <XCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>
                    {fileError}
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Comments (optional)
              </label>
              <textarea 
                className="w-full px-3 py-2 border rounded-md" 
                rows={3}
                placeholder="Describe the changes you've made in response to the feedback"
              ></textarea>
            </div>
            {currentResubmissionCount > 0 && (
              <div className="bg-blue-50 p-2 rounded-md">
                <p className="text-xs text-blue-700">
                  This document will be marked as part of Resubmission #{currentResubmissionCount + 1}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => selectedDocument && handleSubmitDocument(selectedDocument.name)}>
              Upload Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for adding a new document */}
      <Dialog open={isAddDocumentDialogOpen} onOpenChange={setIsAddDocumentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Requested Document</DialogTitle>
            <DialogDescription>
              {selectedUploadTitle}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Select document to upload
              </label>
              <Input 
                type="file" 
                accept=".pdf" 
                onChange={validateAddFileUpload}
              />
              {addFileError && (
                <Alert variant="destructive" className="mt-2">
                  <XCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>
                    {addFileError}
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Comments (optional)
              </label>
              <textarea 
                className="w-full px-3 py-2 border rounded-md" 
                rows={3}
                placeholder="Any additional information about this document"
              ></textarea>
            </div>
            {currentResubmissionCount > 0 && (
              <div className="bg-blue-50 p-2 rounded-md">
                <p className="text-xs text-blue-700">
                  This document will be marked as part of Resubmission #{currentResubmissionCount + 1}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDocumentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddNewDocument}>
              Upload Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}; 