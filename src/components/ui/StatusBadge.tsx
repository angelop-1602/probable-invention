"use client";

import { Badge } from "@/components/ui/badge";
import { getStatusBadgeClass } from "@/components/ui/shared-types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
  showLabel?: boolean;
  customLabel?: string;
  size?: "default" | "sm";
}

export function StatusBadge({ 
  status, 
  className, 
  showLabel = true, 
  customLabel,
  size = "default"
}: StatusBadgeProps) {
  const statusClass = getStatusBadgeClass(status);
  const displayText = customLabel || status;
  
  const sizeClass = size === "sm" 
    ? "text-[0.65rem] py-0 px-1.5" 
    : "";
  
  return (
    <Badge 
      variant="outline" 
      className={cn(statusClass, sizeClass, className)}
    >
      {showLabel ? displayText : ""}
    </Badge>
  );
} 