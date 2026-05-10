import { describe, it, expect } from 'vitest';
import { ScheduleService } from '../../src/services/schedule.js';
import { UserKnowledgeState } from '../../src/models/user-knowledge-state.js';
import type { ScheduleKnowledgeUnit } from '../../src/services/schedule.js';

describe('ScheduleService', () => {
  const scheduler = new ScheduleService();

  function createReview(overrides: Partial<ConstructorParameters<typeof UserKnowledgeState>[0]> = {}): UserKnowledgeState {
    return new UserKnowledgeState({
      userId: 1,
      knowledgeUnitId: 1,
      masteryLevel: 0.3,
      easinessFactor: 2.5,
      intervalDays: 1,
      reviewCount: 1,
      nextReviewDate: '2024-01-01T00:00:00Z',
      ...overrides,
    });
  }

  function createNewItem(id: number, difficulty: number = 1): ScheduleKnowledgeUnit {
    return {
      id,
      knowledgeType: 'letter',
      value: `item_${id}`,
      difficultyLevel: difficulty,
      metadata: {},
    };
  }

  describe('empty inputs', () => {
    it('returns empty lists when no reviews or new items', () => {
      const result = scheduler.generateSchedule({
        dueReviews: [],
        newItems: [],
        maxReviews: 20,
      });
      expect(result.reviews).toHaveLength(0);
      expect(result.newItems).toHaveLength(0);
    });

    it('returns empty lists when maxReviews is 0', () => {
      const result = scheduler.generateSchedule({
        dueReviews: [createReview()],
        newItems: [createNewItem(1)],
        maxReviews: 0,
      });
      expect(result.reviews).toHaveLength(0);
      expect(result.newItems).toHaveLength(0);
    });
  });

  describe('all new, no reviews', () => {
    it('fills all slots with new items', () => {
      const newItems = Array.from({ length: 10 }, (_, i) => createNewItem(i + 1));
      const result = scheduler.generateSchedule({
        dueReviews: [],
        newItems,
        maxReviews: 5,
      });
      expect(result.reviews).toHaveLength(0);
      expect(result.newItems).toHaveLength(5);
    });

    it('respects maxReviews cap', () => {
      const newItems = Array.from({ length: 3 }, (_, i) => createNewItem(i + 1));
      const result = scheduler.generateSchedule({
        dueReviews: [],
        newItems,
        maxReviews: 10,
      });
      expect(result.newItems).toHaveLength(3);
      expect(result.reviews).toHaveLength(0);
    });
  });

  describe('all reviews, no new', () => {
    it('fills all slots with reviews', () => {
      const reviews = Array.from({ length: 10 }, (_, i) =>
        createReview({ knowledgeUnitId: i + 1 }),
      );
      const result = scheduler.generateSchedule({
        dueReviews: reviews,
        newItems: [],
        maxReviews: 5,
      });
      expect(result.reviews).toHaveLength(5);
      expect(result.newItems).toHaveLength(0);
    });
  });

  describe('60/40 split', () => {
    it('allocates ~40% reviews and ~60% new with sufficient items', () => {
      const reviews = Array.from({ length: 20 }, (_, i) =>
        createReview({ knowledgeUnitId: i + 1 }),
      );
      const newItems = Array.from({ length: 20 }, (_, i) => createNewItem(i + 100));

      const result = scheduler.generateSchedule({
        dueReviews: reviews,
        newItems,
        maxReviews: 10,
      });

      // 40% of 10 = 4 reviews, 60% = 6 new
      expect(result.reviews).toHaveLength(4);
      expect(result.newItems).toHaveLength(6);
      expect(result.reviews.length + result.newItems.length).toBe(10);
    });

    it('overflow: not enough new → more reviews', () => {
      const reviews = Array.from({ length: 20 }, (_, i) =>
        createReview({ knowledgeUnitId: i + 1 }),
      );
      const newItems = [createNewItem(100), createNewItem(101)]; // Only 2 new

      const result = scheduler.generateSchedule({
        dueReviews: reviews,
        newItems,
        maxReviews: 10,
      });

      // Target: 4 reviews, 6 new. But only 2 new → 4 remaining go to reviews
      expect(result.newItems).toHaveLength(2);
      expect(result.reviews).toHaveLength(8);
      expect(result.reviews.length + result.newItems.length).toBe(10);
    });

    it('overflow: not enough reviews → more new', () => {
      const reviews = [createReview({ knowledgeUnitId: 1 })]; // Only 1 review
      const newItems = Array.from({ length: 20 }, (_, i) => createNewItem(i + 100));

      const result = scheduler.generateSchedule({
        dueReviews: reviews,
        newItems,
        maxReviews: 10,
      });

      // Target: 4 reviews, 6 new. But only 1 review → 3 remaining go to new
      expect(result.reviews).toHaveLength(1);
      expect(result.newItems).toHaveLength(9);
      expect(result.reviews.length + result.newItems.length).toBe(10);
    });
  });

  describe('sorting', () => {
    it('reviews sorted by most overdue first', () => {
      const reviews = [
        createReview({ knowledgeUnitId: 1, nextReviewDate: '2024-01-03T00:00:00Z' }),
        createReview({ knowledgeUnitId: 2, nextReviewDate: '2024-01-01T00:00:00Z' }),
        createReview({ knowledgeUnitId: 3, nextReviewDate: '2024-01-02T00:00:00Z' }),
      ];

      const result = scheduler.generateSchedule({
        dueReviews: reviews,
        newItems: [],
        maxReviews: 3,
      });

      expect(result.reviews[0].knowledgeUnitId).toBe(2); // Jan 1 (most overdue)
      expect(result.reviews[1].knowledgeUnitId).toBe(3); // Jan 2
      expect(result.reviews[2].knowledgeUnitId).toBe(1); // Jan 3
    });

    it('reviews with same date sorted by lowest mastery', () => {
      const reviews = [
        createReview({ knowledgeUnitId: 1, nextReviewDate: '2024-01-01T00:00:00Z', masteryLevel: 0.5 }),
        createReview({ knowledgeUnitId: 2, nextReviewDate: '2024-01-01T00:00:00Z', masteryLevel: 0.2 }),
        createReview({ knowledgeUnitId: 3, nextReviewDate: '2024-01-01T00:00:00Z', masteryLevel: 0.8 }),
      ];

      const result = scheduler.generateSchedule({
        dueReviews: reviews,
        newItems: [],
        maxReviews: 3,
      });

      expect(result.reviews[0].knowledgeUnitId).toBe(2); // 0.2 mastery
      expect(result.reviews[1].knowledgeUnitId).toBe(1); // 0.5 mastery
      expect(result.reviews[2].knowledgeUnitId).toBe(3); // 0.8 mastery
    });

    it('new items sorted by lowest difficulty first', () => {
      const newItems = [
        createNewItem(1, 3),
        createNewItem(2, 1),
        createNewItem(3, 2),
      ];

      const result = scheduler.generateSchedule({
        dueReviews: [],
        newItems,
        maxReviews: 3,
      });

      expect(result.newItems[0].id).toBe(2); // difficulty 1
      expect(result.newItems[1].id).toBe(3); // difficulty 2
      expect(result.newItems[2].id).toBe(1); // difficulty 3
    });
  });

  describe('maxReviews as hard cap', () => {
    it('never exceeds maxReviews total', () => {
      const reviews = Array.from({ length: 50 }, (_, i) =>
        createReview({ knowledgeUnitId: i + 1 }),
      );
      const newItems = Array.from({ length: 50 }, (_, i) => createNewItem(i + 100));

      const result = scheduler.generateSchedule({
        dueReviews: reviews,
        newItems,
        maxReviews: 15,
      });

      expect(result.reviews.length + result.newItems.length).toBeLessThanOrEqual(15);
    });
  });
});
