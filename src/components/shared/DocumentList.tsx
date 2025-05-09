import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, FileText, Upload, PenSquare, Eye, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { DocumentPreview } from "@/components/shared/DocumentPreview";
import { DocumentStatus } from "@/types/protocol-application/tracking";
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { extractZipFiles } from '@/lib/documents/document-zip';

// Define user roles
export type UserRole = 'proponent' | 'rec_chair' | 'primary_reviewer' | 'secondary_reviewer';

export interface Document {
  id?: string;
  name: string;
  title?: string;
  displayName?: string;
  displayTitle?: string;
  fileName?: string;
  documentType?: string;
  status: DocumentStatus | string;
  downloadLink?: string;
  storagePath?: string;
  uploadDate?: string | number;
  version?: string | number;
  requestReason?: string;
  reviewComment?: string;
  comment?: string;
  resubmissionVersion?: number;
}

export interface DocumentListProps {
  // Core props
  documents: Document[];
  title?: string;
  viewOnly?: boolean;
  
  // Action callbacks
  onView?: (doc: Document) => void;
  onUpload?: (doc: Document, file: File) => void;
  onApprove?: (doc: Document) => void;
  onReject?: (doc: Document, reason: string) => void;
  onRequestRevision?: (doc: Document, reason: string) => void;
  onDownload?: (doc: Document) => void;
  
  // Display options
  showStatus?: boolean;
  showComments?: boolean;
  showVersion?: boolean;
  showUploadDate?: boolean;
  
  // Custom render options
  renderActions?: (doc: Document) => React.ReactNode;
  renderStatus?: (doc: Document) => React.ReactNode;
  
  // Alert/Notification
  showAlert?: boolean;
  alertMessage?: string;
  alertTitle?: string;
  
  // User role
  userRole?: UserRole;
}

// Helper function to check if an action is allowed for a role
const isActionAllowed = (action: string, role?: UserRole): boolean => {
  if (!role) return false;
  
  const permissions: Record<UserRole, string[]> = {
    proponent: ['upload', 'view', 'download'],
    rec_chair: ['view', 'approve', 'reject', 'download', 'request_revision'],
    primary_reviewer: ['view', 'approve', 'reject', 'download'],
    secondary_reviewer: ['view', 'download']
  };

  return permissions[role]?.includes(action) || false;
};

// Helper function to get status variant
const getStatusVariant = (status: DocumentStatus) => {
  switch (status) {
    case 'Accepted':
      return 'default';
    case 'Review Required':
      return 'destructive';
    case 'Pending':
      return 'secondary';
    case 'Revision Submitted':
      return 'destructive';
    case 'Rejected':
      return 'destructive';
    default:
      return 'default';
  }
};

export function DocumentList({
  documents,
  title = "Protocol Review Application Documents",
  viewOnly = false,
  onView,
  onUpload,
  onApprove,
  onReject,
  onRequestRevision,
  onDownload,
  showStatus = true,
  showComments = true,
  showVersion = true,
  showUploadDate = true,
  renderActions,
  renderStatus,
  showAlert = false,
  alertMessage = "The REC Chair has requested additional documents or revisions. Please review the items marked as 'Review Required' or 'Pending' and upload the necessary documents.",
  alertTitle = "Action Required",
  userRole
}: DocumentListProps) {
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  // Helper to get document display title
  const getDisplayTitle = (doc: Document) => {
    return doc.displayTitle || doc.displayName || doc.title || doc.name;
  };

  // Helper to get document status badge
  const getStatusBadge = (doc: Document) => {
    const status = doc.status?.toLowerCase();
    
    switch (status) {
      case 'accepted':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            Accepted
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">Rejected</Badge>
        );
      case 'revision submitted':
        return (
          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
            Revised
          </Badge>
        );
      case 'review required':
        return (
          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
            Revision Required
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
            Pending Review
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100">
            {doc.status || 'Submitted'}
          </Badge>
        );
    }
  };

  // Helper to get document icon
  const getDocumentIcon = (doc: Document) => {
    const status = doc.status?.toLowerCase();
    
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-5 w-5 mr-2 text-green-600 dark:text-green-500 flex-shrink-0" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 mr-2 text-red-600 dark:text-red-500 flex-shrink-0" />;
      case 'revision submitted':
        return <PenSquare className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-500 flex-shrink-0" />;
      case 'review required':
        return <AlertCircle className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-500 flex-shrink-0" />;
      default:
        return <FileText className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-500 flex-shrink-0" />;
    }
  };

  // Handle document view
  const handleViewDocument = async (doc: Document) => {
    try {
      console.log("Opening document for preview:", doc);
      
      // Check if we have a document to preview
      if (!doc || (!doc.storagePath && !doc.downloadLink)) {
        alert('No valid document to preview.');
        return;
      }
      
      // If the document is inside a ZIP, use the server-side API for extraction
      if (doc.storagePath && doc.storagePath.endsWith('.zip')) {
        console.log("Document is in ZIP, using auto-extract API");
        
        // Normalize storagePath to remove any leading slash
        let normalizedStoragePath = doc.storagePath?.replace(/^\/+/, '');
        // Create a URL that uses the server-side auto-extract-zip API
        const autoExtractUrl = `/api/auto-extract-zip?path=${encodeURIComponent(normalizedStoragePath)}&title=${encodeURIComponent(getDisplayTitle(doc))}`;
        
        // Set this URL directly for preview
        setCurrentDocument(doc);
        setPdfBlobUrl(autoExtractUrl);
        setIsDocumentViewerOpen(true);
        if (onView) onView(doc);
      } else {
        // For direct documents, use the normal preview flow
        setCurrentDocument(doc);
        setPdfBlobUrl(null);
        setIsDocumentViewerOpen(true);
        if (onView) onView(doc);
      }
    } catch (err) {
      console.error("Error previewing document:", err);
      alert(`Failed to preview document: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleApproveDocument = (doc: Document) => {
    if (onApprove && isActionAllowed('approve', userRole)) {
      onApprove(doc);
    }
  };

  const handleRejectDocument = (doc: Document, reason: string) => {
    if (onReject && isActionAllowed('reject', userRole)) {
      onReject(doc, reason);
    }
  };

  const handleDownloadDocument = (doc: Document) => {
    if (onDownload && isActionAllowed('download', userRole)) {
      onDownload(doc);
    }
  };

  const handleUploadDocument = (doc: Document, file: File) => {
    if (onUpload && isActionAllowed('upload', userRole)) {
      onUpload(doc, file);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent>
          {/* Debug info - log incoming documents */}
          <script dangerouslySetInnerHTML={{ __html: `console.log("DocumentList received documents:", ${JSON.stringify(documents)})` }} />
          
          {/* Alert Banner */}
          {showAlert && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <h4 className="font-medium flex items-center text-amber-700">
                <AlertCircle className="h-4 w-4 mr-2" />
                {alertTitle}
              </h4>
              <p className="text-sm mt-1">{alertMessage}</p>
            </div>
          )}

          {/* Empty State */}
          {(!documents || documents.length === 0) && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Documents Available</h3>
              <p className="text-sm text-muted-foreground">
                No documents have been uploaded or requested yet.
              </p>
            </div>
          )}

          {/* Document List */}
          {documents && documents.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc, index) => (
                <div 
                  key={doc.id || index} 
                  className="flex flex-col p-3 border rounded-md hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      {getDocumentIcon(doc)}
                      <div>
                        <p className="text-sm font-medium">{getDisplayTitle(doc)}</p>
                        
                        {/* Status Badge */}
                        {showStatus && (renderStatus?.(doc) || getStatusBadge(doc))}
                        
                        {/* Version & Date */}
                        <div className="flex items-center space-x-2 mt-2">
                          {showVersion && doc.version && (
                            <span className="text-xs text-muted-foreground">
                              Version {doc.version}
                            </span>
                          )}
                          {showUploadDate && doc.uploadDate && (
                            <span className="text-xs text-muted-foreground">
                              Updated: {formatDate(doc.uploadDate)}
                            </span>
                          )}
                        </div>
                        
                        {/* Comments */}
                        {showComments && (doc.reviewComment || doc.requestReason || doc.comment) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {doc.reviewComment || doc.requestReason || doc.comment}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      {isActionAllowed('view', userRole) && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewDocument(doc)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      )}
                      {renderActions ? (
                        renderActions(doc)
                      ) : (
                        <>
                          {isActionAllowed('upload', userRole) && (doc.status === 'Review Required' || doc.status === 'Pending') && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = '.pdf';
                                input.onchange = (e) => {
                                  const file = (e.target as HTMLInputElement).files?.[0];
                                  if (file) handleUploadDocument(doc, file);
                                };
                                input.click();
                              }}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                            </Button>
                          )}
                          {isActionAllowed('download', userRole) && doc.downloadLink && (
                            <Button variant="ghost" size="sm" onClick={() => handleDownloadDocument(doc)}>
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Preview */}
      {isDocumentViewerOpen && currentDocument && (
        <DocumentPreview
          documentTitle={getDisplayTitle(currentDocument)}
          documentUrl={pdfBlobUrl || currentDocument.downloadLink}
          storagePath={currentDocument.storagePath}
          onClose={() => {
            setIsDocumentViewerOpen(false);
            if (pdfBlobUrl) {
              URL.revokeObjectURL(pdfBlobUrl);
              setPdfBlobUrl(null);
            }
          }}
        />
      )}
    </>
  );
} 