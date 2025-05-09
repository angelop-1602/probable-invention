import React, { useState, useEffect } from "react";
import { DocumentList as SharedDocumentList, Document as SharedDocument, UserRole } from "@/components/shared/DocumentList";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { DocumentStatus } from "@/types/protocol-application/tracking";
import { showErrorToast } from "@/lib/ui/toast-utils";

interface DocumentListProps {
  applicationCode: string;
  hasAdditionalDocumentsRequest?: boolean;
  additionalDocumentsRequested?: SharedDocument[];
  onDocumentUploaded?: (documentName: string, file: File, description?: string) => void;
  currentResubmissionCount?: number;
  documents: SharedDocument[];
  onDocumentStatusUpdate?: (document: SharedDocument, status: DocumentStatus, comment?: string) => void;
  viewOnly?: boolean;
}

export default function DocumentList({ 
  applicationCode, 
  hasAdditionalDocumentsRequest, 
  additionalDocumentsRequested,
  onDocumentUploaded,
  currentResubmissionCount = 0,
  documents: propDocuments,
  onDocumentStatusUpdate,
  viewOnly = false
}: DocumentListProps) {
  const [documentsState, setDocuments] = useState<SharedDocument[]>(propDocuments || []);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (propDocuments && propDocuments.length > 0) {
      // Debug: Log all document storagePaths
      console.log("[Proponent DocumentList] Received documents:", propDocuments);
      propDocuments.forEach((doc, idx) => {
        console.log(`[Proponent DocumentList] Document #${idx} storagePath:`, doc.storagePath);
      });
      setDocuments(propDocuments);
    }
  }, [propDocuments]);

  useEffect(() => {
    setShowAlert(hasAdditionalDocumentsRequest || false);
  }, [hasAdditionalDocumentsRequest]);

  // Handle document upload
  const handleUpload = async (doc: SharedDocument, file: File) => {
    try {
        if (onDocumentUploaded) {
        await onDocumentUploaded(doc.name, file);
        }
      } catch (error) {
        console.error("Error uploading document:", error);
      showErrorToast(
          "Upload failed", 
        "There was an error uploading the document. Please try again."
        );
      }
    };
    
  // Custom render actions for proponent
  const renderProponentActions = (doc: SharedDocument) => {
    if (viewOnly) return null;

  return (
    <>
        {(doc.status === "Review Required" || doc.status === "Pending") && (
                          <Button 
                            variant="outline" 
                            size="sm" 
              onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.pdf';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleUpload(doc, file);
              };
              input.click();
            }}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload
              </Button>
            )}
      </>
    );
  };

  return (
    <SharedDocumentList
      documents={documentsState}
      viewOnly={viewOnly}
      showAlert={showAlert}
      userRole="proponent"
      alertMessage="The REC Chair has requested additional documents or revisions. Please review the items marked as 'Review Required' or 'Pending' and upload the necessary documents."
      renderActions={renderProponentActions}
      onDownload={(doc) => {
        if (!doc.storagePath || typeof doc.storagePath !== 'string') {
          console.error('[Proponent DocumentList] Document missing valid storagePath:', doc);
          showErrorToast('Document Error', 'This document is missing a valid storage path. Please contact support.');
          return;
        }
        if (doc.downloadLink) {
          window.open(doc.downloadLink, '_blank');
        }
      }}
    />
  );
}