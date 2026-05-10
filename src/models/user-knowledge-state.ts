/**
 * Tracks a user's mastery of a specific knowledge unit.
 * Includes spaced repetition scheduling fields for future milestones.
 */
export class UserKnowledgeState {
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
  }) {
    this.userId = params.userId;
    this.knowledgeUnitId = params.knowledgeUnitId;
    this.masteryLevel = params.masteryLevel ?? 0.0;
    this.easinessFactor = params.easinessFactor ?? 2.5;
    this.intervalDays = params.intervalDays ?? 1;
    this.reviewCount = params.reviewCount ?? 0;
    this.lastPracticed = params.lastPracticed ?? null;
    this.nextReviewDate = params.nextReviewDate ?? null;
  }

  /** True if this unit is due for review (null nextReviewDate or past/today) */
  isDueForReview(): boolean {
    if (this.nextReviewDate === null) return true;
    const now = new Date();
    const reviewDate = new Date(this.nextReviewDate);
    return reviewDate <= now;
  }

  /** True if mastery meets or exceeds the threshold */
  isMastered(threshold = 0.8): boolean {
    return this.masteryLevel >= threshold;
  }

  /** Categorize current mastery into a human-readable strength indicator */
  getStrengthIndicator(): 'weak' | 'learning' | 'familiar' | 'mastered' {
    if (this.masteryLevel < 0.3) return 'weak';
    if (this.masteryLevel < 0.6) return 'learning';
    if (this.masteryLevel < 0.8) return 'familiar';
    return 'mastered';
  }
}
