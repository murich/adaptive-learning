import { UserKnowledgeState } from '../models/user-knowledge-state.js';

/**
 * Pure, stateless SM-2 spaced repetition algorithm service.
 * Calculates optimal review intervals based on user performance quality.
 */
export class SpacedRepetitionService {
  /**
   * Calculate the next review state using the SM-2 algorithm.
   * Returns a NEW UserKnowledgeState (immutable — does not modify the input).
   *
   * @param state - Current knowledge state
   * @param quality - Response quality score (0-5)
   * @returns New state with updated EF, interval, reviewCount, and nextReviewDate
   */
  calculateNextReview(state: UserKnowledgeState, quality: number): UserKnowledgeState {
    if (quality < 0 || quality > 5 || !Number.isInteger(quality)) {
      throw new Error(`Quality must be an integer between 0 and 5, got: ${quality}`);
    }

    // Step 1: Update easiness factor
    const ef = Math.max(
      1.3,
      state.easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
    );

    // Step 2: Calculate interval
    let interval: number;
    if (quality < 3) {
      // Failed recall — reset interval
      interval = 1;
    } else if (state.reviewCount === 0) {
      // First successful review
      interval = 1;
    } else if (state.reviewCount === 1) {
      // Second successful review
      interval = 6;
    } else {
      // Subsequent reviews — multiply previous interval by EF
      interval = Math.round(state.intervalDays * ef);
    }

    // Step 3: Calculate next review date
    const now = new Date();
    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + interval);

    // Step 4: Return new immutable state
    return new UserKnowledgeState({
      userId: state.userId,
      knowledgeUnitId: state.knowledgeUnitId,
      masteryLevel: state.masteryLevel,
      easinessFactor: ef,
      intervalDays: interval,
      reviewCount: quality < 3 ? state.reviewCount : state.reviewCount + 1,
      lastPracticed: now.toISOString(),
      nextReviewDate: nextReview.toISOString(),
    });
  }
}
