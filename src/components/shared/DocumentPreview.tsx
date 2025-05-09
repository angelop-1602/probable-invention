"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, CheckCircle, AlertCircle, Loader2, FileText, Download, RefreshCcw, ChevronRight, ChevronLeft } from "lucide-react";
import { DocumentPreviewProps } from "@/types/rec-chair";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

// Helper function to prevent accidental rendering of toast returns
function showErrorToast(toast: any, title: string, description: string) {
  toast.error(title, {
    description,
  });
}

export function DocumentPreview({
  documentTitle = "Document Preview",
  documentUrl,
  storagePath,
  onApprove,
  onReject,
  onClose,
  showActions = true,
  onDownload,
  rejectionComment,
  isRevision = false,
  revisionVersion = 0,
  revisionDate,
  documents = [],
  currentDocumentIndex = -1,
  onNavigateDocument
}: DocumentPreviewProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<'pdf' | 'image' | 'other'>('pdf');
  const [showSidebar, setShowSidebar] = useState(documents.length > 0);

  useEffect(() => {
    const loadDocument = async () => {
      setLoading(true);
      setIframeLoading(true);
      setError(null);

      try {
        // Log input parameters for debugging
        console.log("DocumentPreview loadDocument - Input:", { 
          documentUrl, 
          storagePath, 
          documentTitle 
        });

        let url = documentUrl
          ? documentUrl
          : `/api/documents/preview?path=${encodeURIComponent(storagePath!)}`;
        
        console.log("DocumentPreview - Using URL:", url);

        // Determine type
        if (url.toLowerCase().includes('.pdf')) {
          setDocumentType('pdf');
        } else if (/\.(jpe?g|png|gif|bmp|webp)/.test(url.toLowerCase())) {
          setDocumentType('image');
        } else {
          setDocumentType('pdf');
        }

        console.log("DocumentPreview - Document type set to:", documentType);
        setIframeUrl(url);
      } catch (err) {
        console.error("DocumentPreview loading error:", err);
        setError("Failed to load document. Please try again later.");
        showErrorToast(toast, "Error loading document", "There was a problem loading the document. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [documentUrl, storagePath, toast]);

  const handleIframeLoad = () => {
    console.log("DocumentPreview - iframe loaded successfully");
    setIframeLoading(false);
  };

  const handleIframeError = () => {
    console.error("DocumentPreview - iframe loading error");
    setError("Failed to load document content. The file may be unavailable or in an unsupported format.");
    setIframeLoading(false);
  };

  const handleDownload = () => {
    if (onDownload) onDownload();
    else if (documentUrl) {
      const a = document.createElement('a');
      a.href = documentUrl;
      a.download = documentTitle;
      a.target = '_blank';
      a.click();
    }
  };

  // Get document status badge style
  const getStatusBadgeStyle = (status: string | undefined) => {
    if (!status) return "bg-gray-100 text-gray-800";

    const statusLower = status.toLowerCase();
    if (statusLower === "accepted") return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
    if (statusLower === "rejected") return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
    if (statusLower === "revision submitted") return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100";
    return "bg-gray-100 text-gray-800";
  };

  // Get document status text
  const getStatusText = (status: string | undefined) => {
    if (!status) return "Pending";

    const statusLower = status.toLowerCase();
    if (statusLower === "accepted") return "Accepted";
    if (statusLower === "rejected") return "Rejected";
    if (statusLower === "revision submitted") return "Revised";
    if (statusLower === "submitted" || statusLower === "pending") return "Pending";
    return status;
  };

  // Navigate to next or previous document
  const navigateDocument = (direction: 'next' | 'prev') => {
    if (!onNavigateDocument || documents.length === 0 || currentDocumentIndex < 0) return;

    let newIndex = currentDocumentIndex;
    if (direction === 'next') {
      newIndex = (currentDocumentIndex + 1) % documents.length;
    } else {
      newIndex = (currentDocumentIndex - 1 + documents.length) % documents.length;
    }

    onNavigateDocument(newIndex);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      {/* backdrop */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* container */}
      <div className="relative z-10 bg-background rounded-lg shadow-lg overflow-hidden flex flex-col
                      w-full h-full max-w-[90vw] max-h-[90vh]">
        {/* header with buttons */}
        <div className="flex items-center justify-between p-4 border-b border-border/20 bg-background/95 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg truncate">{documentTitle}</h3>
            {isRevision && (
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 flex items-center">
                <RefreshCcw className="h-3 w-3 mr-1" />
                Revision {revisionVersion > 0 ? revisionVersion : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {showActions && onApprove && (
              <Button variant="outline" size="sm" onClick={onApprove} className="text-green-600 border-green-200 hover:bg-green-50">
                <CheckCircle className="h-4 w-4 mr-1" /> Accept
              </Button>
            )}
            {showActions && onReject && (
              <Button variant="outline" size="sm" onClick={() => onReject && onReject(rejectionComment || '')} className="text-red-600 border-red-200 hover:bg-red-50">
                <AlertCircle className="h-4 w-4 mr-1" /> Reject
              </Button>
            )}
            {onDownload && (
              <Button variant="ghost" size="sm" onClick={handleDownload} title="Download">
                <Download className="h-4 w-4" />
              </Button>
            )}
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose} title="Close">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Revision info */}
        {isRevision && revisionDate && (
          <div className="p-2 bg-purple-50 dark:bg-purple-900/10 border-b border-purple-200 dark:border-purple-900">
            <div className="flex items-center gap-2 text-xs text-purple-800 dark:text-purple-300">
              <RefreshCcw className="h-3 w-3" />
              <span>
                <span className="font-medium">This document was revised</span>
                {revisionDate && <> on {new Date(revisionDate).toLocaleDateString()}</>}
                {revisionVersion > 0 && <> (Version {revisionVersion})</>}
              </span>
            </div>
          </div>
        )}

        {/* content with optional sidebar */}
        <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-slate-950 flex">
          {/* Document display area */}
          <div className="flex-1 relative flex items-center justify-center">
            {/* Sidebar toggle button when sidebar is hidden */}
            {!showSidebar && documents.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-4 z-10 h-7 w-7 p-0 bg-background/80 border border-border/20 shadow-sm"
                onClick={() => setShowSidebar(true)}
                title="Show document list"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}

            {/* Sticky note for rejection comment */}
            {rejectionComment && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 max-w-[350px] w-full 
                            bg-red-50 p-4 shadow-lg rounded-md border-l-4 border-red-500 
                            transform rotate-1 transition-all dark:bg-red-900/20 dark:text-red-100">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-red-700 dark:text-red-200">Document Rejected</h4>
                    <p className="text-xs text-red-600 dark:text-red-300 whitespace-pre-wrap mt-1 max-h-[300px] overflow-y-auto">
                      {rejectionComment || (documents.length > 0 && documents[currentDocumentIndex] && documents[currentDocumentIndex].comments)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Document navigation buttons */}
            {documents.length > 1 && currentDocumentIndex >= 0 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full h-8 w-8 bg-background/80"
                  onClick={() => navigateDocument('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full h-8 w-8 bg-background/80"
                  onClick={() => navigateDocument('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {loading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="animate-spin h-10 w-10 text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Loading document...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center p-6 text-center">
                <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            ) : iframeUrl ? (
              <>
                {iframeLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-slate-950">
                    <Loader2 className="animate-spin h-10 w-10 text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Loading document content...</p>
                  </div>
                )}
                {documentType === 'image' ? (
                  <div className="w-full h-full flex items-center justify-center overflow-auto">
                    <img
                      src={iframeUrl}
                      alt={documentTitle}
                      className="max-w-full max-h-full object-contain"
                      onLoad={() => setIframeLoading(false)}
                      onError={() => {
                        console.error("DocumentPreview - Image loading error for URL:", iframeUrl);
                        setError("Failed to load image. The file may be unavailable or in an unsupported format.");
                        setIframeLoading(false);
                      }}
                    />
                  </div>
                ) : (
                  <iframe
                    src={`${iframeUrl}#zoom=page-width&zoom=90`}
                    className="w-full h-full border-0"
                    title={documentTitle}
                    onLoad={handleIframeLoad}
                    onError={handleIframeError}
                  />
                )}
              </>
            ) : (
              <div className="flex flex-col items-center">
                <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No document available</p>
              </div>
            )}
          </div>

          {/* Document navigation sidebar - Moved to right side */}
          {showSidebar && documents.length > 0 && (
            <div className="w-72 bg-background border-l border-border/20 flex flex-col overflow-hidden">
              <div className="p-3 border-b border-border/20 flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setShowSidebar(!showSidebar)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h4 className="text-sm font-medium">Document List</h4>

              </div>
              <div className="flex-1 overflow-y-auto pl-5">
                {documents.map((doc, index) => (
                  <div
                    key={index}
                    className={`p-2 border-b border-border/10 cursor-pointer hover:bg-muted/50 flex items-start
                              ${currentDocumentIndex === index ? 'bg-primary/10' : ''}`}
                    onClick={() => onNavigateDocument && onNavigateDocument(index)}
                  >
                    <FileText className={`h-4 w-4 mt-0.5 mr-2 flex-shrink-0
                                      ${currentDocumentIndex === index ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="min-w-0">
                      <p className={`text-xs font-medium truncate
                                  ${currentDocumentIndex === index ? 'text-primary' : ''}`}>
                        {doc.title || doc.fileName || "Unnamed Document"}
                      </p>
                      <div className="flex items-center mt-1">
                        <Badge
                          className={`text-[10px] px-1 py-0 h-4 ${getStatusBadgeStyle(doc.status)}`}
                        >
                          {getStatusText(doc.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
