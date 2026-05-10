import { UserKnowledgeState } from '../models/user-knowledge-state.js';
/**
 * Pure, stateless SM-2 spaced repetition algorithm service.
 * Calculates optimal review intervals based on user performance quality.
 */
export declare class SpacedRepetitionService {
    /**
     * Calculate the next review state using the SM-2 algorithm.
     * Returns a NEW UserKnowledgeState (immutable — does not modify the input).
     *
     * @param state - Current knowledge state
     * @param quality - Response quality score (0-5)
     * @returns New state with updated EF, interval, reviewCount, and nextReviewDate
     */
    calculateNextReview(state: UserKnowledgeState, quality: number): UserKnowledgeState;
}
//# sourceMappingURL=spaced-repetition.d.ts.map