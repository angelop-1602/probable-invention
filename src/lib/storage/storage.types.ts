/**
 * Types for the storage service
 */

/**
 * File metadata including size, name, and content type
 */
export interface FileMetadata {
  id: string;
  fileName: string;
  contentType: string;
  version: string;
  timestamp: number;
  size?: number;
  displayName?: string;  // Human-readable name
  title?: string;        // Official title
  originalFileName?: string; // The original file name before standardization
  standardizedName?: string; // The standardized file name
}

/**
 * Options for uploading files
 */
export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  displayName?: string;
  standardizedName?: string;
}

/**
 * Cached file data
 */
export interface CachedFile {
  id: string;
  data: Blob | ArrayBuffer;
  metadata: FileMetadata;
}

/**
 * File name mapping interface
 */
export interface FileNameMapping {
  [originalName: string]: string;
}

/**
 * Upload result interface
 */
export interface UploadResult {
  path: string;
  downloadUrl: string;
  metadata: Record<string, any>;
}

/**
 * Storage paths configuration
 */
export interface StoragePaths {
  applications: string;
  documents: string;
  submissions: string;
  certificates: string;
  reports: string;
} 