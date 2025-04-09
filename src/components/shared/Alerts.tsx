"use client";

import React, { useState, useEffect, useRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  AlertTriangle, 
  BadgeInfo 
} from "lucide-react";

// Types for alert variants and positions
export type AlertVariant = "default" | "destructive" | "success" | "warning" | "info";
export type AlertPosition = "bottom-right" | "top-right" | "bottom-left" | "top-left" | "center";

// Alert interface
export interface AlertProps {
  id: string;
  title?: string;
  message: string;
  variant?: AlertVariant;
  duration?: number; // in milliseconds
}

// Context for managing alerts
export interface AlertContextType {
  alerts: AlertProps[];
  showAlert: (alert: Omit<AlertProps, "id">) => string;
  dismissAlert: (id: string) => void;
}

// Create context with default values
const AlertContext = React.createContext<AlertContextType>({
  alerts: [],
  showAlert: () => "",
  dismissAlert: () => {},
});

// Default durations based on message length
const getDefaultDuration = (message: string): number => {
  const baseTime = 3000; // 3 seconds minimum
  const wordsPerMinute = 200; // Average reading speed
  const wordCount = message.split(/\s+/).length;
  const readingTimeMs = (wordCount / wordsPerMinute) * 60 * 1000;
  return Math.max(baseTime, Math.min(readingTimeMs + 1000, 10000)); // Between 3-10 seconds
};

// Alert variants styling
const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[auto_1fr] grid-cols-[1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive: "border-destructive/50 text-destructive bg-destructive/10",
        success: "border-green-500/50 text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/20",
        warning: "border-yellow-500/50 text-yellow-700 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20",
        info: "border-blue-500/50 text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// Get the appropriate icon for each alert variant
const getAlertIcon = (variant: AlertVariant) => {
  switch (variant) {
    case "destructive":
      return <AlertCircle className="size-8 text-destructive" />;
    case "success":
      return <CheckCircle2 className="size-8 text-green-600 dark:text-green-400" />;
    case "warning":
      return <AlertTriangle className="size-8 text-yellow-600 dark:text-yellow-400" />;
    case "info":
      return <Info className="size-8 text-blue-600 dark:text-blue-400" />;
    default:
      return <BadgeInfo className="size-8 text-card-foreground" />;
  }
};

// Alert container positioning
const alertContainerPositions: Record<AlertPosition, string> = {
  "bottom-right": "fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md",
  "top-right": "fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md",
  "bottom-left": "fixed bottom-4 left-4 z-50 flex flex-col gap-2 max-w-md",
  "top-left": "fixed top-4 left-4 z-50 flex flex-col gap-2 max-w-md",
  "center": "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col gap-2 max-w-md",
};

// Provider component
export const AlertProvider: React.FC<{ 
  children: React.ReactNode;
  position?: AlertPosition;
}> = ({ children, position = "bottom-right" }) => {
  const [alerts, setAlerts] = useState<AlertProps[]>([]);

  const showAlert = (alert: Omit<AlertProps, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const duration = alert.duration || getDefaultDuration(alert.message);
    const newAlert = { ...alert, id, duration };
    setAlerts((prevAlerts) => [...prevAlerts, newAlert]);
    
    // Auto dismiss after duration
    setTimeout(() => {
      dismissAlert(id);
    }, duration);
    
    return id;
  };

  const dismissAlert = (id: string) => {
    setAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.id !== id));
  };

  return (
    <AlertContext.Provider value={{ alerts, showAlert, dismissAlert }}>
      {children}
      <div className={alertContainerPositions[position]}>
        {alerts.map((alert) => (
          <Alert
            key={alert.id}
            variant={alert.variant}
            title={alert.title}
            message={alert.message}
            duration={alert.duration}
            id={alert.id}
          />
        ))}
      </div>
    </AlertContext.Provider>
  );
};

// Alert component that displays a single alert
const Alert: React.FC<AlertProps> = ({ variant = "default", title, message, duration, id }) => {
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef<number | null>(Date.now());
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = Date.now();
    
    const updateProgress = () => {
      if (!startTimeRef.current) return;
      
      const elapsed = Date.now() - startTimeRef.current;
      const calculatedProgress = Math.min((elapsed / (duration || 5000)) * 100, 100);
      setProgress(calculatedProgress);
      
      if (calculatedProgress < 100) {
        animationRef.current = requestAnimationFrame(updateProgress);
      }
    };
    
    animationRef.current = requestAnimationFrame(updateProgress);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [duration]);

  return (
    <div
      role="alert"
      className={cn(
        alertVariants({ variant }),
        "animate-in slide-in-from-right-5 fade-in-0 duration-300"
      )}
    >
      {/* Add the appropriate icon based on variant */}
      {getAlertIcon(variant)}
      
      <div className="flex flex-col">
        {title && (
          <div className="font-medium leading-none tracking-tight">{title}</div>
        )}
        <div className={cn("text-sm", title ? "mt-1" : "")}>
          {message}
        </div>
        
        {/* Progress indicator */}
        <div className="mt-2">
          <Progress value={100 - progress} className="h-1" />
        </div>
      </div>
    </div>
  );
};

// Hook to use the alert context
export const useAlerts = () => {
  const context = React.useContext(AlertContext);
  if (context === undefined) {
    throw new Error("useAlerts must be used within an AlertProvider");
  }
  return context;
};

// Export Alert component
export { Alert };
