"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { FileText, CheckCircle2, XCircle, AlertTriangle, Eye, Plus, Send, Loader2, Info, X } from "lucide-react";
import { Document, ProtocolDocumentListProps } from '@/types/rec-chair';
import { formatDate, getDocumentDisplayName, formatDocumentName, removeUndefinedValues } from '@/lib/rec-chair/utils';
import { DocumentPreview } from '../../shared/DocumentPreview';

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
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);

  // Handle document viewing with review options
  const handleViewDocument = (doc: Document, index: number) => {
    setCurrentDocument(doc);
    setCurrentDocumentIndex(index);
    setIsDocumentViewerOpen(true);
  };

  // Handle document acceptance from the viewer
  const handleAcceptDocument = () => {
    setDocumentReviewAction("accepted");
    setDocumentComment("");
    submitDocumentReview();
  };

  // Handle document rejection from the viewer
  const handleRejectDocument = () => {
    setIsDocumentViewerOpen(false);
    setDocumentReviewAction("rejected");
    setDocumentComment("");
    setShowDocumentReviewDialog(true);
  };

  const handleDocumentReview = (index: number, action: "accepted" | "rejected") => {
    if (!application || !application.documents) return;
    
    setCurrentDocumentIndex(index);
    setDocumentReviewAction(action);
    setDocumentComment("");
    setShowDocumentReviewDialog(true);
  };

  const submitDocumentReview = () => {
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
      const allDocumentsReviewed = cleanDocuments.every((doc: Document) => 
        doc.status === "accepted" || doc.status === "rejected"
      );
      
      // Determine if all documents are accepted
      const allDocumentsAccepted = cleanDocuments.every((doc: Document) => 
        doc.status === "accepted"
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
      
      // Check if we need to remove fulfilled document requests
      let additionalDocuments = updatedApplication.additionalDocuments;
      
      // If all documents are accepted, clear the additional documents requests
      if (allDocumentsAccepted && additionalDocuments && additionalDocuments.length > 0) {
        additionalDocuments = [];
      }
      
      // Update the document in Firestore
      if (application.id) {
        updateDoc(doc(db, "protocolReviewApplications", application.id), {
          documents: cleanDocuments,
          progress: progress,
          progressDetails: progressDetails,
          status: status,
          ...(additionalDocuments !== undefined ? { additionalDocuments } : {})
        })
          .then(() => {
            setIsSaving(false);
            setShowDocumentReviewDialog(false);
            setIsDocumentViewerOpen(false); // Close the document viewer as well
            setDocumentReviewAction(null);
            setDocumentComment("");
            toast("Document review saved. The document has been updated successfully.");
          })
          .catch((error) => {
            console.error("Error updating document:", error);
            setIsSaving(false);
            toast("Error updating document. There was an error updating the document. Please try again.");
          });
      }

      // Call the onUpdateApplication callback if provided
      if (onUpdateApplication) {
        onUpdateApplication({
          ...updatedApplication,
          documents: cleanDocuments,
          progress: progress,
          progressDetails: progressDetails,
          status: status,
          additionalDocuments: additionalDocuments
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
      // Clean document requests to remove any undefined values
      const cleanDocumentRequests = removeUndefinedValues(documentRequests);
      
      // Update to request additional documents but keep at SC stage
      await updateDoc(doc(db, "protocolReviewApplications", application.id), {
        additionalDocuments: cleanDocumentRequests,
        status: "Document Revision Required",
        progress: "SC" // Keep at Submission Check stage
      });

      // Update application locally
      const updatedApplication = {
        ...application,
        additionalDocuments: cleanDocumentRequests,
        status: "Document Revision Required",
        progress: "SC"
      };

      if (onUpdateApplication) {
        onUpdateApplication(updatedApplication);
      }

      toast("Document requests have been sent to the proponent.");
      setIsRequestingDocuments(false);
      setDocumentRequests([]);
    } catch (error) {
      console.error("Error requesting documents:", error);
      toast("Failed to send document requests. Please try again.");
    }
  };

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
              <Button>Request Documents</Button>
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
                    <Label htmlFor="new-document-description">
                      Description (Optional)
                    </Label>
                    <Textarea 
                      id="new-document-description" 
                      value={newDocumentDescription}
                      onChange={(e) => setNewDocumentDescription(e.target.value)}
                      placeholder="Add details about what should be included in this document..."
                      className="h-24"
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button onClick={handleAddDocumentRequest} type="button">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Document
                    </Button>
                  </div>
                </div>
                
                {documentRequests.length > 0 && (
                  <div className="space-y-2">
                    <Label>Requested Documents</Label>
                    <ul className="space-y-2">
                      {documentRequests.map((request, index) => (
                        <li key={index} className="border p-3 rounded-md">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{request.name}</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRemoveDocumentRequest(index)}
                            >
                              Remove
                            </Button>
                          </div>
                          {request.requestReason && (
                            <p className="text-sm text-gray-600 mt-1">{request.requestReason}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRequestingDocuments(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitDocumentRequests} disabled={documentRequests.length === 0}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Requests
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          {application?.documents && application.documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {application.documents.map((doc, index) => (
                <div 
                  key={index} 
                  className="flex flex-col p-3 border rounded-md hover:bg-accent/10 cursor-pointer" 
                  onClick={() => handleViewDocument(doc, index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <FileText className="h-5 w-5 mr-2 text-gray-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{getDocumentDisplayName(doc)}</p>
                        <p className="text-xs text-gray-500">
                          {doc.status === "accepted" ? (
                            <span className="text-green-600 flex items-center">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Accepted
                            </span>
                          ) : doc.status === "rejected" ? (
                            <span className="text-red-600 flex items-center">
                              <XCircle className="h-3 w-3 mr-1" /> Needs Revision
                            </span>
                          ) : doc.status === "Revision Submitted" ? (
                            <span className="text-blue-600 flex items-center">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Revision Submitted
                            </span>
                          ) : (
                            <span className="text-amber-600 flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-1" /> Pending Review
                            </span>
                          )}
                        </p>
                        {doc.uploadDate && (
                          <p className="text-xs text-gray-400">
                            Uploaded: {formatDate(doc.uploadDate)}
                          </p>
                        )}
                        {doc.reviewComment && (
                          <p className="text-xs text-red-600 flex items-center mt-1">
                            <Info className="h-3 w-3 mr-1" /> {doc.status === "rejected" ? "Revision requested" : "Has comments"}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-8 flex items-center px-2 py-1"
                        title="View document"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDocument(doc, index);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <p>No documents available for this application.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={showDocumentReviewDialog} onOpenChange={setShowDocumentReviewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Review Document</DialogTitle>
            <DialogDescription>
              {currentDocumentIndex !== null && application.documents && application.documents[currentDocumentIndex] && 
                `Review: ${getDocumentDisplayName(application.documents[currentDocumentIndex])}`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col space-y-4 py-4">
            <div className="flex space-x-2 justify-center">
              <Button
                variant={documentReviewAction === "accepted" ? "default" : "outline"}
                className={`flex-1 ${documentReviewAction === "accepted" ? "bg-green-600 hover:bg-green-700" : ""}`}
                onClick={() => setDocumentReviewAction("accepted")}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Accept
              </Button>
              <Button
                variant={documentReviewAction === "rejected" ? "default" : "outline"}
                className={`flex-1 ${documentReviewAction === "rejected" ? "bg-red-600 hover:bg-red-700" : ""}`}
                onClick={() => setDocumentReviewAction("rejected")}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Request Revision
              </Button>
            </div>

            {documentReviewAction === "rejected" && (
              <div className="space-y-2">
                <Label htmlFor="reviewComment">Revision Reason (Optional)</Label>
                <Textarea
                  id="reviewComment"
                  placeholder="Enter reason for requesting revision"
                  value={documentComment}
                  onChange={(e) => setDocumentComment(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-gray-500">
                  This reason will be visible to the applicant.
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDocumentReviewDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitDocumentReview}
              disabled={!documentReviewAction}
            >
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Viewer - using our new DocumentPreview component */}
      {isDocumentViewerOpen && currentDocument && (
        <DocumentPreview
          documentTitle={getDocumentDisplayName(currentDocument)}
          documentUrl={currentDocument.url || ''}
          storagePath={currentDocument.storagePath}
          onApprove={handleAcceptDocument}
          onReject={handleRejectDocument}
          onClose={() => setIsDocumentViewerOpen(false)}
          showActions={true}
          isFullScreen={false}
        />
      )}
    </>
  );
} 