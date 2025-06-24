/**
 * Enhanced Submission Cache with Firebase Change Detection
 * 
 * Caches data until Firebase changes are detected, providing better
 * performance and cost optimization than TTL-based caching
 */

import { openDB, IDBPDatabase } from 'idb';
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  where,
  orderBy,
  Timestamp,
  DocumentSnapshot,
  QuerySnapshot
} from 'firebase/firestore';
import { SubmissionFormData, CachedSubmissionData, DocumentUpload } from './submission.types';

interface CacheEntry {
  id: string;
  data: any;
  timestamp: number;
  firebaseVersion?: number;
  lastFirebaseUpdate?: number;
  isDirty: boolean;
}

interface FirebaseListener {
  unsubscribe: () => void;
  path: string;
  lastUpdate: number;
}

export class EnhancedSubmissionCache {
  private static instance: EnhancedSubmissionCache;
  private dbPromise: Promise<IDBPDatabase>;
  private firestore = getFirestore();
  private readonly DB_NAME = 'enhanced-submission-cache';
  private readonly DB_VERSION = 2;
  private readonly FORM_STORE = 'form-data';
  private readonly METADATA_STORE = 'cache-metadata';
  private readonly FIREBASE_LISTENERS_STORE = 'firebase-listeners';
  
  // In-memory cache for ultra-fast access
  private memoryCache: Map<string, CacheEntry> = new Map();
  
  // Firebase listeners management
  private firebaseListeners: Map<string, FirebaseListener> = new Map();
  
  // Change detection
  private changeCallbacks: Map<string, Set<(data: any) => void>> = new Map();

  private constructor() {
    // Only initialize in browser environment
    if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
      this.dbPromise = this.initDB();
      this.migrateExistingEntries();
      this.startChangeDetection();
    } else {
      // Create a dummy promise for SSR compatibility
      this.dbPromise = Promise.resolve({} as any);
    }
  }

  public static getInstance(): EnhancedSubmissionCache {
    if (!EnhancedSubmissionCache.instance) {
      EnhancedSubmissionCache.instance = new EnhancedSubmissionCache();
    }
    return EnhancedSubmissionCache.instance;
  }

  /**
   * Initialize IndexedDB with enhanced schema
   */
  private async initDB(): Promise<IDBPDatabase> {
    // Check if we're in browser environment
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      throw new Error('IndexedDB not available in this environment');
    }

    const FORM_STORE = this.FORM_STORE;
    const METADATA_STORE = this.METADATA_STORE;
    const FIREBASE_LISTENERS_STORE = this.FIREBASE_LISTENERS_STORE;
    
    return openDB(this.DB_NAME, this.DB_VERSION, {
      upgrade(db, oldVersion) {
        // Form data store
        if (!db.objectStoreNames.contains(FORM_STORE)) {
          const formStore = db.createObjectStore(FORM_STORE, { keyPath: 'id' });
          formStore.createIndex('userId', 'userId', { unique: false });
          formStore.createIndex('isDirty', 'isDirty', { unique: false });
          formStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // Cache metadata store
        if (!db.objectStoreNames.contains(METADATA_STORE)) {
          const metadataStore = db.createObjectStore(METADATA_STORE, { keyPath: 'id' });
          metadataStore.createIndex('lastFirebaseUpdate', 'lastFirebaseUpdate', { unique: false });
          metadataStore.createIndex('firebaseVersion', 'firebaseVersion', { unique: false });
        }
        
        // Firebase listeners tracking
        if (!db.objectStoreNames.contains(FIREBASE_LISTENERS_STORE)) {
          const listenersStore = db.createObjectStore(FIREBASE_LISTENERS_STORE, { keyPath: 'path' });
          listenersStore.createIndex('lastUpdate', 'lastUpdate', { unique: false });
        }
        
        // Migration for version 2
        if (oldVersion < 2) {
          // Add new fields to existing stores
          console.log('Migrating cache to version 2...');
        }
      }
    });
  }

  /**
   * Migrate existing cache entries to ensure proper isDirty values
   */
  private async migrateExistingEntries(): Promise<void> {
    // Skip if not in browser environment
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return;
    }

    try {
      const db = await this.dbPromise;
      const tx = db.transaction(this.FORM_STORE, 'readwrite');
      const store = tx.store;
      
      let cursor = await store.openCursor();
      const updates: Promise<any>[] = [];
      
      while (cursor) {
        const entry = cursor.value;
        
        // Fix entries with undefined or null isDirty values
        if (entry.isDirty === undefined || entry.isDirty === null) {
          entry.isDirty = false; // Default to false for existing entries
          updates.push(cursor.update(entry));
        }
        
        // Ensure other required fields exist
        if (!entry.firebaseVersion) {
          entry.firebaseVersion = 1;
        }
        if (!entry.lastFirebaseUpdate) {
          entry.lastFirebaseUpdate = entry.timestamp || Date.now();
        }
        
        cursor = await cursor.continue();
      }
      
      await Promise.all(updates);
      console.log('Cache migration completed:', { updatedEntries: updates.length });
      
    } catch (error) {
      console.error('Error migrating cache entries:', error);
    }
  }

  /**
   * Save form data with Firebase change tracking
   */
  public async saveFormData(
    userId: string,
    formData: Partial<SubmissionFormData>,
    documents: DocumentUpload[] = [],
    step: number = 1,
    firebaseDocId?: string
  ): Promise<void> {
    // Skip if not in browser environment
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      console.warn('Enhanced cache not available in SSR environment');
      return;
    }
    const timestamp = Date.now();
    const id = `form_${userId}`;

    const cachedData: CachedSubmissionData = {
      formData,
      documents,
      lastModified: timestamp,
      step
    };

    const cacheEntry: CacheEntry = {
      id,
      data: {
        ...cachedData,
        userId,
        firebaseDocId
      },
      timestamp,
      firebaseVersion: 1,
      lastFirebaseUpdate: timestamp,
      isDirty: false // Explicitly set to false for new entries
    };

    try {
      // Save to IndexedDB
      const db = await this.dbPromise;
      const tx = db.transaction([this.FORM_STORE, this.METADATA_STORE], 'readwrite');
      
      await tx.objectStore(this.FORM_STORE).put(cacheEntry);
      await tx.objectStore(this.METADATA_STORE).put({
        id,
        firebaseDocId,
        lastFirebaseUpdate: timestamp,
        firebaseVersion: 1,
        userId
      });
      
      // Update memory cache
      this.memoryCache.set(id, cacheEntry);
      
      // Set up Firebase listener if we have a document ID
      if (firebaseDocId) {
        this.setupFirebaseListener(id, firebaseDocId, 'submissions');
      }

      console.log('Enhanced form data saved:', { userId, step, firebaseDocId });
      
    } catch (error) {
      console.error('Error saving enhanced form data:', error);
    }
  }

  /**
   * Load form data with Firebase sync check
   */
  public async loadFormData(userId: string): Promise<CachedSubmissionData | null> {
    // Skip if not in browser environment
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      console.warn('Enhanced cache not available in SSR environment');
      return null;
    }

    const id = `form_${userId}`;

    try {
      // First check memory cache
      const memoryCached = this.memoryCache.get(id);
      if (memoryCached && !memoryCached.isDirty) {
        console.log('Form data loaded from memory cache (clean):', { userId });
        return memoryCached.data;
      }

      // Check IndexedDB
      const db = await this.dbPromise;
      const cacheEntry = await db.get(this.FORM_STORE, id);
      
      if (!cacheEntry) {
        return null;
      }

      // Check if we need to sync with Firebase
      if (cacheEntry.isDirty) {
        console.log('Cache is dirty, checking Firebase for updates...');
        
        // Try to sync with Firebase if we have a document ID
        const metadata = await db.get(this.METADATA_STORE, id);
        if (metadata?.firebaseDocId) {
          const freshData = await this.syncWithFirebase(id, metadata.firebaseDocId);
          if (freshData) {
            return freshData;
          }
        }
      }

      // Update memory cache
      this.memoryCache.set(id, cacheEntry);
      
      console.log('Form data loaded from IndexedDB cache:', { userId });
      return cacheEntry.data;
      
    } catch (error) {
      console.error('Error loading enhanced form data:', error);
      return null;
    }
  }

  /**
   * Set up Firebase listener for real-time change detection
   */
  private setupFirebaseListener(
    cacheId: string, 
    firebaseDocId: string, 
    collection: string
  ): void {
    // Remove existing listener if any
    const existingListener = this.firebaseListeners.get(cacheId);
    if (existingListener) {
      existingListener.unsubscribe();
    }

    const docRef = doc(this.firestore, collection, firebaseDocId);
    
    const unsubscribe = onSnapshot(docRef, (docSnapshot: DocumentSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const lastModified = data?.lastModified?.toMillis() || Date.now();
        
        // Check if this is a newer version than our cache
        this.handleFirebaseChange(cacheId, data, lastModified);
      }
    }, (error) => {
      console.error('Firebase listener error:', error);
      this.markCacheAsDirty(cacheId);
    });

    // Store listener reference
    this.firebaseListeners.set(cacheId, {
      unsubscribe,
      path: `${collection}/${firebaseDocId}`,
      lastUpdate: Date.now()
    });

    console.log('Firebase listener setup for:', { cacheId, firebaseDocId });
  }

  /**
   * Handle Firebase document changes
   */
  private async handleFirebaseChange(
    cacheId: string, 
    firebaseData: any, 
    firebaseTimestamp: number
  ): Promise<void> {
    // Skip if not in browser environment
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return;
    }

    try {
      const cachedEntry = this.memoryCache.get(cacheId);
             const shouldUpdate = !cachedEntry || 
                           (cachedEntry.lastFirebaseUpdate || 0) < firebaseTimestamp;

      if (shouldUpdate) {
        console.log('Firebase change detected, updating cache:', { cacheId });
        
        // Update cache with fresh Firebase data
        const updatedEntry: CacheEntry = {
          id: cacheId,
          data: firebaseData,
          timestamp: Date.now(),
          firebaseVersion: (cachedEntry?.firebaseVersion || 0) + 1,
          lastFirebaseUpdate: firebaseTimestamp,
          isDirty: false
        };

        // Update IndexedDB
        const db = await this.dbPromise;
        const tx = db.transaction([this.FORM_STORE, this.METADATA_STORE], 'readwrite');
        
        await tx.objectStore(this.FORM_STORE).put(updatedEntry);
        await tx.objectStore(this.METADATA_STORE).put({
          id: cacheId,
          lastFirebaseUpdate: firebaseTimestamp,
          firebaseVersion: updatedEntry.firebaseVersion
        });

        // Update memory cache
        this.memoryCache.set(cacheId, updatedEntry);

        // Notify subscribers
        this.notifyChangeCallbacks(cacheId, firebaseData);
      }
    } catch (error) {
      console.error('Error handling Firebase change:', error);
    }
  }

  /**
   * Mark cache entry as dirty (needs Firebase sync)
   */
  private async markCacheAsDirty(cacheId: string): Promise<void> {
    // Skip if not in browser environment
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return;
    }

    try {
      // Update memory cache
      const memoryCached = this.memoryCache.get(cacheId);
      if (memoryCached) {
        memoryCached.isDirty = true;
        this.memoryCache.set(cacheId, memoryCached);
      }

      // Update IndexedDB
      const db = await this.dbPromise;
      const cacheEntry = await db.get(this.FORM_STORE, cacheId);
      if (cacheEntry) {
        cacheEntry.isDirty = true;
        await db.put(this.FORM_STORE, cacheEntry);
      }
      
      console.log('Cache marked as dirty:', { cacheId });
    } catch (error) {
      console.error('Error marking cache as dirty:', error);
    }
  }

  /**
   * Sync with Firebase to get latest data
   */
  private async syncWithFirebase(
    cacheId: string, 
    firebaseDocId: string
  ): Promise<CachedSubmissionData | null> {
    try {
      const docRef = doc(this.firestore, 'submissions', firebaseDocId);
      const docSnapshot = await import('firebase/firestore').then(({ getDoc }) => getDoc(docRef));
      
      if (docSnapshot.exists()) {
        const firebaseData = docSnapshot.data();
        const firebaseTimestamp = firebaseData?.lastModified?.toMillis() || Date.now();
        
        // Update cache with fresh data
        await this.handleFirebaseChange(cacheId, firebaseData, firebaseTimestamp);
        
        return firebaseData as CachedSubmissionData;
      }
      
      return null;
    } catch (error) {
      console.error('Error syncing with Firebase:', error);
      return null;
    }
  }

  /**
   * Subscribe to cache changes
   */
  public subscribeToChanges(
    cacheId: string, 
    callback: (data: any) => void
  ): () => void {
    if (!this.changeCallbacks.has(cacheId)) {
      this.changeCallbacks.set(cacheId, new Set());
    }
    
    this.changeCallbacks.get(cacheId)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.changeCallbacks.get(cacheId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.changeCallbacks.delete(cacheId);
        }
      }
    };
  }

  /**
   * Notify change callbacks
   */
  private notifyChangeCallbacks(cacheId: string, data: any): void {
    const callbacks = this.changeCallbacks.get(cacheId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in change callback:', error);
        }
      });
    }
  }

    /**
   * Start change detection system
   */
  private startChangeDetection(): void {
    // Skip if not in browser environment
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return;
    }

    // Periodic check for dirty cache entries
    setInterval(async () => {
      try {
        const db = await this.dbPromise;
        const tx = db.transaction(this.FORM_STORE, 'readonly');
        const store = tx.store;
        
        // Get all entries and filter for dirty ones
        let cursor = await store.openCursor();
        
        while (cursor) {
          const entry = cursor.value;
          
          // Check if entry is dirty (handle undefined/null values)
          if (entry.isDirty === true) {
            const metadata = await db.get(this.METADATA_STORE, entry.id);
            
            if (metadata?.firebaseDocId) {
              // Try to sync this dirty entry
              await this.syncWithFirebase(entry.id, metadata.firebaseDocId);
            }
          }
          
          cursor = await cursor.continue();
        }
      } catch (error) {
        console.error('Error in change detection cycle:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Get cache statistics with Firebase sync info
   */
  public async getCacheStats(): Promise<{
    totalEntries: number;
    dirtyEntries: number;
    memoryEntries: number;
    activeListeners: number;
    lastSyncTimes: Record<string, number>;
  }> {
    // Skip if not in browser environment
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return {
        totalEntries: 0,
        dirtyEntries: 0,
        memoryEntries: 0,
        activeListeners: 0,
        lastSyncTimes: {}
      };
    }

    try {
      const db = await this.dbPromise;
      
      // Count total entries
      const totalEntries = await db.count(this.FORM_STORE);
      
            // Count dirty entries manually
      const dirtyTx = db.transaction(this.FORM_STORE, 'readonly');
      const store = dirtyTx.store;
      let dirtyEntries = 0;
      let cursor = await store.openCursor();
      
      while (cursor) {
        if (cursor.value.isDirty === true) {
          dirtyEntries++;
        }
        cursor = await cursor.continue();
      }
      
      // Memory cache size
      const memoryEntries = this.memoryCache.size;
      
      // Active listeners
      const activeListeners = this.firebaseListeners.size;
      
      // Last sync times
      const lastSyncTimes: Record<string, number> = {};
      for (const [id, listener] of this.firebaseListeners) {
        lastSyncTimes[id] = listener.lastUpdate;
      }
      
      return {
        totalEntries,
        dirtyEntries,
        memoryEntries,
        activeListeners,
        lastSyncTimes
      };
      
    } catch (error) {
      console.error('Error getting enhanced cache stats:', error);
      return {
        totalEntries: 0,
        dirtyEntries: 0,
        memoryEntries: 0,
        activeListeners: 0,
        lastSyncTimes: {}
      };
    }
  }

  /**
   * Force sync all dirty entries
   */
  public async forceSyncAll(): Promise<void> {
    // Skip if not in browser environment
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      console.warn('Force sync not available in SSR environment');
      return;
    }

    console.log('Force syncing all dirty cache entries...');
    
        try {
      const db = await this.dbPromise;
      const tx = db.transaction([this.FORM_STORE, this.METADATA_STORE], 'readonly');
      const store = tx.objectStore(this.FORM_STORE);
      
      let cursor = await store.openCursor();
      const syncPromises: Promise<void>[] = [];
      
      while (cursor) {
        const entry = cursor.value;
        
        // Only process dirty entries
        if (entry.isDirty === true) {
          const metadata = await tx.objectStore(this.METADATA_STORE).get(entry.id);
          
          if (metadata?.firebaseDocId) {
            syncPromises.push(
              this.syncWithFirebase(entry.id, metadata.firebaseDocId).then(() => {})
            );
          }
        }
        
        cursor = await cursor.continue();
      }
      
      await Promise.all(syncPromises);
      console.log(`Force sync completed for ${syncPromises.length} entries`);
      
    } catch (error) {
      console.error('Error in force sync:', error);
    }
  }

  /**
   * Save session data (for cost optimization service)
   */
  public async saveSessionData(category: string, key: string, data: any): Promise<void> {
    // Skip if not in browser environment
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      console.warn('Session data save not available in SSR environment');
      return;
    }

    try {
      const db = await this.dbPromise;
      const sessionKey = `${category}_${key}`;
      
      await db.put(this.FORM_STORE, {
        id: sessionKey,
        data,
        timestamp: Date.now(),
        firebaseVersion: 1,
        lastFirebaseUpdate: Date.now(),
        isDirty: false // Explicitly set for session data
      });
      
    } catch (error) {
      console.error('Error saving session data:', error);
    }
  }

  /**
   * Load session data (for cost optimization service)
   */
  public async loadSessionData(category: string, key: string): Promise<any | null> {
    // Skip if not in browser environment
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      console.warn('Session data load not available in SSR environment');
      return null;
    }

    try {
      const db = await this.dbPromise;
      const sessionKey = `${category}_${key}`;
      
      const entry = await db.get(this.FORM_STORE, sessionKey);
      return entry ? entry.data : null;
      
    } catch (error) {
      console.error('Error loading session data:', error);
      return null;
    }
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    // Unsubscribe from all Firebase listeners
    for (const [id, listener] of this.firebaseListeners) {
      listener.unsubscribe();
      console.log('Unsubscribed Firebase listener:', id);
    }
    
    this.firebaseListeners.clear();
    this.changeCallbacks.clear();
    this.memoryCache.clear();
  }
} 