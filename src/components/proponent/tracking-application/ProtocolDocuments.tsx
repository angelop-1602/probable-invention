import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { DocumentStatusBadge } from "@/components/ui/DocumentStatusBadge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileText, Download, Eye, EllipsisVertical } from "lucide-react";
import { toast } from "sonner";
import { SubmissionStorage } from "@/lib/submission/submission.storage";

interface Document {
  name: string;
  status: string;
  downloadUrl?: string;
  id?: string;
  title?: string;
  category?: string;
  version?: number;
  storagePath?: string;
  downloadLink?: string;
  url?: string;
  path?: string;
}

interface ProtocolDocumentsProps {
  documents: Document[];
}

export function ProtocolDocuments({ documents }: ProtocolDocumentsProps) {
  const storage = SubmissionStorage.getInstance();
  
  // Helper function to check if document has any accessible URL
  const hasAccessibleUrl = (doc: Document): boolean => {
    return !!(doc.downloadUrl || doc.downloadLink || doc.url || doc.storagePath || doc.path);
  };

  const handleDownload = async (doc: Document) => {
    try {
      // Try multiple URL sources in order of preference
      let downloadUrl = doc.downloadUrl || doc.downloadLink || doc.url;
      
      // If no direct download URL, try to construct proxy URL from storage path
      if (!downloadUrl && (doc.storagePath || doc.path)) {
        const storagePath = doc.storagePath || doc.path;
        if (storagePath) {
          downloadUrl = `/api/proxy-storage/path?path=${encodeURIComponent(storagePath)}`;
        }
      }
      
      if (!downloadUrl) {
        toast.error('Download link not available');
        return;
      }

      toast.info('Preparing download...');

      // Check if the document is zipped (most submission documents are)
      const isZipped = downloadUrl.includes('.zip') || doc.storagePath?.includes('.zip') || doc.path?.includes('.zip');
      
      if (isZipped) {
        // Handle zipped documents using the storage service
        const extractedContent = await storage.downloadDocument(downloadUrl);
        if (extractedContent) {
          // Create download link for extracted content
          const url = URL.createObjectURL(extractedContent);
          const link = document.createElement('a');
          link.href = url;
          link.download = doc.title || doc.name || 'document';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          toast.success('Download started');
        } else {
          throw new Error('Failed to extract document from zip');
        }
      } else {
        // Handle regular documents
        const response = await fetch(downloadUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.title || doc.name || 'document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success('Download started');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document. Please try again.');
    }
  };

  const handlePreview = async (document: Document) => {
    try {
      // Try multiple URL sources in order of preference
      let previewUrl = document.downloadUrl || document.downloadLink || document.url;
      
      // If no direct download URL, try to construct proxy URL from storage path
      if (!previewUrl && (document.storagePath || document.path)) {
        const storagePath = document.storagePath || document.path;
        if (storagePath) {
          previewUrl = `/api/proxy-storage/path?path=${encodeURIComponent(storagePath)}`;
        }
      }
      
      if (!previewUrl) {
        toast.error('Document not available for preview');
        return;
      }

      toast.info('Opening document preview...');

      // Check if the document is zipped
      const isZipped = previewUrl.includes('.zip') || document.storagePath?.includes('.zip') || document.path?.includes('.zip');
      
      if (isZipped) {
        // For zipped documents, extract and create blob URL for preview
        const extractedContent = await storage.downloadDocument(previewUrl);
        if (extractedContent) {
          const blobUrl = URL.createObjectURL(extractedContent);
          window.open(blobUrl, '_blank');
          
          // Clean up the blob URL after a delay to allow the tab to load
          setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
          }, 30000); // 30 seconds
          
          toast.success('Document opened in new tab');
        } else {
          throw new Error('Failed to extract document from zip');
        }
      } else {
        // For regular documents, use proxy for better compatibility
        const proxyUrl = `/api/proxy-document?url=${encodeURIComponent(previewUrl)}&inline=true`;
        window.open(proxyUrl, '_blank');
        toast.success('Document opened in new tab');
      }
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Failed to preview document. Please try again.');
    }
  };

  return (
    <Card className="w-full h-full bg-white shadow-sm">
      <CardHeader className="border-b flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-green-800">
          Protocol Documents
          {documents.length > 0 && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({documents.length} {documents.length === 1 ? 'document' : 'documents'})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-full p-6">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Found</h3>
            <p className="text-gray-500 max-w-sm">
              No documents have been uploaded for this application yet. Documents will appear here once they are submitted.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100%-2rem)]">
            <div className="grid grid-cols-1 gap-4">
              {documents.map((doc, index) => (
                <div 
                  key={doc.id || index} 
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border"
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="text-primary flex-shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate text-sm">
                        {doc.title || doc.name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center mr-4">
                    <DocumentStatusBadge status={doc.status || "Submitted"} size="sm" />
                  </div>
                  
                  {/* Action Menu - Always show */}
                  <div className="flex-shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                        >
                          <EllipsisVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem 
                          onClick={() => handlePreview(doc)}
                          disabled={!hasAccessibleUrl(doc)}
                          className="flex items-center space-x-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Preview</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDownload(doc)}
                          disabled={!hasAccessibleUrl(doc)}
                          className="flex items-center space-x-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
} 