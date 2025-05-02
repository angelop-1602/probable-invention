"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, CheckCircle, AlertCircle, Maximize, Minimize, Loader2, FileText } from "lucide-react";
import { DocumentPreviewProps } from "@/types/rec-chair";

export function DocumentPreview({
  documentTitle = "Document Preview",
  documentUrl,
  storagePath,
  onApprove,
  onReject,
  onClose,
  showActions = true,
  isFullScreen = false
}: DocumentPreviewProps) {
  const [fullScreen, setFullScreen] = useState(isFullScreen);
  const [loading, setLoading] = useState(true);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadDocument = async () => {
      setLoading(true);
      setIframeLoading(true);
      setError(null);
      
      try {
        // If we have a direct URL, use it immediately
        if (documentUrl) {
          setIframeUrl(documentUrl);
        }
        // If we have a storage path, use the API
        else if (storagePath) {
          // Use API URL to fetch and display the document
          const apiUrl = `/api/documents/preview?path=${encodeURIComponent(storagePath)}`;
          setIframeUrl(apiUrl);
        } else {
          throw new Error("No document URL or storage path provided");
        }
      } catch (error) {
        console.error("Error setting up document:", error);
        setError("Failed to load document. Please try again later.");
        setIframeLoading(false);
      } finally {
        setLoading(false);
      }
    };
    
    loadDocument();
  }, [documentUrl, storagePath]);

  const handleIframeLoad = () => {
    setIframeLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Modal Container */}
      <div
        className={`
          ${fullScreen ? 'fixed inset-2' : 'w-[90vw] h-[90vh] max-w-6xl'}
          bg-background rounded-lg shadow-lg overflow-hidden
          flex flex-col relative z-10
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <h3 className="font-medium truncate max-w-[60%]">{documentTitle}</h3>
          <div className="flex items-center gap-2">
            {showActions && onApprove && (
              <Button
                variant="outline"
                size="sm"
                onClick={onApprove}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Accept
              </Button>
            )}
            {showActions && onReject && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReject}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <AlertCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setFullScreen(!fullScreen)}>
              {fullScreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="animate-spin h-10 w-10 text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Loading document...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center text-center p-6">
              <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : iframeUrl ? (
            <>
              {iframeLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900">
                  <Loader2 className="animate-spin h-10 w-10 text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">Loading document content...</p>
                </div>
              )}
              <iframe 
                src={iframeUrl}
                className="w-full h-full border-0"
                title={documentTitle}
                onLoad={handleIframeLoad}
              />
            </>
          ) : (
            <div className="flex flex-col items-center">
              <FileText className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No document available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
