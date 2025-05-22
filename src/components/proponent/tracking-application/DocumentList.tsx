import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Upload, Download } from "lucide-react";
import { Document, DocumentStatus } from "@/types/protocol-application/tracking";

interface SimpleDocumentListProps {
  documents: Document[];
  title?: string;
  onUpload?: (doc: Document) => void;
  onDownload?: (doc: Document) => void;
}

const getStatusBadge = (status: string) => {
  const statusLower = typeof status === 'string' ? status.toLowerCase() : '';
  
  switch (statusLower) {
    case 'accepted':
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Accepted</Badge>;
    case 'rejected':
      return <Badge variant="destructive">Rejected</Badge>;
    case 'revision submitted':
      return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">Revised</Badge>;
    case 'review required':
      return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">Revision Required</Badge>;
    case 'pending':
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">Pending Review</Badge>;
    default:
      return <Badge variant="outline">{status || 'Submitted'}</Badge>;
  }
};

export function SimpleDocumentList({
  documents,
  title = "Protocol Review Application Documents",
  onUpload,
  onDownload,
}: SimpleDocumentListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        {(!documents || documents.length === 0) && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Documents Available</h3>
            <p className="text-sm text-muted-foreground">
              No documents have been uploaded or requested yet.
            </p>
          </div>
        )}

        {documents && documents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc, index) => (
              <div 
                key={index} 
                className="flex flex-col p-3 border rounded-md hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <FileText className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{doc.name}</p>
                      {getStatusBadge(doc.status)}
                      
                      {(doc.version || doc.fileName) && (
                        <span className="text-xs text-muted-foreground block mt-1">
                          {doc.version ? `Version ${doc.version}` : doc.fileName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {(doc.status === 'Review Required' || doc.status === 'Pending') && onUpload && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onUpload(doc)}
                      >
                        <Upload className="h-4 w-4 mr-1" /> Upload
                      </Button>
                    )}
                    
                    {onDownload && doc.downloadLink && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onDownload(doc)}
                      >
                        <Download className="h-4 w-4 mr-1" /> Download
                      </Button>
                    )}
                  </div>
                </div>
                
                {doc.requestReason && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p className="font-medium">Note:</p>
                    <p>{doc.requestReason}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 