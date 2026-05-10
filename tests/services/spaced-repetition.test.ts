import { describe, it, expect } from 'vitest';
import { SpacedRepetitionService } from '../../src/services/spaced-repetition.js';
import { UserKnowledgeState } from '../../src/models/user-knowledge-state.js';

describe('SpacedRepetitionService', () => {
  const sm2 = new SpacedRepetitionService();

  function createState(overrides: Partial<ConstructorParameters<typeof UserKnowledgeState>[0]> = {}) {
    return new UserKnowledgeState({
      userId: 1,
      knowledgeUnitId: 1,
      masteryLevel: 0.5,
      easinessFactor: 2.5,
      intervalDays: 1,
      reviewCount: 0,
      ...overrides,
    });
  }

  describe('quality validation', () => {
    it('throws for quality < 0', () => {
      const state = createState();
      expect(() => sm2.calculateNextReview(state, -1)).toThrow('Quality must be an integer between 0 and 5');
    });

    it('throws for quality > 5', () => {
      const state = createState();
      expect(() => sm2.calculateNextReview(state, 6)).toThrow('Quality must be an integer between 0 and 5');
    });

    it('throws for non-integer quality', () => {
      const state = createState();
      expect(() => sm2.calculateNextReview(state, 3.5)).toThrow('Quality must be an integer between 0 and 5');
    });
  });

  describe('first review (reviewCount = 0)', () => {
    it('sets interval to 1 on quality >= 3', () => {
      const state = createState({ reviewCount: 0 });
      const result = sm2.calculateNextReview(state, 4);
      expect(result.intervalDays).toBe(1);
      expect(result.reviewCount).toBe(1);
    });

    it('sets interval to 1 on quality < 3 (reset)', () => {
      const state = createState({ reviewCount: 0 });
      const result = sm2.calculateNextReview(state, 2);
      expect(result.intervalDays).toBe(1);
      // reviewCount does NOT increment on failure
      expect(result.reviewCount).toBe(0);
    });
  });

  describe('second review (reviewCount = 1)', () => {
    it('sets interval to 6 on quality >= 3', () => {
      const state = createState({ reviewCount: 1, intervalDays: 1 });
      const result = sm2.calculateNextReview(state, 4);
      expect(result.intervalDays).toBe(6);
      expect(result.reviewCount).toBe(2);
    });

    it('resets interval to 1 on quality < 3', () => {
      const state = createState({ reviewCount: 1, intervalDays: 6 });
      const result = sm2.calculateNextReview(state, 1);
      expect(result.intervalDays).toBe(1);
      expect(result.reviewCount).toBe(1); // not incremented
    });
  });

  describe('subsequent reviews (reviewCount >= 2)', () => {
    it('multiplies interval by EF on quality >= 3', () => {
      const state = createState({ reviewCount: 2, intervalDays: 6, easinessFactor: 2.5 });
      const result = sm2.calculateNextReview(state, 4);
      // EF after quality=4: 2.5 + (0.1 - 1*(0.08 + 1*0.02)) = 2.5 + 0.0 = 2.5
      // New interval: round(6 * 2.5) = 15
      expect(result.intervalDays).toBe(15);
      expect(result.reviewCount).toBe(3);
    });

    it('resets to 1 on quality < 3 regardless of previous interval', () => {
      const state = createState({ reviewCount: 5, intervalDays: 90, easinessFactor: 2.5 });
      const result = sm2.calculateNextReview(state, 2);
      expect(result.intervalDays).toBe(1);
      expect(result.reviewCount).toBe(5); // not incremented
    });
  });

  describe('easiness factor updates', () => {
    it('EF stays at 2.5 for quality=4', () => {
      const state = createState({ easinessFactor: 2.5 });
      const result = sm2.calculateNextReview(state, 4);
      // EF = 2.5 + (0.1 - 1*(0.08 + 1*0.02)) = 2.5 + 0.0 = 2.5
      expect(result.easinessFactor).toBeCloseTo(2.5, 2);
    });

    it('EF increases for quality=5', () => {
      const state = createState({ easinessFactor: 2.5 });
      const result = sm2.calculateNextReview(state, 5);
      // EF = 2.5 + (0.1 - 0*(0.08 + 0*0.02)) = 2.5 + 0.1 = 2.6
      expect(result.easinessFactor).toBeCloseTo(2.6, 2);
    });

    it('EF decreases for quality=3', () => {
      const state = createState({ easinessFactor: 2.5 });
      const result = sm2.calculateNextReview(state, 3);
      // EF = 2.5 + (0.1 - 2*(0.08 + 2*0.02)) = 2.5 + (0.1 - 2*0.12) = 2.5 - 0.14 = 2.36
      expect(result.easinessFactor).toBeCloseTo(2.36, 2);
    });

    it('EF never falls below 1.3', () => {
      const state = createState({ easinessFactor: 1.3 });
      const result = sm2.calculateNextReview(state, 0);
      expect(result.easinessFactor).toBe(1.3);
    });

    it('10 consecutive quality=0 never drops EF below 1.3', () => {
      let state = createState({ easinessFactor: 2.5 });
      for (let i = 0; i < 10; i++) {
        state = sm2.calculateNextReview(state, 0);
      }
      expect(state.easinessFactor).toBeGreaterThanOrEqual(1.3);
    });
  });

  describe('interval progression with quality=5', () => {
    it('produces growing intervals over 5 reviews', () => {
      let state = createState({ reviewCount: 0, intervalDays: 1, easinessFactor: 2.5 });

      // Review 1: reviewCount=0, q=5 → EF=2.6, interval=1 (first review rule)
      state = sm2.calculateNextReview(state, 5);
      expect(state.intervalDays).toBe(1);
      expect(state.reviewCount).toBe(1);
      expect(state.easinessFactor).toBeCloseTo(2.6, 2);

      // Review 2: reviewCount=1, q=5 → EF=2.7, interval=6 (second review rule)
      state = sm2.calculateNextReview(state, 5);
      expect(state.intervalDays).toBe(6);
      expect(state.reviewCount).toBe(2);
      expect(state.easinessFactor).toBeCloseTo(2.7, 2);

      // Review 3: reviewCount=2, q=5 → EF=2.8, interval=round(6 * 2.8) = 17
      state = sm2.calculateNextReview(state, 5);
      expect(state.intervalDays).toBe(17);
      expect(state.reviewCount).toBe(3);
      expect(state.easinessFactor).toBeCloseTo(2.8, 2);

      // Review 4: reviewCount=3, q=5 → EF=2.9, interval=round(17 * 2.9) = 49
      state = sm2.calculateNextReview(state, 5);
      expect(state.intervalDays).toBe(49);
      expect(state.reviewCount).toBe(4);
      expect(state.easinessFactor).toBeCloseTo(2.9, 2);

      // Review 5: reviewCount=4, q=5 → EF=3.0, interval=round(49 * 3.0) = 147
      state = sm2.calculateNextReview(state, 5);
      expect(state.intervalDays).toBe(147);
      expect(state.reviewCount).toBe(5);
      expect(state.easinessFactor).toBeCloseTo(3.0, 2);
    });
  });

  describe('recovery after failure', () => {
    it('quality=2 then quality=5 recovers with reduced EF', () => {
      let state = createState({ reviewCount: 3, intervalDays: 15, easinessFactor: 2.5 });

      // Fail with quality=2
      state = sm2.calculateNextReview(state, 2);
      expect(state.intervalDays).toBe(1);
      expect(state.reviewCount).toBe(3); // not incremented on failure
      // EF = 2.5 + (0.1 - 3*(0.08 + 3*0.02)) = 2.5 - 0.32 = 2.18
      expect(state.easinessFactor).toBeCloseTo(2.18, 2);

      // Recover with quality=5
      // EF = 2.18 + 0.1 = 2.28
      // reviewCount=3 (>=2), interval = round(1 * 2.28) = 2
      state = sm2.calculateNextReview(state, 5);
      expect(state.intervalDays).toBe(2);
      expect(state.reviewCount).toBe(4);
      expect(state.easinessFactor).toBeCloseTo(2.28, 2);
    });
  });

  describe('immutability', () => {
    it('does not modify the input state', () => {
      const state = createState({ reviewCount: 2, intervalDays: 6 });
      const originalEF = state.easinessFactor;
      const originalInterval = state.intervalDays;

      sm2.calculateNextReview(state, 5);

      expect(state.easinessFactor).toBe(originalEF);
      expect(state.intervalDays).toBe(originalInterval);
    });
  });

  describe('nextReviewDate', () => {
    it('sets nextReviewDate to today + intervalDays', () => {
      const state = createState({ reviewCount: 1 });
      const before = new Date();
      const result = sm2.calculateNextReview(state, 4);
      const after = new Date();

      // interval = 6 for second review with q>=3
      const nextReview = new Date(result.nextReviewDate!);
      const expectedMin = new Date(before);
      expectedMin.setDate(expectedMin.getDate() + 6);
      const expectedMax = new Date(after);
      expectedMax.setDate(expectedMax.getDate() + 6);

      expect(nextReview.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime() - 1000);
      expect(nextReview.getTime()).toBeLessThanOrEqual(expectedMax.getTime() + 1000);
    });

    it('sets lastPracticed to current time', () => {
      const state = createState();
      const before = Date.now();
      const result = sm2.calculateNextReview(state, 3);
      const after = Date.now();

      const practiced = new Date(result.lastPracticed!).getTime();
      expect(practiced).toBeGreaterThanOrEqual(before - 1000);
      expect(practiced).toBeLessThanOrEqual(after + 1000);
    });
  });

  describe('mastery level preservation', () => {
    it('preserves the mastery level from input state', () => {
      const state = createState({ masteryLevel: 0.7 });
      const result = sm2.calculateNextReview(state, 4);
      expect(result.masteryLevel).toBe(0.7);
    });
  });
});
