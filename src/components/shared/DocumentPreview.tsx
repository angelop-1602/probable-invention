/**
 * Universal Document Preview Component
 * 
 * Handles preview of documents including zipped files, PDFs, and other formats
 * Used across the entire project for consistent document viewing
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Eye, 
  Download, 
  FileText, 
  File, 
  Archive,
  AlertCircle,
  Maximize2,
  Minimize2,
  RotateCw,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { SubmissionStorage } from '@/lib/submission/submission.storage';
import { formatFileSize } from '@/lib/submission/submission.utils';
import JSZip from 'jszip';

interface DocumentPreviewProps {
  documentUrl: string;
  documentTitle: string;
  documentType?: 'pdf' | 'doc' | 'docx' | 'zip' | 'unknown';
  fileSize?: number;
  isZipped?: boolean;
  trigger?: React.ReactNode;
  className?: string;
  showDownload?: boolean;
  showTitle?: boolean;
}

interface PreviewState {
  isLoading: boolean;
  error: string | null;
  content: Blob | null;
  extractedFiles: { name: string; content: Blob; size: number }[];
  selectedFile: number;
  zoom: number;
  rotation: number;
}

export function DocumentPreview({
  documentUrl,
  documentTitle,
  documentType = 'unknown',
  fileSize,
  isZipped = false,
  trigger,
  className = '',
  showDownload = true,
  showTitle = true
}: DocumentPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewState, setPreviewState] = useState<PreviewState>({
    isLoading: false,
    error: null,
    content: null,
    extractedFiles: [],
    selectedFile: 0,
    zoom: 100,
    rotation: 0
  });

  const storage = SubmissionStorage.getInstance();

  // Detect document type from URL or filename
  const detectDocumentType = useCallback((url: string, title: string): string => {
    if (documentType !== 'unknown') return documentType;
    
    const extension = title.split('.').pop()?.toLowerCase() || url.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf': return 'pdf';
      case 'doc':
      case 'docx': return 'doc';
      case 'zip': return 'zip';
      default: return 'unknown';
    }
  }, [documentType]);

  const detectedType = detectDocumentType(documentUrl, documentTitle);

  // Load and process document
  const loadDocument = useCallback(async () => {
    setPreviewState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let content: Blob;
      
      if (isZipped) {
        // Download and extract zipped content
        const downloadedContent = await storage.downloadDocument(documentUrl);
        if (!downloadedContent) {
          throw new Error('Failed to download document');
        }
        content = downloadedContent;
      } else {
        // Direct download
        const response = await fetch(documentUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        content = await response.blob();
      }

      // If it's a zip file, extract contents
      if (detectedType === 'zip' || isZipped) {
        const zip = new JSZip();
        const zipContents = await zip.loadAsync(content);
        const extractedFiles: { name: string; content: Blob; size: number }[] = [];
        
        for (const [filename, file] of Object.entries(zipContents.files)) {
          if (!file.dir) {
            const fileContent = await file.async('blob');
            extractedFiles.push({
              name: filename,
              content: fileContent,
              size: fileContent.size
            });
          }
        }
        
        setPreviewState(prev => ({
          ...prev,
          content,
          extractedFiles,
          selectedFile: 0,
          isLoading: false
        }));
      } else {
        setPreviewState(prev => ({
          ...prev,
          content,
          extractedFiles: [],
          isLoading: false
        }));
      }
    } catch (error) {
      console.error('Error loading document:', error);
      setPreviewState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load document',
        isLoading: false
      }));
    }
  }, [documentUrl, isZipped, detectedType, storage]);

  // Load document when dialog opens
  useEffect(() => {
    if (isOpen && !previewState.content && !previewState.isLoading) {
      loadDocument();
    }
  }, [isOpen, previewState.content, previewState.isLoading, loadDocument]);

  // Download handler
  const handleDownload = useCallback(async (fileContent?: Blob, fileName?: string) => {
    try {
      const content = fileContent || previewState.content;
      const name = fileName || documentTitle;
      
      if (!content) {
        await loadDocument();
        return;
      }

      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  }, [previewState.content, documentTitle, loadDocument]);

  // Zoom controls
  const handleZoom = (delta: number) => {
    setPreviewState(prev => ({
      ...prev,
      zoom: Math.max(25, Math.min(400, prev.zoom + delta))
    }));
  };

  // Rotation controls
  const handleRotate = () => {
    setPreviewState(prev => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360
    }));
  };

  // File type icon
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="h-4 w-4 text-red-500" />;
      case 'doc':
      case 'docx': return <File className="h-4 w-4 text-blue-500" />;
      case 'zip': return <Archive className="h-4 w-4 text-purple-500" />;
      default: return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  // Render file content based on type
  const renderContent = () => {
    if (previewState.isLoading) {
      return (
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
          <span className="ml-2">Loading document...</span>
        </div>
      );
    }

    if (previewState.error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load document</h3>
          <p className="text-gray-600 mb-4">{previewState.error}</p>
          <Button onClick={loadDocument} variant="outline">
            Try Again
          </Button>
        </div>
      );
    }

    if (previewState.extractedFiles.length > 0) {
      // Zip file with extracted contents
      const currentFile = previewState.extractedFiles[previewState.selectedFile];
      
      return (
        <div className="space-y-4">
          {/* File selector */}
          <div className="border-b pb-4">
            <h4 className="font-semibold mb-2">Archive Contents ({previewState.extractedFiles.length} files)</h4>
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
              {previewState.extractedFiles.map((file, index) => (
                <button
                  key={index}
                  onClick={() => setPreviewState(prev => ({ ...prev, selectedFile: index }))}
                  className={`flex items-center justify-between p-2 rounded border text-left hover:bg-gray-50 ${
                    index === previewState.selectedFile ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {getFileIcon(file.name.split('.').pop()?.toLowerCase() || 'unknown')}
                    <span className="truncate">{file.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      {formatFileSize(file.size)}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(file.content, file.name);
                      }}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Current file preview */}
          {currentFile && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h5 className="font-medium">{currentFile.name}</h5>
                <Badge>{formatFileSize(currentFile.size)}</Badge>
              </div>
              
              {/* PDF preview for extracted PDF files */}
              {currentFile.name.toLowerCase().endsWith('.pdf') ? (
                <div 
                  className="border rounded bg-gray-50 flex items-center justify-center h-96"
                  style={{
                    transform: `scale(${previewState.zoom / 100}) rotate(${previewState.rotation}deg)`
                  }}
                >
                  <iframe
                    src={URL.createObjectURL(currentFile.content)}
                    className="w-full h-full border-0"
                    title={currentFile.name}
                  />
                </div>
              ) : (
                <div className="border rounded bg-gray-50 flex flex-col items-center justify-center h-96">
                  {getFileIcon(currentFile.name.split('.').pop()?.toLowerCase() || 'unknown')}
                  <p className="mt-2 text-gray-600">Preview not available for this file type</p>
                  <Button 
                    onClick={() => handleDownload(currentFile.content, currentFile.name)}
                    className="mt-4"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download to view
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // Single file preview
    if (previewState.content) {
      if (detectedType === 'pdf') {
        return (
          <div 
            className="border rounded bg-gray-50 h-96"
            style={{
              transform: `scale(${previewState.zoom / 100}) rotate(${previewState.rotation}deg)`,
              transformOrigin: 'center center'
            }}
          >
            <iframe
              src={URL.createObjectURL(previewState.content)}
              className="w-full h-full border-0 rounded"
              title={documentTitle}
            />
          </div>
        );
      } else {
        return (
          <div className="border rounded bg-gray-50 flex flex-col items-center justify-center h-96">
            {getFileIcon(detectedType)}
            <p className="mt-2 text-gray-600">Preview not available for this file type</p>
            <Button 
              onClick={() => handleDownload()}
              className="mt-4"
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Download to view
            </Button>
          </div>
        );
      }
    }

    return null;
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className={className}>
      <Eye className="h-4 w-4 mr-2" />
      Preview
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent 
        className={`max-w-4xl h-[90vh] ${isFullscreen ? 'max-w-full h-full' : ''}`}
      >
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            {getFileIcon(detectedType)}
            {showTitle && (
              <DialogTitle className="truncate">{documentTitle}</DialogTitle>
            )}
            {fileSize && (
              <Badge variant="secondary">{formatFileSize(fileSize)}</Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Zoom controls for PDFs */}
            {(detectedType === 'pdf' || previewState.extractedFiles.some(f => f.name.toLowerCase().endsWith('.pdf'))) && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleZoom(-25)}
                  disabled={previewState.zoom <= 25}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-16 text-center">
                  {previewState.zoom}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleZoom(25)}
                  disabled={previewState.zoom >= 400}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRotate}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </>
            )}
            
            {showDownload && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownload()}
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1">
          {renderContent()}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Convenience component for quick document preview
export function QuickDocumentPreview({
  url,
  title,
  className = ''
}: {
  url: string;
  title: string;
  className?: string;
}) {
  return (
    <DocumentPreview
      documentUrl={url}
      documentTitle={title}
      className={className}
      trigger={
        <Button variant="ghost" size="sm" className={`hover:bg-gray-100 ${className}`}>
          <Eye className="h-4 w-4" />
        </Button>
      }
      showTitle={false}
    />
  );
} 