import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MoreVertical, FileText } from "lucide-react";

interface Document {
  name: string;
  status: string;
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
      Submitted: "bg-blue-100 text-blue-700"
    };
    return statusColors[status] || "bg-gray-100 text-gray-700";
  };

  return (
    <Card className="w-full h-full bg-white shadow-sm">
      <CardHeader className="border-b flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-green-800">Protocol Documents</CardTitle>
        <Button variant="outline" className="bg-primary text-white hover:border-primary hover:bg-white hover:text-primary">
          Requested Document
        </Button>
      </CardHeader>
      <CardContent className="h-full p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="text-primary flex-shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                    <Badge 
                      variant="outline" 
                      className={`mt-1 ${getStatusColor(doc.status)}`}
                    >
                      {doc.status}
                    </Badge>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-gray-500 hover:text-gray-700 flex-shrink-0"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
      </CardContent>
    </Card>
  );
} 