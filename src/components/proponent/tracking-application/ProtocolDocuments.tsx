import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MoreVertical, FileText, Download, Calendar, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Document {
  name: string;
  status: string;
  downloadUrl?: string;
  id?: string;
  title?: string;
  category?: string;
  uploadDate?: any;
  version?: number;
}

interface ProtocolDocumentsProps {
  documents: Document[];
}

export function ProtocolDocuments({ documents }: ProtocolDocumentsProps) {
  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      Draft: "bg-gray-100 text-gray-700",
      Accomplished: "bg-yellow-100 text-yellow-700",
      Approved: "bg-green-100 text-green-700",
      Revise: "bg-purple-100 text-purple-700",
      Rejected: "bg-red-100 text-red-700",
      Submitted: "bg-blue-100 text-blue-700",
      Pending: "bg-orange-100 text-orange-700",
      "Under Review": "bg-indigo-100 text-indigo-700"
    };
    return statusColors[status] || "bg-gray-100 text-gray-700";
  };

  const formatUploadDate = (uploadDate: any) => {
    if (!uploadDate) return 'Unknown';
    
    try {
      // Handle different date formats
      let date: Date;
      if (uploadDate.toDate && typeof uploadDate.toDate === 'function') {
        // Firestore Timestamp
        date = uploadDate.toDate();
      } else if (uploadDate.seconds) {
        // Firestore Timestamp object
        date = new Date(uploadDate.seconds * 1000);
      } else {
        // Regular date string or timestamp
        date = new Date(uploadDate);
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown';
    }
  };

  const handleDownload = async (doc: Document) => {
    if (!doc.downloadUrl) {
      toast.error('Download link not available');
      return;
    }

    try {
      // Create a temporary link to trigger download
      const link = window.document.createElement('a');
      link.href = doc.downloadUrl;
      link.download = doc.name || doc.title || 'document';
      link.target = '_blank';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      
      toast.success('Download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    }
  };

  const handleView = async (document: Document) => {
    if (!document.downloadUrl) {
      toast.error('Document not available for viewing');
      return;
    }

    try {
      // Open document in a new tab for viewing
      window.open(document.downloadUrl, '_blank');
    } catch (error) {
      console.error('View error:', error);
      toast.error('Failed to open document');
    }
  };

  const getCategoryLabel = (category: string) => {
    const categoryLabels: Record<string, string> = {
      'basic_requirements': 'Basic Requirement',
      'supplementary_documents': 'Supplementary',
      'submission': 'Submission',
      'requested': 'Requested',
      'resubmission': 'Resubmission'
    };
    return categoryLabels[category] || 'Document';
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
        <Button variant="outline" className="bg-primary text-white hover:border-primary hover:bg-white hover:text-primary">
          Requested Document
        </Button>
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
                      <div className="flex items-center space-x-2 mb-2">
                        <p className="font-medium text-gray-900 truncate text-sm">
                          {doc.title || doc.name}
                        </p>
                        {doc.category && (
                          <Badge variant="secondary" className="text-xs">
                            {getCategoryLabel(doc.category)}
                          </Badge>
                        )}
                        {doc.version && doc.version > 1 && (
                          <Badge variant="outline" className="text-xs">
                            v{doc.version}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatUploadDate(doc.uploadDate)}</span>
                        </div>
                    <Badge 
                      variant="outline" 
                          className={`${getStatusColor(doc.status)} text-xs`}
                    >
                      {doc.status}
                    </Badge>
                  </div>
                </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {doc.downloadUrl && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(doc)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(doc)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                          size="sm"
                          className="text-gray-500 hover:text-gray-700"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {doc.downloadUrl && (
                          <>
                            <DropdownMenuItem onClick={() => handleView(doc)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Document
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(doc)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem>
                          <FileText className="h-4 w-4 mr-2" />
                          Document Details
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