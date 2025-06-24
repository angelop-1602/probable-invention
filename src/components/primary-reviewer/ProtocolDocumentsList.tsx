'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { DocumentPreview } from '@/components/shared/DocumentPreview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Download, 
  Eye, 
  File,
  AlertCircle,
  Archive
} from 'lucide-react';

// Empty documents array - will be populated with real data from Firebase
const documents: any[] = [];

export default function DocumentListPage() {
  // Mock document data structure for when real data is available
  const mockDocument = {
    id: 'doc_1',
    title: 'Research Protocol.pdf',
    url: '/path/to/document.pdf',
    type: 'pdf',
    size: 2048576, // 2MB
    isZipped: false,
    uploadedAt: new Date(),
    category: 'protocol'
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Protocol Documents</h1>
        <Badge variant="secondary" className="text-sm">
          {documents.length} Documents
        </Badge>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No Protocol Documents</h3>
              <p className="text-sm">Documents will appear here when protocols are assigned for review.</p>
              <p className="text-xs mt-2 text-gray-400">
                Preview functionality is ready for zipped and individual documents
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex-shrink-0">
                      {doc.type === 'pdf' && <FileText className="h-8 w-8 text-red-500" />}
                      {doc.type === 'doc' && <File className="h-8 w-8 text-blue-500" />}
                      {doc.isZipped && <Archive className="h-8 w-8 text-purple-500" />}
                      {!['pdf', 'doc'].includes(doc.type) && !doc.isZipped && (
                        <File className="h-8 w-8 text-gray-500" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{doc.title}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {doc.category}
                        </Badge>
                        {doc.size && (
                          <span className="text-xs text-gray-500">
                            {(doc.size / 1024 / 1024).toFixed(1)} MB
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {format(doc.uploadedAt, 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <DocumentPreview
                      documentUrl={doc.url}
                      documentTitle={doc.title}
                      documentType={doc.type}
                      fileSize={doc.size}
                      isZipped={doc.isZipped}
                      trigger={
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                      }
                    />
                    
                    <Button variant="ghost" size="sm" asChild>
                      <Link
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
