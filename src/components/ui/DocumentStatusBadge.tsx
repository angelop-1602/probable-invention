import { cn } from "@/lib/utils";

interface DocumentStatusBadgeProps {
  status: string;
  className?: string;
  size?: "sm" | "md";
}

const STATUS_CONFIG = [
  {
    label: "Pending Upload",
    meaning: "Required document not yet submitted",
    color: "Gray",
    hex: "#9CA3AF"
  },
  {
    label: "Submitted",
    meaning: "Document received but not yet reviewed",
    color: "Blue",
    hex: "#3B82F6"
  },
  {
    label: "Under Review",
    meaning: "Reviewer is currently evaluating the document",
    color: "Indigo",
    hex: "#6366F1"
  },
  {
    label: "Needs Revision",
    meaning: "Document requires corrections based on reviewer feedback",
    color: "Amber",
    hex: "#F59E0B"
  },
  {
    label: "Resubmitted",
    meaning: "Revised version has been uploaded and awaits new review",
    color: "Light Blue",
    hex: "#60A5FA"
  },
  {
    label: "Approved",
    meaning: "Document has been reviewed and accepted",
    color: "Green",
    hex: "#10B981"
  },
  {
    label: "Rejected",
    meaning: "Document is not acceptable; resubmission may not be allowed",
    color: "Red",
    hex: "#EF4444"
  },
  {
    label: "Expired",
    meaning: "Document validity period has lapsed (e.g., old ethical clearance)",
    color: "Rose",
    hex: "#F87171"
  },
  {
    label: "Archived",
    meaning: "Finalized/closed document, moved to inactive status",
    color: "Dark Gray",
    hex: "#6B7280"
  },
  {
    label: "Exempted",
    meaning: "Document reviewed and granted exemption (e.g., protocol exempt from review)",
    color: "Emerald",
    hex: "#34D399"
  }
];

// Map common document status variations to our standard labels
const STATUS_MAPPINGS: Record<string, string> = {
  // Pending variations
  "pending upload": "Pending Upload",
  "pending": "Pending Upload",
  "not submitted": "Pending Upload",
  "missing": "Pending Upload",
  
  // Submitted variations
  "submitted": "Submitted",
  "uploaded": "Submitted",
  "received": "Submitted",
  
  // Under Review variations
  "under review": "Under Review",
  "in review": "Under Review",
  "reviewing": "Under Review",
  "being reviewed": "Under Review",
  
  // Needs Revision variations
  "needs revision": "Needs Revision",
  "revision needed": "Needs Revision",
  "for revision": "Needs Revision",
  "requires changes": "Needs Revision",
  
  // Resubmitted variations
  "resubmitted": "Resubmitted",
  "revised": "Resubmitted",
  "updated": "Resubmitted",
  
  // Approved variations
  "approved": "Approved",
  "accepted": "Approved",
  "validated": "Approved",
  "cleared": "Approved",
  
  // Rejected variations
  "rejected": "Rejected",
  "declined": "Rejected",
  "denied": "Rejected",
  "not accepted": "Rejected",
  
  // Expired variations
  "expired": "Expired",
  "outdated": "Expired",
  "invalid": "Expired",
  
  // Archived variations
  "archived": "Archived",
  "filed": "Archived",
  "closed": "Archived",
  
  // Exempted variations
  "exempted": "Exempted",
  "exempt": "Exempted",
  "not required": "Exempted"
};

export function DocumentStatusBadge({ status, className, size = "sm" }: DocumentStatusBadgeProps) {
  // Normalize status to find the right configuration
  const normalizedStatus = status?.toLowerCase() || '';
  const mappedStatus = STATUS_MAPPINGS[normalizedStatus] || status;
  
  // Find the configuration for this status
  const config = STATUS_CONFIG.find(
    s => s.label.toLowerCase() === mappedStatus.toLowerCase()
  ) || STATUS_CONFIG[0]; // Default to Pending Upload if not found

  // Generate Tailwind classes based on hex color
  const getColorClasses = (hex: string) => {
    switch (hex) {
      case "#9CA3AF": // Gray
        return "bg-gray-100 text-gray-700 border-gray-300";
      case "#3B82F6": // Blue
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "#6366F1": // Indigo
        return "bg-indigo-100 text-indigo-700 border-indigo-300";
      case "#F59E0B": // Amber
        return "bg-amber-100 text-amber-700 border-amber-300";
      case "#60A5FA": // Light Blue
        return "bg-sky-100 text-sky-700 border-sky-300";
      case "#10B981": // Green
        return "bg-green-100 text-green-700 border-green-300";
      case "#EF4444": // Red
        return "bg-red-100 text-red-700 border-red-300";
      case "#F87171": // Rose
        return "bg-rose-100 text-rose-700 border-rose-300";
      case "#6B7280": // Dark Gray
        return "bg-gray-200 text-gray-600 border-gray-400";
      case "#34D399": // Emerald
        return "bg-emerald-100 text-emerald-700 border-emerald-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const colorClasses = getColorClasses(config.hex);
  
  const sizeClasses = size === "sm" 
    ? "px-2 py-1 text-xs" 
    : "px-3 py-1 text-sm";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium border",
        colorClasses,
        sizeClasses,
        className
      )}
      title={config.meaning}
    >
      {config.label}
    </span>
  );
} 