import { collection, getDocs, DocumentData, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/index";
import { TimestampType, Reviewer } from "@/types";

// Type guard to check if a value is a Firestore Timestamp
const isFirestoreTimestamp = (value: any): value is Timestamp => {
  return value && typeof value === 'object' && 'toMillis' in value && typeof value.toMillis === 'function';
};

// Local storage key for reviewers data
const REVIEWERS_STORAGE_KEY = 'spup-reviewers-data';

// In-memory cache (used during the session)
let reviewersCache: Reviewer[] | null = null;

/**
 * Load data from localStorage if available
 * This function is safe to call on the client side
 * Converts stored timestamp data back to Firestore Timestamp objects or ensures they're in a compatible format
 */
const loadFromLocalStorage = (): Reviewer[] | null => {
  // Only run in browser environment (not during SSR)
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    const storedData = localStorage.getItem(REVIEWERS_STORAGE_KEY);
    if (!storedData) return null;
    
    // Parse the stored JSON data
    const parsedData = JSON.parse(storedData);
    
    // Convert stored timestamp data back to usable format
    return parsedData.map((reviewer: any) => {
      let createdAtValue = reviewer.createdAt;
      let updatedAtValue = reviewer.updatedAt;
      
      // Convert milliseconds to Timestamp if needed
      if (typeof createdAtValue === 'number') {
        createdAtValue = Timestamp.fromMillis(createdAtValue);
      }
      
      if (typeof updatedAtValue === 'number') {
        updatedAtValue = Timestamp.fromMillis(updatedAtValue);
      }
      
      return {
        ...reviewer,
        createdAt: createdAtValue,
        updatedAt: updatedAtValue
      };
    });
  } catch (error) {
    console.error('Error loading reviewers from localStorage:', error);
    return null;
  }
};

/**
 * Save data to localStorage for persistence
 * This function is safe to call on the client side
 * Converts Firestore Timestamp objects to a serializable format for JSON storage
 */
const saveToLocalStorage = (data: Reviewer[]): void => {
  // Only run in browser environment (not during SSR)
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    // Convert Firestore Timestamp objects to serializable format
    const serializedData = data.map(reviewer => {
      let createdAtValue = reviewer.createdAt;
      let updatedAtValue = reviewer.updatedAt;
      
      // Handle Firestore Timestamp conversion
      if (isFirestoreTimestamp(createdAtValue)) {
        createdAtValue = createdAtValue.toMillis();
      }
      
      if (isFirestoreTimestamp(updatedAtValue)) {
        updatedAtValue = updatedAtValue.toMillis();
      }
      
      return {
        ...reviewer,
        createdAt: createdAtValue,
        updatedAt: updatedAtValue
      };
    });
    
    localStorage.setItem(REVIEWERS_STORAGE_KEY, JSON.stringify(serializedData));
  } catch (error) {
    console.error('Error saving reviewers to localStorage:', error);
  }
};

/**
 * Extract number from reviewer code for sorting
 */
export const extractNumber = (code: string): number => {
  const match = code.match(/(\d+)/);
  return match ? parseInt(match[0], 10) : 999; // Default to a high number if no match
};

/**
 * Sort reviewers by the numeric part of their code
 */
export const sortReviewers = (reviewersData: Reviewer[]): Reviewer[] => {
  return [...reviewersData].sort((a, b) => {
    return extractNumber(a.code) - extractNumber(b.code);
  });
};

/**
 * Service class for managing reviewers
 */
export class ReviewersService {
  private static instance: ReviewersService;
  
  private constructor() {}
  
  /**
   * Get the singleton instance of ReviewersService
   */
  public static getInstance(): ReviewersService {
    if (!ReviewersService.instance) {
      ReviewersService.instance = new ReviewersService();
    }
    return ReviewersService.instance;
  }
  
  /**
   * Fetch reviewers data from Firestore, localStorage, or in-memory cache
   * @param forceRefresh Whether to bypass cache and fetch fresh data
   * @param activeOnly Whether to only return active reviewers
   * @returns Sorted array of reviewers
   */
  public async fetchReviewers(forceRefresh: boolean = false, activeOnly: boolean = false): Promise<Reviewer[]> {
    // Check in-memory cache first (fastest)
    if (!forceRefresh && reviewersCache !== null) {
      console.log('Using in-memory cached reviewers data');
      const filteredReviewers = activeOnly 
        ? reviewersCache.filter(reviewer => reviewer.isActive) 
        : reviewersCache;
      return filteredReviewers;
    }
    
    // If not in memory but not forcing refresh, try localStorage
    if (!forceRefresh && !reviewersCache) {
      const localData = loadFromLocalStorage();
      if (localData) {
        console.log('Using localStorage cached reviewers data');
        
        // Update the in-memory cache
        reviewersCache = localData;
        
        const filteredReviewers = activeOnly 
          ? localData.filter(reviewer => reviewer.isActive) 
          : localData;
        return filteredReviewers;
      }
    }

    // If we got here, we need to fetch from Firestore
    try {
      console.log('Fetching reviewers from Firestore');
      const reviewersCollection = collection(db, "reviewers");
      const reviewersSnapshot = await getDocs(reviewersCollection);
      const reviewersData = reviewersSnapshot.docs.map(doc => {
        const data = doc.data() as DocumentData;
        return {
          id: doc.id,
          code: data.code || "",
          name: data.name || "",
          specialization: data.specialization || "",
          department: data.department || "",
          isActive: data.isActive || false,
          // Ensure we're using the Firestore Timestamp directly for newly fetched data
          createdAt: data.createdAt || null,
          updatedAt: data.updatedAt || null
        } as Reviewer;
      });
      
      // Sort reviewers by code number
      const sortedData = sortReviewers(reviewersData);
      
      // Update both caches
      reviewersCache = sortedData;
      saveToLocalStorage(sortedData);
      
      // Filter if needed
      const filteredReviewers = activeOnly 
        ? sortedData.filter(reviewer => reviewer.isActive) 
        : sortedData;
      
      return filteredReviewers;
    } catch (error) {
      console.error("Error fetching reviewers:", error);
      throw error;
    }
  }

  /**
   * Get a reviewer by code (case-insensitive, always uppercase)
   * Checks in-memory cache, then localStorage, then Firestore.
   * Returns the reviewer object if found and active, otherwise null.
   */
  public async getReviewerByCode(code: string): Promise<Reviewer | null> {
    const normalizedCode = code.trim().toUpperCase();

    // Helper to find reviewer in a list
    const findReviewer = (list: Reviewer[] | null) =>
      list?.find(
        reviewer =>
          reviewer.code.toUpperCase() === normalizedCode && reviewer.isActive
      ) || null;

    // 1. Check in-memory cache
    if (reviewersCache) {
      const found = findReviewer(reviewersCache);
      if (found) return found;
    }

    // 2. Check localStorage
    const localData = loadFromLocalStorage();
    if (localData) {
      const found = findReviewer(localData);
      if (found) {
        reviewersCache = localData; // sync cache
        return found;
      }
    }

    // 3. Fetch from Firestore
    try {
      const reviewers = await this.fetchReviewers(true, true); // force refresh, only active
      const found = findReviewer(reviewers);
      return found || null;
    } catch (error) {
      console.error("Error fetching reviewer by code:", error);
      return null;
    }
  }

  /**
   * Prefetch reviewers data in the background and store in cache
   * This can be called from layout components for faster navigation
   */
  public prefetchReviewersData(): void {
    // Try to load from localStorage first
    if (!reviewersCache) {
      const localData = loadFromLocalStorage();
      if (localData) {
        reviewersCache = localData;
        return;
      }
    }
    
    // If no localStorage data, fetch from Firestore
    if (reviewersCache === null) {
      this.fetchReviewers().catch(err => {
        console.error('Error prefetching reviewers data:', err);
      });
    }
  }

  /**
   * Invalidate the reviewers cache
   * Call this after adding, updating, or deleting a reviewer to force a refresh on next fetch
   */
  public invalidateReviewersCache(): void {
    // Clear both the in-memory cache and localStorage
    reviewersCache = null;
    
    // Only run in browser environment (not during SSR)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(REVIEWERS_STORAGE_KEY);
    }
  }
} 