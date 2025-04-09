import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressStatus } from "./types";
import { getProgressInfo, getStatusText, getProgressColor, getProgressPercentage } from "./utils";
import { Separator } from "@/components/ui/separator";

interface ProgressTrackerProps {
  progress: ProgressStatus;
  status: string;
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
              className={`mr-2 ${getProgressColor(progress)}`}
            >
              {progress}: {getProgressInfo(progress).name}
            </Badge>
            <Badge variant="outline" className="bg-gray-100 text-gray-800">
              Status: {getStatusText(status)}
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
                  {getProgressInfo(step).name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 