/**
 * Submission Storage Service
 * 
 * Enhanced storage service for submission files with individual zipping,
 * caching, and Firebase Storage integration
 */

import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import JSZip from 'jszip';
import { openDB, IDBPDatabase } from 'idb';
import { DocumentUpload, DocumentRequirement } from './submission.types';
import { generateFileHash, sanitizeFilename, formatDocumentName } from './submission.utils';

interface StorageOptions {
  compress?: boolean;
  generateThumbnail?: boolean;
  maxFileSize?: number; // in bytes
}

interface UploadResult {
  success: boolean;
  downloadUrl?: string;
  storagePath?: string;
  error?: string;
  fileHash?: string;
  compressedSize?: number;
}

interface CachedFileData {
  id: string;
  data: Blob;
  metadata: {
    originalName: string;
    documentTitle: string;
    hash: string;
    timestamp: number;
    size: number;
    compressedSize: number;
  };
}

export class SubmissionStorage {
  private static instance: SubmissionStorage;
  private storage = getStorage();
  private dbPromise: Promise<IDBPDatabase>;
  private readonly DB_NAME = 'submission-storage-cache';
  private readonly DB_VERSION = 1;
  private readonly CACHE_STORE = 'file-cache';
  private readonly METADATA_STORE = 'file-metadata';
  private readonly DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  private constructor() {
    // Only initialize in browser environment
    if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
      this.dbPromise = this.initDB();
    } else {
      // Create a dummy promise for SSR compatibility
      this.dbPromise = Promise.resolve({} as any);
    }
  }

  public static getInstance(): SubmissionStorage {
    if (!SubmissionStorage.instance) {
      SubmissionStorage.instance = new SubmissionStorage();
    }
    return SubmissionStorage.instance;
  }

  /**
   * Initialize IndexedDB for caching
   */
  private async initDB(): Promise<IDBPDatabase> {
    // Check if we're in browser environment
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      throw new Error('IndexedDB not available in this environment');
    }

    const CACHE_STORE = this.CACHE_STORE;
    const METADATA_STORE = this.METADATA_STORE;
    
    return openDB(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // File cache store
        if (!db.objectStoreNames.contains(CACHE_STORE)) {
          db.createObjectStore(CACHE_STORE, { keyPath: 'id' });
        }
        
        // Metadata store
        if (!db.objectStoreNames.contains(METADATA_STORE)) {
          const metadataStore = db.createObjectStore(METADATA_STORE, { keyPath: 'id' });
          metadataStore.createIndex('hash', 'hash', { unique: false });
          metadataStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      }
    });
  }

  /**
   * Upload a single document with individual zipping
   */
  public async uploadDocument(
    document: DocumentUpload,
    applicationCode: string,
    options: StorageOptions = {}
  ): Promise<UploadResult> {
    try {
      const maxSize = options.maxFileSize || this.DEFAULT_MAX_SIZE;
      
      // Validate file size
      if (document.file.size > maxSize) {
        return {
          success: false,
          error: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`
        };
      }

      // Generate file hash for deduplication
      const fileHash = await generateFileHash(document.file);
      
      // Check if file already exists in cache
      const cachedFile = await this.getFromCache(fileHash);
      if (cachedFile && Date.now() - cachedFile.metadata.timestamp < this.CACHE_TTL) {
        console.log('File found in cache, skipping upload');
        return {
          success: true,
          downloadUrl: await this.getCachedDownloadUrl(fileHash),
          fileHash,
          compressedSize: cachedFile.metadata.compressedSize
        };
      }

      // Create individual zip for this document
      const { zippedBlob, compressedSize } = await this.zipSingleFile(
        document.file,
        document.title
      );

      // Generate storage path
      const sanitizedTitle = sanitizeFilename(document.title);
      const storagePath = `submissions/${applicationCode}/documents/${sanitizedTitle}_${Date.now()}.zip`;
      


      // Upload to Firebase Storage
      const storageRef = ref(this.storage, storagePath);
      const uploadResult = await uploadBytes(storageRef, zippedBlob, {
        contentType: 'application/zip',
        customMetadata: {
          originalName: document.file.name,
          documentTitle: document.title,
          applicationCode,
          fileHash,
          originalSize: document.file.size.toString(),
          compressedSize: compressedSize.toString()
        }
      });

      // Get download URL
      const downloadUrl = await getDownloadURL(uploadResult.ref);
      


      // Cache the file
      await this.storeInCache({
        id: fileHash,
        data: zippedBlob,
        metadata: {
          originalName: document.file.name,
          documentTitle: document.title,
          hash: fileHash,
          timestamp: Date.now(),
          size: document.file.size,
          compressedSize
        }
      });

      // Store download URL mapping
      await this.storeUrlMapping(fileHash, downloadUrl);

      return {
        success: true,
        downloadUrl,
        storagePath,
        fileHash,
        compressedSize
      };

    } catch (error) {
      console.error('Error uploading document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Zip a single file with document title as filename
   */
  private async zipSingleFile(file: File, documentTitle: string): Promise<{
    zippedBlob: Blob;
    compressedSize: number;
  }> {
    const zip = new JSZip();
    
    // Use document title as filename, keep original extension
    const extension = file.name.split('.').pop() || 'pdf';
    const formattedTitle = formatDocumentName(file.name, documentTitle);
    const zipFileName = `${formattedTitle}.${extension}`;
    
    // Add file to zip
    zip.file(zipFileName, file);
    
    // Generate zip with maximum compression
    const zippedBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 9 // Maximum compression
      }
    });
    
    return {
      zippedBlob,
      compressedSize: zippedBlob.size
    };
  }

  /**
   * Upload multiple documents in batch
   */
  public async uploadDocuments(
    documents: DocumentUpload[],
    applicationCode: string,
    onProgress?: (progress: number, currentFile: string) => void
  ): Promise<Record<string, UploadResult>> {
    const results: Record<string, UploadResult> = {};
    
    for (let i = 0; i < documents.length; i++) {
      const document = documents[i];
      
      if (onProgress) {
        onProgress((i / documents.length) * 100, document.title);
      }
      
      results[document.id] = await this.uploadDocument(document, applicationCode);
    }
    
    if (onProgress) {
      onProgress(100, 'Upload complete');
    }
    
    return results;
  }

  /**
   * Download and extract a document
   */
  public async downloadDocument(downloadUrl: string): Promise<Blob | null> {
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const zipBlob = await response.blob();
      
      // Extract the first file from the zip
      const zip = new JSZip();
      const zipContents = await zip.loadAsync(zipBlob);
      
      // Get the first file (should only be one)
      const fileName = Object.keys(zipContents.files)[0];
      if (!fileName) {
        throw new Error('No files found in zip');
      }
      
      const file = zipContents.files[fileName];
      return await file.async('blob');
      
    } catch (error) {
      console.error('Error downloading document:', error);
      return null;
    }
  }

  /**
   * Store file in cache
   */
  private async storeInCache(fileData: CachedFileData): Promise<void> {
    try {
      const db = await this.dbPromise;
      
      // Store file data
      const tx1 = db.transaction(this.CACHE_STORE, 'readwrite');
      await tx1.store.put(fileData);
      
      // Store metadata
      const tx2 = db.transaction(this.METADATA_STORE, 'readwrite');
      await tx2.store.put({
        id: fileData.id,
        ...fileData.metadata
      });
      
    } catch (error) {
      console.error('Error storing file in cache:', error);
    }
  }

  /**
   * Get file from cache
   */
  private async getFromCache(fileHash: string): Promise<CachedFileData | null> {
    try {
      const db = await this.dbPromise;
      
      // Get file data
      const fileData = await db.get(this.CACHE_STORE, fileHash);
      if (!fileData) {
        return null;
      }
      
      return fileData;
      
    } catch (error) {
      console.error('Error getting file from cache:', error);
      return null;
    }
  }

  /**
   * Store URL mapping for cached files
   */
  private async storeUrlMapping(fileHash: string, downloadUrl: string): Promise<void> {
    try {
      const db = await this.dbPromise;
      const tx = db.transaction(this.METADATA_STORE, 'readwrite');
      
      const metadata = await tx.store.get(fileHash);
      if (metadata) {
        metadata.downloadUrl = downloadUrl;
        await tx.store.put(metadata);
      }
      
    } catch (error) {
      console.error('Error storing URL mapping:', error);
    }
  }

  /**
   * Get cached download URL
   */
  private async getCachedDownloadUrl(fileHash: string): Promise<string | undefined> {
    try {
      const db = await this.dbPromise;
      const metadata = await db.get(this.METADATA_STORE, fileHash);
      return metadata?.downloadUrl;
      
    } catch (error) {
      console.error('Error getting cached download URL:', error);
      return undefined;
    }
  }

  /**
   * Clean up old cache entries
   */
  public async cleanupCache(maxAge: number = this.CACHE_TTL): Promise<void> {
    // Skip if not in browser environment
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      console.warn('Storage cache cleanup not available in SSR environment');
      return;
    }

    try {
      const db = await this.dbPromise;
      const now = Date.now();
      
      // Get all metadata entries
      const tx = db.transaction([this.METADATA_STORE, this.CACHE_STORE], 'readwrite');
      const metadataStore = tx.objectStore(this.METADATA_STORE);
      const cacheStore = tx.objectStore(this.CACHE_STORE);
      
      let cursor = await metadataStore.openCursor();
      const idsToDelete: string[] = [];
      
      while (cursor) {
        const metadata = cursor.value;
        if (now - metadata.timestamp > maxAge) {
          idsToDelete.push(metadata.id);
          await cursor.delete();
        }
        cursor = await cursor.continue();
      }
      
      // Delete corresponding cache entries
      for (const id of idsToDelete) {
        await cacheStore.delete(id);
      }
      
      console.log(`Cleaned up ${idsToDelete.length} cached files`);
      
    } catch (error) {
      console.error('Error cleaning up cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  public async getCacheStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    oldestFile: number;
    newestFile: number;
  }> {
    // Skip if not in browser environment
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return {
        totalFiles: 0,
        totalSize: 0,
        oldestFile: 0,
        newestFile: 0
      };
    }

    try {
      const db = await this.dbPromise;
      const tx = db.transaction(this.METADATA_STORE, 'readonly');
      const store = tx.objectStore(this.METADATA_STORE);
      
      let cursor = await store.openCursor();
      let totalFiles = 0;
      let totalSize = 0;
      let oldestFile = Date.now();
      let newestFile = 0;
      
      while (cursor) {
        const metadata = cursor.value;
        totalFiles++;
        totalSize += metadata.compressedSize;
        oldestFile = Math.min(oldestFile, metadata.timestamp);
        newestFile = Math.max(newestFile, metadata.timestamp);
        cursor = await cursor.continue();
      }
      
      return {
        totalFiles,
        totalSize,
        oldestFile,
        newestFile
      };
      
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        oldestFile: 0,
        newestFile: 0
      };
    }
  }
} 