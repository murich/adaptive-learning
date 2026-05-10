/**
 * Tracks a user's mastery of a specific knowledge unit.
 * Includes spaced repetition scheduling fields for future milestones.
 */
export declare class UserKnowledgeState {
    userId: number;
    knowledgeUnitId: number;
    masteryLevel: number;
    easinessFactor: number;
    intervalDays: number;
    reviewCount: number;
    lastPracticed: string | null;
    nextReviewDate: string | null;
    constructor(params: {
        userId: number;
        knowledgeUnitId: number;
        masteryLevel?: number;
        easinessFactor?: number;
        intervalDays?: number;
        reviewCount?: number;
        lastPracticed?: string | null;
        nextReviewDate?: string | null;
    });
    /** True if this unit is due for review (null nextReviewDate or past/today) */
    isDueForReview(): boolean;
    /** True if mastery meets or exceeds the threshold */
    isMastered(threshold?: number): boolean;
    /** Categorize current mastery into a human-readable strength indicator */
    getStrengthIndicator(): 'weak' | 'learning' | 'familiar' | 'mastered';
}
//# sourceMappingURL=user-knowledge-state.d.ts.map