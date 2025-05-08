/**
 * Toast Utility Functions
 * 
 * This module provides safe toast notification implementations using Sonner
 */

import { toast } from "sonner";

/**
 * Show a toast notification
 */
export function showToast(
  title: string,
  description?: string,
  variant: "success" | "error" | "default" = "default"
): void {
  try {
    switch (variant) {
      case "error":
        toast.error(title, {
          description
        });
        break;
      case "success":
        toast.success(title, {
          description
        });
        break;
      default:
        toast(title, {
          description
        });
    }
  } catch (error) {
    console.error("Error showing toast notification:", error);
  }
}

/**
 * Show a success toast
 */
export function showSuccessToast(title: string, description?: string): void {
  showToast(title, description, "success");
}

/**
 * Show an error toast
 */
export function showErrorToast(title: string, description?: string): void {
  showToast(title, description, "error");
}

/**
 * Show a default toast
 */
export function showDefaultToast(title: string, description?: string): void {
  showToast(title, description, "default");
} 