import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, FileText, Upload, PenSquare, Eye, Plus, XCircle, MessageCircle, Check, X, ExternalLink } from "lucide-react";
import { DocumentStatus as DocumentStatusType } from "@/types/protocol-application/tracking";
import { Input } from "@/components/ui/input";
import { listenToApplicationUpdates } from "@/lib/application-service";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DocumentPreview } from "@/components/shared/DocumentPreview";

interface DocumentListProps {
  applicationCode: string;
  hasAdditionalDocumentsRequest?: boolean;
  additionalDocumentsRequested?: Document[];
  onDocumentUploaded?: (documentName: string, file: File, description?: string) => void;
  currentResubmissionCount?: number;
  documents: any[];
  onDocumentStatusUpdate?: (document: any, status: DocumentStatusType, comment?: string) => void;
  viewOnly?: boolean;
}

// Extend the Document interface to include reviewComment
interface Document {
  id?: string;
  name: string;
  path?: string;
  status: DocumentStatusType | string; // Allow string to handle both uppercase/lowercase statuses
  dateUploaded?: string;
  reviewComment?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  file?: File;
  url?: string;
  action?: "reject" | "approve";
  
  // Add back these properties that were accidentally removed
  downloadLink?: string;
  requestReason?: string;
  resubmissionVersion?: number;
  fileName?: string;
  documentType?: string;
  documentId?: string;
  version?: string;
  storagePath?: string;
  displayName?: string;
  comment?: string; // Add comment field to support Firebase document structure
  displayTitle?: string;
}

export default function DocumentList({ 
  applicationCode, 
  hasAdditionalDocumentsRequest, 
  additionalDocumentsRequested,
  onDocumentUploaded,
  currentResubmissionCount = 0,
  documents,
  onDocumentStatusUpdate,
  viewOnly = false
}: DocumentListProps) {
  const { toast } = useToast();
  const [documentsState, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isAddDocumentDialogOpen, setIsAddDocumentDialogOpen] = useState(false);
  const [selectedUploadTitle, setSelectedUploadTitle] = useState<string>("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [addFileError, setAddFileError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAlert, setShowAlert] = useState<boolean>(hasAdditionalDocumentsRequest || false);
  const [docBlobs, setDocBlobs] = useState<Map<string, Blob>>(new Map());
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [selectedCommentDoc, setSelectedCommentDoc] = useState<Document | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [additionalDocDescription, setAdditionalDocDescription] = useState("");
  const [revisionDescription, setRevisionDescription] = useState("");
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);

  useEffect(() => {
    // Set up listeners for application updates
    setIsLoading(true);
    const unsubscribers = listenToApplicationUpdates(
      applicationCode,
      (data) => {
        // Update documents from application data
        if (data && data.documents) {
          console.log("Documents data received from Firebase:", data.documents);
          
          // Map the documents to include necessary fields for DocumentPreview
          const mappedDocuments = data.documents.map((doc: any) => ({
            name: doc.displayTitle || doc.displayName || doc.title || doc.documentName || doc.name || "Document",
            status: (doc.status || "Pending") as DocumentStatusType,
            downloadLink: doc.downloadLink || "",
            requestReason: doc.requestReason || doc.comments || doc.comment,
            resubmissionVersion: doc.resubmissionVersion || doc.version,
            
            // Add fields needed for DocumentPreview component
            documentType: doc.documentType || "submission",
            documentId: doc.documentId || doc.fileName || doc.name,
            version: doc.version || doc.resubmissionVersion || "v1",
            storagePath: doc.storagePath,
            fileName: doc.fileName,
            displayName: doc.displayTitle || doc.displayName || doc.title || doc.name,
            reviewComment: doc.reviewComment || doc.comment
          }));
          
          console.log("Mapped documents for UI:", mappedDocuments);
          setDocuments(mappedDocuments);
          setIsLoading(false);
        } else {
          console.log("No documents data available in the response or documents array is empty:", data);
          
          // Check if we got passed documents as props
          if (documents && documents.length > 0) {
            console.log("Using documents from props:", documents);
            setDocuments(documents);
          }
          
          setIsLoading(false);
        }
      },
      (files) => {
        // Store file blobs for preview
        console.log("Received document files:", files.size);
        setDocBlobs(files);
        
        // If we have file blobs but no documents, create document objects from the blobs
        if (files.size > 0 && documentsState.length === 0) {
          const newDocuments: Document[] = [];
          
          files.forEach((blob, path) => {
            const fileName = path.split('/').pop() || path;
            const displayName = formatDocumentName(fileName);
            
            newDocuments.push({
              name: displayName,
              status: "Submitted" as DocumentStatusType,
              downloadLink: URL.createObjectURL(blob),
              storagePath: path,
              fileName: fileName
            });
          });
          
          if (newDocuments.length > 0) {
            console.log("Created documents from blobs:", newDocuments);
            setDocuments(newDocuments);
          }
        }
      }
    );

    // Clean up listeners on component unmount
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [applicationCode, documents]);

  // Also use the documents prop if provided and we have no documents from Firebase
  useEffect(() => {
    if (documentsState.length === 0 && documents && documents.length > 0) {
      console.log("Using documents from props because no documents from Firebase:", documents);
      setDocuments(documents);
    }
  }, [documents, documentsState.length]);

  // Check for direct document access when no documents are available
  useEffect(() => {
    // Only try this approach if we still don't have documents after the main fetch
    if (documentsState.length === 0 && !isLoading) {
      console.log("Attempting direct document access");
      
      // Try to fetch documents directly from Firebase Storage
      const storage = getStorage();
      const basePath = `protocolReviewApplications/${applicationCode}/submission`;
      
      // Common document types to check for
      const documentTypes = [
        "form07a", "form07b", "form07c", "research_proposal", 
        "minutes", "questionnaire", "cv"
      ];
      
      documentTypes.forEach(docType => {
        const docRef = ref(storage, `${basePath}/${docType}.pdf`);
        
        getDownloadURL(docRef)
          .then(url => {
            console.log(`Found document: ${docType}`);
            
            // Create a new document object
            const newDoc: Document = {
              name: formatDocumentName(docType),
              status: "Submitted" as DocumentStatusType,
              downloadLink: url,
              storagePath: `${basePath}/${docType}.pdf`,
              fileName: `${docType}.pdf`,
              reviewComment: ""
            };
            
            // Add to documents state
            setDocuments(prevDocs => {
              // Check if we already have this document
              const exists = prevDocs.some(doc => doc.fileName === `${docType}.pdf`);
              if (!exists) {
                return [...prevDocs, newDoc];
              }
              return prevDocs;
            });
          })
          .catch(err => {
            // Silent fail - we're just checking if files exist
          });
      });
    }
  }, [documentsState.length, isLoading, applicationCode]);

  useEffect(() => {
    setShowAlert(hasAdditionalDocumentsRequest || false);
  }, [hasAdditionalDocumentsRequest]);

  // Check if there are any documents still needing action
  const documentsNeedingAction = documentsState.filter(doc => 
    doc.status === "Review Required" || doc.status === "Pending"
  );

  // When all requested documents are uploaded, don't show the alert anymore
  useEffect(() => {
    // Check if any additional documents are requested but not yet uploaded
    const pendingAdditionalDocs = additionalDocumentsRequested?.filter(reqDoc => {
      // Check if this requested document has already been uploaded
      return !documentsState.some(doc => 
        doc.name === reqDoc.name && 
        (doc.status === "Revision Submitted" || doc.status?.toLowerCase() === "submitted")
      );
    }) || [];

    // Only show alert if there are documents needing action or pending additional document requests
    if (documentsNeedingAction.length === 0 && pendingAdditionalDocs.length === 0) {
      setShowAlert(false);
    } else {
      setShowAlert(true);
    }
  }, [documentsNeedingAction.length, additionalDocumentsRequested, documentsState]);

  const handleViewRequest = (doc: Document) => {
    // Get the document URL with inline parameter always set to true
    let documentUrl = '';
    let documentName = doc.name || 'Document';
    
    if (doc.storagePath) {
      // Add inline=true parameter to force viewing instead of downloading
      documentUrl = `/api/proxy-storage/path?path=${encodeURIComponent(doc.storagePath)}&inline=true`;
    } else if (doc.downloadLink) {
      // For download links, we'll use our proxy to ensure inline viewing
      // This avoids CORS issues and ensure content-disposition is set correctly
      documentUrl = `/api/proxy-document?url=${encodeURIComponent(doc.downloadLink)}&inline=true`;
    } else {
      // Fallback using consistent path construction
      const docPath = `protocolReviewApplications/${applicationCode}/${doc.documentType || 'submission'}/${doc.fileName || doc.name}`;
      documentUrl = `/api/proxy-storage/path?path=${encodeURIComponent(docPath)}&inline=true`;
    }
    
    // Check if it's a ZIP file
    const isZip = 
      (doc.fileName && doc.fileName.toLowerCase().endsWith('.zip')) || 
      (doc.storagePath && doc.storagePath.toLowerCase().endsWith('.zip')) ||
      (doc.downloadLink && doc.downloadLink.toLowerCase().includes('.zip'));
    
    if (isZip) {
      // For ZIP files, use auto-extraction API that will open first viewable file directly
      let autoExtractUrl = '/api/auto-extract-zip?';
      
      if (doc.storagePath) {
        autoExtractUrl += `path=${encodeURIComponent(doc.storagePath)}`;
      } else if (doc.downloadLink) {
        autoExtractUrl += `url=${encodeURIComponent(doc.downloadLink)}`;
      }
      
      autoExtractUrl += `&title=${encodeURIComponent(documentName)}`;
      window.open(autoExtractUrl, '_blank', 'noopener,noreferrer');
    } else {
      // For all other files, open directly
      window.open(documentUrl, '_blank', 'noopener,noreferrer');
    }
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
    // Get the file from the input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    
    // Validate file exists
    if (!file) {
      setFileError("Please select a file to upload");
      return;
    }
    
    console.log(`File selected for upload: ${file.name}`);
    
    // Update local state
    setDocuments(prevDocs => 
      prevDocs.map(doc => 
        doc.name === documentName 
          ? { 
              ...doc, 
              status: "Revision Submitted" as DocumentStatusType, 
              resubmissionVersion: currentResubmissionCount + 1,
              reviewComment: revisionDescription || doc.reviewComment // Add description if provided
            }
          : doc
      )
    );
    
    // Close dialog
    setIsUploadDialogOpen(false);
    
    // Call parent callback if available
    if (onDocumentUploaded) {
      onDocumentUploaded(documentName, file, revisionDescription);
    }
    
    setRevisionDescription(""); // Reset description
  };

  // Function to handle adding a new requested document
  const handleAddNewDocument = () => {
    // Get the file from the input
    const fileInput = document.getElementById('add-file-upload') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    
    // Validate file exists
    if (!file) {
      setAddFileError("Please select a file to upload");
      return;
    }
    
    console.log(`New file selected for upload: ${file.name}`);
    
    // Update local state to remove the document from requested list
    const requestedDocName = selectedUploadTitle;
    
    // Add the document to the documents list with Revision Submitted status
    const newDocument: Document = {
      name: requestedDocName,
      displayTitle: requestedDocName, // Use the title as displayTitle
      status: "Revision Submitted" as DocumentStatusType,
      downloadLink: "#",
      resubmissionVersion: currentResubmissionCount + 1
    };
    
    setDocuments(prevDocs => [...prevDocs, newDocument]);
    
    // Close dialog
    setIsAddDocumentDialogOpen(false);
    
    // Call parent callback if available
    if (onDocumentUploaded) {
      onDocumentUploaded(requestedDocName, file, additionalDocDescription);
    }
    
    setAdditionalDocDescription(""); // Reset description field
  };

  // Function to handle viewing a document's comment
  const handleViewComment = (doc: Document) => {
    setSelectedCommentDoc(doc);
    setIsCommentDialogOpen(true);
  };

  // Function to get truncated text with ellipsis for long comments
  const getTruncatedText = (text: string, maxLength: number = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Update how document titles are displayed - prioritize displayTitle
  const getDocumentDisplayName = (doc: Document): string => {
    return doc.displayTitle || doc.displayName || doc.name || formatDocumentName(doc.fileName || "");
  };

  const handleViewDocument = async (document: Document) => {
    if (!applicationCode) return;
    
    try {
      console.log("DocumentList: Opening document preview", {
        documentId: document.documentId,
        documentType: document.documentType,
        fileName: document.fileName,
        name: document.name,
        storagePath: document.storagePath,
        url: document.url,
        downloadLink: document.downloadLink
      });
      setCurrentDocument(document);
      setIsDocumentViewerOpen(true);
    } catch (error) {
      console.error("Error viewing document:", error);
      toast({
        title: "Error",
        description: "Failed to view document. Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Application Documents</CardTitle>
        </CardHeader>
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
          {additionalDocumentsRequested && additionalDocumentsRequested.length > 0 &&
            <>
              <h3 className="text-lg font-medium mb-2">Additional Documents Requested</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {additionalDocumentsRequested.map((doc, index) => (
                  <div key={index} className="flex flex-col p-3 border rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <FileText className="h-5 w-5 mr-2 text-gray-500 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{doc.name}</p>
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
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          }

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documentsState.map((doc, index) => (
              <div key={index} className="flex flex-col p-3 border rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <FileText className="h-5 w-5 mr-2 text-gray-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{getStandardizedDocumentTitle(doc)}</p>
                      <p className="text-xs text-gray-500">
                        {doc.status?.toLowerCase() === "accepted" ? (
                          <span className="text-green-600 flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" /> Accepted
                          </span>
                        ) : doc.status?.toLowerCase() === "rejected" ? (
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
                      {(doc as any).uploadDate && (
                        <p className="text-xs text-gray-400">
                          Uploaded: {formatDate((doc as any).uploadDate)}
                        </p>
                      )}
                      {doc.resubmissionVersion && (
                        <p className="text-xs text-gray-400">Revision #{doc.resubmissionVersion}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleViewDocument(doc)}
                      className="h-8 w-8 p-0"
                      title="View document"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {(doc.status === "Review Required" || doc.status === "Pending" || 
                      doc.status?.toLowerCase() === "rejected") && (
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
                    
                    {/* Add a "View Comment" button when comment exists */}
                    {(doc.requestReason || doc.reviewComment) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewComment(doc);
                        }}
                        className="h-8 w-8 p-0"
                        title="View comment"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Replace full comment with a summary indicator */}
                {(doc.requestReason || doc.reviewComment) && (
                  <div className={`mt-2 text-xs flex items-center ${
                    doc.status?.toLowerCase() === "rejected" 
                      ? "text-red-700" 
                      : doc.status?.toLowerCase() === "accepted"
                        ? "text-green-700"
                        : "text-amber-700"
                  }`}>
                    <MessageCircle className="h-3 w-3 mr-1" />
                    <span className="font-medium">
                      {doc.status?.toLowerCase() === "rejected" 
                        ? "Document rejected. Click to view reason." 
                        : doc.status?.toLowerCase() === "accepted"
                          ? "Document approved with comment."
                          : "Comments available. Click to view."}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upload Revised Document Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              {selectedDocument ? getDocumentDisplayName(selectedDocument) : ""}
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
            
            {/* Add description textarea for revisions */}
            <div className="mt-4">
              <label htmlFor="revision-description" className="block text-sm font-medium text-gray-700 mb-1">
                Revision Notes (Optional)
              </label>
              <textarea
                id="revision-description"
                className="w-full p-2 border rounded-md h-24 text-sm"
                placeholder="Describe the changes made in this revision..."
                value={revisionDescription}
                onChange={(e) => setRevisionDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsUploadDialogOpen(false);
                setRevisionDescription("");
              }}
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
            <DialogTitle>Upload Requested Document</DialogTitle>
            <DialogDescription>
              {selectedUploadTitle}
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
            
            {/* Add description textarea */}
            <div className="mt-4">
              <label htmlFor="doc-description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="doc-description"
                className="w-full p-2 border rounded-md h-24 text-sm"
                placeholder="Add an optional description or notes about this document..."
                value={additionalDocDescription}
                onChange={(e) => setAdditionalDocDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddDocumentDialogOpen(false);
                setAdditionalDocDescription("");
              }}
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

      {/* Add Comment View Dialog */}
      <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Document Review Comment</DialogTitle>
            <DialogDescription>
              {selectedCommentDoc ? getDocumentDisplayName(selectedCommentDoc) : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className={`p-3 rounded-md ${
              selectedCommentDoc?.status?.toLowerCase() === "rejected" 
                ? "bg-red-50 text-red-700 border border-red-200" 
                : selectedCommentDoc?.status?.toLowerCase() === "accepted"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}>
              <p className="whitespace-pre-wrap">
                {selectedCommentDoc?.reviewComment || selectedCommentDoc?.requestReason || selectedCommentDoc?.comment || "No comment available."}
              </p>
            </div>
            
            {selectedCommentDoc?.status?.toLowerCase() === "rejected" && (
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">Action Required:</p>
                <p>Please upload a revised version of this document that addresses the rejection reason above.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCommentDialogOpen(false)}
            >
              Close
            </Button>
            {selectedCommentDoc?.status?.toLowerCase() === "rejected" && (
              <Button 
                onClick={() => {
                  setIsCommentDialogOpen(false);
                  if (selectedCommentDoc) {
                    handleUploadDocument(selectedCommentDoc);
                  }
                }}
              >
                Upload Revision
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Document Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDocument?.action === "reject"
                ? "Reject Document"
                : "Approve Document"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm">
              <span className="font-medium">Document: </span>
              {selectedDocument?.name}
            </p>
            <div>
              <label className="text-sm font-medium">
                {selectedDocument?.action === "reject"
                  ? "Please provide a reason for rejection:"
                  : "Comments (optional):"}
              </label>
              <textarea
                className="w-full h-24 p-2 border rounded-md mt-1"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={
                  selectedDocument?.action === "reject"
                    ? "Enter rejection reason..."
                    : "Enter comments..."
                }
              />
            </div>

            {selectedDocument?.action === "reject" && !commentText.trim() && (
              <div className="flex items-center text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span>Rejection reason is required</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUpdateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (
                  selectedDocument?.action === "reject" &&
                  !commentText.trim()
                ) {
                  // Don't proceed without a rejection reason
                  return;
                }

                if (onDocumentStatusUpdate && selectedDocument) {
                  onDocumentStatusUpdate(
                    selectedDocument,
                    selectedDocument.action === "reject"
                      ? "Rejected" as DocumentStatusType
                      : "Accepted" as DocumentStatusType,
                    commentText
                  );
                }
                setUpdateDialogOpen(false);
              }}
              variant={selectedDocument?.action === "reject" ? "destructive" : "default"}
            >
              {selectedDocument?.action === "reject" ? "Reject" : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Use the shared DocumentPreview component */}
      {currentDocument && applicationCode && isDocumentViewerOpen && (
        <DocumentPreview
          documentTitle={getStandardizedDocumentTitle(currentDocument)}
          documentUrl={currentDocument.downloadLink}
          storagePath={currentDocument.storagePath || 
            `protocolReviewApplications/${applicationCode}/${currentDocument.documentType || 'submission'}/${currentDocument.fileName || currentDocument.name}`}
          onClose={() => setIsDocumentViewerOpen(false)}
          showActions={false}
          isFullScreen={false}
        />
      )}
    </>
  );
}

// Format filenames to be more readable
const formatDocumentName = (fileName: string): string => {
  // Remove file extension
  const withoutExtension = fileName.replace(/\.\w+$/, '');
  
  // Try to find a matching document type in our config
  const lowerFileName = withoutExtension.toLowerCase();
  
  // Map of common document types
  const documentNameMap: Record<string, string> = {
    "form07a": "Form 07A: Protocol Review Application Form",
    "form7a": "Form 07A: Protocol Review Application Form",
    "protocol_review": "Form 07A: Protocol Review Application Form",
    "form07b": "Form 07B: Adviser's Certification Form",
    "form7b": "Form 07B: Adviser's Certification Form",
    "adviser": "Form 07B: Adviser's Certification Form",
    "certification": "Form 07B: Adviser's Certification Form",
    "form07c": "Form 07C: Informed Consent Template",
    "form7c": "Form 07C: Informed Consent Template", 
    "consent": "Form 07C: Informed Consent Template",
    "research_proposal": "Research Proposal/Study Protocol",
    "proposal": "Research Proposal/Study Protocol",
    "protocol": "Research Proposal/Study Protocol",
    "minutes": "Minutes of Proposal Defense",
    "defense": "Minutes of Proposal Defense",
    "questionnaire": "Questionnaires",
    "survey": "Questionnaires",
    "abstract": "Abstract",
    "cv": "Curriculum Vitae of Researchers",
    "curriculum": "Curriculum Vitae of Researchers",
    "vitae": "Curriculum Vitae of Researchers",
    "technical": "Technical Review Approval",
    "review": "Technical Review Approval",
    "approval": "Technical Review Approval",
    "submission": "Protocol Submission",
    "resubmission": "Protocol Resubmission",
    "revision": "Revision Document",
    "amendment": "Protocol Amendment",
    "progress": "Progress Report",
    "final": "Final Report",
    "certificate": "Approval Certificate"
  };
  
  // Check for matches in our mapping
  for (const [key, name] of Object.entries(documentNameMap)) {
    if (lowerFileName.includes(key)) {
      return name;
    }
  }
  
  // Fall back to original formatting if no match found
  // Remove application IDs, timestamps, and other technical prefixes
  const cleanName = withoutExtension
    .replace(/^[A-Z0-9]+_/, '') // Remove application ID prefix
    .replace(/_v\d+$/, '')      // Remove version suffix
    .replace(/\d{10,}/, '')     // Remove timestamps
    .replace(/_+/g, ' ');       // Replace underscores with spaces
    
  // Capitalize each word
  return cleanName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

// Helper function to get standardized document titles
const getStandardizedDocumentTitle = (doc: Document): string => {
  // First try the explicit displayTitle field
  if (doc.displayTitle) {
    return doc.displayTitle;
  }
  
  // Map documentType to standardized names
  const documentTypeMap: Record<string, string> = {
    "form07A": "Form 07A: Protocol Review Application Form",
    "form07B": "Form 07B: Adviser's Certification Form",
    "form07C": "Form 07C: Informed Consent",
    "researchProposal": "Research Proposal/Study Protocol",
    "minutesOfProposalDefense": "Minutes of Proposal Defense",
    "questionnaires": "Questionnaires",
    "abstract": "Abstract",
    "curriculumVitae": "Curriculum Vitae of Researchers",
    "technicalReview": "Technical Review Approval"
  };
  
  // Check if we can map the document type
  if (doc.documentType && documentTypeMap[doc.documentType]) {
    return documentTypeMap[doc.documentType];
  }
  
  // Fall back to other name fields
  return doc.displayName || doc.name || "Document";
};

// Helper function to get status variant
const getStatusVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
  switch (status.toLowerCase()) {
    case "rejected":
      return "destructive";
    case "accepted":
      return "default";
    case "review required":
      return "destructive";
    case "pending":
      return "outline";
    case "revision submitted":
      return "default";
    case "issued":
      return "default";
    default:
      return "secondary";
  }
}; 