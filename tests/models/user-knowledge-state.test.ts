import { describe, it, expect } from 'vitest';
import { UserKnowledgeState } from '../../src/index.js';

describe('UserKnowledgeState', () => {
  it('creates with defaults', () => {
    const state = new UserKnowledgeState({ userId: 1, knowledgeUnitId: 10 });
    expect(state.masteryLevel).toBe(0.0);
    expect(state.easinessFactor).toBe(2.5);
    expect(state.intervalDays).toBe(1);
    expect(state.reviewCount).toBe(0);
    expect(state.lastPracticed).toBeNull();
    expect(state.nextReviewDate).toBeNull();
  });

  describe('isDueForReview', () => {
    it('returns true when nextReviewDate is null', () => {
      const state = new UserKnowledgeState({ userId: 1, knowledgeUnitId: 1 });
      expect(state.isDueForReview()).toBe(true);
    });

    it('returns true when nextReviewDate is in the past', () => {
      const state = new UserKnowledgeState({
        userId: 1,
        knowledgeUnitId: 1,
        nextReviewDate: '2020-01-01T00:00:00Z',
      });
      expect(state.isDueForReview()).toBe(true);
    });

    it('returns false when nextReviewDate is in the future', () => {
      const future = new Date(Date.now() + 86400000).toISOString();
      const state = new UserKnowledgeState({
        userId: 1,
        knowledgeUnitId: 1,
        nextReviewDate: future,
      });
      expect(state.isDueForReview()).toBe(false);
    });
  });

  describe('isMastered', () => {
    it('returns true at default threshold 0.8', () => {
      const state = new UserKnowledgeState({ userId: 1, knowledgeUnitId: 1, masteryLevel: 0.8 });
      expect(state.isMastered()).toBe(true);
    });

    it('returns false below threshold', () => {
      const state = new UserKnowledgeState({ userId: 1, knowledgeUnitId: 1, masteryLevel: 0.79 });
      expect(state.isMastered()).toBe(false);
    });

    it('respects custom threshold', () => {
      const state = new UserKnowledgeState({ userId: 1, knowledgeUnitId: 1, masteryLevel: 0.5 });
      expect(state.isMastered(0.5)).toBe(true);
      expect(state.isMastered(0.6)).toBe(false);
    });
  });

  describe('getStrengthIndicator', () => {
    it('returns weak for < 0.3', () => {
      expect(new UserKnowledgeState({ userId: 1, knowledgeUnitId: 1, masteryLevel: 0.0 }).getStrengthIndicator()).toBe('weak');
      expect(new UserKnowledgeState({ userId: 1, knowledgeUnitId: 1, masteryLevel: 0.29 }).getStrengthIndicator()).toBe('weak');
    });

    it('returns learning for 0.3-0.59', () => {
      expect(new UserKnowledgeState({ userId: 1, knowledgeUnitId: 1, masteryLevel: 0.3 }).getStrengthIndicator()).toBe('learning');
      expect(new UserKnowledgeState({ userId: 1, knowledgeUnitId: 1, masteryLevel: 0.59 }).getStrengthIndicator()).toBe('learning');
    });

    it('returns familiar for 0.6-0.79', () => {
      expect(new UserKnowledgeState({ userId: 1, knowledgeUnitId: 1, masteryLevel: 0.6 }).getStrengthIndicator()).toBe('familiar');
      expect(new UserKnowledgeState({ userId: 1, knowledgeUnitId: 1, masteryLevel: 0.79 }).getStrengthIndicator()).toBe('familiar');
    });

    it('returns mastered for >= 0.8', () => {
      expect(new UserKnowledgeState({ userId: 1, knowledgeUnitId: 1, masteryLevel: 0.8 }).getStrengthIndicator()).toBe('mastered');
      expect(new UserKnowledgeState({ userId: 1, knowledgeUnitId: 1, masteryLevel: 1.0 }).getStrengthIndicator()).toBe('mastered');
    });
  });
});
