export * from './reviewers.service';
import { ReviewersService } from './reviewers.service';

/**
 * Standalone helper function for backward compatibility
 * Prefetch reviewers data in the background and store in cache
 */
export const prefetchReviewersData = (): void => {
  const reviewersService = ReviewersService.getInstance();
  reviewersService.prefetchReviewersData();
}; 