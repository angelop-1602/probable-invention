"use client";

import { useState, useRef, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { FileText, CheckCircle2, XCircle, AlertTriangle, Eye, Plus, Send, Loader2, Info, X, FilePlus2 } from "lucide-react";
import { Document, ProtocolDocumentListProps } from '@/types/rec-chair';
import { getDocumentDisplayName, removeUndefinedValues } from '@/lib/rec-chair/utils';
import { formatDate } from '@/lib/application/application.utils';
import { DocumentPreview } from '../../shared/DocumentPreview';
import { Timestamp } from "firebase/firestore";
import { getDocuments, addDocument, updateDocumentStatus, deleteDocument, uploadDocument, createDocumentRequest } from '@/lib/documents/document-subcollection';
import type { SubcollectionDocument } from '@/types/protocol-application/documents';
import { useDocumentCache } from '@/hooks/useDocumentCache';
import { DocumentList as SharedDocumentList, Document as SharedDocument, UserRole } from "@/components/shared/DocumentList";

// Helper to sanitize a document object
const sanitizeDocument = (doc: any) => {
  return {
    ...doc,
    version: doc.version?.toString() || "1", // Convert version to string
    status: doc.status?.toLowerCase() || "pending",
    uploadDate: doc.uploadDate || Timestamp.now().toDate().toISOString(),
    downloadLink: doc.downloadLink || "",
    requestReason: doc.requestReason || "",
    reviewComment: doc.reviewComment || doc.comment || "",
    resubmissionVersion: doc.resubmissionVersion || 1
  };
};

// Helper to check if a document has legacy fields
function hasLegacyFields(doc: any) {
  const allowed = [
    "documentType", "title", "fileName", "status", "storagePath", "uploadDate", "version", "comments"
  ];
  return Object.keys(doc).some((key) => !allowed.includes(key));
}

export function ProtocolDocumentList({ application, onUpdateApplication }: ProtocolDocumentListProps) {
  const [isRequestingDocuments, setIsRequestingDocuments] = useState(false);
  const [documentRequests, setDocumentRequests] = useState<Array<{ name: string; requestReason?: string }>>([]);
  const [newDocumentRequest, setNewDocumentRequest] = useState("");
  const [newDocumentDescription, setNewDocumentDescription] = useState("");
  const [showDocumentReviewDialog, setShowDocumentReviewDialog] = useState(false);
  const [currentDocumentIndex, setCurrentDocumentIndex] = useState<number | null>(null);
  const [documentReviewAction, setDocumentReviewAction] = useState<"accepted" | "rejected" | null>(null);
  const [documentComment, setDocumentComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  // State for document viewer
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<SubcollectionDocument | null>(null);

  const fileInputsRef = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Add: Use the document cache for subcollection-zip files
  const applicationCode = application?.id;
  const { isLoading: isZipLoading, error: zipError, fileManifest, getFile } = useDocumentCache(applicationCode);

  const [zipPreviewFile, setZipPreviewFile] = useState<{ title: string; blobUrl: string } | null>(null);
  const [zipPreviewLoading, setZipPreviewLoading] = useState(false);

  // Clean up Blob URLs on unmount
  useEffect(() => {
    return () => {
      if (zipPreviewFile?.blobUrl) URL.revokeObjectURL(zipPreviewFile.blobUrl);
    };
  }, [zipPreviewFile]);

  // Handle document viewing with review options
  const handleViewDocument = (doc: SubcollectionDocument, index: number) => {
    setCurrentDocument(doc);
    setCurrentDocumentIndex(index);
    setIsDocumentViewerOpen(true);
  };

  // Get document preview URL using the document service
  const getDocumentPreviewURL = (document: SubcollectionDocument) => {
    return document.downloadLink || "";
  };

  // Handle document acceptance from the viewer
  const handleAcceptDocument = async () => {
    if (!currentDocument?.documentId || !application.id) return;
    
    try {
      await updateDocumentStatus(application.id, currentDocument.documentId, "accepted");
      toast("Document accepted successfully");
      if (typeof onUpdateApplication === 'function') {
        const updatedDocs = await getDocuments(application.id);
        onUpdateApplication({ ...application, documents: updatedDocs });
      }
    } catch (error) {
      console.error("Error accepting document:", error);
      toast("Failed to accept document");
    }
  };

  // Handle document rejection from the viewer
  const handleRejectDocument = async () => {
    if (!currentDocument?.documentId || !application.id) return;
    
    try {
      await updateDocumentStatus(application.id, currentDocument.documentId, "rejected");
      toast("Document rejected successfully");
      if (typeof onUpdateApplication === 'function') {
        const updatedDocs = await getDocuments(application.id);
        onUpdateApplication({ ...application, documents: updatedDocs });
      }
    } catch (error) {
      console.error("Error rejecting document:", error);
      toast("Failed to reject document");
    }
  };

  const handleDocumentReview = (index: number, action: "accepted" | "rejected") => {
    if (!application || !application.documents) return;
    
    setCurrentDocumentIndex(index);
    setDocumentReviewAction(action);
    setDocumentComment("");
    setShowDocumentReviewDialog(true);
  };

  const submitDocumentReview = (closeViewer = true) => {
    if (currentDocumentIndex === null || !documentReviewAction) {
      return;
    }

    setIsSaving(true);

    const updatedApplication = { ...application };
    if (updatedApplication.documents && currentDocumentIndex >= 0) {
      // Create a clean document object with no undefined values
      const currentDoc = updatedApplication.documents[currentDocumentIndex];
      
      // Update with new values
      updatedApplication.documents[currentDocumentIndex] = {
        ...currentDoc,
        status: documentReviewAction,
        // Only include reviewComment if it has a value
        ...(documentComment ? { reviewComment: documentComment } : {})
      };
      
      // Clean the entire documents array to remove any undefined values
      const cleanDocuments = removeUndefinedValues(updatedApplication.documents);
      
      // Determine if all documents are reviewed (accepted or rejected)
      const allDocumentsReviewed = cleanDocuments.every((doc: SubcollectionDocument) => 
        doc.status?.toLowerCase() === "accepted" || doc.status?.toLowerCase() === "rejected"
      );
      
      // Determine if all documents are accepted
      const allDocumentsAccepted = cleanDocuments.every((doc: SubcollectionDocument) => 
        doc.status?.toLowerCase() === "accepted"
      );
      
      // Calculate progress and progress details
      let progress = application.progress;
      let progressDetails = "";
      let status = application.status;
      
      if (allDocumentsReviewed) {
        if (allDocumentsAccepted) {
          // All documents are accepted, move to next stage
          progress = "IR"; // Initial Review stage
          progressDetails = "All documents accepted. Application moved to Initial Review.";
          status = "Under Review";
        } else {
          // Some documents are rejected, require revision
          progress = "SC"; // Stay at Submission Check
          progressDetails = "Some documents require revision. Awaiting applicant updates.";
          status = "Document Revision Required";
        }
      }
      
      // Update the document in Firestore
      if (application.id) {
        updateDoc(doc(db, "protocolReviewApplications", application.id), {
          documents: cleanDocuments,
          progress: progress,
          progressDetails: progressDetails,
          status: status,
        })
          .then(() => {
            setIsSaving(false);
            setShowDocumentReviewDialog(false);
            
            // Only close document viewer if specified
            if (closeViewer) {
              setIsDocumentViewerOpen(false);
            }
            
            setDocumentReviewAction(null);
            setDocumentComment("");
            
            // Update the current document with the new status
            if (currentDocument && !closeViewer) {
              setCurrentDocument({
                ...currentDocument,
                status: documentReviewAction,
                ...(documentComment ? { reviewComment: documentComment } : {})
              });
            }
            
            toast("Document review saved. The document has been updated successfully.");
          })
          .catch((error) => {
            console.error("Error updating document:", error);
            setIsSaving(false);
            toast("Error updating document. There was an error updating the document. Please try again.");
          });
      }

      // Call the onUpdateApplication callback if provided
      if (typeof onUpdateApplication === 'function') {
        onUpdateApplication({
          ...updatedApplication,
          documents: cleanDocuments,
          progress: progress,
          progressDetails: progressDetails,
          status: status,
        });
      }
    }
  };

  const handleAddDocumentRequest = () => {
    if (newDocumentRequest.trim()) {
      setDocumentRequests([
        ...documentRequests, 
        { 
          name: newDocumentRequest.trim(),
          requestReason: newDocumentDescription.trim() || undefined
        }
      ]);
      setNewDocumentRequest("");
      setNewDocumentDescription("");
    }
  };

  const handleRemoveDocumentRequest = (index: number) => {
    setDocumentRequests(documentRequests.filter((_, i) => i !== index));
  };

  const handleSubmitDocumentRequests = async () => {
    if (!application.id || documentRequests.length === 0) return;

    try {
      for (const req of documentRequests) {
        await createDocumentRequest(application.id, req.name, req.requestReason);
      }

      // Update application status
      const applicationRef = doc(db, "protocolReviewApplications", application.id);
      await updateDoc(applicationRef, {
        status: "Document Revision Required",
        progress: "SC",
        updatedAt: Timestamp.now(),
      });

      // Refresh documents
      const updatedDocs = await getDocuments(application.id);
      if (typeof onUpdateApplication === 'function') {
        onUpdateApplication({ ...application, documents: updatedDocs });
      }

      toast("Document requests have been sent to the proponent.");
      setIsRequestingDocuments(false);
      setDocumentRequests([]);
    } catch (error) {
      console.error("Error requesting documents:", error);
      toast("Failed to send document requests. Please try again.");
    }
  };

  const [showRequestList, setShowRequestList] = useState(false);

  // Upload handler for requested documents
  const handleUploadRequestedDocument = async (doc: SubcollectionDocument, file: File) => {
    if (!application.id) return;
    
    try {
      await uploadDocument(application.id, doc.documentId!, file);
      toast("Document uploaded successfully");
      if (typeof onUpdateApplication === 'function') {
        const updatedDocs = await getDocuments(application.id);
        onUpdateApplication({ ...application, documents: updatedDocs });
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      toast("Failed to upload document");
    }
  };

  // Map application documents to the shared Document type
  const sharedDocuments: SharedDocument[] = (application.documents || []).map((doc: any) => ({
    ...doc,
    name: doc.title || doc.fileName || doc.documentType || 'Document',
    title: doc.title || doc.fileName || doc.documentType || 'Document',
    status: typeof doc.status === 'string' ? doc.status.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : doc.status,
  }));

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Protocol Review Application Documents</CardTitle>
            <CardDescription>
              Review and manage documents submitted by the proponent
            </CardDescription>
          </div>
          <Dialog open={isRequestingDocuments} onOpenChange={setIsRequestingDocuments}>
            <DialogTrigger asChild>
              <Button><FilePlus2  className="h-4 w-4 mr-1"/>Request Documents</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Additional Documents</DialogTitle>
                <DialogDescription>
                  Add document requests that will be sent to the proponent
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 my-4">
                <div className="flex flex-col gap-4">
                  <div>
                    <Label htmlFor="new-document-request">Document Name</Label>
                    <Input 
                      id="new-document-request" 
                      value={newDocumentRequest} 
                      onChange={(e) => setNewDocumentRequest(e.target.value)}
                      placeholder="e.g., Revised Consent Form"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="new-document-description">Description (Optional)</Label>
                    <Textarea 
                      id="new-document-description" 
                      value={newDocumentDescription}
                      onChange={(e) => setNewDocumentDescription(e.target.value)}
                      placeholder="Describe why this document is needed"
                    />
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleAddDocumentRequest}
                    disabled={!newDocumentRequest.trim()}
                  >
                      <Plus className="h-4 w-4 mr-2" />
                    Add Document Request
                    </Button>
                </div>
                
                {documentRequests.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-sm mb-2">Document Requests</h4>
                  <div className="space-y-2">
                      {documentRequests.map((request, index) => (
                        <div key={index} className="flex items-start justify-between border rounded-md p-2">
                          <div>
                            <p className="font-medium text-sm">{request.name}</p>
                            {request.requestReason && (
                              <p className="text-xs text-muted-foreground">{request.requestReason}</p>
                            )}
                          </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRemoveDocumentRequest(index)}
                            >
                            <X className="h-4 w-4" />
                            </Button>
                          </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setIsRequestingDocuments(false);
                    setDocumentRequests([]);
                    setNewDocumentRequest("");
                    setNewDocumentDescription("");
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitDocumentRequests}
                  disabled={documentRequests.length === 0}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Requests
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        
        <Separator />
        
        <CardContent className="p-6">
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
          {/* Alert for missing requested documents */}
          {application.documents && application.documents.some(doc => (doc.status?.toLowerCase() === "pending" && !doc.fileName && !doc.storagePath)) && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <h4 className="font-medium flex items-center text-amber-700">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Action Required
              </h4>
              <p className="text-sm mt-1">
                There are requested documents that must be uploaded before you can submit for initial review. Please upload all required documents listed below.
              </p>
            </div>
          )}
          {!application.documents || application.documents.length === 0 ? (
            <div className="text-center py-12">
              <Info className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No Documents Available</p>
              <p className="text-sm text-muted-foreground mt-1">
                The proponent has not uploaded any documents yet.
              </p>
            </div>
          ) : (
            <SharedDocumentList
              documents={sharedDocuments}
              viewOnly={false}
              showAlert={false}
              userRole="rec_chair"
              onView={(doc) => handleViewDocument(doc as any, 0)}
              onApprove={(doc) => handleAcceptDocument()}
              onReject={(doc, reason) => handleRejectDocument()}
              onDownload={(doc) => window.open(doc.downloadLink || '', '_blank')}
              onRequestRevision={(doc, reason) => {
                // Handle revision request
                setDocumentRequests([...documentRequests, { name: doc.name, requestReason: reason }]);
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Document Preview Dialog */}
      {isDocumentViewerOpen && currentDocument && (
        <DocumentPreview
          documentTitle={currentDocument.title}
          documentUrl={getDocumentPreviewURL(currentDocument)}
          storagePath={currentDocument.storagePath}
          onClose={() => setIsDocumentViewerOpen(false)}
          onApprove={handleAcceptDocument}
          onReject={handleRejectDocument}
          showActions={!currentDocument.status || 
                      currentDocument.status?.toLowerCase() === "submitted" || 
                      currentDocument.status?.toLowerCase() === "pending" ||
                      currentDocument.status?.toLowerCase() === "revision submitted"}
          isRevision={currentDocument.status?.toLowerCase() === "revision submitted"}
          revisionDate={currentDocument.uploadDate}
          documents={application.documents || []}
          currentDocumentIndex={currentDocumentIndex !== null ? currentDocumentIndex : undefined}
          onNavigateDocument={(index) => {
            if (application.documents && index >= 0 && index < application.documents.length) {
              setCurrentDocument(application.documents[index]);
              setCurrentDocumentIndex(index);
            }
          }}
        />
      )}

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

      {/* Document Review Dialog */}
      <Dialog open={showDocumentReviewDialog} onOpenChange={setShowDocumentReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {documentReviewAction === "accepted" ? "Accept Document" : "Reject Document"}
            </DialogTitle>
            <DialogDescription>
              {documentReviewAction === "accepted" 
                ? "This document will be marked as accepted."
                : "Please provide a reason for rejecting this document."}
            </DialogDescription>
          </DialogHeader>

            {documentReviewAction === "rejected" && (
            <div className="py-4">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
                <Textarea
                id="rejection-reason"
                  value={documentComment}
                  onChange={(e) => setDocumentComment(e.target.value)}
                placeholder="Explain why this document is being rejected"
                className="mt-2"
                />
              </div>
            )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDocumentReviewDialog(false);
                setDocumentReviewAction(null);
                setDocumentComment("");
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant={documentReviewAction === "accepted" ? "default" : "destructive"}
              onClick={() => submitDocumentReview(true)}
              disabled={isSaving || (documentReviewAction === "rejected" && !documentComment.trim())}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : documentReviewAction === "accepted" ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Accept Document
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Document
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 
