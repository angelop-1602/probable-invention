import { getStorage, ref, uploadBytes, getDownloadURL, StorageReference, getMetadata } from "firebase/storage";
import { openDB, IDBPDatabase } from 'idb';
import JSZip from 'jszip';
import { 
  FileMetadata, 
  UploadOptions, 
  CachedFile, 
  FileNameMapping, 
  UploadResult 
} from './storage.types';

/**
 * Service for managing file storage operations
 */
export class StorageService {
  private static instance: StorageService;
  private storage: any;
  private dbPromise: Promise<IDBPDatabase>;
  private readonly DB_NAME = 'protocol-submissions-db';
  private readonly DB_VERSION = 1;
  private readonly FILE_STORE = 'files';
  private readonly METADATA_STORE = 'fileMetadata';
  
  private constructor() {
    this.storage = getStorage();
    this.dbPromise = this.initDB();
  }
  
  /**
   * Get the singleton instance of the StorageService
   */
  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Initialize the IndexedDB database
   */
  private async initDB(): Promise<IDBPDatabase> {
    return openDB(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Create stores if they don't exist
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('fileMetadata')) {
          db.createObjectStore('fileMetadata', { keyPath: 'id' });
        }
      }
    });
  }

  /**
   * Upload a file to Firebase Storage
   * @param file - File to upload
   * @param path - Path to store the file at
   * @param options - Upload options
   * @returns Upload result
   */
  public async uploadFile(
    file: File | Blob,
    path: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      // Create storage reference
      const storageRef = ref(this.storage, path);
      
      // Upload file
      const result = await uploadBytes(storageRef, file, {
        contentType: options.contentType,
        customMetadata: options.metadata
      });
      
      // Get download URL
      const downloadUrl = await getDownloadURL(storageRef);
      
      // Return result
      return {
        path,
        downloadUrl,
        metadata: result.metadata
      };
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  }

  /**
   * Zip files together before uploading
   * @param files - Files to zip
   * @param nameMapping - Optional mapping of standardized names
   * @returns Zipped blob and name mapping
   */
  public async zipFiles(
    files: File[],
    nameMapping?: Record<number, string>
  ): Promise<{ blob: Blob, nameMapping: FileNameMapping }> {
    try {
      const zip = new JSZip();
      const resultNameMapping: FileNameMapping = {};
      
      // Add each file to the zip
      files.forEach((file, index) => {
        // Use mapped name if provided, otherwise use original filename
        const fileName = nameMapping ? 
          (nameMapping[index] || file.name) : 
          file.name;
        
        // Store the mapping
        resultNameMapping[file.name] = fileName;
        
        // Add to zip
        zip.file(fileName, file);
      });
      
      // Generate the zip file
      const blob = await zip.generateAsync({ type: 'blob' });
      
      return { blob, nameMapping: resultNameMapping };
    } catch (error) {
      console.error("Error zipping files:", error);
      throw error;
    }
  }

  /**
   * Unzip files
   * @param zipBlob - Zipped blob
   * @returns Map of filenames to blob data
   */
  public async unzipFiles(zipBlob: Blob): Promise<Map<string, Blob>> {
    try {
      const zip = await JSZip.loadAsync(zipBlob);
      const files = new Map<string, Blob>();
      
      // Extract each file
      for (const filename of Object.keys(zip.files)) {
        if (!zip.files[filename].dir) {
          const blob = await zip.files[filename].async('blob');
          files.set(filename, blob);
        }
      }
      
      return files;
    } catch (error) {
      console.error("Error unzipping files:", error);
      throw error;
    }
  }

  /**
   * Store file in IndexedDB cache
   * @param id - File ID
   * @param data - File data
   * @param metadata - File metadata
   */
  public async storeInCache(
    id: string,
    data: Blob | ArrayBuffer,
    metadata: FileMetadata
  ): Promise<void> {
    try {
      const db = await this.dbPromise;
      
      // Store file data
      const tx1 = db.transaction(this.FILE_STORE, 'readwrite');
      await tx1.store.put({ id, data });
      
      // Store metadata
      const tx2 = db.transaction(this.METADATA_STORE, 'readwrite');
      await tx2.store.put(metadata);
    } catch (error) {
      console.error("Error storing file in cache:", error);
      throw error;
    }
  }

  /**
   * Retrieve file from IndexedDB cache
   * @param id - File ID
   * @param currentVersion - Optional current version to check
   * @returns Cached file or null if not found
   */
  public async getFromCache(
    id: string,
    currentVersion?: string
  ): Promise<CachedFile | null> {
    try {
      const db = await this.dbPromise;
      
      // Get metadata first
      const metadata = await db.get(this.METADATA_STORE, id);
      
      // If metadata not found or version mismatch, return null
      if (!metadata || (currentVersion && metadata.version !== currentVersion)) {
        return null;
      }
      
      // Get file data
      const fileData = await db.get(this.FILE_STORE, id);
      
      if (!fileData) {
        return null;
      }
      
      return {
        id,
        data: fileData.data,
        metadata
      };
    } catch (error) {
      console.error("Error retrieving file from cache:", error);
      return null;
    }
  }

  /**
   * Clean up cache, removing entries older than maxAge
   * @param maxAge - Maximum age of cached files in milliseconds
   */
  public async cleanupCache(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const db = await this.dbPromise;
      const now = Date.now();
      
      // Get all metadata entries
      const tx = db.transaction(this.METADATA_STORE, 'readwrite');
      const store = tx.store;
      let cursor = await store.openCursor();
      
      // Track entries to delete
      const idsToDelete: string[] = [];
      
      // Check each entry
      while (cursor) {
        const metadata = cursor.value;
        if (now - metadata.timestamp > maxAge) {
          idsToDelete.push(metadata.id);
          await cursor.delete();
        }
        cursor = await cursor.continue();
      }
      
      // Delete file data for expired entries
      if (idsToDelete.length > 0) {
        const fileTx = db.transaction(this.FILE_STORE, 'readwrite');
        const fileStore = fileTx.store;
        
        for (const id of idsToDelete) {
          await fileStore.delete(id);
        }
      }
      
      console.log(`Cleaned up ${idsToDelete.length} cached files`);
    } catch (error) {
      console.error("Error cleaning up cache:", error);
    }
  }

  /**
   * Format a date in YYYYMMDD format
   * @param date - Date object or timestamp
   * @returns Formatted date string
   */
  public formatDateYYYYMMDD(date: Date | number = new Date()): string {
    const d = date instanceof Date ? date : new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Generate a standardized filename based on document title
   * @param title - Document title
   * @param originalFileName - Original file name
   * @returns Standardized file name
   */
  public standardizeFileName(title: string, originalFileName: string): string {
    // Extract the base name from the title (before any colon)
    let baseName = title.split(':')[0].trim();
    
    // Remove any form numbers or special prefixes
    baseName = baseName.replace(/^Form\s+\d+[A-Z]?\s*:?\s*/i, '');
    
    // Convert to camel case for readability
    const camelCaseName = baseName
      .replace(/\s+/g, ' ')
      .split(' ')
      .map((word, index) => {
        if (index === 0) {
          return word.toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join('');
    
    // Extract file extension from original file name
    const fileExtension = originalFileName.split('.').pop() || 'pdf';
    
    // Add current date in YYYYMMDD format
    const dateSuffix = this.formatDateYYYYMMDD();
    
    // Construct standardized name
    return `${camelCaseName}_${dateSuffix}.${fileExtension}`;
  }
} 