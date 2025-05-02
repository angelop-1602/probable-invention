"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ExternalLink, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useSimpleDocumentViewer from '@/hooks/useSimpleDocumentViewer';

interface SimplePDFViewerProps {
  storagePath: string;
  title?: string;
  onClose?: () => void;
}

/**
 * A simple PDF viewer that displays documents from Firebase Storage
 * It automatically handles ZIP extraction and displays PDFs directly
 */
export default function SimplePDFViewer({
  storagePath,
  title,
  onClose
}: SimplePDFViewerProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const { documentUrl, loading, error } = useSimpleDocumentViewer(storagePath);

  const handleIframeLoad = () => {
    setIframeLoaded(true);
  };

  const openInNewTab = () => {
    if (documentUrl) {
      window.open(documentUrl, '_blank');
    }
  };

  return (
    <Card className="overflow-hidden w-full h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b bg-muted/40">
        <h3 className="text-base font-medium truncate">{title || 'Document'}</h3>
        <div className="flex gap-2">
          {documentUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={openInNewTab}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Open in New Tab
            </Button>
          )}
          {onClose && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClose}
            >
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-0 h-[calc(100vh-4rem)]">
        {loading && (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-2">Loading document...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-full">
            <FileText className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-red-500 max-w-md text-center">{error}</p>
            <p className="text-sm text-muted-foreground mt-4">
              Note: If you have an ad blocker enabled, try disabling it.
            </p>
          </div>
        )}

        {documentUrl && (
          <>
            {!iframeLoaded && !error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            <iframe
              src={`${documentUrl}#toolbar=1&navpanes=1`}
              className="w-full h-full"
              onLoad={handleIframeLoad}
              style={{ 
                visibility: iframeLoaded ? 'visible' : 'hidden',
                border: 'none'
              }}
              title={title || "Document Viewer"}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
} 