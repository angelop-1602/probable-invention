/**
 * Types for utility functions
 */
import { Timestamp } from "firebase/firestore";

/**
 * Timestamp type union to handle different timestamp formats
 */
export type TimestampType = Timestamp | Date | number | string | { seconds: number; nanoseconds: number } | null;

/**
 * Reviewer data type
 */
export interface Reviewer {
  id?: string;
  code: string;
  name: string;
  isActive: boolean;
  specialization?: string;
  department?: string;
  createdAt: TimestampType;
  updatedAt: TimestampType;
}

/**
 * Alert variant types
 */
export type AlertVariant = "default" | "destructive" | "success" | "warning" | "info";

/**
 * Alert position types
 */
export type AlertPosition = "bottom-right" | "top-right" | "bottom-left" | "top-left" | "center";

/**
 * Alert properties interface
 */
export interface AlertProps {
  id: string;
  title?: string;
  message: string;
  variant?: AlertVariant;
  duration?: number; // in milliseconds
}

/**
 * Alert context type
 */
export interface AlertContextType {
  alerts: AlertProps[];
  showAlert: (alert: Omit<AlertProps, "id">) => string;
  dismissAlert: (id: string) => void;
} 