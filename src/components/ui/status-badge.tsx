import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ApplicationStatus = 
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected";

interface StatusBadgeProps {
  status: ApplicationStatus;
  className?: string;
}

const statusConfig = {
  draft: {
    label: "Draft",
    className: "bg-gray-100 text-gray-800 hover:bg-gray-200",
  },
  submitted: {
    label: "Submitted",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  },
  under_review: {
    label: "Under Review",
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  },
  approved: {
    label: "Approved",
    className: "bg-green-100 text-green-800 hover:bg-green-200",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 hover:bg-red-200",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant="secondary"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}

// Helper function to get status label
export function getStatusLabel(status: ApplicationStatus): string {
  return statusConfig[status].label;
}

// Helper function to get status class
export function getStatusClass(status: ApplicationStatus): string {
  return statusConfig[status].className;
} 