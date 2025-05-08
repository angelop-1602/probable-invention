"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddCommentDialog } from "./AddCommentDialog";
import { Eye, FileText, Download } from "lucide-react";
import { formatDate } from "@/lib/application/application.utils";
import { ViewApplicationDialogProps } from "@/types/rec-chair";
import { DocumentPreview } from "../../shared/DocumentPreview";

export function ViewApplicationDialog({ application, onApplicationUpdated }: ViewApplicationDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<any>(null);

  const handleCommentAdded = () => {
    if (onApplicationUpdated) {
      onApplicationUpdated();
    }
  };
  
  // Handle document viewing
  const handleViewDocument = (doc: any) => {
    setCurrentDocument(doc);
    setIsDocumentViewerOpen(true);
  };
  
  // Close document viewer
  const handleCloseDocumentViewer = () => {
    setIsDocumentViewerOpen(false);
    setCurrentDocument(null);
  };
  
  // Get document preview URL using the document service
  const getDocumentPreviewURL = (document: any) => {
    return document.downloadLink || document.storagePath;
  };

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default">
          <Eye className="mr-2 h-4 w-4" />
          Quick View
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">{application.title}</DialogTitle>
          <DialogDescription>
            Submission Date: {formatDate(application.submissionDate)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Card>
            <CardContent className="p-4 grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">SPUP REC Code:</span>
                  <p className="font-medium">{application.spupRecCode || "Not Assigned"}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <div>
                    <Badge 
                      className={
                        application.status?.toLowerCase() === "approved" ? "bg-green-100 text-green-800" :
                        application.status?.toLowerCase() === "rejected" ? "bg-red-100 text-red-800" :
                        application.status?.toLowerCase() === "pending" ? "bg-yellow-100 text-yellow-800" :
                        "bg-blue-100 text-blue-800"
                      }
                    >
                      {application.status || "Pending"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Principal Investigator:</span>
                  <p className="font-medium">{application.principalInvestigator}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Course/Program:</span>
                  <p className="font-medium">{application.courseProgram}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <p className="font-medium">{application.email}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Research Type:</span>
                  <p className="font-medium">{application.researchType}</p>
                </div>
              </div>
            </CardContent>
          </Card>
            
            {/* Documents Section */}
            {application.documents && application.documents.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-md font-medium mb-3">Documents</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {application.documents.map((doc: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded border hover:bg-muted/30">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">
                            {doc.title || "Untitled Document"}
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewDocument(doc)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          <div className="flex space-x-2">
            {application.id && <AddCommentDialog applicationId={application.id} onCommentAdded={handleCommentAdded} />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
      
      {/* Document Preview */}
      {isDocumentViewerOpen && currentDocument && (
        <DocumentPreview
          documentTitle={currentDocument.title || "Untitled Document"}
          documentUrl={getDocumentPreviewURL(currentDocument)}
          storagePath={currentDocument.storagePath}
          onClose={handleCloseDocumentViewer}
          showActions={false}
        />
      )}
    </>
  );
} 