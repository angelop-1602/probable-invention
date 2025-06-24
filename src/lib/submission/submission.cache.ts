/**
 * Submission Cache Service
 * 
 * Enhanced caching service for submission form data and state management
 */

import { openDB, IDBPDatabase } from 'idb';
import { SubmissionFormData, CachedSubmissionData, DocumentUpload } from './submission.types';

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  compress?: boolean;
  encrypt?: boolean;
}

export class SubmissionCache {
  private static instance: SubmissionCache;
  private dbPromise: Promise<IDBPDatabase>;
  private readonly DB_NAME = 'submission-form-cache';
  private readonly DB_VERSION = 1;
  private readonly FORM_STORE = 'form-data';
  private readonly SESSION_STORE = 'session-data';
  private readonly DEFAULT_TTL = 60 * 60 * 1000; // 1 hour
  private memoryCache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  private constructor() {
    // Only initialize in browser environment
    if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
      this.dbPromise = this.initDB();
      this.startCleanupTimer();
    } else {
      // Create a dummy promise for SSR compatibility
      this.dbPromise = Promise.resolve({} as any);
    }
  }

  public static getInstance(): SubmissionCache {
    if (!SubmissionCache.instance) {
      // Only create instance in browser environment to avoid SSR issues
      if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
        SubmissionCache.instance = new SubmissionCache();
      } else {
        // Create a minimal instance for SSR compatibility
        SubmissionCache.instance = Object.create(SubmissionCache.prototype);
        SubmissionCache.instance.dbPromise = Promise.resolve({} as any);
        SubmissionCache.instance.memoryCache = new Map();
      }
    }
    return SubmissionCache.instance;
  }

  /**
   * Initialize IndexedDB for persistent caching
   */
  private async initDB(): Promise<IDBPDatabase> {
    // Check if we're in browser environment
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      throw new Error('IndexedDB not available in this environment');
    }

    const FORM_STORE = this.FORM_STORE;
    const SESSION_STORE = this.SESSION_STORE;
    
    return openDB(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Form data store
        if (!db.objectStoreNames.contains(FORM_STORE)) {
          const formStore = db.createObjectStore(FORM_STORE, { keyPath: 'id' });
          formStore.createIndex('userId', 'userId', { unique: false });
          formStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // Session data store
        if (!db.objectStoreNames.contains(SESSION_STORE)) {
          const sessionStore = db.createObjectStore(SESSION_STORE, { keyPath: 'id' });
          sessionStore.createIndex('sessionId', 'sessionId', { unique: false });
          sessionStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      }
    });
  }

  /**
   * Save form data to cache
   */
  public async saveFormData(
    userId: string,
    formData: Partial<SubmissionFormData>,
    documents: DocumentUpload[] = [],
    step: number = 1,
    options: CacheOptions = {}
  ): Promise<void> {
    // Skip if not in browser environment
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      console.warn('Cache not available in SSR environment');
      return;
    }
    const ttl = options.ttl || this.DEFAULT_TTL;
    const timestamp = Date.now();
    const id = `form_${userId}`;

    const cachedData: CachedSubmissionData = {
      formData,
      documents,
      lastModified: timestamp,
      step
    };

    const cacheEntry = {
      id,
      userId,
      data: cachedData,
      timestamp,
      ttl,
      expiresAt: timestamp + ttl
    };

    try {
      // Save to IndexedDB for persistence
      const db = await this.dbPromise;
      const tx = db.transaction(this.FORM_STORE, 'readwrite');
      await tx.store.put(cacheEntry);
      
      // Also save to memory cache for faster access
      this.memoryCache.set(id, {
        data: cachedData,
        timestamp,
        ttl
      });

      console.log('Form data saved to cache:', { userId, step, fieldsCount: Object.keys(formData).length });
      
    } catch (error) {
      console.error('Error saving form data to cache:', error);
    }
  }

  /**
   * Load form data from cache
   */
  public async loadFormData(userId: string): Promise<CachedSubmissionData | null> {
    // Skip if not in browser environment
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      console.warn('Cache not available in SSR environment');
      return null;
    }

    const id = `form_${userId}`;
    const now = Date.now();

    try {
      // First check memory cache
      const memoryCached = this.memoryCache.get(id);
      if (memoryCached && now - memoryCached.timestamp < memoryCached.ttl) {
        console.log('Form data loaded from memory cache:', { userId });
        return memoryCached.data;
      }

      // Check IndexedDB
      const db = await this.dbPromise;
      const cacheEntry = await db.get(this.FORM_STORE, id);
      
      if (!cacheEntry) {
        return null;
      }

      // Check if expired
      if (now > cacheEntry.expiresAt) {
        // Remove expired entry
        await db.delete(this.FORM_STORE, id);
        this.memoryCache.delete(id);
        return null;
      }

      // Update memory cache
      this.memoryCache.set(id, {
        data: cacheEntry.data,
        timestamp: cacheEntry.timestamp,
        ttl: cacheEntry.ttl
      });

      console.log('Form data loaded from IndexedDB cache:', { userId });
      return cacheEntry.data;
      
    } catch (error) {
      console.error('Error loading form data from cache:', error);
      return null;
    }
  }

  /**
   * Save session data (temporary data for current session)
   */
  public async saveSessionData(
    sessionId: string,
    key: string,
    data: any,
    options: CacheOptions = {}
  ): Promise<void> {
    // Skip if not in browser environment
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      console.warn('Cache not available in SSR environment');
      return;
    }
    const ttl = options.ttl || this.DEFAULT_TTL;
    const timestamp = Date.now();
    const id = `session_${sessionId}_${key}`;

    const cacheEntry = {
      id,
      sessionId,
      key,
      data,
      timestamp,
      ttl,
      expiresAt: timestamp + ttl
    };

    try {
      // Save to IndexedDB
      const db = await this.dbPromise;
      const tx = db.transaction(this.SESSION_STORE, 'readwrite');
      await tx.store.put(cacheEntry);
      
      // Also save to memory cache
      this.memoryCache.set(id, {
        data,
        timestamp,
        ttl
      });
      
    } catch (error) {
      console.error('Error saving session data to cache:', error);
    }
  }

  /**
   * Load session data
   */
  public async loadSessionData(sessionId: string, key: string): Promise<any | null> {
    // Skip if not in browser environment
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      console.warn('Cache not available in SSR environment');
      return null;
    }

    const id = `session_${sessionId}_${key}`;
    const now = Date.now();

    try {
      // First check memory cache
      const memoryCached = this.memoryCache.get(id);
      if (memoryCached && now - memoryCached.timestamp < memoryCached.ttl) {
        return memoryCached.data;
      }

      // Check IndexedDB
      const db = await this.dbPromise;
      const cacheEntry = await db.get(this.SESSION_STORE, id);
      
      if (!cacheEntry || now > cacheEntry.expiresAt) {
        if (cacheEntry) {
          await db.delete(this.SESSION_STORE, id);
          this.memoryCache.delete(id);
        }
        return null;
      }

      // Update memory cache
      this.memoryCache.set(id, {
        data: cacheEntry.data,
        timestamp: cacheEntry.timestamp,
        ttl: cacheEntry.ttl
      });

      return cacheEntry.data;
      
    } catch (error) {
      console.error('Error loading session data from cache:', error);
      return null;
    }
  }

  /**
   * Clear form data for a user
   */
  public async clearFormData(userId: string): Promise<void> {
    // Skip if not in browser environment
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      console.warn('Cache not available in SSR environment');
      return;
    }

    const id = `form_${userId}`;

    try {
      const db = await this.dbPromise;
      await db.delete(this.FORM_STORE, id);
      this.memoryCache.delete(id);
      
      console.log('Form data cleared from cache:', { userId });
      
    } catch (error) {
      console.error('Error clearing form data from cache:', error);
    }
  }

  /**
   * Clear session data
   */
  public async clearSessionData(sessionId: string, key?: string): Promise<void> {
    // Skip if not in browser environment
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      console.warn('Cache not available in SSR environment');
      return;
    }

    try {
      const db = await this.dbPromise;
      const tx = db.transaction(this.SESSION_STORE, 'readwrite');
      const index = tx.store.index('sessionId');
      
      let cursor = await index.openCursor(sessionId);
      const idsToDelete: string[] = [];
      
      while (cursor) {
        const entry = cursor.value;
        if (!key || entry.key === key) {
          idsToDelete.push(entry.id);
          this.memoryCache.delete(entry.id);
        }
        cursor = await cursor.continue();
      }
      
      // Delete from IndexedDB
      for (const id of idsToDelete) {
        await db.delete(this.SESSION_STORE, id);
      }
      
      console.log(`Cleared ${idsToDelete.length} session data entries`);
      
    } catch (error) {
      console.error('Error clearing session data from cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  public async getCacheStats(): Promise<{
    formDataEntries: number;
    sessionDataEntries: number;
    memoryEntries: number;
    totalSize: number;
  }> {
    // Skip if not in browser environment
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return {
        formDataEntries: 0,
        sessionDataEntries: 0,
        memoryEntries: 0,
        totalSize: 0
      };
    }

    try {
      const db = await this.dbPromise;
      
      // Count form data entries
      const formTx = db.transaction(this.FORM_STORE, 'readonly');
      const formCount = await formTx.store.count();
      
      // Count session data entries
      const sessionTx = db.transaction(this.SESSION_STORE, 'readonly');
      const sessionCount = await sessionTx.store.count();
      
      // Memory cache size
      const memoryEntries = this.memoryCache.size;
      
      // Estimate total size (rough calculation)
      let totalSize = 0;
      for (const [, entry] of this.memoryCache) {
        totalSize += JSON.stringify(entry.data).length;
      }
      
      return {
        formDataEntries: formCount,
        sessionDataEntries: sessionCount,
        memoryEntries,
        totalSize
      };
      
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        formDataEntries: 0,
        sessionDataEntries: 0,
        memoryEntries: 0,
        totalSize: 0
      };
    }
  }

  /**
   * Clean up expired cache entries
   */
  public async cleanupExpiredEntries(): Promise<void> {
    // Skip if not in browser environment
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      console.warn('Cache cleanup not available in SSR environment');
      return;
    }

    const now = Date.now();
    
    try {
      const db = await this.dbPromise;
      
      // Clean up form data
      const formTx = db.transaction(this.FORM_STORE, 'readwrite');
      let formCursor = await formTx.store.openCursor();
      const expiredFormIds: string[] = [];
      
      while (formCursor) {
        const entry = formCursor.value;
        if (now > entry.expiresAt) {
          expiredFormIds.push(entry.id);
          await formCursor.delete();
        }
        formCursor = await formCursor.continue();
      }
      
      // Clean up session data
      const sessionTx = db.transaction(this.SESSION_STORE, 'readwrite');
      let sessionCursor = await sessionTx.store.openCursor();
      const expiredSessionIds: string[] = [];
      
      while (sessionCursor) {
        const entry = sessionCursor.value;
        if (now > entry.expiresAt) {
          expiredSessionIds.push(entry.id);
          await sessionCursor.delete();
        }
        sessionCursor = await sessionCursor.continue();
      }
      
      // Clean up memory cache
      const expiredMemoryIds: string[] = [];
      for (const [id, entry] of this.memoryCache) {
        if (now - entry.timestamp > entry.ttl) {
          expiredMemoryIds.push(id);
        }
      }
      
      expiredMemoryIds.forEach(id => this.memoryCache.delete(id));
      
      console.log('Cache cleanup completed:', {
        expiredFormEntries: expiredFormIds.length,
        expiredSessionEntries: expiredSessionIds.length,
        expiredMemoryEntries: expiredMemoryIds.length
      });
      
    } catch (error) {
      console.error('Error during cache cleanup:', error);
    }
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    // Only start timer in browser environment
    if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
      // Run cleanup every 30 minutes
      setInterval(() => {
        this.cleanupExpiredEntries();
      }, 30 * 60 * 1000);
    }
  }

  /**
   * Compress data for storage (simple JSON compression)
   */
  private compressData(data: any): string {
    // Simple compression by removing extra whitespace
    return JSON.stringify(data);
  }

  /**
   * Decompress data from storage
   */
  private decompressData(compressedData: string): any {
    return JSON.parse(compressedData);
  }

  /**
   * Clear all cache data
   */
  public async clearAllCache(): Promise<void> {
    try {
      const db = await this.dbPromise;
      
      // Clear form data
      const formTx = db.transaction(this.FORM_STORE, 'readwrite');
      await formTx.store.clear();
      
      // Clear session data
      const sessionTx = db.transaction(this.SESSION_STORE, 'readwrite');
      await sessionTx.store.clear();
      
      // Clear memory cache
      this.memoryCache.clear();
      
      console.log('All cache data cleared');
      
    } catch (error) {
      console.error('Error clearing all cache data:', error);
    }
  }
} 