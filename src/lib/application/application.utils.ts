/**
 * Application utility functions
 */

/**
 * Format a document name for display
 * @param fileName Original file name
 * @returns Formatted document name
 */
export function formatDocumentName(fileName: string): string {
  // Remove file extension
  let name = fileName.replace(/\.[^/.]+$/, "");
  
  // Replace underscores and hyphens with spaces
  name = name.replace(/[_-]/g, " ");
  
  // Capitalize each word
  name = name.replace(/\b\w/g, char => char.toUpperCase());
  
  // Special case for common form names
  if (name.match(/form\s*07a/i)) {
    return "Protocol Review Application Form";
  } else if (name.match(/form\s*07b/i)) {
    return "Adviser's Certification Form";
  } else if (name.match(/form\s*07c/i)) {
    return "Informed Consent Template";
  } else if (name.match(/research\s*proposal/i) || name.match(/protocol/i)) {
    return "Research Proposal / Study Protocol";
  } else if (name.match(/minutes/i) || name.match(/defense/i)) {
    return "Minutes of Proposal Defense";
  } else if (name.match(/questionnaire/i) || name.match(/survey/i)) {
    return "Questionnaires / Survey Forms";
  } else if (name.match(/cv/i) || name.match(/curriculum/i) || name.match(/vitae/i)) {
    return "Curriculum Vitae";
  } else if (name.match(/technical/i) || name.match(/review/i)) {
    return "Technical Review Approval";
  } else if (name.match(/abstract/i)) {
    return "Abstract";
  }
  
  return name;
}

/**
 * Format a date for display
 * @param date Date to format
 * @param includeTime Whether to include time in the formatted date
 * @returns Formatted date string
 */
export function formatDate(date: any, includeTime: boolean = false): string {
  if (!date) return 'N/A';
  
  let dateObj: Date;
  
  try {
    // Handle Firebase Timestamp objects (with toDate method)
    if (typeof date === 'object' && date !== null && 'toDate' in date && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    }
    // Handle objects with seconds field (server Timestamp format)
    else if (typeof date === 'object' && date !== null && 'seconds' in date) {
      dateObj = new Date(date.seconds * 1000);
    }
    // Handle string or number inputs
    else if (typeof date === 'string' || typeof date === 'number') {
      dateObj = new Date(date);
    }
    // Already a Date object
    else if (date instanceof Date) {
      dateObj = date;
    }
    // Unknown type
    else {
      console.warn('Unknown date format received:', date);
      return 'Invalid Date';
    }
    
    // Check if resulting date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
    };
    
    return dateObj.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('Error formatting date:', error, date);
    return 'Invalid Date';
  }
}

/**
 * Get MIME type for a file based on its extension
 * @param extension File extension without the dot (e.g., 'pdf')
 * @returns MIME type string
 */
export function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'txt': 'text/plain',
    'csv': 'text/csv',
    'rtf': 'application/rtf',
  };
  
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

/**
 * Get the file extension from a filename
 * @param filename Filename with extension
 * @returns The file extension without the dot
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Validate a file is within acceptable size limits
 * @param file File to validate
 * @param maxSize Maximum size in bytes (default: 10MB)
 * @returns Boolean indicating if file is valid
 */
export function validateFileSize(file: File, maxSize: number = 10 * 1024 * 1024): boolean {
  return file.size <= maxSize;
}

/**
 * Helper function to generate a unique ID
 * @returns A unique string ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Generate a random string of specified length
 * @param length Length of the random string to generate
 * @returns Random string of specified length
 */
function generateRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  
  return result;
}

/**
 * Generate an application code in the format RECYYYYRC
 * where YYYY is the current year and RC is a random 6-character string
 * @returns Application code
 */
export function generateApplicationCode(): string {
  const currentYear = new Date().getFullYear();
  const randomChars = generateRandomString(6);
  
  return `REC${currentYear}${randomChars}`;
}

/**
 * Validate if a string is a valid application code
 * @param code The code to validate
 * @returns Whether the code is valid
 */
export function isValidApplicationCode(code: string): boolean {
  const regex = /^REC\d{4}[A-Z0-9]{6}$/;
  return regex.test(code);
} 