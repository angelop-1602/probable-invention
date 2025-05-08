import { doc, writeBatch, serverTimestamp, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { ReviewersService } from './reviewers.service';

export interface ReviewerAssignment {
  id: string;
  name: string;
  assignDate: Date;
  status: 'Assigned' | 'In Progress' | 'Completed';
  reviewForm: string;
}

export interface ReviewerAssignmentInput {
  reviewerId: string;
  formType: string;
}

export class ReviewerAssignmentService {
  private static instance: ReviewerAssignmentService;

  private constructor() {}

  public static getInstance(): ReviewerAssignmentService {
    if (!ReviewerAssignmentService.instance) {
      ReviewerAssignmentService.instance = new ReviewerAssignmentService();
    }
    return ReviewerAssignmentService.instance;
  }

  /**
   * Validates reviewer assignments before processing
   */
  private validateAssignments(
    assignments: ReviewerAssignmentInput[],
    applicationId: string
  ): string | null {
    if (!applicationId) {
      return 'Application ID is required';
    }
    if (assignments.length === 0) {
      return 'At least one reviewer must be assigned';
    }
    if (assignments.some(a => !a.reviewerId || !a.formType)) {
      return 'All reviewers must have both an ID and form type';
    }
    return null;
  }

  /**
   * Maps reviewer assignments to the required format
   */
  private mapAssignments(
    assignments: ReviewerAssignmentInput[],
    reviewers: any[]
  ): ReviewerAssignment[] {
    return assignments.map(assignment => {
      const reviewer = reviewers.find(r => r.id === assignment.reviewerId);
      return {
        id: assignment.reviewerId,
        name: reviewer?.name || 'Unknown Reviewer',
        assignDate: new Date(),
        status: 'Assigned',
        reviewForm: assignment.formType
      };
    });
  }

  /**
   * Assigns reviewers to a protocol application (writes only to primaryReviewers subcollection)
   * Uses reviewer code as the document ID and stores code as a field.
   */
  public async assignReviewers(
    applicationId: string,
    assignments: ReviewerAssignmentInput[],
    _existingReviewers: ReviewerAssignment[], // no longer used
    reviewers: any[]
  ): Promise<ReviewerAssignment[]> {
    // Validate inputs
    const validationError = this.validateAssignments(assignments, applicationId);
    if (validationError) {
      throw new Error(validationError);
    }

    try {
      // Fetch all reviewers (with code) for mapping
      const reviewersService = ReviewersService.getInstance();
      const allReviewers = await reviewersService.fetchReviewers(false, false);

      // Map assignments to the required format, using reviewer code as doc ID
      const newAssignments = assignments.map(assignment => {
        const reviewer = allReviewers.find(r => r.id === assignment.reviewerId);
        if (!reviewer) {
          throw new Error(`Reviewer not found for ID: ${assignment.reviewerId}`);
        }
        return {
          id: reviewer.id,
          code: reviewer.code,
          name: reviewer.name,
          assignDate: new Date(),
          status: 'Assigned',
          reviewForm: assignment.formType,
        };
      });

      const batch = writeBatch(db);
      const appRef = doc(db, 'protocolReviewApplications', applicationId);
      const primaryReviewersCol = collection(appRef, 'primaryReviewers');

      // Write each reviewer as a document in the subcollection using code as doc ID
      newAssignments.forEach((assignment) => {
        const reviewerDoc = doc(primaryReviewersCol, assignment.code);
        batch.set(reviewerDoc, assignment, { merge: true });
      });

      // Optionally, update application status/progress
      batch.update(appRef, {
        status: 'Under Review',
        progress: 'IR',
        updatedAt: serverTimestamp()
      });

      await batch.commit();
      toast.success('Reviewers assigned successfully');
      return newAssignments;
    } catch (error) {
      console.error('Error assigning reviewers:', error);
      throw new Error('Failed to assign reviewers. Please try again.');
    }
  }

  /**
   * Checks if a reviewer is already assigned to an application
   */
  public isReviewerAssigned(
    reviewerId: string,
    existingReviewers: ReviewerAssignment[]
  ): boolean {
    return existingReviewers.some(reviewer => reviewer.id === reviewerId);
  }

  /**
   * Gets available reviewers that haven't been assigned
   */
  public getAvailableReviewers(
    allReviewers: any[],
    existingReviewers: ReviewerAssignment[]
  ): any[] {
    return allReviewers.filter(
      reviewer => 
        reviewer.isActive && 
        !this.isReviewerAssigned(reviewer.id, existingReviewers)
    );
  }
} 