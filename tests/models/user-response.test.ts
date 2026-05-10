import { describe, it, expect } from 'vitest';
import { UserResponse } from '../../src/index.js';

describe('UserResponse', () => {
  it('creates with required params', () => {
    const response = new UserResponse({
      userId: 1,
      knowledgeUnitId: 10,
      gameType: 'абракадабра',
      isCorrect: true,
      responseTimeMs: 2000,
    });
    expect(response.userId).toBe(1);
    expect(response.knowledgeUnitId).toBe(10);
    expect(response.isCorrect).toBe(true);
    expect(response.hintsUsed).toBe(0);
    expect(response.timestamp).toBeTruthy();
  });

  describe('calculateQualityScore', () => {
    it('returns 0 for incorrect with no hints', () => {
      const response = new UserResponse({
        userId: 1,
        knowledgeUnitId: 1,
        gameType: 'test',
        isCorrect: false,
        responseTimeMs: 1000,
        hintsUsed: 0,
      });
      expect(response.calculateQualityScore()).toBe(0);
    });

    it('returns 1 for incorrect with hints', () => {
      const response = new UserResponse({
        userId: 1,
        knowledgeUnitId: 1,
        gameType: 'test',
        isCorrect: false,
        responseTimeMs: 1000,
        hintsUsed: 2,
      });
      expect(response.calculateQualityScore()).toBe(1);
    });

    it('returns 5 for correct with no hints', () => {
      const response = new UserResponse({
        userId: 1,
        knowledgeUnitId: 1,
        gameType: 'test',
        isCorrect: true,
        responseTimeMs: 1000,
        hintsUsed: 0,
      });
      expect(response.calculateQualityScore()).toBe(5);
    });

    it('returns 3 for correct with 2 hints', () => {
      const response = new UserResponse({
        userId: 1,
        knowledgeUnitId: 1,
        gameType: 'test',
        isCorrect: true,
        responseTimeMs: 1000,
        hintsUsed: 2,
      });
      expect(response.calculateQualityScore()).toBe(3);
    });

    it('floors at 2 for correct with many hints', () => {
      const response = new UserResponse({
        userId: 1,
        knowledgeUnitId: 1,
        gameType: 'test',
        isCorrect: true,
        responseTimeMs: 1000,
        hintsUsed: 10,
      });
      expect(response.calculateQualityScore()).toBe(2);
    });
  });

  it('auto-calculates qualityScore when not provided', () => {
    const response = new UserResponse({
      userId: 1,
      knowledgeUnitId: 1,
      gameType: 'test',
      isCorrect: true,
      responseTimeMs: 1000,
    });
    expect(response.qualityScore).toBe(5);
  });

  it('uses provided qualityScore when given', () => {
    const response = new UserResponse({
      userId: 1,
      knowledgeUnitId: 1,
      gameType: 'test',
      isCorrect: true,
      responseTimeMs: 1000,
      qualityScore: 3,
    });
    expect(response.qualityScore).toBe(3);
  });
});
