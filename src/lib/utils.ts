import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date as a readable string
 * @param date Date object, string, timestamp, or Firestore timestamp to format
 * @returns Formatted date string
 */
export function formatDate(date: any): string {
  if (!date) return "N/A";
  
  try {
    // Handle Firestore timestamp objects
    if (typeof date === 'object' && date.toDate && typeof date.toDate === 'function') {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(date.toDate());
    }
    
    // Handle Firestore timestamp objects with seconds
    if (typeof date === 'object' && date.seconds) {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(new Date(date.seconds * 1000));
    }
    
    // Handle date strings
    if (typeof date === 'string') {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        return new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        }).format(parsed);
      }
      return date; // Return as is if it can't be parsed
    }
    
    // Handle numbers (timestamps)
    if (typeof date === 'number') {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(new Date(date));
    }
    
    // Handle Date objects
    if (date instanceof Date) {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(date);
    }
    
    // Fallback for unknown formats
    return String(date);
  } catch (error) {
    console.error("Error formatting date:", error, date);
    return "Invalid Date";
  }
}
