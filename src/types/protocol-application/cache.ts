/**
 * Types for caching systems used in the application
 */
import { DocumentData } from "firebase/firestore";

/**
 * Document metadata for caching
 */
export interface DataMetadata {
  id: string;
  path: string;
  timestamp: number;
  version: string;
}

/**
 * Cached document structure
 */
export interface CachedDocument {
  id: string;
  path: string;
  data: DocumentData;
  metadata: DataMetadata;
}

/**
 * Cached collection structure
 */
export interface CachedCollection {
  id: string;
  path: string;
  data: DocumentData[];
  metadata: DataMetadata;
}

/**
 * File metadata for document storage
 */
export interface FileMetadata {
  id: string;
  fileName: string;
  contentType: string;
  version: string;
  timestamp: number;
  size?: number;
}

/**
 * Cached file structure
 */
export interface CachedFile {
  id: string;
  data: Blob | ArrayBuffer;
  metadata: FileMetadata;
}

/**
 * Simple cache item structure for in-memory cache
 */
export interface CacheItem<T> {
  data: T;
  expiration: number; // Timestamp when the cache expires
} 