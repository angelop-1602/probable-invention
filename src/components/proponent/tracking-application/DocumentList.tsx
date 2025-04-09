import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, FileText, Upload, PenSquare, Eye, Plus, XCircle } from "lucide-react";
import { Document, DocumentStatus } from "@/types/protocol-application/tracking";
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

interface DocumentListProps {
  documents: Document[];
  hasAdditionalDocumentsRequest?: boolean;
  additionalDocumentsRequested?: Document[];
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
    if (documentsNeedingAction.length === 0 && (!additionalDocumentsRequested || additionalDocumentsRequested.length === 0)) {
      setShowAlert(false);
    } else {
      setShowAlert(true);
    }
  }, [documentsNeedingAction.length, additionalDocumentsRequested]);

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
          ? { ...doc, status: "Revision Submitted" as DocumentStatus, resubmissionVersion: currentResubmissionCount + 1 }
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
      status: "Revision Submitted" as DocumentStatus,
      downloadLink: "#"
    };
    
    setActualDocuments(prevDocs => [...prevDocs, newDocument]);
    
    // Close dialog
    setIsAddDocumentDialogOpen(false);
    
    // Call parent callback if available
    if (onDocumentUploaded) {
      onDocumentUploaded(requestedDocName);
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
              <div key={index} className="flex flex-col p-3 border rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <FileText className="h-5 w-5 mr-2 text-gray-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-gray-500">
                        {doc.status === "Accepted" ? (
                          <span className="text-green-600 flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" /> Accepted
                          </span>
                        ) : doc.status === "Rejected" ? (
                          <span className="text-red-600 flex items-center">
                            <XCircle className="h-3 w-3 mr-1" /> Rejected
                          </span>
                        ) : doc.status === "Review Required" ? (
                          <span className="text-orange-600 flex items-center">
                            <PenSquare className="h-3 w-3 mr-1" /> Revision Required
                          </span>
                        ) : doc.status === "Revision Submitted" ? (
                          <span className="text-blue-600 flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" /> Revision Submitted
                          </span>
                        ) : doc.status === "Pending" ? (
                          <span className="text-amber-600 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" /> Pending Review
                          </span>
                        ) : doc.status === "Issued" ? (
                          <span className="text-purple-600 flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" /> Certificate Issued
                          </span>
                        ) : (
                          <span className="text-gray-600 flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" /> Submitted
                          </span>
                        )}
                      </p>
                      {doc.resubmissionVersion && (
                        <p className="text-xs text-gray-400">Revision #{doc.resubmissionVersion}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    {doc.downloadLink && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => window.open(doc.downloadLink, '_blank')}
                        className="h-8 w-8 p-0"
                        title="View document"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {(doc.status === "Review Required" || doc.status === "Pending" || doc.status === "Rejected") && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleUploadDocument(doc)}
                        className="h-8 w-8 p-0"
                        title="Upload revised document"
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {doc.requestReason && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleViewRequest(doc)}
                        className="h-8 w-8 p-0"
                        title="View revision request details"
                      >
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Document View Dialog */}
      {isDialogOpen && selectedDocument && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{selectedDocument.name}</DialogTitle>
              <DialogDescription>
                {selectedDocument.requestReason && (
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-sm">
                    <p className="font-medium text-amber-800">Revision requested:</p>
                    <p>{selectedDocument.requestReason}</p>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 min-h-0 mt-4">
              {selectedDocument.downloadLink ? (
                <object 
                  data={`${selectedDocument.downloadLink}#toolbar=1&navpanes=1&scrollbar=1`}
                  type="application/pdf"
                  className="w-full h-full border rounded-md"
                >
                  <p>
                    Your browser does not support viewing PDFs directly. 
                    <a href={selectedDocument.downloadLink} target="_blank" rel="noreferrer" className="text-blue-500 underline ml-1">
                      Download the document
                    </a> to view it.
                  </p>
                </object>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-100 rounded-md">
                  <p className="text-gray-500">Document preview not available</p>
                </div>
              )}
            </div>
            
            <DialogFooter className="mt-4">
              {selectedDocument.downloadLink && (
                <Button 
                  variant="outline" 
                  onClick={() => window.open(selectedDocument.downloadLink, '_blank')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
              <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Upload Revised Document Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Revised Document</DialogTitle>
            <DialogDescription>
              Please upload the revised version of <strong>{selectedDocument?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              type="file"
              accept=".pdf"
              id="file-upload"
              onChange={validateFileUpload}
            />
            {fileError && (
              <p className="text-red-500 text-xs">{fileError}</p>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsUploadDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => selectedDocument && handleSubmitDocument(selectedDocument.name)}
              disabled={!!fileError}
            >
              Submit Revision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Document Dialog */}
      <Dialog open={isAddDocumentDialogOpen} onOpenChange={setIsAddDocumentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Additional Document</DialogTitle>
            <DialogDescription>
              Please upload the requested document: <strong>{selectedUploadTitle}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              type="file"
              accept=".pdf"
              id="add-file-upload"
              onChange={validateAddFileUpload}
            />
            {addFileError && (
              <p className="text-red-500 text-xs">{addFileError}</p>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAddDocumentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddNewDocument}
              disabled={!!addFileError}
            >
              Upload Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}; 