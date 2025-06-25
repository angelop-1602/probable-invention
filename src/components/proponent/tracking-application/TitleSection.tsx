import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProtocolStatusBadge } from "@/components/ui/ProtocolStatusBadge";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";
import { FacebookStyleMessage } from "./FacebookStyleMessage";

interface TitleSectionsProps {
  applicationCode?: string;
  spupRecCode?: string;
  title: string;
  date: string;
  status?: string;
  progress?: string;
  className?: string;
  applicationId?: string;
  currentUserName?: string;
}

export default function TitleSections({
  applicationCode,
  spupRecCode,
  title,
  date,
  status = "Submitted",
  progress,
  className,
  applicationId = "",
  currentUserName = "Angel Peralta",
}: TitleSectionsProps) {
  // Use progress if available, otherwise use status
  const displayStatus = progress || status;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Title Section with Codes and Status */}
      <Card className="p-6 bg-white border-l-4 border-l-primary">
        <div className="space-y-4">
          {/* Title */}
          <h1 className="text-2xl font-semibold text-gray-900 mb-1 leading-tight">
            {title}
            
          </h1>
          <div className="flex items-center justify-between">
          {applicationCode && (
                <div className="flex items-center space-x-2 mt-0">
                  <span className="text-sm text-gray-500">
                    Application Code:
                  </span>
                  <span className="text-sm font-mono text-gray-400">
                    {applicationCode}
                  </span>
                </div>
              )}

            {/* Submission Date */}
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Submitted on {date}</span>
            </div>
          </div>
          
          {/* Codes and Submission Date Row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col space-x-4">
              <div className="flex items-center space-x-2 border-2 border-dashed border-primary rounded-full px-4">
                <span className="text-lg font-medium text-primary">SPUP REC Code:</span>
                {spupRecCode ? (
                  <Badge
                    variant="outline"
                    className="px-3 py-1 text-sm font-semibold border-primary text-primary bg-primary/10"
                  >
                    {spupRecCode}
                  </Badge>
                ) : (
                  <span className="text-sm text-gray-400 italic">
                    Not yet assigned by REC Chair
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <ProtocolStatusBadge status={displayStatus} />
            </div>
          </div>

          {/* Status Row */}
          <div className="flex items-center justify-between">
            
<div></div>
            <div className="flex items-center space-x-2">
              <FacebookStyleMessage 
                isInline={true} 
                applicationId={applicationId}
                currentUserRole="proponent"
                currentUserName={currentUserName}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
