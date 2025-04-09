import { Application } from "./types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { progressStatusMap, statusMap } from "./constants";

interface ProponentTrackingHeaderProps {
  application: Application;
}

export const ProponentTrackingHeader = ({ application }: ProponentTrackingHeaderProps) => {
  // Get the appropriate status text and badge color
  const statusText = statusMap[application.status] || "Unknown";
  const progressText = progressStatusMap[application.progress]?.name || "Unknown";
  
  // Determine badge variant based on status
  const getBadgeVariant = () => {
    switch (application.status) {
      case "OR": return "default"; // Ongoing Review
      case "A": return "secondary";  // Approved
      case "C": return "outline";  // Completed
      case "T": return "destructive"; // Terminated
      default: return "secondary";
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-xl font-semibold mb-2">
              Protocol Application #{application.applicationCode}
            </h1>
            <p className="text-sm text-muted-foreground mb-1">
              SPUP-REC Code: <span className="font-medium">{application.spupRecCode}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Submitted on {application.submissionDate}
            </p>
          </div>
          
          <div className="flex flex-col mt-4 md:mt-0 space-y-2 items-end">
            <Badge variant={getBadgeVariant()}>
              {statusText}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Stage: {progressText}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 