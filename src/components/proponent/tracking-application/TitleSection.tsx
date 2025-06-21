import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TitleSectionsProps {
  protocolCode: string;
  title: string;
  date: string;
  className?: string;
}

export default function TitleSections({
  protocolCode,
  title,
  date,
  className,
}: TitleSectionsProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Protocol Code Section */}

      {/* Title Section */}
      <Card className="p-6 bg-white border-l-4 border-l-primary">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900 leading-tight">
            {title}
          </h1>
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className="px-4 py-1.5 text-sm font-medium border-primary text-primary"
            >
              Protocol Code: {protocolCode}
            </Badge>
            <div className="flex items-center text-sm text-gray-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>Submitted on {date}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
