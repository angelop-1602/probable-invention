import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressStatus, ApplicationStatus } from "@/types/protocol-application/tracking";
import { Separator } from "@/components/ui/separator";

// Progress info mapping for display
const progressInfo: Record<string, { name: string; description: string }> = {
  "SC": { name: "Submission Check", description: "Checking completeness of documents" },
  "IR": { name: "Initial Review", description: "Under review by primary reviewers" },
  "RS": { name: "Resubmission", description: "Revisions required" },
  "AP": { name: "Approved", description: "Protocol has been approved" },
  "PR": { name: "Progress Report", description: "Ongoing progress monitoring" },
  "FR": { name: "Final Report", description: "Final report submission" },
  "AR": { name: "Archived", description: "Protocol has been archived" }
};

// Status color mapping
const statusText: Record<string, string> = {
  "OR": "On-going Review",
  "A": "Approved and On-going",
  "C": "Completed",
  "T": "Terminated"
};

// Progress color mapping
const progressColors: Record<string, string> = {
  "SC": "bg-blue-100 text-blue-800",
  "IR": "bg-yellow-100 text-yellow-800",
  "RS": "bg-orange-100 text-orange-800",
  "AP": "bg-green-100 text-green-800",
  "PR": "bg-purple-100 text-purple-800",
  "FR": "bg-indigo-100 text-indigo-800",
  "AR": "bg-gray-100 text-gray-800"
};

// Helper function to get progress percentage
const getProgressPercentage = (progress: ProgressStatus): string => {
  const progressSteps: ProgressStatus[] = ["SC", "IR", "RS", "AP", "PR", "FR", "AR"];
  const currentIndex = progressSteps.indexOf(progress);
  if (currentIndex === -1) return "0%";
  
  // Calculate percentage (current / total * 100)
  return `${Math.floor((currentIndex / (progressSteps.length - 1)) * 100)}%`;
};

interface ProgressTrackerProps {
  progress: ProgressStatus;
  status: ApplicationStatus;
}

export const ProgressTracker = ({ progress, status }: ProgressTrackerProps) => {
  // Array of all progress steps
  const progressSteps: ProgressStatus[] = ["SC", "IR", "RS", "AP", "PR", "FR", "AR"];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Application Status</CardTitle>
          <div>
            <Badge 
              variant="outline" 
              className={`mr-2 ${progressColors[progress]}`}
            >
              {progress}: {progressInfo[progress].name}
            </Badge>
            <Badge variant="outline" className="bg-gray-100 text-gray-800">
              Status: {statusText[status]}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent>
        <div className="relative">
          <div className="flex justify-between mb-2">
            {progressSteps.map((step) => (
              <div key={step} className="text-center flex-1">
                <div className="text-xs font-medium">{step}</div>
              </div>
            ))}
          </div>
          <div className="h-2 bg-gray-200 rounded-full mb-4">
            {/* This will show the progress based on the current step */}
            <div 
              className="h-full bg-primary rounded-full"
              style={{ width: getProgressPercentage(progress) }}
            ></div>
          </div>
          <div className="flex justify-between text-xs">
            {progressSteps.map((step) => (
              <div key={step} className="text-center flex-1">
                <div className="text-xs">
                  {progressInfo[step].name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 