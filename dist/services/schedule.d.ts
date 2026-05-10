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
export declare class ScheduleService {
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
    generateSchedule(params: ScheduleParams): ScheduleResult;
}
//# sourceMappingURL=schedule.d.ts.map