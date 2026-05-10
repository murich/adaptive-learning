import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  UserProgressService,
  UserResponse,
  KnowledgeType,
} from '../../src/index.js';
import type { IUserProgressRepository, IUserResponseRepository, ICacheClient } from '../../src/index.js';

function mockProgressRepo(): IUserProgressRepository {
  const states = new Map<string, {
    user_id: number;
    knowledge_unit_id: number;
    mastery_level: number;
    easiness_factor: number;
    interval_days: number;
    review_count: number;
    last_practiced: string | null;
    next_review_date: string | null;
  }>();

  return {
    getState: vi.fn(async (userId, knowledgeUnitId) => {
      return states.get(`${userId}:${knowledgeUnitId}`) ?? null;
    }),
    upsertState: vi.fn(async (state) => {
      states.set(`${state.userId}:${state.knowledgeUnitId}`, {
        user_id: state.userId,
        knowledge_unit_id: state.knowledgeUnitId,
        mastery_level: state.masteryLevel,
        easiness_factor: state.easinessFactor,
        interval_days: state.intervalDays,
        review_count: state.reviewCount,
        last_practiced: state.lastPracticed,
        next_review_date: state.nextReviewDate,
      });
    }),
    getDueReviews: vi.fn(async () => []),
    getWeakAreas: vi.fn(async (userId, threshold) => {
      return [...states.values()]
        .filter((s) => s.user_id === userId && s.mastery_level < threshold && !(s.mastery_level === 0 && s.review_count === 0))
        .sort((a, b) => a.mastery_level - b.mastery_level);
    }),
    getMasteryOverview: vi.fn(async () => ({
      totalUnits: 33,
      mastered: 0,
      inProgress: 0,
      notStarted: 33,
      avgMastery: 0,
      masteryByDifficulty: {},
    })),
  };
}

function mockResponseRepo(): IUserResponseRepository {
  return {
    insert: vi.fn(async () => 1),
  };
}

function mockCache(): ICacheClient {
  return {
    get: vi.fn(async () => null),
    set: vi.fn(async () => {}),
    delete: vi.fn(async () => {}),
    deleteByPrefix: vi.fn(async () => {}),
  };
}

describe('UserProgressService', () => {
  let progressRepo: IUserProgressRepository;
  let responseRepo: IUserResponseRepository;
  let cache: ICacheClient;
  let service: UserProgressService;

  beforeEach(() => {
    progressRepo = mockProgressRepo();
    responseRepo = mockResponseRepo();
    cache = mockCache();
    service = new UserProgressService(progressRepo, responseRepo, cache);
  });

  describe('recordResponse', () => {
    it('creates state on first response', async () => {
      const response = new UserResponse({
        userId: 1,
        knowledgeUnitId: 10,
        gameType: 'test',
        isCorrect: true,
        responseTimeMs: 1000,
      });

      await service.recordResponse(response);

      expect(responseRepo.insert).toHaveBeenCalledOnce();
      expect(progressRepo.upsertState).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          knowledgeUnitId: 10,
          masteryLevel: 0.1,
          reviewCount: 1,
        }),
      );
    });

    it('increases mastery by 0.1 on correct', async () => {
      // Set up existing state at 0.5
      vi.mocked(progressRepo.getState).mockResolvedValueOnce({
        user_id: 1,
        knowledge_unit_id: 10,
        mastery_level: 0.5,
        easiness_factor: 2.5,
        interval_days: 1,
        review_count: 5,
        last_practiced: null,
        next_review_date: null,
      });

      await service.recordResponse(
        new UserResponse({
          userId: 1,
          knowledgeUnitId: 10,
          gameType: 'test',
          isCorrect: true,
          responseTimeMs: 1000,
        }),
      );

      expect(progressRepo.upsertState).toHaveBeenCalledWith(
        expect.objectContaining({
          masteryLevel: 0.6,
          reviewCount: 6,
        }),
      );
    });

    it('decreases mastery by 0.05 on incorrect', async () => {
      vi.mocked(progressRepo.getState).mockResolvedValueOnce({
        user_id: 1,
        knowledge_unit_id: 10,
        mastery_level: 0.5,
        easiness_factor: 2.5,
        interval_days: 1,
        review_count: 5,
        last_practiced: null,
        next_review_date: null,
      });

      await service.recordResponse(
        new UserResponse({
          userId: 1,
          knowledgeUnitId: 10,
          gameType: 'test',
          isCorrect: false,
          responseTimeMs: 1000,
        }),
      );

      expect(progressRepo.upsertState).toHaveBeenCalledWith(
        expect.objectContaining({
          masteryLevel: 0.45,
        }),
      );
    });

    it('caps mastery at 1.0', async () => {
      vi.mocked(progressRepo.getState).mockResolvedValueOnce({
        user_id: 1,
        knowledge_unit_id: 10,
        mastery_level: 0.95,
        easiness_factor: 2.5,
        interval_days: 1,
        review_count: 9,
        last_practiced: null,
        next_review_date: null,
      });

      await service.recordResponse(
        new UserResponse({
          userId: 1,
          knowledgeUnitId: 10,
          gameType: 'test',
          isCorrect: true,
          responseTimeMs: 1000,
        }),
      );

      expect(progressRepo.upsertState).toHaveBeenCalledWith(
        expect.objectContaining({
          masteryLevel: 1.0,
        }),
      );
    });

    it('floors mastery at 0.0', async () => {
      vi.mocked(progressRepo.getState).mockResolvedValueOnce({
        user_id: 1,
        knowledge_unit_id: 10,
        mastery_level: 0.02,
        easiness_factor: 2.5,
        interval_days: 1,
        review_count: 1,
        last_practiced: null,
        next_review_date: null,
      });

      await service.recordResponse(
        new UserResponse({
          userId: 1,
          knowledgeUnitId: 10,
          gameType: 'test',
          isCorrect: false,
          responseTimeMs: 1000,
        }),
      );

      expect(progressRepo.upsertState).toHaveBeenCalledWith(
        expect.objectContaining({
          masteryLevel: 0.0,
        }),
      );
    });

    it('invalidates cache after recording', async () => {
      await service.recordResponse(
        new UserResponse({
          userId: 1,
          knowledgeUnitId: 10,
          gameType: 'test',
          isCorrect: true,
          responseTimeMs: 1000,
        }),
      );

      expect(cache.delete).toHaveBeenCalledWith('lp:user:1:state:10');
      expect(cache.delete).toHaveBeenCalledWith('lp:user:1:due_reviews');
    });
  });

  describe('getUserState', () => {
    it('returns null for non-existent state', async () => {
      const state = await service.getUserState(1, 999);
      expect(state).toBeNull();
    });

    it('returns hydrated state', async () => {
      vi.mocked(progressRepo.getState).mockResolvedValueOnce({
        user_id: 1,
        knowledge_unit_id: 10,
        mastery_level: 0.5,
        easiness_factor: 2.5,
        interval_days: 3,
        review_count: 5,
        last_practiced: '2024-01-01',
        next_review_date: null,
      });

      const state = await service.getUserState(1, 10);
      expect(state).not.toBeNull();
      expect(state!.masteryLevel).toBe(0.5);
      expect(state!.reviewCount).toBe(5);
      expect(state!.getStrengthIndicator()).toBe('learning');
    });
  });

  describe('mastery progression', () => {
    it('5 correct responses raise mastery from 0.0 to 0.5', async () => {
      for (let i = 0; i < 5; i++) {
        await service.recordResponse(
          new UserResponse({
            userId: 1,
            knowledgeUnitId: 10,
            gameType: 'test',
            isCorrect: true,
            responseTimeMs: 1000,
          }),
        );
      }

      // After 5 correct, upsertState should have been called with 0.5 on the 5th call
      const calls = vi.mocked(progressRepo.upsertState).mock.calls;
      expect(calls[4][0].masteryLevel).toBeCloseTo(0.5, 1);
    });

    it('10 correct responses raise mastery to 1.0', async () => {
      for (let i = 0; i < 10; i++) {
        await service.recordResponse(
          new UserResponse({
            userId: 1,
            knowledgeUnitId: 10,
            gameType: 'test',
            isCorrect: true,
            responseTimeMs: 1000,
          }),
        );
      }

      const calls = vi.mocked(progressRepo.upsertState).mock.calls;
      expect(calls[9][0].masteryLevel).toBeCloseTo(1.0, 1);
    });
  });
});
