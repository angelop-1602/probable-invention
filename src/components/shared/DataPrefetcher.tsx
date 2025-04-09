"use client";

import { useEffect } from "react";
import { prefetchReviewersData } from "@/lib/reviewers";

/**
 * DataPrefetcher component handles prefetching data for the application
 * to improve performance on subsequent navigation.
 * 
 * This component fetches data in the background when the app first loads.
 */
export default function DataPrefetcher() {
  useEffect(() => {
    // Prefetch reviewers data for faster navigation
    prefetchReviewersData();
    
    // Add additional prefetching for other data as needed
    // ...
  }, []);
  
  // This component doesn't render anything
  return null;
} 