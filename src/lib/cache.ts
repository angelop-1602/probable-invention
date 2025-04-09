// A simple in-memory cache utility with expiration
import { CacheItem } from '@/types';

class DataCache {
  private cache: Record<string, CacheItem<any>> = {};
  
  // Default cache duration in milliseconds (5 minutes)
  private defaultDuration = 5 * 60 * 1000;

  /**
   * Set data in the cache with an optional expiration
   * @param key Cache key
   * @param data Data to cache
   * @param duration Cache duration in milliseconds (default: 5 minutes)
   */
  set<T>(key: string, data: T, duration?: number): void {
    const expiration = Date.now() + (duration || this.defaultDuration);
    this.cache[key] = { data, expiration };
  }

  /**
   * Get data from the cache if it exists and hasn't expired
   * @param key Cache key
   * @returns The cached data or null if not found or expired
   */
  get<T>(key: string): T | null {
    const item = this.cache[key] as CacheItem<T> | undefined;
    
    // If item doesn't exist or has expired, return null
    if (!item || Date.now() > item.expiration) {
      return null;
    }
    
    return item.data;
  }

  /**
   * Check if a cache key exists and is valid
   * @param key Cache key
   * @returns Boolean indicating if key exists and is valid
   */
  has(key: string): boolean {
    const item = this.cache[key];
    return !!item && Date.now() <= item.expiration;
  }

  /**
   * Remove an item from the cache
   * @param key Cache key
   */
  remove(key: string): void {
    delete this.cache[key];
  }

  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache = {};
  }

  /**
   * Set the default cache duration
   * @param duration Duration in milliseconds
   */
  setDefaultDuration(duration: number): void {
    this.defaultDuration = duration;
  }
}

// Create and export a singleton instance
export const dataCache = new DataCache(); 