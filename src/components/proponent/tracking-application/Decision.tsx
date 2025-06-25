import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle, AlertTriangle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DecisionProps {
  decision?: {
    status: string;
    type?: string;
    date: string;
    comments?: string;
    nextSteps?: string[];
    documents?: {
      name: string;
      status: string;
      dueDate: string;
    }[];
  };
}

const DECISION_COLORS = {
  "Approved": {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
    icon: CheckCircle,
    badge: "bg-green-100 text-green-800"
  },
  "Minor modification": {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-700",
    icon: AlertTriangle,
    badge: "bg-yellow-100 text-yellow-800"
  },
  "Major modification": {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    icon: AlertCircle,
    badge: "bg-orange-100 text-orange-800"
  },
  "Disapproved": {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    icon: XCircle,
    badge: "bg-red-100 text-red-800"
  },
  "Pending": {
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-700",
    icon: AlertCircle,
    badge: "bg-gray-100 text-gray-800"
  }
};

export function Decision({ decision }: DecisionProps) {
  if (!decision) {
    return null;
  }

  const decisionStyle = DECISION_COLORS[decision.status as keyof typeof DECISION_COLORS] || DECISION_COLORS["Pending"];
  const Icon = decisionStyle.icon;

  const handleDownload = () => {
    // TODO: Implement actual file download
    console.log("Downloading REC Decision notification");
  };

  return (
    <Card className={`w-full h-full ${decisionStyle.bg} ${decisionStyle.border} border`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Icon className={`h-5 w-5 ${decisionStyle.text}`} />
          Decision Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Current Status</span>
            <Badge className={`${decisionStyle.badge}`}>
              {decision.status}
            </Badge>
          </div>
          {decision.type && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Review Type</span>
              <span className="text-sm text-gray-600">{decision.type}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Decision Date</span>
            <span className="text-sm text-gray-600">{decision.date}</span>
          </div>
        </div>

        {decision.comments && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Notification of REC Decision</h4>
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2 bg-white"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
              Download Decision Form
            </Button>
          </div>
        )}

        {decision.nextSteps && decision.nextSteps.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Next Steps</h4>
            <ul className="list-disc list-inside space-y-1">
              {decision.nextSteps.map((step, index) => (
                <li key={index} className="text-sm text-gray-600">{step}</li>
              ))}
            </ul>
          </div>
        )}

        {decision.documents && decision.documents.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Required Documents</h3>
            <div className="space-y-2">
              {decision.documents.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-600">{doc.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize",
                        doc.status === "pending" && "bg-yellow-50",
                        doc.status === "submitted" && "bg-blue-50",
                        doc.status === "approved" && "bg-green-50"
                      )}
                    >
                      {doc.status}
                    </Badge>
                    <span className="text-gray-500">Due: {doc.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
