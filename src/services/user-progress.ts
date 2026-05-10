import { KnowledgeType } from '../models/enums.js';
import { UserKnowledgeState } from '../models/user-knowledge-state.js';
import { UserResponse } from '../models/user-response.js';
import {
  IUserProgressRepository,
  IUserResponseRepository,
  ICacheClient,
} from '../interfaces/index.js';
import { IUserProgressService, MasteryOverview } from './interfaces.js';
import { SpacedRepetitionService } from './spaced-repetition.js';

/**
 * Records user responses, updates mastery levels, and provides analytics.
 */
export class UserProgressService implements IUserProgressService {
  constructor(
    private readonly progressRepo: IUserProgressRepository,
    private readonly responseRepo: IUserResponseRepository,
    private readonly cache?: ICacheClient,
  ) {}

  async recordResponse(response: UserResponse): Promise<void> {
    // Insert the response record
    await this.responseRepo.insert({
      userId: response.userId,
      knowledgeUnitId: response.knowledgeUnitId,
      gameType: response.gameType,
      isCorrect: response.isCorrect,
      responseTimeMs: response.responseTimeMs,
      hintsUsed: response.hintsUsed,
      qualityScore: response.qualityScore,
      contextMetadata: JSON.stringify(response.contextMetadata),
    });

    // Get or create user knowledge state
    const existing = await this.progressRepo.getState(
      response.userId,
      response.knowledgeUnitId,
    );

    let currentMastery = existing
      ? existing.mastery_level
      : 0.0;

    // Update mastery: +0.1 correct, -0.05 incorrect
    if (response.isCorrect) {
      currentMastery = Math.min(1.0, currentMastery + 0.1);
    } else {
      currentMastery = Math.max(0.0, currentMastery - 0.05);
    }

    // Build current state for SM-2 calculation
    const currentState = new UserKnowledgeState({
      userId: response.userId,
      knowledgeUnitId: response.knowledgeUnitId,
      masteryLevel: currentMastery,
      easinessFactor: existing ? existing.easiness_factor : 2.5,
      intervalDays: existing ? existing.interval_days : 1,
      reviewCount: existing ? existing.review_count : 0,
      lastPracticed: existing ? existing.last_practiced : null,
      nextReviewDate: existing ? existing.next_review_date : null,
    });

    // Apply SM-2 algorithm for scheduling
    const sm2 = new SpacedRepetitionService();
    const updatedState = sm2.calculateNextReview(currentState, response.qualityScore);

    // Persist with SM-2 scheduling + mastery level
    await this.progressRepo.upsertState({
      userId: response.userId,
      knowledgeUnitId: response.knowledgeUnitId,
      masteryLevel: currentMastery,
      easinessFactor: updatedState.easinessFactor,
      intervalDays: updatedState.intervalDays,
      reviewCount: updatedState.reviewCount,
      lastPracticed: updatedState.lastPracticed,
      nextReviewDate: updatedState.nextReviewDate,
    });

    // Invalidate cache
    if (this.cache) {
      await Promise.all([
        this.cache.delete(
          `lp:user:${response.userId}:state:${response.knowledgeUnitId}`,
        ),
        this.cache.delete(`lp:user:${response.userId}:due_reviews`),
      ]).catch(() => {});
    }
  }

  async getUserState(
    userId: number,
    knowledgeId: number,
  ): Promise<UserKnowledgeState | null> {
    const cacheKey = `lp:user:${userId}:state:${knowledgeId}`;

    if (this.cache) {
      const cached = await this.cache.get<string>(cacheKey).catch(() => null);
      if (cached) {
        const row = JSON.parse(cached);
        return this.hydrateState(row);
      }
    }

    const row = await this.progressRepo.getState(userId, knowledgeId);
    if (!row) return null;

    if (this.cache) {
      await this.cache.set(cacheKey, JSON.stringify(row), 600).catch(() => {});
    }

    return this.hydrateState(row);
  }

  async getDueReviews(
    userId: number,
    knowledgeType?: KnowledgeType,
  ): Promise<UserKnowledgeState[]> {
    const cacheKey = `lp:user:${userId}:due_reviews`;

    if (this.cache && !knowledgeType) {
      const cached = await this.cache.get<string>(cacheKey).catch(() => null);
      if (cached) {
        const rows = JSON.parse(cached);
        return rows.map((row: ReturnType<typeof this.stateRowType>) => this.hydrateState(row));
      }
    }

    const rows = await this.progressRepo.getDueReviews(userId, knowledgeType);

    if (this.cache && !knowledgeType) {
      await this.cache.set(cacheKey, JSON.stringify(rows), 300).catch(() => {});
    }

    return rows.map((row) => this.hydrateState(row));
  }

  async getWeakAreas(
    userId: number,
    threshold = 0.5,
    limit = 10,
  ): Promise<UserKnowledgeState[]> {
    const rows = await this.progressRepo.getWeakAreas(userId, threshold, limit);
    return rows.map((row) => this.hydrateState(row));
  }

  async getMasteryOverview(
    userId: number,
    knowledgeType: KnowledgeType,
  ): Promise<MasteryOverview> {
    return this.progressRepo.getMasteryOverview(userId, knowledgeType);
  }

  async checkStageProgression(userId: number): Promise<string | null> {
    // Basic implementation: check if all letters are mastered
    const letterOverview = await this.progressRepo.getMasteryOverview(
      userId,
      KnowledgeType.LETTER,
    );

    if (letterOverview.totalUnits > 0 && letterOverview.mastered === letterOverview.totalUnits) {
      // All letters mastered — check syllables
      const syllableOverview = await this.progressRepo.getMasteryOverview(
        userId,
        KnowledgeType.SYLLABLE,
      );
      if (syllableOverview.totalUnits > 0 && syllableOverview.mastered === syllableOverview.totalUnits) {
        return 'words';
      }
      return 'syllables';
    }

    return null;
  }

  private hydrateState(row: {
    user_id: number;
    knowledge_unit_id: number;
    mastery_level: number;
    easiness_factor: number;
    interval_days: number;
    review_count: number;
    last_practiced: string | null;
    next_review_date: string | null;
  }): UserKnowledgeState {
    return new UserKnowledgeState({
      userId: row.user_id,
      knowledgeUnitId: row.knowledge_unit_id,
      masteryLevel: row.mastery_level,
      easinessFactor: row.easiness_factor,
      intervalDays: row.interval_days,
      reviewCount: row.review_count,
      lastPracticed: row.last_practiced,
      nextReviewDate: row.next_review_date,
    });
  }

  /** Type helper for row shape (used for type inference in map callbacks) */
  private stateRowType() {
    return null as unknown as {
      user_id: number;
      knowledge_unit_id: number;
      mastery_level: number;
      easiness_factor: number;
      interval_days: number;
      review_count: number;
      last_practiced: string | null;
      next_review_date: string | null;
    };
  }
}
