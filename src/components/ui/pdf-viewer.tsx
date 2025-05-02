"use client";

import React, { useState } from 'react';

interface PDFViewerProps {
  url: string;
  title?: string;
  inline?: boolean;
}

export default function PDFViewer({ url, title, inline = true }: PDFViewerProps) {
  const [loading, setLoading] = useState(true);
  
  console.log("PDFViewer: Initializing with", { url, title, inline });
  
  // If inline parameter exists in URL, ensure it's preserved
  const ensureInlineParameter = (pdfUrl: string): string => {
    try {
      console.log("PDFViewer: Processing URL", pdfUrl);
      const urlObj = new URL(pdfUrl, window.location.origin);
      if (inline) {
        urlObj.searchParams.set('inline', 'true');
      }
      const processedUrl = urlObj.toString();
      console.log("PDFViewer: Processed URL", processedUrl);
      return processedUrl;
    } catch (e) {
      console.log("PDFViewer: Error processing URL", e);
      // If URL parsing fails, just append the parameter
      if (inline && !pdfUrl.includes('inline=')) {
        const newUrl = pdfUrl + (pdfUrl.includes('?') ? '&' : '?') + 'inline=true';
        console.log("PDFViewer: Appended inline parameter", newUrl);
        return newUrl;
      }
      return pdfUrl;
    }
  };

  const processedUrl = ensureInlineParameter(url);

  const handleIframeLoad = () => {
    console.log("PDFViewer: iframe loaded");
    setLoading(false);
  };

  const handleIframeError = (e: any) => {
    console.error("PDFViewer: iframe error", e);
    setLoading(false);
  };

  return (
    <div className="flex flex-col w-full h-full min-h-[80vh]">
      {title && (
        <div className="p-2 bg-muted text-center border-b">
          <h2 className="text-lg font-medium">{title}</h2>
        </div>
      )}
      
      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
        </div>
      )}
      
      <iframe 
        src={`${processedUrl}#toolbar=1&navpanes=1`} 
        className="w-full flex-1 min-h-[500px]"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        title={title || "PDF Document"}
        style={{ 
          display: loading ? 'none' : 'block',
          border: 'none'
        }}
      />
    </div>
  );
} 