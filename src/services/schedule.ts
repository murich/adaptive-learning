import { UserKnowledgeState } from '../models/user-knowledge-state.js';

/**
 * Minimal knowledge unit shape needed for scheduling new items.
 */
export interface ScheduleKnowledgeUnit {
  id: number;
  knowledgeType: string;
  value: string;
  difficultyLevel: number;
  metadata: Record<string, unknown>;
}

export interface ScheduleParams {
  dueReviews: UserKnowledgeState[];
  newItems: ScheduleKnowledgeUnit[];
  maxReviews: number;
}

export interface ScheduleResult {
  reviews: UserKnowledgeState[];
  newItems: ScheduleKnowledgeUnit[];
}

/**
 * Pure scheduling logic for generating optimal review sessions.
 * Implements a 60/40 split: 60% new material, 40% reviews.
 * Handles edge cases when one pool is insufficient.
 */
export class ScheduleService {
  /**
   * Generate an optimal study schedule from due reviews and new items.
   *
   * Split strategy:
   * - 40% of maxReviews slots go to overdue reviews (sorted: most overdue first, then lowest mastery)
   * - 60% of maxReviews slots go to new material (sorted: lowest difficulty first)
   * - If one pool is insufficient, the other fills remaining slots
   *
   * @param params - Due reviews, new items, and max session size
   * @returns Scheduled reviews and new items for the session
   */
  generateSchedule(params: ScheduleParams): ScheduleResult {
    const { dueReviews, newItems, maxReviews } = params;

    if (maxReviews <= 0) {
      return { reviews: [], newItems: [] };
    }

    // Target slots: 40% reviews, 60% new
    const targetReviewSlots = Math.round(maxReviews * 0.4);
    const targetNewSlots = maxReviews - targetReviewSlots;

    // Sort reviews: most overdue first (earliest next_review_date), then lowest mastery
    const sortedReviews = [...dueReviews].sort((a, b) => {
      const dateA = a.nextReviewDate ? new Date(a.nextReviewDate).getTime() : 0;
      const dateB = b.nextReviewDate ? new Date(b.nextReviewDate).getTime() : 0;
      if (dateA !== dateB) return dateA - dateB;
      return a.masteryLevel - b.masteryLevel;
    });

    // Sort new items: lowest difficulty first, then by value for stability
    const sortedNew = [...newItems].sort((a, b) => {
      if (a.difficultyLevel !== b.difficultyLevel) return a.difficultyLevel - b.difficultyLevel;
      return a.value.localeCompare(b.value);
    });

    // Allocate slots with overflow handling
    let reviewCount = Math.min(targetReviewSlots, sortedReviews.length);
    let newCount = Math.min(targetNewSlots, sortedNew.length);

    // Fill remaining slots from the other pool
    const remainingSlots = maxReviews - reviewCount - newCount;
    if (remainingSlots > 0) {
      const additionalReviews = Math.min(remainingSlots, sortedReviews.length - reviewCount);
      reviewCount += additionalReviews;
      const stillRemaining = remainingSlots - additionalReviews;
      if (stillRemaining > 0) {
        newCount += Math.min(stillRemaining, sortedNew.length - newCount);
      }
    }

    return {
      reviews: sortedReviews.slice(0, reviewCount),
      newItems: sortedNew.slice(0, newCount),
    };
  }
}
