"use client";

import React, { useState } from 'react';
import { AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import useDocumentViewer from '@/hooks/useDocumentViewer';
import { cn } from '@/lib/utils';

interface PdfViewerProps {
  storagePath?: string;
  directUrl?: string;
  title?: string;
  className?: string;
  fullScreen?: boolean;
}

/**
 * Simplified PDF viewer component that handles document loading directly using Firebase
 */
export function PdfViewer({
  storagePath,
  directUrl,
  title = 'Document',
  className,
  fullScreen = false,
}: PdfViewerProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  
  const {
    documentUrl,
    loading,
    error,
    retry
  } = useDocumentViewer(storagePath, directUrl);

  // Handle iframe events
  const handleIframeLoad = () => {
    setIframeLoaded(true);
    setIframeError(false);
  };

  const handleIframeError = () => {
    setIframeError(true);
  };

  return (
    <div className={cn('flex flex-col w-full h-full', className)}>
      {/* Document title and action buttons */}
      <div className="flex justify-between items-center mb-2 p-2 bg-muted/30 rounded">
        <h3 className="text-sm font-medium truncate">{title}</h3>
        {documentUrl && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2"
            onClick={() => window.open(documentUrl, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            <span className="sr-only sm:not-sr-only sm:text-xs">Open</span>
          </Button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center flex-1 p-4">
          <div className="animate-spin">
            <RefreshCw className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Loading document...</p>
        </div>
      )}

      {/* Error state */}
      {(error || iframeError) && !loading && (
        <div className="flex flex-col items-center justify-center flex-1 p-4">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>
              {error || "Failed to display the document."}
            </AlertDescription>
          </Alert>
          <Button onClick={retry} className="mt-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      )}

      {/* PDF viewer iframe */}
      {documentUrl && !loading && !iframeError && (
        <div className={cn(
          'relative flex-1 border rounded overflow-hidden', 
          !iframeLoaded && 'bg-muted/30'
        )}>
          <iframe
            src={documentUrl}
            className="absolute inset-0 w-full h-full"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            style={{ opacity: iframeLoaded ? 1 : 0 }}
          />
          {!iframeLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin">
                <RefreshCw className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 