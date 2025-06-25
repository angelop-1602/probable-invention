import { cn } from "@/lib/utils";

interface ProtocolStatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_CONFIG = [
  {
    label: "Draft",
    description: "Submission incomplete",
    color: "Gray",
    hex: "#9CA3AF"
  },
  {
    label: "Submitted",
    description: "For review classification",
    color: "Blue",
    hex: "#3B82F6"
  },
  {
    label: "Under Review",
    description: "Assigned for assessment",
    color: "Indigo",
    hex: "#6366F1"
  },
  {
    label: "For Revision",
    description: "Requires modification",
    color: "Amber",
    hex: "#F59E0B"
  },
  {
    label: "Approved",
    description: "Granted ethical clearance",
    color: "Green",
    hex: "#10B981"
  },
  {
    label: "Ongoing",
    description: "Under implementation",
    color: "Teal",
    hex: "#14B8A6"
  },
  {
    label: "Completed/Terminated",
    description: "Study concluded",
    color: "Purple",
    hex: "#8B5CF6"
  },
  {
    label: "Archived",
    description: "Filed for record retention",
    color: "Dark Gray",
    hex: "#6B7280"
  }
];

// Map common status variations to our standard labels
const STATUS_MAPPINGS: Record<string, string> = {
  // Draft variations
  "draft": "Draft",
  "pending": "Draft",
  "incomplete": "Draft",
  
  // Submitted variations
  "submitted": "Submitted",
  "pending review": "Submitted",
  "for review": "Submitted",
  "sc": "Submitted", // Initial submission code
  
  // Under Review variations
  "under review": "Under Review",
  "in review": "Under Review",
  "reviewing": "Under Review",
  "assigned": "Under Review",
  
  // For Revision variations
  "for revision": "For Revision",
  "needs revision": "For Revision",
  "revision required": "For Revision",
  "revise": "For Revision",
  
  // Approved variations
  "approved": "Approved",
  "accepted": "Approved",
  "cleared": "Approved",
  
  // Ongoing variations
  "ongoing": "Ongoing",
  "active": "Ongoing",
  "in progress": "Ongoing",
  "implementation": "Ongoing",
  
  // Completed variations
  "completed": "Completed/Terminated",
  "terminated": "Completed/Terminated",
  "finished": "Completed/Terminated",
  "concluded": "Completed/Terminated",
  
  // Archived variations
  "archived": "Archived",
  "closed": "Archived",
  "filed": "Archived"
};

export function ProtocolStatusBadge({ status, className }: ProtocolStatusBadgeProps) {
  // Normalize status to find the right configuration
  const normalizedStatus = status?.toLowerCase() || '';
  const mappedStatus = STATUS_MAPPINGS[normalizedStatus] || status;
  
  // Find the configuration for this status
  const config = STATUS_CONFIG.find(
    s => s.label.toLowerCase() === mappedStatus.toLowerCase()
  ) || STATUS_CONFIG[0]; // Default to Draft if not found

  // Generate Tailwind classes based on hex color
  const getColorClasses = (hex: string) => {
    switch (hex) {
      case "#9CA3AF": // Gray
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "#3B82F6": // Blue
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "#6366F1": // Indigo
        return "bg-indigo-100 text-indigo-800 border-indigo-300";
      case "#F59E0B": // Amber
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "#10B981": // Green
        return "bg-green-100 text-green-800 border-green-300";
      case "#14B8A6": // Teal
        return "bg-teal-100 text-teal-800 border-teal-300";
      case "#8B5CF6": // Purple
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "#6B7280": // Dark Gray
        return "bg-gray-200 text-gray-700 border-gray-400";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const colorClasses = getColorClasses(config.hex);

  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border-2",
        colorClasses,
        className
      )}
      title={config.description}
    >
      {config.label}
    </span>
  );
} 