/**
 * Firebase Cost Optimization Service
 * 
 * Implements advanced strategies to minimize Firebase read/write operations
 * and reduce costs while maintaining performance and reliability
 */

import { 
  getFirestore, 
  writeBatch, 
  doc, 
  collection, 
  query, 
  where, 
  limit, 
  orderBy,
  startAfter,
  getDocs,
  getDoc,
  DocumentSnapshot,
  QuerySnapshot,
  Timestamp
} from 'firebase/firestore';
import { EnhancedSubmissionCache } from './submission.cache.enhanced';

interface BatchOperation {
  type: 'set' | 'update' | 'delete';
  docRef: any;
  data?: any;
}

interface QueryCache {
  query: string;
  results: any[];
  timestamp: number;
  hash: string;
}

interface CostMetrics {
  reads: number;
  writes: number;
  deletes: number;
  cachehits: number;
  cacheMisses: number;
  batchOperations: number;
  costSavings: number;
}

export class CostOptimizationService {
  private static instance: CostOptimizationService;
  private firestore = getFirestore();
  private cache = EnhancedSubmissionCache.getInstance();
  
  // Batch operations queue
  private batchQueue: BatchOperation[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 500; // Firestore limit
  private readonly BATCH_DELAY = 2000; // 2 seconds
  
  // Query caching
  private queryCache: Map<string, QueryCache> = new Map();
  private readonly QUERY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  // Cost tracking
  private costMetrics: CostMetrics = {
    reads: 0,
    writes: 0,
    deletes: 0,
    cachehits: 0,
    cacheMisses: 0,
    batchOperations: 0,
    costSavings: 0
  };
  
  // Field selection optimization
  private fieldMasks: Map<string, string[]> = new Map();

  private constructor() {
    this.setupFieldMasks();
    this.startPeriodicCleanup();
  }

  public static getInstance(): CostOptimizationService {
    if (!CostOptimizationService.instance) {
      CostOptimizationService.instance = new CostOptimizationService();
    }
    return CostOptimizationService.instance;
  }

  /**
   * Setup field masks for selective reading
   */
  private setupFieldMasks(): void {
    // Define which fields to fetch for different use cases
    this.fieldMasks.set('submission-list', [
      'general_information.protocol_title',
      'general_information.spup_rec_code',
      'general_information.principal_investigator.name',
      'status',
      'submittedAt',
      'lastModified'
    ]);
    
    this.fieldMasks.set('submission-preview', [
      'general_information.protocol_title',
      'general_information.principal_investigator',
      'nature_and_type_of_study',
      'status',
      'submittedAt',
      'brief_description_of_study'
    ]);
    
    this.fieldMasks.set('submission-full', [
      // All fields - no mask
    ]);
  }

  /**
   * Optimized document read with caching and field selection
   */
  public async optimizedRead(
    collectionName: string,
    documentId: string,
    fieldMask?: string,
    useCache: boolean = true
  ): Promise<any | null> {
    const cacheKey = `${collectionName}/${documentId}${fieldMask ? `?fields=${fieldMask}` : ''}`;
    
    // Check cache first
    if (useCache) {
      const cached = await this.getCachedQuery(cacheKey);
      if (cached) {
        this.costMetrics.cachehits++;
        console.log('Cache hit for document read:', { collectionName, documentId });
        return cached.results[0] || null;
      }
    }
    
    try {
      const docRef = doc(this.firestore, collectionName, documentId);
      
      // Apply field mask if specified
      const docSnapshot = await getDoc(docRef);
      this.costMetrics.reads++;
      
      if (docSnapshot.exists()) {
        let data = docSnapshot.data();
        
        // Apply field mask manually (Firestore Web SDK doesn't support select())
        if (fieldMask && this.fieldMasks.has(fieldMask)) {
          const fields = this.fieldMasks.get(fieldMask)!;
          if (fields.length > 0) {
            data = this.applyFieldMask(data, fields);
          }
        }
        
        // Cache the result
        if (useCache) {
          await this.cacheQuery(cacheKey, [data]);
        }
        
        this.costMetrics.cacheMisses++;
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('Error in optimized read:', error);
      throw error;
    }
  }

  /**
   * Optimized query with pagination and caching
   */
  public async optimizedQuery(
    collectionName: string,
    constraints: any[] = [],
    fieldMask?: string,
    pageSize: number = 20,
    lastDoc?: DocumentSnapshot,
    useCache: boolean = true
  ): Promise<{
    results: any[];
    lastDoc: DocumentSnapshot | null;
    hasMore: boolean;
  }> {
    const queryHash = this.generateQueryHash(collectionName, constraints, fieldMask, pageSize);
    const cacheKey = `query_${queryHash}${lastDoc ? `_page_${lastDoc.id}` : ''}`;
    
    // Check cache first
    if (useCache && !lastDoc) { // Only cache first page
      const cached = await this.getCachedQuery(cacheKey);
      if (cached) {
        this.costMetrics.cachehits++;
        console.log('Cache hit for query:', { collectionName, queryHash });
        return {
          results: cached.results,
          lastDoc: null, // We don't cache lastDoc
          hasMore: cached.results.length === pageSize
        };
      }
    }
    
    try {
      let q = query(collection(this.firestore, collectionName));
      
      // Apply constraints
      constraints.forEach(constraint => {
        q = query(q, constraint);
      });
      
      // Add pagination
      q = query(q, limit(pageSize + 1)); // +1 to check if there are more
      
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      
      const querySnapshot = await getDocs(q);
      this.costMetrics.reads += querySnapshot.size;
      
      let results = querySnapshot.docs.map(doc => {
        let data = { id: doc.id, ...doc.data() };
        
        // Apply field mask
        if (fieldMask && this.fieldMasks.has(fieldMask)) {
          const fields = this.fieldMasks.get(fieldMask)!;
          if (fields.length > 0) {
            data = this.applyFieldMask(data, ['id', ...fields]);
          }
        }
        
        return data;
      });
      
      // Check if there are more results
      const hasMore = results.length > pageSize;
      if (hasMore) {
        results = results.slice(0, pageSize);
      }
      
      const newLastDoc = hasMore && querySnapshot.docs.length > pageSize 
        ? querySnapshot.docs[pageSize - 1] 
        : null;
      
      // Cache first page only
      if (useCache && !lastDoc) {
        await this.cacheQuery(cacheKey, results);
      }
      
      this.costMetrics.cacheMisses++;
      return {
        results,
        lastDoc: newLastDoc,
        hasMore
      };
      
    } catch (error) {
      console.error('Error in optimized query:', error);
      throw error;
    }
  }

  /**
   * Batch write operations for cost efficiency
   */
  public async batchWrite(
    operations: BatchOperation[]
  ): Promise<void> {
    // Add operations to queue
    this.batchQueue.push(...operations);
    
    // Process immediately if queue is full
    if (this.batchQueue.length >= this.BATCH_SIZE) {
      await this.processBatchQueue();
    } else {
      // Schedule delayed processing
      this.scheduleBatchProcessing();
    }
  }

  /**
   * Add single operation to batch queue
   */
  public addToBatch(operation: BatchOperation): void {
    this.batchQueue.push(operation);
    this.scheduleBatchProcessing();
  }

  /**
   * Schedule batch processing with delay
   */
  private scheduleBatchProcessing(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    
    this.batchTimeout = setTimeout(() => {
      this.processBatchQueue();
    }, this.BATCH_DELAY);
  }

  /**
   * Process the batch queue
   */
  private async processBatchQueue(): Promise<void> {
    if (this.batchQueue.length === 0) return;
    
    const operationsToProcess = this.batchQueue.splice(0, this.BATCH_SIZE);
    
    try {
      const batch = writeBatch(this.firestore);
      
      operationsToProcess.forEach(operation => {
        switch (operation.type) {
          case 'set':
            batch.set(operation.docRef, operation.data);
            this.costMetrics.writes++;
            break;
          case 'update':
            batch.update(operation.docRef, operation.data);
            this.costMetrics.writes++;
            break;
          case 'delete':
            batch.delete(operation.docRef);
            this.costMetrics.deletes++;
            break;
        }
      });
      
      await batch.commit();
      this.costMetrics.batchOperations++;
      
      console.log(`Batch processed: ${operationsToProcess.length} operations`);
      
      // Calculate cost savings (batch vs individual operations)
      this.costMetrics.costSavings += operationsToProcess.length - 1;
      
    } catch (error) {
      console.error('Error processing batch queue:', error);
      // Re-add failed operations to queue for retry
      this.batchQueue.unshift(...operationsToProcess);
      throw error;
    }
    
    // Process remaining operations if any
    if (this.batchQueue.length > 0) {
      setTimeout(() => this.processBatchQueue(), 100);
    }
  }

  /**
   * Force process all pending batch operations
   */
  public async flushBatchQueue(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    
    while (this.batchQueue.length > 0) {
      await this.processBatchQueue();
    }
  }

  /**
   * Apply field mask to data object
   */
  private applyFieldMask(data: any, fields: string[]): any {
    const result: any = {};
    
    fields.forEach(field => {
      const fieldParts = field.split('.');
      let source = data;
      let target = result;
      
      for (let i = 0; i < fieldParts.length; i++) {
        const part = fieldParts[i];
        
        if (i === fieldParts.length - 1) {
          // Last part - copy the value
          if (source && source[part] !== undefined) {
            target[part] = source[part];
          }
        } else {
          // Intermediate part - create nested object
          if (source && source[part] !== undefined) {
            if (!target[part]) {
              target[part] = {};
            }
            source = source[part];
            target = target[part];
          } else {
            break; // Field doesn't exist
          }
        }
      }
    });
    
    return result;
  }

  /**
   * Generate hash for query caching
   */
  private generateQueryHash(
    collectionName: string,
    constraints: any[],
    fieldMask?: string,
    pageSize?: number
  ): string {
    const queryString = JSON.stringify({
      collection: collectionName,
      constraints: constraints.map(c => c.toString()),
      fieldMask,
      pageSize
    });
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < queryString.length; i++) {
      const char = queryString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString();
  }

  /**
   * Cache query results
   */
  private async cacheQuery(key: string, results: any[]): Promise<void> {
    const cacheEntry: QueryCache = {
      query: key,
      results,
      timestamp: Date.now(),
      hash: this.generateQueryHash(key, [], undefined, results.length)
    };
    
    this.queryCache.set(key, cacheEntry);
    
    // Also store in persistent cache for longer-term storage
    await this.cache.saveSessionData('query-cache', key, cacheEntry);
  }

  /**
   * Get cached query results
   */
  private async getCachedQuery(key: string): Promise<QueryCache | null> {
    // Check memory cache first
    const memoryCached = this.queryCache.get(key);
    if (memoryCached && Date.now() - memoryCached.timestamp < this.QUERY_CACHE_TTL) {
      return memoryCached;
    }
    
    // Check persistent cache
    const persistentCached = await this.cache.loadSessionData('query-cache', key);
    if (persistentCached && Date.now() - persistentCached.timestamp < this.QUERY_CACHE_TTL) {
      // Update memory cache
      this.queryCache.set(key, persistentCached);
      return persistentCached;
    }
    
    return null;
  }

  /**
   * Invalidate cached queries
   */
  public invalidateQueryCache(pattern?: string): void {
    if (pattern) {
      // Invalidate specific pattern
      for (const [key] of this.queryCache) {
        if (key.includes(pattern)) {
          this.queryCache.delete(key);
        }
      }
    } else {
      // Clear all
      this.queryCache.clear();
    }
    
    console.log('Query cache invalidated:', pattern || 'all');
  }

  /**
   * Start periodic cleanup
   */
  private startPeriodicCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 10 * 60 * 1000); // Every 10 minutes
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.queryCache) {
      if (now - entry.timestamp > this.QUERY_CACHE_TTL) {
        this.queryCache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} expired query cache entries`);
    }
  }

  /**
   * Get cost metrics and statistics
   */
  public getCostMetrics(): CostMetrics & {
    estimatedCost: number;
    totalOperations: number;
    cacheHitRate: number;
  } {
    const totalOperations = this.costMetrics.reads + this.costMetrics.writes + this.costMetrics.deletes;
    const cacheHitRate = this.costMetrics.cachehits + this.costMetrics.cacheMisses > 0
      ? (this.costMetrics.cachehits / (this.costMetrics.cachehits + this.costMetrics.cacheMisses)) * 100
      : 0;
    
    // Rough cost estimation (based on Firebase pricing)
    const readCost = this.costMetrics.reads * 0.00006; // $0.06 per 100,000 reads
    const writeCost = this.costMetrics.writes * 0.00018; // $0.18 per 100,000 writes
    const deleteCost = this.costMetrics.deletes * 0.00002; // $0.02 per 100,000 deletes
    const estimatedCost = readCost + writeCost + deleteCost;
    
    return {
      ...this.costMetrics,
      estimatedCost,
      totalOperations,
      cacheHitRate
    };
  }

  /**
   * Reset cost metrics
   */
  public resetCostMetrics(): void {
    this.costMetrics = {
      reads: 0,
      writes: 0,
      deletes: 0,
      cachehits: 0,
      cacheMisses: 0,
      batchOperations: 0,
      costSavings: 0
    };
    
    console.log('Cost metrics reset');
  }

  /**
   * Get optimization recommendations
   */
  public getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.getCostMetrics();
    
    if (metrics.cacheHitRate < 50) {
      recommendations.push('Consider increasing cache TTL or improving cache strategy');
    }
    
    if (metrics.batchOperations < metrics.writes * 0.1) {
      recommendations.push('Use more batch operations to reduce write costs');
    }
    
    if (metrics.reads > metrics.writes * 3) {
      recommendations.push('High read-to-write ratio detected - consider aggressive caching');
    }
    
    if (this.queryCache.size > 100) {
      recommendations.push('Query cache is large - consider more specific field masks');
    }
    
    return recommendations;
  }
} 